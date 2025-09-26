// ensureUser.ts
// Ova funkcija će biti implementirana za kreiranje ili pronalaženje korisnika u bazi.

import { connectToDatabase } from "@/lib/mongodb";
import { userInsertSchema } from "@/lib/schemas/userSchema";

// Tip podataka koji se očekuje kao input (iz options.ts):
interface EnsureUserParams {
    provider: "google";
    providerId: string;
    email?: string;
    name?: string;
    image?: string;
}

// Tip povratne vrednosti (iz options.ts):
interface EnsureUserResult {
    user: {
        _id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        createdAt?: string;
        updatedAt?: string;
    };
    created: boolean; // true ako je korisnik kreiran, false ako je pronađen
}

/**
 * ensureUser - Finds or creates a user in the database based on OAuth provider data.
 *
 * 1. Connects to MongoDB and gets the users collection.
 * 2. Searches for a user by provider and providerId.
 *    - If found, returns the user and created: false.
 * 3. If not found, validates input with Zod and inserts a new user.
 *    - Returns the new user and created: true.
 * 4. All errors are logged and rethrown for handling in the NextAuth callback.
 *
 * @param params - User data from OAuth provider (Google)
 * @returns User object and created flag
 * @throws Error if validation or database operation fails
 */
export async function ensureUser(params: EnsureUserParams): Promise<EnsureUserResult> {
    try {
        // 1. Connect to database and get users collection
        const { db } = await connectToDatabase();
        const usersCollection = db.collection("users");

        // 2. Find user by provider and providerId
        const existingUser = await usersCollection.findOne({
            provider: params.provider,
            providerId: params.providerId,
        });
        if (existingUser) {
            return {
                user: {
                    _id: existingUser._id.toString(),
                    name: existingUser.name ?? null,
                    email: existingUser.email ?? null,
                    image: existingUser.image ?? null,
                    createdAt: existingUser.createdAt,
                    updatedAt: existingUser.updatedAt,
                },
                created: false,
            };
        }

        // 3. Validate and insert new user
        const now = new Date();
        const newUserData = {
            provider: params.provider,
            providerId: params.providerId,
            name: params.name ?? null,
            email: params.email ?? null,
            image: params.image ?? null,
            createdAt: now,
            updatedAt: now,
        };
        // Validate with Zod schema
        const parsed = userInsertSchema.safeParse(newUserData);
        if (!parsed.success) {
            throw new Error("User validation failed: " + JSON.stringify(parsed.error.format()));
        }
        // Insert into database
        const insertResult = await usersCollection.insertOne(parsed.data);
        return {
            user: {
                _id: insertResult.insertedId.toString(),
                name: parsed.data.name,
                email: parsed.data.email,
                image: parsed.data.image,
                createdAt: parsed.data.createdAt.toISOString(),
                updatedAt: parsed.data.updatedAt.toISOString(),
            },
            created: true,
        };
    } catch (err) {
        // Log error for server-side monitoring
        console.error("[ensureUser] Error:", err);
        throw err;
    }
}
