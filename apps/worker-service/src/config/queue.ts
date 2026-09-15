import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';

export class WorkerConfig {
    worker: Worker;
    dlqQueue: Queue;
    connection: Redis;

    constructor(processor: any) {
        // Redis connection
        this.connection = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: null,
        });

        // Dead Letter Queue for failed jobs
        this.dlqQueue = new Queue('dlq-queue', {
            connection: this.connection,
        });

        // BullMQ Worker
        this.worker = new Worker('task-queue', processor, {
            connection: this.connection,
            concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1'),
        });

        // Worker event listeners
        this.worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed successfully`);
        });

        this.worker.on('failed', async (job, err) => {
            if (job) {
                console.log(`Job ${job.id} failed with error: ${err.message}`);
                
                // Check if max attempts reached
                if (job.attemptsMade >= (job.opts.attempts || 3)) {
                    console.log(`Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
                    
                    // Add to Dead Letter Queue
                    await this.dlqQueue.add('failed-task', {
                        jobId: job.id,
                        taskData: job.data,
                        error: err.message,
                        attempts: job.attemptsMade,
                        failedAt: new Date().toISOString(),
                    }, {
                        removeOnComplete: false,
                        removeOnFail: false,
                    });
                }
            }
        });

        this.worker.on('error', (err) => {
            console.error('Worker error:', err);
        });
    }

    async close() {
        await this.worker.close();
        await this.dlqQueue.close();
        await this.connection.quit();
    }
}
