import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions, Session, User, Account } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { ensureUser } from "@/server/users/ensureUser";

const AUTH_REDIRECT = "/daily";
const ERROR_REDIRECT = "/auth/error";

declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            provider?: "google";
            providerId?: string;
            createdAt?: string;
            updatedAt?: string;
        };
    }
}

// Custom interfaces for type safety
export interface CustomUser {
    _dbId: string;
    _firstLogin: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider: "google";
    providerId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomToken extends JWT {
    userId?: string;
    provider?: "google";
    providerId?: string;
    createdAt?: string;
    updatedAt?: string;
    picture?: string | null;
    firstLogin?: boolean;
}

/**
 * NextAuth configuration options for authentication.
 *
 * - Uses Google provider for OAuth login.
 * - JWT session strategy for stateless sessions.
 * - Custom callbacks for user provisioning, JWT enrichment, and session shaping.
 * - Integrates with MongoDB and Zod for user validation and persistence.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const options: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        /**
         * signIn callback: Ensures user exists in DB (provisioning) and attaches custom fields.
         * On error, logs and redirects to error page.
         */
        async signIn({ user, account }) {
            try {
                if (account?.provider === "google") {
                    const providerId = account.providerAccountId;
                    const result = await ensureUser({
                        provider: "google",
                        providerId,
                        email: user.email ?? undefined,
                        name: user.name ?? undefined,
                        image: user.image ?? undefined,
                    });
                    // Attach custom fields to user object
                    const customUser = user as unknown as CustomUser;
                    customUser._dbId = result.user._id;
                    customUser._firstLogin = !!result.created;
                    customUser.provider = "google";
                    customUser.providerId = providerId;
                    customUser.createdAt = result.user.createdAt;
                    customUser.updatedAt = result.user.updatedAt;
                    customUser.name = result.user.name ?? user.name ?? null;
                    customUser.image = result.user.image ?? user.image ?? null;
                    customUser.email = result.user.email ?? user.email ?? null;
                    return AUTH_REDIRECT;
                }
                return AUTH_REDIRECT;
            } catch (err) {
                console.error("signIn ensureUser error:", err);
                return ERROR_REDIRECT;
            }
        },
        /**
         * jwt callback: Enriches JWT token with custom user fields for session use.
         * Ensures all relevant user data is available in the session.
         */
        async jwt({ token, user }) {
            if (user) {
                const customUser = user as Partial<CustomUser>;
                if (customUser._dbId) {
                    token.userId = customUser._dbId;
                    token.provider = customUser.provider;
                    token.providerId = customUser.providerId;
                    token.createdAt = customUser.createdAt;
                    token.updatedAt = customUser.updatedAt;
                    token.name = customUser.name ?? token.name ?? null;
                    token.email = customUser.email ?? token.email ?? null;
                    token.picture = customUser.image ?? token.picture ?? null;
                    token.firstLogin = !!customUser._firstLogin;
                }
            }
            return token;
        },
        /**
         * session callback: Shapes the session.user object from JWT token fields.
         * Makes all user data available on client and server.
         */
        async session({ session, token }) {
            session.user = {
                id: (token as CustomToken).userId ?? "",
                name: token.name ?? "",
                email: token.email ?? "",
                image: (token as CustomToken).picture ?? "",
                provider: (token as CustomToken).provider ?? undefined,
                providerId: (token as CustomToken).providerId ?? undefined,
                createdAt: (token as CustomToken).createdAt ?? undefined,
                updatedAt: (token as CustomToken).updatedAt ?? undefined,
            };
            return session;
        },
    },
    pages: {
        // signIn: "/auth/signin",
        error: ERROR_REDIRECT,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
