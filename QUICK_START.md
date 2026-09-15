# Quick Start - Redis + BullMQ Version

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js (v16+)
- Docker & Docker Compose
- pnpm (or npm/yarn)

---

## Step 1: Start Infrastructure (1 minute)

```bash
# Start Redis and MongoDB
docker compose up -d
```

Verify:
```bash
docker ps
# Should show: redis (port 6379), mongodb (port 27017)
```

---

## Step 2: Install Dependencies (2 minutes)

```bash
# Install all dependencies
pnpm install
```

---

## Step 3: Start Services (1 minute)

**Option A - Start All Together:**
```bash
pnpm run start:all
```

**Option B - Start Individually:**
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

---

## Step 4: Test It (1 minute)

### Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Task",
    "description": "Testing the new system",
    "maxRetries": 3,
    "backoffDelay": 1000
  }'
```

### Watch It Process
```bash
# In worker terminal, you'll see:
Starting Task Consumer with BullMQ Worker...
Worker is now listening for tasks...
Processing job 1 with task 507f1f77bcf86cd799439011
Task completed successfully
Job 1 completed successfully
```

### Monitor Queue
```bash
redis-cli

# Check queue length
127.0.0.1:6379> LLEN bull:task-queue:wait
(integer) 0

# Check completed jobs
127.0.0.1:6379> LLEN bull:task-queue:completed
(integer) 1
```

---

## ✅ You're Done!

The system is now running with:
- ✅ Redis for queue management
- ✅ BullMQ for task processing
- ✅ MongoDB for data storage
- ✅ Automatic retries with exponential backoff
- ✅ Dead Letter Queue for failed tasks

---

## 📊 Architecture

```
Client Request
      ↓
API Service (localhost:3000)
      ↓
Scheduler Service
      ↓
BullMQ Queue (Redis)
      ↓
Worker Service(s)
      ↓
MongoDB
```

---

## 🔍 Monitoring Commands

### Check Queue Status
```bash
redis-cli

# View all queues
KEYS bull:*

# Waiting jobs
LLEN bull:task-queue:wait

# Active jobs  
LLEN bull:task-queue:active

# Failed jobs
LLEN bull:task-queue:failed

# DLQ
LLEN bull:dlq-queue:wait
```

### Check MongoDB
```bash
mongosh

use taskmanager
db.tasks.find().pretty()
```

---

## 🛑 Stop Everything

```bash
# Stop services (Ctrl+C in each terminal)

# Stop Docker containers
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## 🆘 Troubleshooting

### Redis Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Fix:** `docker compose up -d redis`

### MongoDB Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** `docker compose up -d mongodb`

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Fix:** Kill the process or change port in service config

---

## 📚 Learn More

- `README.md` - Complete documentation
- `MIGRATION_GUIDE.md` - Detailed explanation
- `CHANGES_SUMMARY.md` - What changed from Kafka

---

## 🎯 Next Steps

1. Create more tasks and watch them process
2. Try stopping a worker mid-task (see retry mechanism)
3. Create a task that fails (see DLQ in action)
4. Scale workers (run multiple instances)
5. Monitor with Redis CLI

---

**Happy Task Processing! 🚀**
