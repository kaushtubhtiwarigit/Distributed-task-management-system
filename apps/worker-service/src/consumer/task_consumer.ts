import { connectToDatabase } from "../config/database";
import { KafkaConfig } from "../config/kafka";
import { process_task } from "../handler/task_handler";


export const task_consumer = async () => {
    try {
        await connectToDatabase();
        console.log("Starting Task Consumer...");
        const kafka = new KafkaConfig();
        await kafka.consumer.connect();
        await kafka.consumer.subscribe({ topic: 'task-topic' });
        await kafka.consumer.run({
            eachMessage: async ({ topic, partition, message } : any) => {
                process_task(JSON.parse(message.value.toString()));
            },
        });
    } catch (error) {
        console.error(error);
    }
}