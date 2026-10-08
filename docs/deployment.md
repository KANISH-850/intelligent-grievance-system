# System Deployment & Operational Guide

**Project:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework  
**Version:** 1.0.0 (Phase 13 Final Release)  

---

## 1. System Architecture Overview

The application comprises 4 containerized / independent microservices:

| Service | Technology | Internal Port | Production URL / Docker Host |
|---|---|---|---|
| **Frontend UI** | React + Vite + TypeScript | `80` / `5173` | `http://localhost:80` (Docker) / `http://localhost:5173` (Dev) |
| **Backend API** | Node.js + Express + Prisma | `5000` | `http://localhost:5000/api/v1` |
| **AI Service** | Python FastAPI | `8001` | `http://ai-service:8001` (Docker) / `http://localhost:8001` (Dev) |
| **Database** | PostgreSQL 15 | `5432` | `postgres:5432` (Docker) / `localhost:5433` (Host mapping) |

---

## 2. Environment Configuration

Copy `.env.example` files to `.env` in the respect directories before running the stack:

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/intelligent_grievance?schema=public"
JWT_SECRET="super-secret-key-grievance-system-2026-academic-mvp"
JWT_EXPIRES_IN="1d"
AI_SERVICE_URL="http://localhost:8001"
CLIENT_URL="http://localhost:5173"
```

### AI Service (`ai-service/.env`)
```env
PORT=8001
HOST=0.0.0.0
MODEL_PATH=app/ml/models/classifier_tfidf.pkl
LOG_LEVEL=info
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 3. Docker Compose Deployment (Recommended)

### 3.1 Prerequisite Check
Ensure Docker Desktop or Docker Engine (v20.10+) and Docker Compose (v2.0+) are installed.

### 3.2 Launch Full Stack
Execute from the project root:
```bash
# Build and start containers in background
docker compose up --build -d

# Verify container status
docker compose ps
```

### 3.3 Apply Database Migrations & Seed Data inside Docker
```bash
# Apply Prisma migrations
docker exec -it grievance_backend npx prisma migrate deploy

# Seed initial departments and demo credentials
docker exec -it grievance_backend npx prisma db seed
```

### 3.4 Container Shutdown
```bash
# Stop containers
docker compose down

# Stop containers and wipe volumes (Fresh database reset)
docker compose down -v
```

---

## 4. Native Development Setup (Without Docker)

### 4.1 Step 1: PostgreSQL Database Setup
Ensure PostgreSQL is running locally on port `5433` (or update `DATABASE_URL` in `backend/.env`).
```bash
# Create database
psql -U postgres -c "CREATE DATABASE intelligent_grievance;"
```

### 4.2 Step 2: AI Microservice Setup
```bash
cd ai-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
Verify AI Health: `http://localhost:8001/health`

### 4.3 Step 3: Backend API Setup
```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```
Verify Backend Health: `http://localhost:5000/api/v1/health`

### 4.4 Step 4: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access UI: `http://localhost:5173`

---

## 5. Pre-Seeded Demo Credentials

| Role | Email | Password | Department |
|---|---|---|---|
| **Citizen** | `citizen@example.com` | `Citizen@123` | N/A |
| **Officer** | `officer.water@example.com` | `Officer@123` | Water Supply & Sanitation |
| **Officer** | `officer.pwd@example.com` | `Officer@123` | Public Works Department |
| **Administrator** | `admin@example.com` | `Admin@123` | All Departments |

---

## 6. Health & Diagnostic Endpoints

- **Backend Health**: `GET http://localhost:5000/api/v1/health`
- **AI Service Health**: `GET http://localhost:8001/health`
- **PostgreSQL Readiness**: `pg_isready -h localhost -p 5433 -U postgres`

---

## 7. Troubleshooting Guide

| Symptom | Cause | Solution |
|---|---|---|
| Backend fails database connection | PostgreSQL container not fully ready or wrong port. | Verify container health `docker compose ps` and confirm port `5432`/`5433` mapping. |
| AI analysis falls back to keyword rules | Trained model file `.pkl` missing from `ai-service/app/ml/models/`. | Run dataset train script `python -m app.ml.train` inside `ai-service`. |
| CORS Error in Browser Console | `CLIENT_URL` mismatch in backend environment. | Ensure `CLIENT_URL` matches frontend URL (`http://localhost:5173` or `http://localhost`). |
| Migration lock or error on clean database | Stale migration state. | Run `npx prisma migrate resolve` or `npx prisma migrate deploy`. |
