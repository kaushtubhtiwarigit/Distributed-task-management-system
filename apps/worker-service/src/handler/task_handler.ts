import { Task } from "../model/task_model";
import { KafkaDLQConfig } from "../config/kafka";
import axios from "axios";
import { logger } from "../utils/logger";
import { calculateExponentialBackoff, calculateNextRetryTime } from "../utils/backoff";

export const process_task = async (task: any) => {
    const { _id: taskId } = task;
    const pending_task = await Task.findById(taskId);
    if (!pending_task) {
        console.log(`Task not found`);
        return;
    }
    try {
        console.log(`Processing task`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const { data: pending_task } = await axios.post(
            "http://localhost:3001/api/db/events",
            {
                event: "TASK COMPLETED",
                eventBody: {
                    taskId,
                    status: "IN_PROGRESS"
                }
            }
        );
        logger.info({
            message: "Task completed",
            taskId: task._id,
            event: "TASK COMPLETED",
        });

        return pending_task;
    } catch (error: any) {
        console.error(`Error processing task ${taskId}:`, error.message);
        const { retries, maxRetries, backoffDelay = 1000 } = pending_task
        if (retries < maxRetries) {
            // Calculate exponential backoff delay
            const nextBackoffDelay = calculateExponentialBackoff(retries + 1, backoffDelay);
            const nextRetryAt = calculateNextRetryTime(new Date(), nextBackoffDelay);
            
            const { data: pending_task } = await axios.post(
                "http://localhost:3001/api/db/events",
                {
                    event: "TASK RETRY",
                    eventBody: {
                        taskId,
                        nextRetryAt,
                        backoffDelay: nextBackoffDelay,
                        error: error.message
                    }
                }
            );
            logger.info({
                message: "Task scheduled for retry with exponential backoff",
                taskId: task._id,
                retryAttempt: retries + 1,
                nextRetryAt: nextRetryAt.toISOString(),
                backoffDelay: nextBackoffDelay,
                event: "TASK RETRY SCHEDULED",
            });
            return pending_task;
        } else {
            console.log(`Task failed, sending to DLQ`);
            const kafka = new KafkaDLQConfig();
            await kafka.produce([{
                value: JSON.stringify({
                    taskId,
                    reason: error.message,
                    retries,
                    maxRetries
                })
            }]);
            const { data: pending_task } = await axios.post(
                "http://localhost:3001/api/db/events",
                {
                    event: "TASK FAILED",
                    eventBody: {
                        taskId
                    }
                }
            );
            logger.info({
                message: "Task failed",
                taskId: task._id,
                event: "TASK FAILED",
            });
            return pending_task;
        }

    }
}