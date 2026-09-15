import { Queue } from 'bullmq';
import Redis from 'ioredis';

export class QueueConfig {
    taskQueue: Queue;
    connection: Redis;

    constructor() {
        // Redis connection
        this.connection = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: null,
        });

        // BullMQ Task Queue
        this.taskQueue = new Queue('task-queue', {
            connection: this.connection,
        });
    }

    async addTask(taskData: any) {
        try {
            await this.taskQueue.add('process-task', taskData, {
                attempts: taskData.maxRetries || 3,
                backoff: {
                    type: 'exponential',
                    delay: taskData.backoffDelay || 1000,
                },
                removeOnComplete: true,
                removeOnFail: false, // Keep failed jobs for DLQ
            });
            console.log(`Task ${taskData._id} added to queue`);
        } catch (error) {
            console.error('Error adding task to queue:', error);
            throw error;
        }
    }

    async close() {
        await this.taskQueue.close();
        await this.connection.quit();
    }
}
