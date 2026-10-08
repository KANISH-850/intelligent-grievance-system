# Docker Container Orchestration Documentation

## Overview
This document describes the multi-container Docker architecture for the **Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework**.

The containerized stack includes four orchestrated services:
1. **PostgreSQL Database** (`postgres:15-alpine`)
2. **Python FastAPI AI Microservice** (`ai-service/Dockerfile`)
3. **Node.js Express Backend API** (`backend/Dockerfile`)
4. **React Nginx Web Frontend** (`frontend/Dockerfile`)

---

## Service Architecture & Inter-Container Communication

```
                   ┌──────────────────────────────────┐
                   │    Frontend (Nginx / React)      │
                   │    Port: 80                      │
                   └────────────────┬─────────────────┘
                                    │ Browser HTTP (VITE_API_BASE_URL)
                                    ▼
                   ┌──────────────────────────────────┐
                   │    Backend (Node + Express)      │
                   │    Port: 5000                    │
                   └─────────┬───────────────┬────────┘
                             │               │
  Internal Network           │               │ Internal Network
  http://postgres:5432       │               │ http://ai-service:8001
                             ▼               ▼
                 ┌──────────────────┐  ┌──────────────────┐
                 │    PostgreSQL    │  │    AI Service    │
                 │    Database      │  │    FastAPI       │
                 └──────────────────┘  └──────────────────┘
```

---

## Docker Compose Services Summary

| Service | Container Name | Image / Build Context | Internal Port | Host Port | Health Check |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`postgres`** | `grievance_postgres` | `postgres:15-alpine` | `5432` | `5433` | `pg_isready -U postgres -d intelligent_grievance` |
| **`ai-service`** | `grievance_ai_service` | `./ai-service` | `8001` | `8001` | `curl -f http://localhost:8001/health` |
| **`backend`** | `grievance_backend` | `./backend` | `5000` | `5000` | `wget http://localhost:5000/api/v1/health` |
| **`frontend`** | `grievance_frontend` | `./frontend` | `80` | `80` | Nginx web serving dist bundle |

---

## Environment Variables Configuration

| Variable | Scope | Description | Default Docker Value |
| :--- | :--- | :--- | :--- |
| `POSTGRES_USER` | `postgres`, `backend` | Database user name | `postgres` |
| `POSTGRES_PASSWORD` | `postgres`, `backend` | Database user password | `postgres` |
| `POSTGRES_DB` | `postgres`, `backend` | Target database name | `intelligent_grievance` |
| `DATABASE_URL` | `backend` | PostgreSQL connection string | `postgresql://postgres:postgres@postgres:5432/intelligent_grievance` |
| `AI_SERVICE_URL` | `backend` | AI microservice endpoint | `http://ai-service:8001` |
| `JWT_SECRET` | `backend` | JWT secret signature key | Configured securely via env |
| `VITE_API_BASE_URL` | `frontend` | Browser backend API URL | `http://localhost:5000/api/v1` |

---

## How to Run with Docker Compose

### 1. Build and Start All Containers
```bash
docker compose up --build
```

### 2. Run Database Migrations & Seed Initial Data
```bash
# Execute Prisma migration inside running backend container
docker compose exec backend npx prisma db push

# Execute Prisma seed
docker compose exec backend npx prisma db seed
```

### 3. Verify Container Status & Health
```bash
docker compose ps
```

### 4. Stopping Containers
```bash
docker compose down
```
*(Persistent data is preserved safely in PostgreSQL volume `postgres_data`)*
