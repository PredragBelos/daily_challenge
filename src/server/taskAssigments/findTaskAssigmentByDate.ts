// src/server/taskAssigments/findTaskAssigmentByDate.ts

import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import {
    taskAssignmentDbSchema,
    TaskAssignmentDb,
    dailyTaskDbSchema,
    DailyTaskDb,
} from "@/lib/schemas/dailyTaskSchema";

// Input parameters for finding a task assignment by date
export interface FindTaskAssignmentByDateParams {
    userId: string; // MongoDB ObjectId as string
    date: string;   // Date in YYYY-MM-DD format
}

// Return type for task assignment lookup
export interface FindTaskAssignmentByDateResult {
    assignment: TaskAssignmentDb | null; // Task assignment or null if not found
    task?: DailyTaskDb; // Related daily task (only if assignment exists)
}

/**
 * findTaskAssignmentByDate - Finds a task assignment for a specific user and date.
 *
 * This function performs a lookup for a TaskAssignment document that matches the given
 * user ID and assigned date. If found, it also fetches the related DailyTask document.
 *
 * Flow:
 * 1. Connect to MongoDB database
 * 2. Search taskAssignments collection by { userId, assignedDate }
 * 3. If assignment found:
 *    - Validate assignment data with Zod schema
 *    - Fetch related DailyTask by taskId
 *    - Validate task data with Zod schema
 *    - Return { assignment, task }
 * 4. If assignment not found:
 *    - Return { assignment: null }
 *
 * @param params - Object containing userId and date
 * @returns Promise resolving to assignment and related task data
 * @throws Error if database operation fails or data validation fails
 *
 * @example
 * ```typescript
 * const result = await findTaskAssignmentByDate({
 *   userId: "507f1f77bcf86cd799439011",
 *   date: "2025-09-29"
 * });
 *
 * if (result.assignment) {
 *   console.log("Found assignment:", result.assignment);
 *   console.log("Related task:", result.task);
 * } else {
 *   console.log("No assignment found for this date");
 * }
 * ```
 */
export async function findTaskAssignmentByDate(
    params: FindTaskAssignmentByDateParams
): Promise<FindTaskAssignmentByDateResult> {
    // Establish database connection
    const { db } = await connectToDatabase();
    const { userId, date } = params;

    try {
        // Get collection references
        const taskAssignmentsCollection = db.collection("taskAssignments");
        const dailyTasksCollection = db.collection("dailyTasks");

        // Step 1: Find assignment by user and date
        const rawAssignment = await taskAssignmentsCollection.findOne({
            userId,
            assignedDate: date,
        });

        // If no assignment exists for this user/date combination
        if (!rawAssignment) {
            return { assignment: null };
        }

        // Step 2: Validate assignment data with Zod schema
        // Convert ObjectId to string for Zod validation
        const assignment = taskAssignmentDbSchema.parse({
            ...rawAssignment,
            _id: rawAssignment._id.toString(),
        });

        // Step 3: Fetch the related DailyTask document
        const rawTask = await dailyTasksCollection.findOne({
            _id: new ObjectId(assignment.taskId),
        });

        // Check for orphaned assignment (assignment exists but task doesn't)
        if (!rawTask) {
            throw new Error("Orphaned TaskAssignment: related DailyTask not found");
        }

        // Step 4: Validate DailyTask data with Zod schema
        // Convert ObjectId to string for Zod validation
        const task = dailyTaskDbSchema.parse({
            ...rawTask,
            _id: rawTask._id.toString(),
        });

        // Return validated assignment and task
        return { assignment, task };

    } catch (err) {
        // Log error with context for debugging
        console.error("[findTaskAssignmentByDate] Error:", err);
        throw err;
    }
}
