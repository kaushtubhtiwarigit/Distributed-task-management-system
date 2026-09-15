import { KafkaDLQConfig } from "../config/kafka";

interface DLQMessage {
    taskId: string;
    reason: string;
    retries: number;
    maxRetries: number;
    timestamp?: string;
}

export const DLQConsumer = () => {
    console.log("Starting DLQ Consumer...");
    const kafka = new KafkaDLQConfig();
    kafka.consumer.connect();
    kafka.consumer.subscribe({ topic: 'dlq-topic' });
    kafka.consumer.run({
        eachMessage: async ({ topic, partition, message }: any) => {
            try {
                const dlqMessage: DLQMessage = JSON.parse(message.value.toString());
                console.log(`DLQ Message received for task ${dlqMessage.taskId}:`, dlqMessage);
                
                // Log the failed task for monitoring and alerting
                await logFailedTask(dlqMessage);
                
                // Here you could implement additional logic:
                // - Send alerts to monitoring systems
                // - Store in a separate failed tasks collection
                // - Trigger manual review workflows
                
            } catch (error) {
                console.error("Error processing DLQ message:", error);
            }
        }
    });
}

async function logFailedTask(dlqMessage: DLQMessage): Promise<void> {
    try {
        // You could send this to a logging service, monitoring system, or database
        console.log(`🚨 TASK PERMANENTLY FAILED:`, {
            taskId: dlqMessage.taskId,
            reason: dlqMessage.reason,
            totalRetries: dlqMessage.retries,
            maxRetries: dlqMessage.maxRetries,
            timestamp: new Date().toISOString()
        });
        
        // Optional: Send to external logging/monitoring service
        // await sendToMonitoringService(dlqMessage);
        
    } catch (error) {
        console.error("Error logging failed task:", error);
    }
}