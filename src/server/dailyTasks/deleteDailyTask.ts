import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";

// Input data type for deleting a task
interface DeleteDailyTaskParams {
    id: string;
}

// Return type for deleting a task
interface DeleteDailyTaskResult {
    deleted: boolean;
}

/**
 * deleteDailyTask - Deletes a daily task template from the database.
 *
 * 1. Connects to MongoDB and gets the dailyTasks collection.
 * 2. Deletes the task template by its _id.
 * 3. Returns deletion flag.
 *
 * @param params - Object containing the task ID
 * @returns Deletion flag
 * @throws Error if database operation fails
 */
export async function deleteDailyTaskById(params: DeleteDailyTaskParams): Promise<DeleteDailyTaskResult> {
    try {
        const { db } = await connectToDatabase();
        const dailyTasksCollection = db.collection("dailyTasks");

        // Delete task template
        const deleteResult = await dailyTasksCollection.deleteOne({ _id: new ObjectId(params.id) });

        return {
            deleted: deleteResult.deletedCount > 0,
        };
    } catch (err) {
        console.error("[deleteDailyTask] Error:", err);
        throw err;
    }
}