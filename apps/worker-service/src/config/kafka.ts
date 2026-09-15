import { Kafka } from 'kafkajs'

export class KafkaConfig {
    kafka: Kafka;
    consumer: any;
    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:29092'],
        });
        this.consumer = this.kafka.consumer({ groupId: 'test-worker' });
    }
}

export class KafkaDLQConfig {
    kafka: Kafka;
    producer: any;
    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:29092'],
        });
        this.producer = this.kafka.producer();
    }

    async produce(data: any) {
        try {
            await this.producer.connect();
            await this.producer.send({
                topic: 'dlq-topic',
                messages: [
                    { value: JSON.stringify(data) }
                ]
            });
        } catch (error) {
            console.error(error);
        }
    }

}