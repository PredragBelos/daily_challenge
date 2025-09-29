import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { dailyTaskDbSchema, type DailyTaskDb } from "@/lib/schemas/dailyTaskSchema";

// Input data type for finding a task by ID
interface FindDailyTaskByIdParams {
    id: string;
}

// Return type for finding a task by ID
interface FindDailyTaskByIdResult {
    task: DailyTaskDb | null;
}

/**
 * findDailyTaskById - Finds a daily task template by its ID.
 *
 * 1. Connects to MongoDB and gets the dailyTasks collection.
 * 2. Searches for the task by its _id.
 * 3. Returns the task if found, or null if not found.
 *
 * @param params - Object containing the task ID
 * @returns Task object or null if not found
 * @throws Error if database operation fails
 */
export async function findDailyTaskById(params: FindDailyTaskByIdParams): Promise<FindDailyTaskByIdResult> {
    try {
        const { db } = await connectToDatabase();
        const dailyTasksCollection = db.collection("dailyTasks");

        // Find task by _id
        const task = await dailyTasksCollection.findOne({ _id: new ObjectId(params.id) });

        if (!task) {
            return { task: null };
        }

        // Validate and transform with schema
        const result: DailyTaskDb = dailyTaskDbSchema.parse({
            ...task,
            _id: task._id.toString(),
        });

        return {
            task: result,
        };
    } catch (err) {
        console.error("[findDailyTaskById] Error:", err);
        throw err;
    }
}