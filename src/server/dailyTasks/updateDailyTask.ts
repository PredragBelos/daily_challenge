import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { dailyTaskUpdateSchema, type DailyTaskUpdate, type DailyTaskDb, dailyTaskDbSchema } from "@/lib/schemas/dailyTaskSchema";

// Input data type for updating a task
interface UpdateDailyTaskParams {
    id: string;
    updates: DailyTaskUpdate;
}

// Return type for updating a task
interface UpdateDailyTaskResult {
    task: DailyTaskDb | null;
    updated: boolean;
}

/**
 * updateDailyTask - Updates an existing daily task template in the database.
 *
 * 1. Connects to MongoDB and gets the dailyTasks collection.
 * 2. Validates update data with Zod schema.
 * 3. Updates the task template in the database.
 * 4. Returns the updated task and update flag.
 *
 * @param params - Object containing task ID and update data
 * @returns Updated task object and updated flag
 * @throws Error if validation, database operation fails, or task not found
 */
export async function updateDailyTask(
    params: UpdateDailyTaskParams
): Promise<UpdateDailyTaskResult> {
    try {
        const { db } = await connectToDatabase();
        const dailyTasksCollection = db.collection("dailyTasks");

        // Validate update data with Zod
        const parsed = dailyTaskUpdateSchema.parse(params.updates);

        // Update task template (adding updatedAt, even though schema doesn't know about it)
        const updateResult = await dailyTasksCollection.findOneAndUpdate(
            { _id: new ObjectId(params.id) },
            { $set: { ...parsed, updatedAt: new Date() } },
            { returnDocument: "after" }
        );

        // If no document was found
        if (!updateResult || !updateResult.value) {
            return {
                task: null,
                updated: false,
            };
        }

        // Remove updatedAt before validation
        const { updatedAt, ...rest } = updateResult.value;

        // Parse through schema (which doesn't know about updatedAt)
        const updatedTask: DailyTaskDb = dailyTaskDbSchema.parse({
            ...rest,
            _id: updateResult.value._id.toString(),
        });

        return {
            task: updatedTask,
            updated: true,
        };
    } catch (err) {
        console.error("[updateDailyTask] Error:", err);
        throw err;
    }
}