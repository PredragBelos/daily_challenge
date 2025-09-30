// src/server/taskAssigments/listTaskAssigmentsByUser.ts

import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import {
    taskAssignmentDbSchema,
    TaskAssignmentDb,
    dailyTaskDbSchema,
    DailyTaskDb,
} from "@/lib/schemas/dailyTaskSchema";

// Input parameters for listing task assignments by user
export interface ListTaskAssignmentsByUserParams {
    userId: string; // MongoDB ObjectId as string
    page?: number;  // Page number (default 1)
    limit?: number; // Number of items per page (default 10)
}

// Return type for task assignments list
export interface ListTaskAssignmentsByUserResult {
    assignments: (TaskAssignmentDb & { task: DailyTaskDb })[]; // List of assignments with related tasks
    pagination: {
        page: number;
        limit: number;
        total: number;       // Total number of assignments
        totalPages: number;  // Total number of pages
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

/**
 * listTaskAssignmentsByUser - Lists task assignments for a specific user with pagination.
 *
 * This function retrieves a paginated list of TaskAssignment documents for the given user,
 * sorted by assignedDate descending. For each assignment, it fetches the related DailyTask.
 *
 * Flow:
 * 1. Connect to MongoDB database
 * 2. Calculate skip and limit for pagination
 * 3. Count total assignments for the user
 * 4. Query taskAssignments collection with filter, sort, skip, and limit
 * 5. For each assignment, fetch related DailyTask
 * 6. Validate data with Zod schemas
 * 7. Form result with assignments and pagination metadata
 *
 * @param params - Object containing userId, page, and limit
 * @returns Promise resolving to list of assignments with tasks and pagination
 * @throws Error if database operation fails or data validation fails
 *
 * @example
 * ```typescript
 * const result = await listTaskAssignmentsByUser({
 *   userId: "507f1f77bcf86cd799439011",
 *   page: 1,
 *   limit: 10
 * });
 *
 * console.log("Assignments:", result.assignments);
 * console.log("Pagination:", result.pagination);
 * ```
 */
export async function listTaskAssignmentsByUser(
    params: ListTaskAssignmentsByUserParams
): Promise<ListTaskAssignmentsByUserResult> {
    // Establish database connection
    const { db } = await connectToDatabase();
    const { userId, page = 1, limit = 10 } = params;
    
    try {
        // Get collection references
        const taskAssignmentsCollection = db.collection("taskAssignments");
        const dailyTasksCollection = db.collection("dailyTasks");

        // Step 1: Calculate skip and limit
        const skip = (page - 1) * limit;
        
        // Step 2: Count total assignments for the user
        const total = await taskAssignmentsCollection.countDocuments({
            userId: userId,
        });

        // Step 3: Query assignments with pagination
        const rawAssignments = await taskAssignmentsCollection
            .find({ userId: userId})
            .sort({ assignedDate: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Step 4: Fetch related DailyTask for each assignment
        const assignmentsWithTasks = await Promise.all(
            rawAssignments.map(async (rawAssignment) => {
                // Validate assignment data with Zod schema
                const assignment = taskAssignmentDbSchema.parse({
                    ...rawAssignment,
                    _id: rawAssignment._id.toString(),
                });

                // Fetch related DailyTask
                const rawTask = await dailyTasksCollection.findOne({
                    _id: new ObjectId(assignment.taskId),
                });

                if (!rawTask) {
                    throw new Error("Orphaned TaskAssignment: related DailyTask not found");
                }

                // Validate task data with Zod schema
                const task = dailyTaskDbSchema.parse({
                    ...rawTask,
                    _id: rawTask._id.toString(),
                });

                return {
                    ...assignment,
                    task,
                };
            })
        );

        // Step 5: Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // Return result
        return {
            assignments: assignmentsWithTasks,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
        };

    } catch (err) {
        // Log error with context for debugging
        console.error("[listTaskAssignmentsByUser] Error:", err);
        throw err;
    }
}