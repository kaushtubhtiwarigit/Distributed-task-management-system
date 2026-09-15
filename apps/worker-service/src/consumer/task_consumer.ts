import { connectToDatabase } from "../config/database";
import { WorkerConfig } from "../config/queue";
import { process_task } from "../handler/task_handler";
import { Job } from 'bullmq';

export const task_consumer = async () => {
    try {
        await connectToDatabase();
        console.log("Starting Task Consumer with BullMQ Worker...");
        
        // Define the job processor
        const processor = async (job: Job) => {
            console.log(`Processing job ${job.id} with task ${job.data._id}`);
            await process_task(job.data);
        };

        // Initialize worker
        const workerConfig = new WorkerConfig(processor);
        
        console.log("Worker is now listening for tasks...");

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('Shutting down worker gracefully...');
            await workerConfig.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Shutting down worker gracefully...');
            await workerConfig.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('Error starting worker:', error);
        process.exit(1);
    }
}
