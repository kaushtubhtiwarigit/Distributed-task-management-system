import { Kafka } from "kafkajs";

export class KafkaDLQConfig {
    kafka: Kafka
    producer: any
    consumer: any
    admin: any
    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:29092'],
        });
        this.producer = this.kafka.producer()
        this.consumer = this.kafka.consumer({ groupId: 'dlq-worker' })
        this.admin = this.kafka.admin()
        this.createTopics()
    }

    async produce(data: any) {
        try {
            await this.producer.connect()
            await this.producer.send({
                topic: 'dlq-topic',
                messages: [
                    { value: JSON.stringify(data) }
                ]
            })
        } catch (error) {
            console.error(error)
        }
    }

    async consume(topic: string, callback: (data: any) => void) {
        await this.consumer.connect()
        await this.consumer.subscribe({ topic: topic })
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }: any) => {
                callback(JSON.parse(message.value.toString()))
            }
        })
    }

    async createTopics() {
        await this.admin.connect()
        await this.admin.createTopics({
            topics: [
                {
                    topic: 'dlq-topic',
                    numPartitions: 3,
                    replicationFactor: 1
                }
            ]
        })
        await this.admin.disconnect()
    }
}