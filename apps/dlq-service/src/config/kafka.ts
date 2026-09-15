import { Kafka } from "kafkajs";

export class KafkaDLQConfig {
    kafka: Kafka
    consumer: any
    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:29092'],
        });
        this.consumer = this.kafka.consumer({ groupId: 'dlq-worker' });
    }
}