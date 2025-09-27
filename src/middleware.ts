/**
 * Next.js Middleware with NextAuth Authentication
 * 
 * This middleware runs before every route and controls access based on:
 * - User authentication status (signed in/not signed in)
 * - Route type (public, protected, auth, semi-public)
 * 
 * Logic:
 * 1. Auth routes - NextAuth system routes + signin/signout logic
 * 2. Protected routes - checks if user is authenticated
 * 3. Public routes - accessible to everyone
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
    PUBLIC_ROUTES,
    SEMI_PUBLIC_ROUTES,
    PROTECTED_ROUTES,
    isPublicRoute,
    isSemiPublicRoute,
    isProtectedRoute,
    isAuthRoute,
} from "@/lib/routes";

export default async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    try {
        // Get JWT token to check authentication
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const isLoggedIn = Boolean(token);

        // Handle auth routes (NextAuth system + signin/signout)
        if (isAuthRoute(pathname)) {
            // If user is already logged in, redirect them from signin page
            if (pathname === SEMI_PUBLIC_ROUTES.signin && isLoggedIn) {
                return NextResponse.redirect(new URL(PROTECTED_ROUTES.daily, req.url));
            }

            // If user is not logged in, redirect them from signout page
            if (pathname === SEMI_PUBLIC_ROUTES.signout && !isLoggedIn) {
                return NextResponse.redirect(new URL(PUBLIC_ROUTES.home, req.url));
            }

            // Other auth routes (callback, error) pass through without checks
            return NextResponse.next();
        }

        // Handle protected routes - requires authentication
        if (isProtectedRoute(pathname) && !isLoggedIn) {
            const signinUrl = new URL(SEMI_PUBLIC_ROUTES.signin, req.url);

            // Add callbackUrl so user is redirected back after login
            if (pathname !== PUBLIC_ROUTES.home) {
                signinUrl.searchParams.set("callbackUrl", pathname + search);
            }

            return NextResponse.redirect(signinUrl);
        }

        // Public routes - accessible to everyone
        if (isPublicRoute(pathname)) {
            return NextResponse.next();
        }

        // All other routes are allowed (fallback)
        return NextResponse.next();

    } catch (error) {
        // In case of error, redirect to home page
        console.error("Middleware error:", error);
        return NextResponse.redirect(new URL(PUBLIC_ROUTES.home, req.url));
    }
}

/**
 * Middleware matcher configuration
 * 
 * Defines which routes the middleware runs on:
 * - All routes except Next.js internal (_next/static, _next/image) and favicon
 * - All NextAuth API routes (/api/auth/*)
 */
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
        "/api/auth/:path*",
    ],
};
