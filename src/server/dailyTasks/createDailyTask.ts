import { connectToDatabase } from "@/lib/mongodb";
import { dailyTaskInsertSchema, type DailyTaskInsert, type DailyTaskDb } from "@/lib/schemas/dailyTaskSchema";

// Input data type for single task creation
interface CreateDailyTaskParams {
    text: string;
    purpose: string;
}

// Return type for single task creation
interface CreateDailyTaskResult {
    task: DailyTaskDb;
    created: true; // Always true since a new task is created
}

/**
 * createDailyTask - Creates a new daily task template in the database.
 *
 * 1. Connects to MongoDB and gets the dailyTasks collection.
 * 2. Validates input data with Zod schema.
 * 3. Inserts the new task template into the database.
 * 4. Returns the created task with its generated _id and created: true.
 *
 * @param params - Task data to create (text, purpose)
 * @returns Created task object and created flag
 * @throws Error if validation or database operation fails
 */
export async function createDailyTask(params: CreateDailyTaskParams): Promise<CreateDailyTaskResult> {
    try {
        const { db } = await connectToDatabase();
        const dailyTasksCollection = db.collection("dailyTasks");

        // Validate input with Zod
        const parsed = dailyTaskInsertSchema.parse(params);

        // Insert new task template
        const insertResult = await dailyTasksCollection.insertOne(parsed);

        // Return created task with _id
        const createdTask: DailyTaskDb = {
            _id: insertResult.insertedId.toString(),
            ...parsed,
        };

        return {
            task: createdTask,
            created: true,
        };
    } catch (err) {
        console.error("[createDailyTask] Error:", err);
        throw err;
    }
}

// Input data type for bulk create:
interface CreateMultipleDailyTasksParams {
    tasks: CreateDailyTaskParams[];
}

// Return type for bulk create:
interface CreateMultipleDailyTasksResult {
    tasks: DailyTaskDb[]; // Successfully created tasks
    created: number; // Number of successfully created tasks
    notCreated: number; // Number of unsuccessfully created tasks
    failedTasks: CreateDailyTaskParams[]; // Original input tasks that were not created
    errors: { index: number; error: string }[]; // Errors with indices
}

/**
 * createMultipleDailyTasks - Creates multiple daily task templates in bulk using insertMany.
 *
 * 1. Validates all tasks before inserting.
 * 2. Collects valid and invalid tasks separately.
 * 3. Inserts all valid tasks with a single insertMany call.
 * 4. Returns results with success count, error details, and failed tasks.
 *
 * @param params - Array of task data
 * @returns Created tasks, success count, error details, and failed tasks
 * @throws Error if database connection fails
 */
export async function createMultipleDailyTasks(params: CreateMultipleDailyTasksParams): Promise<CreateMultipleDailyTasksResult> {
    const { tasks } = params;
    const validTasks: DailyTaskInsert[] = [];
    const failedTasks: CreateDailyTaskParams[] = [];
    const errors: { index: number; error: string }[] = [];

    // 1. Validate input tasks
    tasks.forEach((task, index) => {
        try {
            const parsed = dailyTaskInsertSchema.parse(task);
            validTasks.push(parsed);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Validation error';
            errors.push({ index, error: errorMessage });
            failedTasks.push(task);
        }
    });

    if (validTasks.length === 0) {
        return {
            tasks: [],
            created: 0,
            notCreated: failedTasks.length,
            failedTasks,
            errors,
        };
    }

    try {
        const { db } = await connectToDatabase();
        const dailyTasksCollection = db.collection("dailyTasks");

        // 2. Insert all valid tasks at once, with ordered: false to attempt all
        const insertResult = await dailyTasksCollection.insertMany(validTasks, { ordered: false });

        // 3. Successfully inserted tasks (based on insertedIds)
        const createdTasks: DailyTaskDb[] = Object.entries(insertResult.insertedIds).map(([i, id]) => ({
            _id: id.toString(),
            ...validTasks[Number(i)],
        }));

        // 4. Failed tasks (based on writeErrors)
        if ((insertResult as any).writeErrors) {
            for (const err of (insertResult as any).writeErrors) {
                errors.push({ index: err.index, error: err.errmsg ?? 'Insert error' });
                failedTasks.push(tasks[err.index]);
            }
        }

        // 5. Verify total count
        const totalCount = createdTasks.length + failedTasks.length;
        if (totalCount !== tasks.length) {
            console.warn("[createMultipleDailyTasks] Warning: count mismatch");
        }

        return {
            tasks: createdTasks,
            created: createdTasks.length,
            notCreated: failedTasks.length,
            failedTasks,
            errors,
        };
    } catch (err) {
        console.error("[createMultipleDailyTasks] Error:", err);
        // If insertMany fails completely → all valid tasks are treated as failed
        failedTasks.push(...validTasks);
        return {
            tasks: [],
            created: 0,
            notCreated: failedTasks.length,
            failedTasks,
            errors: [
                ...errors,
                { index: -1, error: err instanceof Error ? err.message : 'InsertMany error' },
            ],
        };
    }
}
