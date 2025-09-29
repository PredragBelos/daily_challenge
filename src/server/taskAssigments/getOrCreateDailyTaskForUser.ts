import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { dailyTaskDbSchema, DailyTaskDb } from "@/lib/schemas/dailyTaskSchema";
import {
    taskAssignmentDbSchema,
    taskAssignmentInsertSchema,
    TaskAssignmentDb,
} from "@/lib/schemas/dailyTaskSchema";

// Input data type for getOrCreateDailyTaskForUser
interface GetOrCreateDailyTaskForUserParams {
    userId: string; // from session
    date: string;   // local date in format YYYY-MM-DD
}

// Return type for getOrCreateDailyTaskForUser
interface GetOrCreateDailyTaskForUserResult {
    assignment: TaskAssignmentDb;
    created: boolean;
    task: DailyTaskDb;
}

/**
 * getOrCreateDailyTaskForUser - Finds or creates a task assignment for a user on a given date.
 *
 * 1. Connects to MongoDB and gets collections.
 * 2. Checks if an assignment exists for (userId, date).
 *    - If found, returns it with the related DailyTask.
 * 3. If not found, finds all tasks the user has already had.
 * 4. Selects a random DailyTask the user has never had.
 * 5. Creates a new TaskAssignment document and inserts it.
 * 6. Returns the new assignment and task.
 *
 * @param params - User ID and local date
 * @returns Assignment document, created flag, and related task
 * @throws Error if validation or database operation fails
 */
export async function getOrCreateDailyTaskForUser(
    params: GetOrCreateDailyTaskForUserParams
): Promise<GetOrCreateDailyTaskForUserResult> {
    try {
        const { db } = await connectToDatabase();
        const dailyTasksCollection = db.collection("dailyTasks");
        const taskAssignmentsCollection = db.collection("taskAssignments");

        // 1. Check if assignment already exists for this user and date
        const existing = await taskAssignmentsCollection.findOne({
            userId: params.userId,
            assignedDate: params.date,
        });

        if (existing) {
            // Validate assignment
            const assignment = taskAssignmentDbSchema.parse({
                ...existing,
                _id: existing._id.toString(),
            });

            // Find related dailyTask
            const taskDoc = await dailyTasksCollection.findOne({
                _id: new ObjectId(assignment.taskId),
            });
            if (!taskDoc) {
                throw new Error("Related DailyTask not found for existing assignment");
            }
            const task = dailyTaskDbSchema.parse({
                ...taskDoc,
                _id: taskDoc._id.toString(),
            });

            return { assignment, created: false, task };
        }

        // 2. Find all tasks already assigned to this user
        const pastAssignments = await taskAssignmentsCollection
            .find({ userId: params.userId })
            .toArray();
        const usedTaskIds = new Set(pastAssignments.map((a) => a.taskId));

        // 3. Find all available tasks not yet used
        const availableTasks = await dailyTasksCollection
            .find({ _id: { $nin: Array.from(usedTaskIds).map((id) => new ObjectId(id)) } })
            .toArray();

        if (availableTasks.length === 0) {
            throw new Error("No available tasks for user");
        }

        // 4. Pick a random task
        const randomIndex = Math.floor(Math.random() * availableTasks.length);
        const chosenTaskDoc = availableTasks[randomIndex];
        const chosenTask = dailyTaskDbSchema.parse({
            _id: chosenTaskDoc._id.toString(),
            createdAt: chosenTaskDoc.createdAt,
            text: chosenTaskDoc.text,
            purpose: chosenTaskDoc.purpose,
        });

        // 5. Create new taskAssignment
        const newAssignmentData = {
            taskId: chosenTask._id,
            userId: params.userId,
            assignedDate: params.date,
            completed: false,
            notes: "",
            createdAt: new Date(),
        };
        const parsed = taskAssignmentInsertSchema.parse(newAssignmentData);

        const insertResult = await taskAssignmentsCollection.insertOne(parsed);

        const assignment: TaskAssignmentDb = {
            _id: insertResult.insertedId.toString(),
            ...parsed,
        };

        return { assignment, created: true, task: chosenTask };
    } catch (err) {
        console.error("[getOrCreateDailyTaskForUser] Error:", err);
        throw err;
    }
}
