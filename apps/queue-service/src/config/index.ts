import { KafkaDLQConfig } from "./kafka_dlq";
import { KafkaConfig } from "./kafka_task";

export const kafkaQueueService = async () => {
    console.log("Starting Queue Service...");
    const kafkaConfig = new KafkaConfig();
    const kafkaDLQConfig = new KafkaDLQConfig();
    console.log("Queue Service Started ✅");
}