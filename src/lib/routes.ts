/**
 * Route Management System
 * 
 * Centralized route management for Next.js application with NextAuth authentication.
 * Enables type-safe route access and easier maintenance through helper functions.
 */

type RouteValues<T> = T[keyof T];

/**
 * Public routes - accessible to everyone regardless of authentication status
 */
export const PUBLIC_ROUTES = {
    home: "/",
} as const;

/**
 * Semi-public routes - access depends on user authentication state
 * - /api/auth/signin → accessible only if user IS NOT signed in
 * - /api/auth/signout → accessible only if user IS signed in
 */
export const SEMI_PUBLIC_ROUTES = {
    signin: "/api/auth/signin",
    signout: "/api/auth/signout",
} as const;

/**
 * NextAuth system routes - always accessible for NextAuth functionality
 */
export const AUTH_ROUTES = {
    callback: "/api/auth/callback",
    error: "/api/auth/error",
} as const;

/**
 * Protected routes - require authenticated user
 */
export const PROTECTED_ROUTES = {
    daily: "/daily",
    archive: "/archive",
} as const;

/**
 * API routes - for custom API endpoints (currently empty)
 */
export const API_ROUTES = {} as const;

// Type definitions for all route categories
export type PublicRoute = RouteValues<typeof PUBLIC_ROUTES>;
export type SemiPublicRoute = RouteValues<typeof SEMI_PUBLIC_ROUTES>;
export type ProtectedRoute = RouteValues<typeof PROTECTED_ROUTES>;
export type AuthRoute = RouteValues<typeof AUTH_ROUTES>;

/**
 * Helper functions for checking route types
 * Used in middleware and other parts of the application
 */

/**
 * Checks if route is public (accessible to everyone)
 */
export const isPublicRoute = (path: string): boolean => {
    return Object.values(PUBLIC_ROUTES).includes(path as any);
};

/**
 * Checks if route is semi-public (signin/signout)
 */
export const isSemiPublicRoute = (path: string): boolean => {
    return Object.values(SEMI_PUBLIC_ROUTES).includes(path as any);
};

/**
 * Checks if route is protected (requires authentication)
 */
export const isProtectedRoute = (path: string): boolean => {
    return Object.values(PROTECTED_ROUTES).includes(path as any);
};

/**
 * Checks if route is NextAuth system route (includes semi-public routes)
 */
export const isAuthRoute = (path: string): boolean => {
    return Object.values({ ...AUTH_ROUTES, ...SEMI_PUBLIC_ROUTES }).includes(path as any);
};