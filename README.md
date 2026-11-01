# 🏛️ Intelligent Multilingual Grievance Categorization & Automated Dispatch Framework

> **Multilingual Grievance Redressal Framework (CPGRAMS-Inspired Prototype)** — An end-to-end intelligent system for automating citizen grievance submission, multilingual classification, priority prediction, departmental routing, and real-time status tracking, evaluated on curated benchmark datasets modeled after the CPGRAMS taxonomy with human-in-the-loop governance.

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green?logo=node.js)](https://nodejs.org)
[![AI Service](https://img.shields.io/badge/AI%20Service-Python%20%2F%20FastAPI-blue?logo=python)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2F%20Vite%20%2F%20TypeScript-cyan?logo=react)](https://vitejs.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Prisma-blue?logo=postgresql)](https://www.postgresql.org)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-purple?logo=render)](https://render.com)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://intelligent-grievance-system-beta.vercel.app |
| **Backend API** | https://grievance-backend-qv5e.onrender.com |
| **AI Service** | https://grievance-ai-service.onrender.com |
| **API Health** | https://grievance-backend-qv5e.onrender.com/api/v1/health |

### 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 🧑 Citizen | `citizen@example.com` | `Password@123` |
| 👮 Officer | `officer@example.com` | `Password@123` |
| 🛡️ Admin | `admin@example.com` | `Password@123` |

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [AI Pipeline](#-ai-pipeline)
- [API Reference](#-api-reference)
- [Local Development Setup](#-local-development-setup)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Test Suite](#-test-suite)

---

## 🎯 Project Overview

The **Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework** is a full-stack AI-powered prototype platform designed to demonstrate modern citizen grievance redressal workflows modeled on Central Government portal taxonomies (CPGRAMS).

Citizens can submit grievances in **11 official Indian languages**. The system automatically:
1. **Detects** the language of the submission
2. **Translates** non-English text for processing
3. **Classifies** the grievance into one of 9 government departments using a trained ML model
4. **Predicts** the urgency priority (LOW / MEDIUM / HIGH / CRITICAL)
5. **Routes** the grievance to the correct departmental officer
6. **Tracks** the status with a full audit timeline
7. **Notifies** citizens and officers in real time

---

## ✨ Key Features

### 🧑 Citizen Portal
- Submit grievances in any Indian language (Hindi, Tamil, Telugu, Bengali, Kannada, etc.)
- AI-powered automatic language detection and category classification
- Real-time priority assignment (CRITICAL → fast-track routing)
- Full grievance history with status timeline
- In-app notification feed
- AI-powered chatbot assistant for guidance

### 👮 Officer Portal
- Department-scoped grievance queue (officers see only their department)
- Status workflow: SUBMITTED → ASSIGNED → UNDER\_REVIEW → IN\_PROGRESS → RESOLVED / REJECTED
- Internal remarks and audit trail on every status change
- Citizen notification triggered automatically on every update
- Officer-level analytics dashboard

### 🛡️ Admin Portal
- System-wide visibility across all departments
- AI classification correction with human-override logging
- Department performance analytics
- Category distribution charts
- AI accuracy and review metrics

### 🤖 AI Intelligence
- TF-IDF + Logistic Regression classification pipeline (scikit-learn)
- Language detection via `langdetect`
- Rule-based keyword fallback when model confidence is LOW
- Explainability: top classification terms returned with each decision
- Confidence level (HIGH / MEDIUM / LOW) with `ai_review_required` flag
- Human correction tracking: `is_human_corrected`, `human_corrected_by`, `human_corrected_at`

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│   React 19 + TypeScript + Vite + TailwindCSS               │
│   Deployed on: Vercel                                       │
│   URL: intelligent-grievance-system-beta.vercel.app        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (REST / JSON)
                           │ CORS: *.vercel.app allowed
┌──────────────────────────▼──────────────────────────────────┐
│                      API GATEWAY LAYER                      │
│                                                             │
│   Node.js 20 + Express 4 + Prisma ORM                      │
│   JWT Authentication + Role-Based Authorization            │
│   Deployed on: Render (grievance-backend-qv5e)             │
│   Port: 5000 (local) / $PORT (Render)                      │
└──────────┬──────────────────────────────┬───────────────────┘
           │ PostgreSQL (Prisma)           │ HTTP (fetch)
           │                              │
┌──────────▼────────────┐   ┌────────────▼────────────────────┐
│     DATA LAYER        │   │         AI SERVICE LAYER        │
│                       │   │                                 │
│  PostgreSQL 15        │   │  Python 3.11 + FastAPI          │
│  Hosted on Render     │   │  scikit-learn TF-IDF pipeline   │
│  5 core models:       │   │  langdetect + rule-based NLP    │
│  User, Department,    │   │  Deployed on Render             │
│  Grievance,           │   │  (grievance-ai-service)         │
│  StatusHistory,       │   │  Port: 8001 (local) / $PORT     │
│  Notification         │   └─────────────────────────────────┘
└───────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8.1 | Build tool and dev server |
| TailwindCSS | 3.4 | Utility-first styling |
| React Router | 7 | Client-side routing |
| Lucide React | Latest | Icon system |
| `@fontsource-variable/geist` | Latest | Typography |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 | JavaScript runtime |
| Express | 4.21 | HTTP server framework |
| Prisma | 6.4 | ORM and migrations |
| PostgreSQL | 15 | Relational database |
| JWT (`jsonwebtoken`) | 9.0 | Stateless authentication |
| bcryptjs | 3.0 | Password hashing |
| cors | 2.8 | CORS middleware |
| morgan | 1.10 | HTTP request logging |

### AI Service
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | ≥0.100 | Async HTTP framework |
| uvicorn | ≥0.20 | ASGI server |
| scikit-learn | ≥1.2 | TF-IDF + Logistic Regression |
| langdetect | ≥1.0.9 | Language identification |
| pandas | ≥2.0 | Data processing |
| numpy | ≥1.24 | Numerical computation |
| joblib | ≥1.2 | Model serialization |
| pydantic | ≥2.0 | Request/response validation |
| pydantic-settings | ≥2.0 | Config management |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Render | Backend + AI Service + PostgreSQL hosting |
| Vercel | Frontend hosting with auto-deploy |
| GitHub | Source control and CI/CD trigger |
| Docker | Local containerized development |

---

## 📁 Project Structure

```
intelligent-grievance-system/
├── frontend/                     # React + TypeScript + Vite
│   ├── src/
│   │   ├── apps/                 # Role-based app views
│   │   │   ├── admin/            # Admin dashboard, grievances, analytics
│   │   │   ├── citizen/          # Citizen submit, list, detail
│   │   │   ├── officer/          # Officer queue and detail
│   │   │   ├── analytics/        # Analytics views
│   │   │   └── chatbot/          # AI chatbot interface
│   │   ├── core/
│   │   │   ├── api/              # API client (client.ts, grievanceApi.ts)
│   │   │   └── routes/           # Public + Protected route guards
│   │   ├── features/
│   │   │   └── auth/             # Auth context, login, storage
│   │   └── shared/
│   │       ├── layouts/          # DashboardLayout with sidebar
│   │       ├── types/            # TypeScript interfaces
│   │       └── ui/               # StatusBadge, StatusTimeline
│   └── package.json
│
├── backend/                      # Node.js + Express + Prisma
│   ├── src/
│   │   ├── config/               # env.js, database.js (Prisma client)
│   │   ├── controllers/          # auth, grievance, officer, admin, chatbot
│   │   ├── middleware/           # auth, role, errorHandler, validation
│   │   ├── routes/               # index, auth, grievance, officer, admin
│   │   ├── services/             # auth, grievance, officer, admin, ai
│   │   └── utils/                # jwt.js, response.js
│   ├── prisma/
│   │   ├── schema.prisma         # Database models
│   │   ├── migrations/           # SQL migration history
│   │   └── seed.js               # Demo data seeder
│   └── tests/                    # 65-test Node test suite
│
├── ai-service/                   # Python + FastAPI
│   ├── app/
│   │   ├── core/                 # config.py (pydantic-settings)
│   │   ├── routes/               # analyze.py, chatbot.py, health.py
│   │   ├── schemas/              # grievance.py (request/response models)
│   │   └── services/
│   │       ├── ml/               # model_loader.py, classifier.py, predictor.py
│   │       ├── language_detector.py
│   │       ├── preprocessor.py
│   │       └── department_router.py
│   ├── models/
│   │   └── grievance-classifier/ # model.joblib + config.json
│   ├── tests/                    # 19 pytest test suite
│   └── requirements.txt
│
├── render.yaml                   # Render Blueprint (IaC)
├── docker-compose.yml            # Local Docker setup
├── .env.example                  # Environment variable template
└── README.md
```

---

## 🗄️ Database Schema

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    users    │────<│    grievances    │>────│ departments │
├─────────────┤     ├──────────────────┤     ├─────────────┤
│ id (uuid)   │     │ id (uuid)        │     │ id (uuid)   │
│ name        │     │ grievance_number │     │ name        │
│ email       │     │ user_id          │     │ code        │
│ password_hash│    │ original_text    │     │ description │
│ role        │     │ detected_language│     └─────────────┘
│ CITIZEN     │     │ translated_text  │
│ OFFICER     │     │ category         │     ┌──────────────────────┐
│ ADMIN       │     │ priority         │────<│ grievance_status_    │
│ department_id│    │ department_id    │     │ history              │
└─────────────┘     │ status           │     ├──────────────────────┤
                    │ ai_confidence    │     │ id (uuid)            │
                    │ ai_confidence_lvl│     │ grievance_id         │
                    │ ai_review_req'd  │     │ status               │
                    │ ai_method        │     │ remarks              │
                    │ ai_explanation[] │     │ changed_by           │
                    │ is_human_corr'd  │     │ created_at           │
                    └──────────────────┘     └──────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  notifications   │
                    ├──────────────────┤
                    │ id (uuid)        │
                    │ user_id          │
                    │ grievance_id     │
                    │ type (enum)      │
                    │ title / message  │
                    │ is_read          │
                    └──────────────────┘
```

**Status Lifecycle:** `SUBMITTED → ASSIGNED → UNDER_REVIEW → IN_PROGRESS → RESOLVED / REJECTED`

**Priority Levels:** `LOW | MEDIUM | HIGH | CRITICAL`

**Departments (9 total):** Water Supply, Electricity, Roads & Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, Other

---

## 🤖 AI Pipeline

```
Citizen Input (any language)
         │
         ▼
 Language Detection (langdetect)
 → Detected: Hindi, Tamil, Bengali, etc.
         │
         ▼
 Text Preprocessing (preprocessor.py)
 → Lowercase, punctuation removal, normalization
         │
         ▼
 Translation Layer (translator.py)
 → Pass-through (IndicTrans2 optional)
         │
         ▼
 ML Classification (ml/classifier.py)
 → TF-IDF Vectorizer + Logistic Regression
 → Returns: category, confidence (0.0–1.0)
         │
         ├── confidence ≥ 0.75 → HIGH confidence
         ├── confidence ≥ 0.50 → MEDIUM confidence (ai_review_required: true)
         └── confidence < 0.50 → Rule-based keyword fallback
         │
         ▼
 Priority Prediction (ml/predictor.py)
 → CRITICAL / HIGH / MEDIUM / LOW
         │
         ▼
 Department Routing (department_router.py)
 → Maps category → department
         │
         ▼
 Response to Backend
 → category, confidence, department, priority,
   explanation_terms, model_used, processing_time_ms
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login, returns JWT |
| `GET` | `/api/v1/auth/me` | Get current user profile |

### Citizen
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/grievances` | Submit new grievance (triggers AI) |
| `GET` | `/api/v1/grievances` | List my grievances |
| `GET` | `/api/v1/grievances/:id` | Get grievance detail |

### Officer
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/officer/grievances` | List department grievances |
| `GET` | `/api/v1/officer/grievances/:id` | Grievance detail |
| `PATCH` | `/api/v1/officer/grievances/:id/status` | Update status + remarks |
| `GET` | `/api/v1/officer/analytics` | Department analytics |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/grievances` | All grievances (filterable) |
| `GET` | `/api/v1/admin/grievances/:id` | Any grievance detail |
| `PATCH` | `/api/v1/admin/grievances/:id/status` | Override any status |
| `PATCH` | `/api/v1/admin/grievances/:id/classification` | Correct AI classification |
| `GET` | `/api/v1/admin/analytics` | System-wide analytics |
| `GET` | `/api/v1/admin/analytics/ai` | AI accuracy metrics |

### Chatbot & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chatbot/message` | Send message to AI chatbot |
| `GET` | `/api/v1/notifications` | List notifications |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark one as read |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all as read |

### AI Service (FastAPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/analyze` | Classify grievance text |
| `POST` | `/chatbot/process` | Process chatbot message |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ running locally

### 1. Clone the Repository
```bash
git clone https://github.com/KANISH-850/intelligent-grievance-system.git
cd intelligent-grievance-system
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Start the AI Service
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 4. Start the Backend
```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
node src/server.js
```

### 5. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Open in Browser
```
http://localhost:5173
```

### Docker (Alternative)
```bash
docker-compose up --build
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173,http://localhost:5174
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intelligent_grievance
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRES_IN=1d
AI_SERVICE_URL=http://localhost:8001
```

### AI Service (`ai-service/.env`)
```env
TRANSLATION_PROVIDER=libretranslate
TRANSLATION_API_URL=https://libretranslate.de/translate
TRANSLATION_API_KEY=your-libretranslate-key-optional
VISION_API_URL=https://api.openai.com/v1/chat/completions
VISION_API_KEY=your-vision-api-key
VISION_MODEL=gpt-4o-mini
AI_CONFIDENCE_THRESHOLD=0.75
AI_LOW_CONFIDENCE_THRESHOLD=0.50
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## ☁️ Deployment

This project is configured for **zero-configuration deployment** via `render.yaml`.

### Render (Backend + AI Service + Database)

The `render.yaml` Blueprint defines all three Render services:

1. **PostgreSQL 15** — `grievance-db`
2. **Python Web Service** — `grievance-ai-service`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Node.js Web Service** — `grievance-backend`
   - Build: `npm ci && npx prisma generate && npx prisma migrate deploy && npx prisma db seed`
   - Start: `node src/server.js`

**Required Render environment variables (backend service):**
```
NODE_ENV=production
DATABASE_URL=<Render PostgreSQL Internal URL>
JWT_SECRET=<48-char hex secret>
JWT_EXPIRES_IN=1d
AI_SERVICE_URL=https://grievance-ai-service.onrender.com
CLIENT_URL=https://your-frontend.vercel.app
```

### Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_BASE_URL=https://grievance-backend-qv5e.onrender.com/api/v1
   ```
4. Deploy — auto-deploys on every push to `main`

---

## 🧪 Test Suite

### Backend — Node.js built-in test runner
```bash
cd backend
npm test
```
**65 tests across 6 test files:**
- `grievance.test.js` — Citizen CRUD
- `officer_admin.test.js` — Officer and Admin workflows
- `phase9_notifications.test.js` — Notification system
- `phase11_ai_validation.test.js` — AI classification integration
- `phase12_chatbot.test.js` — Chatbot API
- `phase8_chatbot_analytics.test.js` — Analytics endpoints

### AI Service — pytest
```bash
cd ai-service
python -m pytest tests/ -v
```
**19 tests:**
- `test_analyze.py` — All categories + multilingual + edge cases
- `test_phase10_ml.py` — ML model loading, fallback, priority

---

## 📊 Supported Grievance Categories

| Category | Department Code |
|----------|----------------|
| Water Supply | WS |
| Electricity | ELEC |
| Roads and Transport | RT |
| Healthcare | HC |
| Education | EDU |
| Sanitation | SAN |
| Municipal Services | MS |
| Revenue | REV |
| Other | OTH |

---

## 🌏 Supported Languages

Detection and processing support for **11 official Indian languages:**
Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, and English.

---

## 📄 License

This project is an academic prototype developed as part of the **S5 Intelligent Systems** curriculum.

---

<div align="center">
  <strong>Built with ❤️ for smarter citizen-government interaction</strong><br/>
  Ministry of Electronics & Information Technology · CPGRAMS Integrated Platform
</div>
