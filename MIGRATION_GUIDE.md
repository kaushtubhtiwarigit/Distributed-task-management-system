# Kafka to Redis + BullMQ Migration Guide

## 🎯 Overview

This document explains the migration from Apache Kafka to Redis + BullMQ in the Distributed Task Manager project.

---

## 📊 Architecture Comparison

### Before (Kafka)
```
Client
   ↓
API Service
   ↓
Scheduler Service
   ↓
Kafka Producer → Kafka Topic
   ↓
Kafka Consumer (Worker)
   ↓
MongoDB
```

### After (Redis + BullMQ)
```
Client
   ↓
API Service
   ↓
Scheduler Service
   ↓
BullMQ Queue (Redis)
   ↓
BullMQ Worker
   ↓
MongoDB
```

---

## 🔄 What Changed

### 1. Messaging System

| Aspect | Kafka | Redis + BullMQ |
|--------|-------|----------------|
| **Message Broker** | Kafka (distributed log) | Redis (in-memory data store) |
| **Queue Library** | KafkaJS | BullMQ |
| **Topics/Queues** | Kafka topics | Redis lists (BullMQ queues) |
| **Consumer Groups** | Kafka consumer groups | BullMQ workers |
| **Persistence** | Kafka log segments | Redis AOF/RDB |
| **Retry Logic** | Manual implementation | Built-in exponential backoff |
| **DLQ** | Separate Kafka topic | Built-in failed job queue |

### 2. Infrastructure

**Removed:**
- Zookeeper (Kafka dependency)
- Kafka broker
- KafkaJS library
- `apps/queue-service/docker-compose.yaml`

**Added:**
- Redis server
- BullMQ library
- IORedis library
- Root-level `docker-compose.yml`

### 3. Code Changes

#### Scheduler Service

**Before (Kafka):**
```typescript
import { KafkaConfig } from "../config/kafka";

const kafkaConfig = new KafkaConfig();
await kafkaConfig.produce("task-topic", task);
```

**After (BullMQ):**
```typescript
import { QueueConfig } from "../config/queue";

const queueConfig = new QueueConfig();
await queueConfig.addTask(task.toObject());
```

#### Worker Service

**Before (Kafka Consumer):**
```typescript
import { KafkaConfig } from "../config/kafka";

const kafka = new KafkaConfig();
await kafka.consumer.connect();
await kafka.consumer.subscribe({ topic: 'task-topic' });
await kafka.consumer.run({
    eachMessage: async ({ message }) => {
        process_task(JSON.parse(message.value.toString()));
    },
});
```

**After (BullMQ Worker):**
```typescript
import { WorkerConfig } from "../config/queue";
import { Job } from 'bullmq';

const processor = async (job: Job) => {
    await process_task(job.data);
};

const workerConfig = new WorkerConfig(processor);
```

---

## 📝 Files Changed

### Created Files
1. `apps/schedular-service/src/config/queue.ts` - BullMQ queue configuration
2. `apps/worker-service/src/config/queue.ts` - BullMQ worker configuration
3. `docker-compose.yml` - Redis + MongoDB setup

### Modified Files
1. `apps/schedular-service/package.json` - Removed kafkajs, added bullmq + ioredis
2. `apps/worker-service/package.json` - Removed kafkajs, added bullmq + ioredis
3. `apps/schedular-service/src/schedular/schedular.ts` - Use QueueConfig instead of KafkaConfig
4. `apps/worker-service/src/consumer/task_consumer.ts` - Use WorkerConfig instead of KafkaConfig
5. `apps/worker-service/src/handler/task_handler.ts` - Removed Kafka DLQ, use BullMQ's built-in DLQ
6. `README.md` - Updated documentation

### Deleted Files
1. `apps/schedular-service/src/config/kafka.ts`
2. `apps/worker-service/src/config/kafka.ts`
3. `apps/queue-service/docker-compose.yaml`

---

## 🚀 How It Works Now

### Task Flow

#### 1. Task Creation
```javascript
POST /api/tasks
{
  "name": "Process Invoice",
  "maxRetries": 3,
  "backoffDelay": 1000
}
```

#### 2. Scheduler Adds to Queue
```typescript
// Scheduler finds PENDING tasks
const tasks = await Task.find({ status: "PENDING" });

// Add to BullMQ queue
await queueConfig.addTask(taskData);
```

BullMQ stores this in Redis as:
```
bull:task-queue:wait -> [job1, job2, job3...]
```

#### 3. Worker Processes Job
```typescript
// Worker picks up job from queue
const processor = async (job: Job) => {
    console.log(`Processing ${job.id}`);
    await process_task(job.data);
};
```

#### 4. Retry on Failure
```javascript
// BullMQ configuration
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000
  }
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds (exponential)
- Attempt 4: After 4 seconds
- Failed: Move to DLQ

#### 5. Dead Letter Queue
When max retries reached:
```typescript
// Automatically moved to DLQ by BullMQ
await dlqQueue.add('failed-task', {
    jobId: job.id,
    taskData: job.data,
    error: err.message,
    attempts: job.attemptsMade,
    failedAt: new Date().toISOString(),
});
```

---

## ⚙️ Configuration

### Redis Connection
```typescript
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});
```

### Queue Configuration
```typescript
const queue = new Queue('task-queue', {
    connection: redisConnection,
});

await queue.add('process-task', taskData, {
    attempts: 3,               // Max retry attempts
    backoff: {
        type: 'exponential',    // Retry strategy
        delay: 1000,            // Initial delay in ms
    },
    removeOnComplete: true,     // Clean up successful jobs
    removeOnFail: false,        // Keep failed jobs for DLQ
});
```

### Worker Configuration
```typescript
const worker = new Worker('task-queue', processor, {
    connection: redisConnection,
    concurrency: 1,  // Number of concurrent jobs
});
```

---

## 🔍 Monitoring

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# View queues
KEYS bull:*

# Check waiting jobs
LLEN bull:task-queue:wait

# Check active jobs
LLEN bull:task-queue:active

# Check failed jobs
LLEN bull:task-queue:failed

# View DLQ
LLEN bull:dlq-queue:wait

# Get job details
HGETALL bull:task-queue:1
```

### BullMQ Events

```typescript
worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed: ${err.message}`);
});

worker.on('progress', (job, progress) => {
    console.log(`Job ${job.id} progress: ${progress}%`);
});
```

---

## 📊 Comparison

### Advantages of Redis + BullMQ over Kafka

#### Simplicity
- **Setup:** Redis: 1 service vs Kafka: 2 services (Kafka + Zookeeper)
- **Configuration:** Minimal vs Complex broker configuration
- **Code:** BullMQ handles retries vs Manual retry logic

#### Built-in Features
- ✅ Exponential backoff (built-in)
- ✅ Dead Letter Queue (built-in)
- ✅ Job priority
- ✅ Delayed jobs
- ✅ Job progress tracking
- ✅ Job events (completed, failed, progress)

#### Resource Usage
- **Memory:** Redis: ~10-50 MB vs Kafka: ~500 MB - 1 GB
- **Disk:** Redis: Minimal vs Kafka: Heavy (log segments)
- **CPU:** Redis: Lightweight vs Kafka: Moderate

#### Development
- **Local Setup:** Single Docker container vs Two containers
- **Dependencies:** 2 packages vs 1 package
- **Learning Curve:** Lower vs Higher

### When to Use Kafka Instead

Use Kafka if you need:
- Multiple consumers of same message (pub/sub pattern)
- Message replay/reprocessing
- Very high throughput (millions of messages/second)
- Long-term message retention
- Stream processing
- Event sourcing architecture

### When Redis + BullMQ is Better

Use Redis + BullMQ when:
- Job/task queue pattern
- Limited retention needed
- Moderate throughput (thousands/second)
- Simple retry logic
- Development/learning projects ✅ **(This project)**
- Quick setup required

---

## 🧪 Testing the Migration

### 1. Start Infrastructure
```bash
docker compose up -d
```

Verify:
```bash
docker ps
# Should see: redis, mongodb
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Services
```bash
# Terminal 1
pnpm run start:databus

# Terminal 2
pnpm run start:api

# Terminal 3
pnpm run start:scheduler

# Terminal 4
pnpm run start:worker
```

### 4. Create a Test Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Task",
    "description": "Testing migration",
    "maxRetries": 3,
    "backoffDelay": 1000
  }'
```

### 5. Monitor Queue
```bash
redis-cli
> LLEN bull:task-queue:wait
> LLEN bull:task-queue:active
> LLEN bull:task-queue:completed
```

### 6. Check Logs
Watch worker logs for:
```
Processing job 1 with task 507f1f77bcf86cd799439011
Task completed successfully
Job 1 completed successfully
```

---

## ⚠️ Gotchas & Solutions

### Issue: Connection ECONNREFUSED
**Cause:** Redis not running
**Solution:**
```bash
docker compose up -d redis
```

### Issue: Jobs not processing
**Cause:** Worker not started or crashed
**Solution:**
```bash
# Check worker logs
pnpm run start:worker

# Check Redis connection
redis-cli ping
```

### Issue: Jobs stuck in active
**Cause:** Worker crashed during processing
**Solution:**
```bash
# Clean stalled jobs
redis-cli
> DEL bull:task-queue:active
```

### Issue: Memory usage high
**Cause:** Too many completed jobs
**Solution:** Enable `removeOnComplete: true` in queue config

---

## 📈 Performance Considerations

### Redis Configuration for Production

```redis.conf
# Persistence
appendonly yes
appendfsync everysec

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Network
timeout 300
tcp-keepalive 60
```

### Worker Scaling

```typescript
// Increase concurrency
const worker = new Worker('task-queue', processor, {
    concurrency: 5,  // Process 5 jobs simultaneously
});
```

Or run multiple worker instances:
```bash
# Scale horizontally
pnpm run start:worker  # Instance 1
pnpm run start:worker  # Instance 2
pnpm run start:worker  # Instance 3
```

---

## ✅ Migration Checklist

- [x] Remove Kafka dependencies from package.json
- [x] Add BullMQ + IORedis dependencies
- [x] Create BullMQ queue configuration
- [x] Create BullMQ worker configuration
- [x] Update scheduler to use BullMQ
- [x] Update worker consumer to use BullMQ
- [x] Remove Kafka DLQ, use BullMQ's built-in DLQ
- [x] Delete Kafka config files
- [x] Create Redis docker-compose.yml
- [x] Delete Kafka docker-compose.yml
- [x] Update README documentation
- [x] Test task creation
- [x] Test task processing
- [x] Test retry mechanism
- [x] Test DLQ functionality

---

## 🎓 Learning Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
- [IORedis GitHub](https://github.com/luin/ioredis)
- [Exponential Backoff Pattern](https://en.wikipedia.org/wiki/Exponential_backoff)

---

**Migration Complete! 🎉**

The system now uses Redis + BullMQ for simpler, more maintainable task queue management.
