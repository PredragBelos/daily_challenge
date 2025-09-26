import NextAuth from "next-auth";
import { options } from "./options";

// NextAuth API route handler for App Router (GET and POST)
/**
 * NextAuth API route handler for App Router (GET and POST)
 * Wraps NextAuth with custom options and exports as GET and POST handlers.
 *
 * This enables authentication via NextAuth in the App Router (Next.js 13+).
 *
 * @see https://next-auth.js.org/configuration/nextjs#app-router
 */
const handler = NextAuth(options);

export { handler as GET, handler as POST };
