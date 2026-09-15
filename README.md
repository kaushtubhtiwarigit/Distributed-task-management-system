# 🚀 Distributed Task Manager

<img src="./assets/design.png" >

A scalable and distributed task manager built with **Node.js, Express, MongoDB, and Kafka**. This project handles task execution with a worker-based architecture and event-driven messaging.

---

## 🛠 Tech Stack

| Component           | Technology        | Description |
|---------------------|------------------|-------------|
| **Backend**        | Node.js + Express | REST API for task management |
| **Database**       | MongoDB           | Stores tasks and execution details |
| **Queue System**   | Kafka             | Manages task distribution across workers |
| **Containerization** | Docker           | Manages services as containers |
| **Service Communication** | REST API | Communicates between microservices |

## 🔄 Flow of Code Execution

1. **Task Submission** → API Service receives a task submission request (POST `/tasks`).
2. **Queue Processing** → API Service publishes the task to Kafka.
3. **Worker Execution** → Workers consume tasks from Kafka and process them.
4. **Task Completion & Storage** → Worker updates MongoDB with task results.
5. **Centralized DB Service** → Centralized MongoDB service for task storage and retrieval.
6. **Retries & Failure Handling** → If a task fails, it is retried based on an exponential backoff strategy. Persistent failures go to the Dead Letter Queue (DLQ).

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/vr-varad/distributed-task-manager.git
cd distributed-task-manager
```

### 2️⃣ Install Dependencies
```sh
pnpm install
```

### 3️⃣ Start Kafka (Docker-based setup)
```sh
cd apps/queue-service
docker compose up -d
```

### 4️⃣ Start Services
#### Start API Service:
```sh
pnpm run start:api
```
#### Start Worker Service:
```sh
pnpm run start:worker
```
#### Start Scheduler Service:
```sh
pnpm run start:scheduler
```