import mongoose from 'mongoose';
import { Task } from '../apps/databus-service/src/api/model/task_model';

/**
 * Task Monitoring Utility
 * Shows current task states with exponential backoff information
 */

interface TaskStatus {
    _id: string;
    title: string;
    status: string;
    retries: number;
    maxRetries: number;
    nextRetryAt?: Date;
    backoffDelay?: number;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

class TaskMonitor {
    async connect() {
        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskdb');
            console.log('📊 Connected to MongoDB for monitoring');
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('📊 Disconnected from MongoDB');
    }

    async getTasksSummary() {
        const summary = await Task.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgRetries: { $avg: '$retries' }
                }
            }
        ]);

        console.log('\n📈 Task Status Summary:');
        console.log('Status      | Count | Avg Retries');
        console.log('------------|-------|------------');
        
        summary.forEach(status => {
            const avgRetries = status.avgRetries ? status.avgRetries.toFixed(1) : '0.0';
            console.log(`${status._id.padEnd(11)} | ${status.count.toString().padEnd(5)} | ${avgRetries}`);
        });
    }

    async getRetryingTasks() {
        const retryingTasks = await Task.find({ 
            status: { $in: ['RETRYING', 'PENDING'] },
            retries: { $gt: 0 }
        }).sort({ nextRetryAt: 1 });

        console.log('\n🔄 Tasks with Retry Information:');
        
        if (retryingTasks.length === 0) {
            console.log('No tasks currently in retry state');
            return;
        }

        console.log('Task ID                  | Title        | Retries | Next Retry           | Backoff | Status');
        console.log('-------------------------|--------------|---------|----------------------|---------|--------');

        const now = new Date();
        retryingTasks.forEach(task => {
            const taskId = task._id.toString().substring(0, 8) + '...';
            const title = task.title.substring(0, 12);
            const nextRetry = task.nextRetryAt ? task.nextRetryAt.toISOString().substring(11, 19) : 'N/A';
            const backoff = task.backoffDelay ? `${task.backoffDelay}ms` : 'N/A';
            const isReady = !task.nextRetryAt || now >= task.nextRetryAt ? '✅' : '⏳';
            
            console.log(`${taskId.padEnd(24)} | ${title.padEnd(12)} | ${task.retries}/${task.maxRetries}     | ${nextRetry} ${isReady} | ${backoff.padEnd(7)} | ${task.status}`);
        });
    }

    async getFailedTasks() {
        const failedTasks = await Task.find({ status: 'FAILED' })
            .sort({ updatedAt: -1 })
            .limit(10);

        console.log('\n❌ Recent Failed Tasks:');
        
        if (failedTasks.length === 0) {
            console.log('No failed tasks found');
            return;
        }

        console.log('Task ID                  | Title        | Retries | Error                | Failed At');
        console.log('-------------------------|--------------|---------|----------------------|----------------');

        failedTasks.forEach(task => {
            const taskId = task._id.toString().substring(0, 8) + '...';
            const title = task.title.substring(0, 12);
            const error = task.error ? task.error.substring(0, 20) : 'Unknown';
            const failedAt = task.updatedAt.toISOString().substring(0, 16).replace('T', ' ');
            
            console.log(`${taskId.padEnd(24)} | ${title.padEnd(12)} | ${task.retries}/${task.maxRetries}     | ${error.padEnd(20)} | ${failedAt}`);
        });
    }

    async showBackoffMetrics() {
        const backoffStats = await Task.aggregate([
            {
                $match: { 
                    retries: { $gt: 0 },
                    backoffDelay: { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$retries',
                    count: { $sum: 1 },
                    avgBackoff: { $avg: '$backoffDelay' },
                    maxBackoff: { $max: '$backoffDelay' },
                    minBackoff: { $min: '$backoffDelay' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        console.log('\n📊 Backoff Metrics by Retry Attempt:');
        
        if (backoffStats.length === 0) {
            console.log('No backoff metrics available');
            return;
        }

        console.log('Retry # | Count | Avg Backoff | Min Backoff | Max Backoff');
        console.log('--------|-------|-------------|-------------|------------');

        backoffStats.forEach(stat => {
            const avgBackoff = Math.round(stat.avgBackoff);
            const minBackoff = stat.minBackoff;
            const maxBackoff = stat.maxBackoff;
            
            console.log(`   ${stat._id}    |   ${stat.count}   |    ${avgBackoff}ms   |    ${minBackoff}ms   |    ${maxBackoff}ms`);
        });
    }

    async run() {
        await this.connect();
        
        try {
            await this.getTasksSummary();
            await this.getRetryingTasks();
            await this.getFailedTasks();
            await this.showBackoffMetrics();
        } catch (error) {
            console.error('Error during monitoring:', error);
        } finally {
            await this.disconnect();
        }
    }
}

// Run the monitor if called directly
if (require.main === module) {
    const monitor = new TaskMonitor();
    monitor.run().catch(console.error);
}

export { TaskMonitor };
