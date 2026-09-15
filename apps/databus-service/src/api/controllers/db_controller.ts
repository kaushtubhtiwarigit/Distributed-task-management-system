import { Request, Response } from "express";
import { Task } from "../model/task_model";
import { logger } from "../utils/logger";

const DbController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { event, eventBody }: { event: string, eventBody: any } = req.body;
        console.log("Event received:", event);

        let responseData: any;

        switch (event) {
            case "TASK CREATED":
                const task = new Task({
                    title: eventBody.title,
                    description: eventBody.description,
                    maxRetries: eventBody.maxRetries,
                });
                await task.save();
                responseData = task;
                logger.info({
                    message: "Task created successfully",
                    taskId: task._id,
                });
                break;

            case "TASK INPROGRESS":
                const pendingTask = await Task.findById(eventBody.taskId);
                if (!pendingTask) throw new Error("Task not found");
                pendingTask.status = "IN_PROGRESS";
                await pendingTask.save();
                responseData = pendingTask;
                logger.info({
                    message: "Task status updated to IN_PROGRESS",
                    taskId: pendingTask._id,
                });
                break;

            case "TASK COMPLETED":
                const completedTask = await Task.findById(eventBody.taskId);
                if (!completedTask) throw new Error("Task not found");
                completedTask.status = "COMPLETED";
                await completedTask.save();
                responseData = completedTask;
                logger.info({
                    message: "Task status updated to COMPLETED",
                    taskId: completedTask._id,
                });
                break;

            case "TASK FAILED":
                const failedTask = await Task.findById(eventBody.taskId);
                if (!failedTask) throw new Error("Task not found");
                failedTask.status = "FAILED";
                await failedTask.save();
                responseData = failedTask;
                logger.info({
                    message: "Task status updated to FAILED",
                    taskId: failedTask._id,
                });
                break;

            case "TASK RETRY":
                const retryTask = await Task.findById(eventBody.taskId);
                if (!retryTask) throw new Error("Task not found");
                retryTask.retries += 1;
                retryTask.status = "RETRYING"; // Mark as retrying instead of pending
                retryTask.error = eventBody.error || retryTask.error;
                
                // Set exponential backoff timing
                if (eventBody.nextRetryAt) {
                    retryTask.nextRetryAt = new Date(eventBody.nextRetryAt);
                }
                if (eventBody.backoffDelay) {
                    retryTask.backoffDelay = eventBody.backoffDelay;
                }
                
                await retryTask.save();
                responseData = retryTask;
                logger.info({
                    message: "Task scheduled for retry with exponential backoff",
                    taskId: retryTask._id,
                    retries: retryTask.retries,
                    nextRetryAt: retryTask.nextRetryAt?.toISOString(),
                    backoffDelay: retryTask.backoffDelay,
                });
                break;

            default:
                return res.status(400).json({ error: "Unknown event type" });
        }

        return res.status(200).json(
            {
                message: "Event processed successfully",
                data: responseData
            });

    } catch (error: any) {

        logger.error({
            message: "Error processing event",
            error: error.message,
        });
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}

export {
    DbController
}
