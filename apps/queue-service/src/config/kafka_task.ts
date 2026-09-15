import { Admin, Kafka } from 'kafkajs'


export class KafkaConfig {
    kafka: Kafka
    producer: any
    consumer: any
    admin: Admin
    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:29092'],
        });
        this.producer = this.kafka.producer()
        this.consumer = this.kafka.consumer({ groupId: 'task-worker' })
        this.admin = this.kafka.admin()
        this.createTopics()
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
                    topic: 'task-topic',
                    numPartitions: 3,
                    replicationFactor: 1
                }
            ]
        })
        await this.admin.disconnect()
    }
}