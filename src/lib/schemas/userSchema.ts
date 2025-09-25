// Zod schemas for User model: validation for MongoDB documents, insert, and update operations
import { z } from "zod";

// Validates a MongoDB ObjectId as a 24-character hex string
export const objectIdString = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "User ID must be a valid 24-character hex string");

// Email validation: trims, lowercases, allows null/undefined, must be valid if present
export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .optional()
    .nullable();

// Enum for supported OAuth providers (expand as needed)
export const providerEnum = z.enum(["google"]);

// Base user fields (excluding _id and timestamps)
const userBaseFields = z.object({
    name: z.string().trim().min(1, "Name cannot be empty").optional().nullable(),
    email: emailSchema,
    image: z.string().url("Image must be a valid URL").optional().nullable(),
    provider: providerEnum,
    providerId: z.string().min(1, "Provider ID cannot be empty"),
}).strict();

// Timestamps with validation: updatedAt must be >= createdAt
const timestampsSchema = z.object({
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
}).refine(
    (t) => t.updatedAt.getTime() >= t.createdAt.getTime(),
    { message: "updatedAt must be greater than or equal to createdAt", path: ["updatedAt"] }
);

// Schema for a user document as stored in the database (includes _id, all fields, and timestamps)
export const userDbSchema = z.object({
    _id: objectIdString,
}).and(userBaseFields).and(timestampsSchema);

export type UserDb = z.infer<typeof userDbSchema>;

// Schema for inserting a new user (no _id, timestamps default to now)
export const userInsertSchema = userBaseFields
    .extend({
        createdAt: z.coerce.date().default(() => new Date()),
        updatedAt: z.coerce.date().default(() => new Date()),
    })
    .strict();

export type UserInsert = z.infer<typeof userInsertSchema>;

// Schema for updating user profile (only editable fields)
export const userProfileUpdateSchema = z.object({
    name: z.string().trim().min(1, "Name cannot be empty").optional().nullable(),
    email: emailSchema,
    image: z.string().url("Image must be a valid URL").optional().nullable(),
    updatedAt: z.coerce.date().default(() => new Date()),
}).strict();

export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;

// Alias for update operations (can be extended for admin updates)
export const userUpdateSchema = userProfileUpdateSchema;
export type UserUpdate = UserProfileUpdate;
