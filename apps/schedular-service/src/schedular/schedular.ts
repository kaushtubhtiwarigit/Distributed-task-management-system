import axios from "axios";
import { KafkaConfig } from "../config/kafka";
import { Task } from "../model/task_model";
import { logger } from "../utils/logger";
import { isReadyForRetry } from "../utils/backoff";

export const schedule_tasks = async () => {
    const allSchedulableTasks = await Task.find({ 
        status: { $in: ["PENDING", "RETRYING"] } 
    });

    if (allSchedulableTasks.length === 0) {
        console.log("No tasks to schedule");
        return;
    }

    const currentTime = new Date();
    const tasksReadyForExecution = allSchedulableTasks.filter((task: any) => 
        isReadyForRetry(task.nextRetryAt, currentTime)
    );

    if (tasksReadyForExecution.length === 0) {
        console.log(`${allSchedulableTasks.length} schedulable tasks found, but none are ready for execution yet due to backoff delays`);
        return;
    }

    console.log(`${tasksReadyForExecution.length} out of ${allSchedulableTasks.length} schedulable tasks are ready for execution`);

    const kafkaConfig = new KafkaConfig();

    for (const task of tasksReadyForExecution) {
        try {
            logger.info({
                message: "Scheduling task for execution",
                taskId: task._id,
                currentRetry: task.retries,
                status: task.status,
                event: "SCHEDULING TASK",
            });
            
            // Mark task as in progress
            await axios.post("http://localhost:3001/api/db/events", {
                event: "TASK INPROGRESS",
                eventBody: {
                    taskId: task._id,
                }
            })
            
            logger.info({
                message: "Producing task to Kafka for processing",
                taskId: task._id,
                event: "PRODUCING TASK TO KAFKA",
            });
            
            await kafkaConfig.produce("task-topic", task);
        } catch (error) {
            logger.error({
                message: "Error scheduling task",
                taskId: task._id,
                error: (error as Error).message,
            });   
        }
    }
} 