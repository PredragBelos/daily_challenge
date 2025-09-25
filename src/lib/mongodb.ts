// MongoDB connection helper for Next.js (TypeScript)
// Uses native MongoDB driver and simple in-memory cache for connection reuse.
// No ORM, no migrations. Suitable for App Router and API routes.

import { MongoClient, Db } from "mongodb";

// MongoDB connection URI and database name from environment variables
const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// Throw errors if required env variables are missing
if (!uri) throw new Error("Please define the MONGODB_URI in .env");
if (!dbName) throw new Error("Please define the MONGODB_DB in .env");

// Simple cache to prevent multiple connections in development
let cached: { client: MongoClient; db: Db } | null = null;

/**
 * Connect to MongoDB and return the client and db instance.
 * Uses in-memory cache to avoid creating new connections on hot-reload.
 * @returns {Promise<{ client: MongoClient; db: Db }>} MongoDB client and db
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
    if (cached) return cached;

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    cached = { client, db };

    return cached;
}

/**
 * Gracefully close the MongoDB connection and clear the cache.
 * Useful for tests or scripts that need to clean up.
 */
export async function closeDatabase() {
    if (cached?.client) {
        await cached.client.close();
        cached = null;
    }
}