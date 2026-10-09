# Source of Truth Project Profile

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  
**Workspace:** `E:\VS_CODE\S5\intelligent-grievance-system`  

---

## 1. Project Identity & Problem Statement

- **Problem Solved**: Solves manual triage backlogs, incorrect department routing, and lack of real-time citizen assistance in Central Government portals (such as CPGRAMS). Automated AI-driven categorization, priority estimation, and department routing reduce processing latency and human error.
- **Intended Users**:
  1. **Citizens**: Register public complaints, receive real-time status tracking, get automated chatbot assistance, and view in-app notifications.
  2. **Department Officers**: Access department-locked grievance queues, update complaint resolution states (`UNDER_REVIEW`, `RESOLVED`, `REJECTED`), and submit mandatory resolution remarks.
  3. **Administrators**: Inspect cross-department metrics, perform confidence-based human classification corrections, and monitor AI microservice health.
- **Key Objectives**:
  - Automated category classification across 9 government domains.
  - Urgency & priority assessment (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - Confidence scoring with automatic human-review flags (`ai_review_required`).
  - Explainable AI (XAI) feature importance reporting for predictions.
  - Multi-turn intent-based citizen chatbot.
  - Role-based security and privacy isolation.

---

## 2. Technology Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (`frontend/package.json`)
- **Backend API**: Node.js v20+, Express.js v4, Prisma ORM v6, bcryptjs, JSON Web Tokens (`backend/package.json`)
- **AI Microservice**: Python 3.11/3.13, FastAPI, Scikit-learn, joblib, langdetect (`ai-service/requirements.txt`)
- **Database**: PostgreSQL 15 (`backend/prisma/schema.prisma`)
- **Orchestration**: Docker, Docker Compose (`docker-compose.yml`)
- **Architectural Flow**:
  `React UI` ──(HTTP/JWT)──> `Express API Gateway` ──(Prisma)──> `PostgreSQL Database`  
  `Express API` ──(REST)──> `FastAPI AI Microservice` (`/api/v1/analyze`)

---

## 3. AI / Machine Learning Implementation (Ground Truth)

- **Machine Learning Architecture**: **TF-IDF Vectorizer + Logistic Regression** (`ai-service/scripts/train_classifier.py` and `ai-service/app/services/ml/classifier.py`).
- **Hyperparameters & Configuration**:
  - `TfidfVectorizer`: `ngram_range=(1, 2)`, `max_features=5000`, `sublinear_tf=True`, `lowercase=True`
  - `LogisticRegression`: `C=2.5`, `max_iter=1000`, `solver="lbfgs"`, `random_state=42`
  - Saved Model Path: `ai-service/models/grievance-classifier/model.joblib`
  - Metadata Config: `ai-service/models/grievance-classifier/config.json`
- **Academic Synthetic Dataset**:
  - Source File: `datasets/grievance-classification/README.md`
  - Total Samples: 675 academic synthetic samples (`is_synthetic=True`)
  - Train Set (70%): 472 samples
  - Validation Set (15%): 101 samples
  - Test Set (15%): 102 samples
  - Random Seed: 42
  - Categories (9): Water Supply, Electricity, Roads and Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, Other
- **Confidence & Human Review Thresholds**:
  - `AI_CONFIDENCE_THRESHOLD`: `0.75` (HIGH confidence, `ai_review_required: False`)
  - `AI_LOW_CONFIDENCE_THRESHOLD`: `0.50` (MEDIUM confidence, `ai_review_required: True`)
  - `conf < 0.50`: LOW confidence (`ai_review_required: True`)
- **Explainability (XAI)**:
  - Exact token contribution score = `TF-IDF feature value * Logistic Regression coefficient` for the predicted class (`ai-service/app/services/ml/classifier.py`).
- **Fallback Behavior**:
  - If `.joblib` model file is uninitialized or missing, the service falls back to a keyword-based baseline classifier (`rule_based_fallback`) and flags `ai_review_required: True`.

---

## 4. Multilingual Processing & Chatbot

- **Language Detection**: Uses `langdetect` library (`ai-service/app/services/language_detector.py`).
- **Translation / Regional Language Handling**: Non-English grievances detect language code cleanly and preserve original text. Keyword fallback rules handle Indic script terms.
- **Academic Disclaimer**: The project does NOT perform real-time IndicTrans2 neural translation or LLM generative translation. Regional complaints are preserved in original text.
- **Chatbot Intents (9)**:
  1. `GREETING`
  2. `PRIORITY_INFORMATION`
  3. `PROCESS_INFORMATION`
  4. `TRACKING_GUIDANCE`
  5. `SUBMIT_GRIEVANCE_GUIDANCE`
  6. `DEPARTMENT_INFORMATION`
  7. `HELP`
  8. `GRIEVANCE_STATUS` / `GRIEVANCE_DETAILS` / `LIST_GRIEVANCES`
  9. `UNKNOWN` (Fallback)
- **Reference Code Extraction**: Regex matching `GRV-\d{4}-\d{6}` (`GRV-2026-000001`).
- **Session Memory**: Recalls `last_grievance_number` for contextual queries (e.g. "What is its status?").

---

## 5. Security & Isolation

- **Authentication**: JWT Bearer Token validation via `authenticate` middleware (`backend/src/middleware/auth.middleware.js`).
- **RBAC Roles**: `CITIZEN`, `OFFICER`, `ADMIN` via `requireRole` middleware (`backend/src/middleware/role.middleware.js`).
- **Citizen Isolation**: `where: { id, user_id: req.user.id }` enforced on grievance queries (`backend/src/controllers/grievance.controller.js`).
- **Officer Department Lock**: `where: { department_id: req.user.department_id }` enforced on officer queue (`backend/src/controllers/officer.controller.js`).
- **Admin Correction**: Admins override category via `PATCH /api/v1/admin/grievances/:id/classification`, preserving `ai_original_category` and setting `is_human_corrected: true` (`backend/src/controllers/admin.controller.js`).

---

## 6. Testing & Deployment Verification

- **Python AI Tests**: 34/34 passed (`pytest` in `ai-service/tests/`).
- **Node Backend Tests**: 65/65 passed across 18 test suites (`node --test` in `backend/tests/`).
- **Frontend Code Quality**: 0 ESLint errors (2 fast-refresh warnings), Vite production build successful.
- **Docker Compose**: Verified syntax and service configuration via `docker compose config`.
