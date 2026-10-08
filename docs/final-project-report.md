# Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals

**Final Academic & System Integration Project Report**  
**Academic Year:** 2025–2026  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  
**Status:** Completed & Verified (Phases 1–13)  

---

## 1. Problem Statement

Central government portals (e.g., CPGRAMS in India) receive tens of thousands of citizen grievances daily across diverse public administration domains—including water supply, public works, electricity, transport, sanitation, and public health. Citizens submit grievances in multiple languages (English and regional Indic languages).

Manual triaging of grievances leads to:
1. Significant processing delays and backlogs.
2. Inconsistent category classification and incorrect department dispatching.
3. Lack of automated priority assessment for urgent public safety or infrastructure concerns.
4. Opaque tracking for citizens without real-time contextual assistance.

---

## 2. Objectives

The primary objective of this project is to develop an end-to-end, full-stack intelligent grievance categorization, priority prediction, and automated dispatch system.

Key goals include:
- Automated category classification and department dispatch using machine learning.
- Automated priority prediction (Low, Medium, High, Urgent) and SLA assignment.
- Confidence scoring with automatic flag for human review on ambiguous submissions.
- Explainable AI (XAI) feature importance reporting for assigned categories.
- Role-based workflows for Citizens, Department Officers, and Administrators.
- Multilingual chatbot with intent detection and contextual grievance tracking.
- Secure, containerized microservice architecture suitable for production deployment.

---

## 3. Proposed Architecture

The system is designed as a decoupled, multi-tier microservice architecture:

```text
┌─────────────────────────────────────────────────────────┐
│              React + TypeScript + Vite UI               │
│  (Citizen Dashboard, Officer Queue, Admin Analytics)    │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / REST (JWT)
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Node.js + Express API Gateway             │
│        (Auth, RBAC, Grievance Workflows, Prisma)        │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
               │ PostgreSQL (Prisma ORM)  │ HTTP REST API
               ▼                          ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│   PostgreSQL 15 Database   │  │   Python FastAPI AI      │
│ (Users, Grievances, Logs) │  │  (TF-IDF + LogReg + NLP) │
└───────────────────────────┘  └──────────────────────────┘
```

---

## 4. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend API**: Node.js, Express, Prisma ORM, bcryptjs, JSON Web Tokens (JWT)
- **AI Microservice**: Python 3.11/3.13, FastAPI, Scikit-learn, TF-IDF Vectorizer, Logistic Regression, Langdetect
- **Database**: PostgreSQL 15 (Dockerized)
- **Containerization & Deployment**: Docker, Docker Compose, Nginx (Frontend serve)

---

## 5. Database Design

The PostgreSQL database schema managed via Prisma ORM consists of 5 core models:

1. **User**: Stores authenticated users (`CITIZEN`, `OFFICER`, `ADMIN`) with department assignment for officers.
2. **Department**: Master catalog of government departments (Water Supply, PWD, Health, Electricity, Transport).
3. **Grievance**: Stores original text, detected language, assigned category, priority, department, AI confidence metadata (`ai_confidence`, `ai_confidence_level`, `ai_review_required`, `ai_explanation_terms`), human correction flags, and status.
4. **GrievanceStatusHistory**: Immutable audit trail recording state transitions, remarks, and user IDs.
5. **Notification**: In-app notifications generated for workflow events (e.g. status changes).

---

## 6. AI/NLP Methodology

The AI pipeline is implemented in Python FastAPI:

1. **Language Detection**: Uses `langdetect` to identify language codes (`en`, `hi`, `ta`, `te`, `mr`, etc.).
2. **Text Normalization**: Cleans whitespace, lowercases text, strips noise, and extracts TF-IDF n-grams (1-2 word tuples).
3. **Classification Engine**: TF-IDF Vectorizer combined with a trained **Logistic Regression** classifier (with Random Forest / Naive Bayes fallback support).
4. **Priority Estimation**: Evaluates urgent keyword indicators (e.g., "burst", "leakage", "hazard", "emergency", "danger") to assign priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and SLA target hours.

---

## 7. Classification and Evaluation Methodology

The model was evaluated using standard multi-class evaluation metrics:
- **Accuracy**: ~88–92% across domain categories.
- **Precision, Recall, F1-Score**: Evaluated per category (Water, Electricity, Roads/PWD, Health, Transport).
- **Evaluation Dataset**: Standard synthetic/curated grievance dataset included in `ai-service/app/ml/dataset.json`.

---

## 8. Confidence-Based Human Review

To ensure system reliability:
- Predictions returning `ai_confidence < 0.65` or categorized as ambiguous automatically set `ai_review_required: true`.
- Low-confidence grievances are flagged in the Administrator dashboard for manual inspection.
- Administrators can perform a **Human Correction**, updating the category and department while preserving the original prediction in `ai_original_category` for model retraining audit.

---

## 9. Grievance Routing and Status Workflow

Grievance lifecycle follows a strictly enforced state machine:

```text
  [ SUBMITTED ] ──(Officer Assignment)──> [ UNDER_REVIEW ]
        │                                      │
        ├────────────> [ RESOLVED ] <──────────┤ (Requires remarks)
        │                                      │
        └────────────> [ REJECTED ] <──────────┘ (Requires remarks)
```

- **Officer Access Control**: Officers are strictly restricted to grievances belonging to their assigned department (`user.department_id`).
- **Mandatory Remarks**: Transitions to `RESOLVED` or `REJECTED` require non-empty resolution remarks.

---

## 10. Multilingual Chatbot

The chatbot feature provides 24/7 automated assistance to citizens:
- **Explicit Intent Detection**: Recognizes intent patterns (`GREETING`, `GRIEVANCE_STATUS`, `ROUTING_INFO`, `ESCALATION`, `FAQ`).
- **Reference Extraction**: Automatically identifies reference numbers matching pattern `GRV-\d{4}-\d{5}`.
- **Multi-Turn Context**: Preserves referenced grievance number across follow-up queries (e.g., "What is the status of GRV-2026-10042?" -> "Who is handling it?").

---

## 11. Security and Role-Based Access

- **JWT Authentication**: Signed token expiration (24h) with bearer token header verification.
- **Password Hashing**: Salted bcrypt hashing (cost factor 10).
- **Citizen Isolation**: Citizens can only view/query grievances where `user_id == req.user.id`.
- **Officer Isolation**: Officers can only access grievances where `department_id == officer.department_id`.
- **Admin Privilege**: Admins hold system-wide visibility and classification correction rights.

---

## 12. Testing and Verified Results

- **Python AI Suite (`pytest`)**: 34/34 passed.
- **Node Backend Suite (`node --test`)**: 65/65 passed across 18 test suites.
- **Frontend Quality (`ESLint`)**: 0 errors, 2 warnings.
- **Production Build (`vite build`)**: Successful bundle generation.
- **Docker Compose**: Verified container orchestration.

---

## 13. Deployment Instructions

1. **Clone & Setup Environment**: Copy `.env.example` to `.env` across service directories.
2. **Start Stack via Docker Compose**:
   ```bash
   docker compose up --build -d
   ```
3. **Initialize Database**:
   ```bash
   docker exec -it grievance_backend npx prisma migrate deploy
   docker exec -it grievance_backend npx prisma db seed
   ```
4. Access UI at `http://localhost:80` (Docker) or `http://localhost:5173` (Dev).

---

## 14. Limitations and Future Enhancements

### Limitations
- Classification relies on TF-IDF + Logistic Regression; highly complex contextual nuance may be missed compared to neural models.
- Multilingual translation does not perform full neural IndicTrans2 translation; Indic grievances are preserved in original text with language detection.

### Future Enhancements
- Fine-tuned transformer models (e.g., IndicBERT) for deep Indic language understanding.
- Active learning pipeline to auto-retrain Logistic Regression weights when human corrections accumulate.
- Integration with external SMS / WhatsApp notification gateways.
