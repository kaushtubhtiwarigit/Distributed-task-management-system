import { Kafka, Admin } from 'kafkajs'

export class KafkaConfig {
    kafka: Kafka;
    producer: any;
    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:29092'],
        });
        this.producer = this.kafka.producer()
    }

    async produce(topic: string, data: any) {
        try {
            await this.producer.connect()
            await this.producer.send({
                topic: topic,
                messages: [
                    { value: JSON.stringify(data) }
                ]
            })
        } catch (error) {
            console.error(error)
        }
    }
}