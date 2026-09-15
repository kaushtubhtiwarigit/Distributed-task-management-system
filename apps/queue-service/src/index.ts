import { kafkaQueueService } from './config'

const startQueueService = async () => {
    await kafkaQueueService();
}

startQueueService().catch(console.error);
