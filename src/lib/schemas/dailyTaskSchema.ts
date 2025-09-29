// Zod schemas for DailyTask and TaskAssignment models: validation for MongoDB documents, insert, and update operations
import { z } from "zod";

// Validates a MongoDB ObjectId as a 24-character hex string
export const objectIdString = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hex string");

// Validates a date string in YYYY-MM-DD format
export const dateString = z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Date must be in format YYYY-MM-DD");

// Base fields for a DailyTask template (excluding _id and createdAt)
const dailyTaskBaseFields = z.object({
    text: z
        .string()
        .trim()
        .min(1, "Task text cannot be empty"),
    purpose: z
        .string()
        .trim()
        .min(1, "Task purpose cannot be empty"),
}).strict();

// Schema for a DailyTask document as stored in the database (includes _id, all fields, and createdAt)
export const dailyTaskDbSchema = z.object({
    _id: objectIdString,
    createdAt: z.coerce.date(),
}).merge(dailyTaskBaseFields);

export type DailyTaskDb = z.infer<typeof dailyTaskDbSchema>;

// Schema for inserting a new DailyTask template (no _id, createdAt defaults to now)
export const dailyTaskInsertSchema = dailyTaskBaseFields.extend({
    createdAt: z.coerce.date().default(() => new Date()),
}).strict();

export type DailyTaskInsert = z.infer<typeof dailyTaskInsertSchema>;

// Schema for updating an existing DailyTask template (all fields optional, createdAt not updatable)
export const dailyTaskUpdateSchema = dailyTaskBaseFields.partial().extend({
    // text and purpose are most commonly updated, but all are optional
    // createdAt is not updatable
}).strict();

export type DailyTaskUpdate = z.infer<typeof dailyTaskUpdateSchema>;

// Schema for TaskAssignment model (separate collection for assignments)
export const taskAssignmentBaseFields = z.object({
    taskId: objectIdString,
    userId: objectIdString,
    assignedDate: dateString,
    completed: z.boolean().default(false),
    notes: z.string().optional(),
}).strict();

// Schema for a TaskAssignment document as stored in the database (includes _id and createdAt)
export const taskAssignmentDbSchema = z.object({
    _id: objectIdString,
    createdAt: z.coerce.date(),
}).merge(taskAssignmentBaseFields);

export type TaskAssignmentDb = z.infer<typeof taskAssignmentDbSchema>;

// Schema for inserting a new TaskAssignment (no _id, createdAt defaults to now)
export const taskAssignmentInsertSchema = taskAssignmentBaseFields.extend({
    createdAt: z.coerce.date().default(() => new Date()),
}).strict();

export type TaskAssignmentInsert = z.infer<typeof taskAssignmentInsertSchema>;

// Schema for updating an existing TaskAssignment (all fields optional, createdAt not updatable)
export const taskAssignmentUpdateSchema = taskAssignmentBaseFields.partial().extend({
    // completed and notes are most commonly updated, but all are optional
    // createdAt is not updatable
}).strict();

export type TaskAssignmentUpdate = z.infer<typeof taskAssignmentUpdateSchema>;