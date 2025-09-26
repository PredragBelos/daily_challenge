// Zod schemas for DailyTask model: validation for MongoDB documents, insert, and update operations
import { z } from "zod";

// Validates a MongoDB ObjectId as a 24-character hex string
export const objectIdString = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hex string");

// Validates a date string in YYYY-MM-DD format
export const dateString = z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Date must be in format YYYY-MM-DD");

// Base fields for a DailyTask (excluding _id and createdAt)
const dailyTaskBaseFields = z.object({
    userId: objectIdString,
    date: dateString,
    text: z
        .string()
        .trim()
        .min(1, "Task text cannot be empty"),
    purpose: z
        .string()
        .trim()
        .min(1, "Task purpose cannot be empty"),
    done: z.boolean().default(false),
}).strict();

// Schema for a DailyTask document as stored in the database (includes _id, all fields, and createdAt)
export const dailyTaskDbSchema = z.object({
    _id: objectIdString,
    createdAt: z.coerce.date(),
}).and(dailyTaskBaseFields);

export type DailyTaskDb = z.infer<typeof dailyTaskDbSchema>;

// Schema for inserting a new DailyTask (no _id, createdAt defaults to now)
export const dailyTaskInsertSchema = dailyTaskBaseFields.extend({
    createdAt: z.coerce.date().default(() => new Date()),
}).strict();

export type DailyTaskInsert = z.infer<typeof dailyTaskInsertSchema>;

// Schema for updating an existing DailyTask (all fields optional, createdAt not updatable)
export const dailyTaskUpdateSchema = dailyTaskBaseFields.partial().extend({
    // done and text are most commonly updated, but all are optional
    // createdAt is not updatable
}).strict();

export type DailyTaskUpdate = z.infer<typeof dailyTaskUpdateSchema>;