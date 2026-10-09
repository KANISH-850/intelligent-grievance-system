# Comprehensive Academic Technical Defense Sheet

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  
**Workspace:** `E:\VS_CODE\S5\intelligent-grievance-system`  

---

## Section A — Project Overview

### 1. Problem Statement
Central government portals (such as CPGRAMS in India) receive tens of thousands of citizen grievances daily across diverse public administration domains (water supply, electricity, public works, healthcare, sanitation, etc.). Manual triage creates severe processing backlogs, delayed emergency responses, and high inter-department misrouting rates.

### 2. Primary Objectives
1. Implement automated machine learning text classification across 9 government domains.
2. Analyze emergency terms to predict complaint priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and assign resolution SLA deadlines.
3. Establish confidence-based thresholding (75% confidence) to flag uncertain predictions for human review.
4. Calculate Explainable AI (XAI) feature token contributions for model prediction transparency.
5. Provide isolated role-based web portals for Citizens, Department Officers, and Administrators.
6. Build a 24/7 intent-based citizen chatbot with contextual multi-turn status tracking.

### 3. System Boundaries & Core Contribution
The framework automates complaint ingestion, language detection, classification, priority prediction, department routing, and status tracking. Its main contribution is combining fast, explainable statistical machine learning with human-in-the-loop governance to eliminate manual triage delays while preventing automated misrouting.

---

## Section B — System Architecture

### 1. Component Responsibilities
- **Frontend UI (React 18 + TypeScript + Vite)**: Renders single-page application views, manages `AuthContext`, executes Axios API calls, and presents responsive data tables and charts. Served via Nginx on port 80 (Docker) or port 5173 (Dev).
- **Backend API Gateway (Node.js + Express.js + Prisma ORM)**: Manages JWT token issuance, validates RBAC middleware, enforces business logic workflows, executes database CRUD operations via Prisma, and triggers in-app notifications. Listens on port 5000.
- **AI Microservice (Python 3.11/3.13 + FastAPI)**: Executes text preprocessing, language detection (`langdetect`), TF-IDF + Logistic Regression inference, XAI token contribution calculation, priority prediction, and chatbot intent processing. Listens on port 8001.
- **Database (PostgreSQL 15)**: Relational data store managing models for Users, Departments, Grievances, GrievanceStatusHistory, and Notifications. Port 5432 / 5433.

### 2. Service-to-Service Request Flow
```text
Citizen UI ──(HTTP POST + JWT)──> Express Gateway ──(HTTP POST)──> FastAPI AI Service
                                       │                               │
                                       │ (Save Grievance + Meta)        │ (Return ML Prediction)
                                       ▼                               ▼
                               PostgreSQL Database             Model (.joblib)
```

### 3. Rationale for Separate AI Microservice
Node.js handles event-driven asynchronous I/O and REST API gateway routing efficiently. Python is the industry standard for machine learning libraries (Scikit-learn, Joblib, Pandas). Decoupling allows independent horizontal scaling, isolated dependency management, and prevents CPU-intensive ML inference from blocking the Node event loop.

---

## Section C — Artificial Intelligence & Machine Learning

### 1. Text Representation (TF-IDF & N-Grams)
- **Vectorizer Configuration**: `TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True, lowercase=True)`.
- **N-Grams**: Captures single words (unigrams like "pipe") and word pairs (bigrams like "water leakage").
- **Sublinear TF**: Replaces term frequency $tf$ with $1 + \log(tf)$ to diminish the impact of repetitive words in long descriptions.
- **Formula**: $\text{TF-IDF}(t, d) = (1 + \log(tf_{t,d})) \times \log(N / df_t)$.

### 2. Multiclass Logistic Regression Classifier
- **Configuration**: `LogisticRegression(C=2.5, max_iter=1000, solver="lbfgs", random_state=42)`.
- **Softmax Probability**: Computes logit scores $z_k = \mathbf{w}_k \cdot \mathbf{x} + b_k$ for all 9 categories and normalizes them:
  $$P(y = k \mid \mathbf{x}) = \frac{\exp(z_k)}{\sum_{j=1}^{9} \exp(z_j)}$$
- **Target Categories (9)**: Water Supply, Electricity, Roads and Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, Other.

### 3. Explainability (XAI) Token Contribution
Token contribution score $S(t) = \text{TF-IDF}(t) \times w_{\text{predicted\_class}}(t)$. Terms with the highest positive contribution scores are extracted and displayed as `explanation_terms` in the UI (e.g. `['pipeline', 'leakage', 'water']`).

### 4. Dataset Composition & Ground Truth
- **Source**: Academic synthetic dataset (`datasets/grievance-classification/README.md`).
- **Total Samples**: 675 synthetic samples (`is_synthetic=True`).
- **Split**: 70% Train (472), 15% Validation (101), 15% Test (102). Seed: 42.
- **Validation Accuracy**: 100.0% accuracy on clean synthetic validation split (`validation.csv`).
- **Academic Disclaimer**: Synthetic dataset performance does NOT equal real-world government portal accuracy. Real citizen text contains heavy noise, typos, and multi-department ambiguities.

---

## Section D — Human-in-the-Loop Workflow

### 1. Confidence Threshold Logic
- `AI_CONFIDENCE_THRESHOLD = 0.75` (HIGH confidence, `ai_review_required: false`).
- `AI_LOW_CONFIDENCE_THRESHOLD = 0.50` (MEDIUM/LOW confidence, `ai_review_required: true`).
- Out-of-domain fallback ($c < 0.35$): Assigns category `Other`, confidence 0.40, and flags `ai_review_required: true`.

### 2. Administrator Correction & Auditability
When an administrator reviews a flagged complaint via `PATCH /api/v1/admin/grievances/:id/classification`:
1. `category` and `department_id` update to new admin values.
2. Initial prediction is preserved in `ai_original_category`.
3. `is_human_corrected` is set to `true`.
4. Admin ID and timestamp are logged in `human_corrected_by` and `human_corrected_at`.

---

## Section E — Multilingual Processing & Chatbot

### 1. Language Detection & Fallback
- Uses `langdetect` to identify ISO language codes (`en`, `hi`, `ta`, `te`, `mr`, `bn`, etc.).
- Original regional script text is preserved without alteration in PostgreSQL (`original_text`).
- Keyword rules handle Indic script terms.
- **Honest Disclaimer**: Does NOT perform IndicTrans2 neural machine translation.

### 2. Intent-Based Chatbot Architecture
- **9 Explicit Intents**: `GREETING`, `PRIORITY_INFORMATION`, `PROCESS_INFORMATION`, `TRACKING_GUIDANCE`, `SUBMIT_GRIEVANCE_GUIDANCE`, `DEPARTMENT_INFORMATION`, `HELP`, `GRIEVANCE_STATUS`/`GRIEVANCE_DETAILS`, `UNKNOWN`.
- **Regex Extraction**: Pattern `GRV-\d{4}-\d{6}` extracts reference codes.
- **Session Memory**: `session_context.last_grievance_number` recalls reference codes across multi-turn queries.
- **Privacy Filter**: Chatbot query filters by authenticated user's grievances (`user_id == req.user.id`).

---

## Section F — Security Architecture

- **JWT Authentication**: 24-hour signed tokens validated via Bearer header in `auth.middleware.js`.
- **Password Security**: Salted bcrypt hashing (cost factor 10) in `auth.controller.js`.
- **RBAC**: `requireRole('CITIZEN', 'OFFICER', 'ADMIN')` blocks unauthorized route execution.
- **Citizen Isolation**: Lookups enforce `where: { id, user_id: req.user.id }`.
- **Officer Isolation**: Officer queues enforce `where: { department_id: req.user.department_id }`.
- **SQL Injection Safety**: Prisma ORM parameterizes all database queries.

---

## Section G — Evaluation & Testing Results

### 1. Empirical Test Summary
- **Python Pytest AI Suite**: 34 / 34 passed (`py -m pytest` in `ai-service/`).
- **Node Backend Integration Suite**: 65 / 65 passed across 18 test suites (`npm test` in `backend/`).
- **Frontend ESLint**: 0 errors (2 fast-refresh warnings).
- **Frontend Vite Build**: Successful bundle build (`npm run build`).
- **Docker Compose Config**: Validated via `docker compose config`.

### 2. Test Layer Distinctions
- **Unit Tests**: Test isolated service modules (e.g. text preprocessing, regex extraction).
- **Integration Tests**: Test complete HTTP routes and Prisma PostgreSQL transactions.
- **Build & Lint Checks**: Verify TypeScript types, code syntax, and bundling.
- **Runtime Docker Checks**: Validate service configuration syntax across container hostnames.

---

## Section H — Verified Limitations & Future Roadmap

### Verified Limitations
1. Classifier uses TF-IDF + Logistic Regression rather than Transformer architectures (BERT).
2. Language handling detects scripts and preserves text without neural machine translation.
3. Chatbot uses explicit intent schemas rather than generative LLMs.
4. Notifications are in-app; SMS/email gateways are simulated.
5. Evaluated on an academic dataset of 675 synthetic samples.

### Future Roadmap
1. Fine-tuning `IndicBERT` embeddings for deep regional language understanding.
2. Integrating `IndicTrans2` NMT model for 22 official Indian languages.
3. Building active learning pipelines to retrain models from admin human corrections.
4. Connecting Twilio / NIC SMS and WhatsApp telecommunication gateways.

---

## Section I — Tough Examiner Questions & Defensible Answers

### Q1. What is genuinely novel about your system?
- **Answer**: "The novelty lies in combining fast statistical ML categorization with explainable token contribution weights, automated confidence thresholding, and human-in-the-loop administration in an end-to-end full-stack architecture."

### Q2. Why did you choose TF-IDF and Logistic Regression instead of BERT?
- **Answer**: "TF-IDF + Logistic Regression delivers sub-50ms CPU inference, requires under 50MB of RAM, provides complete mathematical explainability, and deploys without expensive GPU hardware."

### Q3. Is your classifier really multilingual?
- **Answer**: "The system incorporates multilingual language detection (`langdetect`) and script preservation, supported by keyword fallback rules. Full neural machine translation is documented as future scope."

### Q4. How do you know the confidence score is reliable?
- **Answer**: "Softmax probability values reflect mathematical model certainty. For predictions under 75% confidence, we incorporate automated human-review fallback to prevent misrouting."

### Q5. How did you avoid data leakage during model training?
- **Answer**: "The dataset was split strictly prior to vectorization: 70% Train, 15% Validation, 15% Test, using a fixed random seed of 42. Vectorizer vocabulary was fit strictly on training data."

### Q6. Is 100% accuracy on synthetic validation data sufficient proof of production readiness?
- **Answer**: "No. Academic honesty requires acknowledging that synthetic dataset performance does not equal real-world portal performance, where typos, slang, and complex multi-issue complaints lower accuracy."

### Q7. How would you evaluate the system on real government portal data?
- **Answer**: "By obtaining anonymized historical CPGRAMS complaint logs, establishing multi-annotator ground truth labels, and evaluating macro-F1 score across rare regional categories."

### Q8. What happens when a complaint is misclassified?
- **Answer**: "If confidence is low, it is flagged for admin review. If dispatched incorrectly, the officer or admin can reassign it via human classification correction, preserving initial prediction audit logs."

### Q9. How is citizen data protected?
- **Answer**: "Through 24-hour JWT tokens, bcrypt password hashing, input validation, and database queries enforced with `user_id == req.user.id` isolation."

### Q10. Is this a production-ready central government system?
- **Answer**: "It is a fully functional, containerized 4-tier prototype demonstrating core architecture and AI workflows. Public production deployment would require TLS setup, real NMT translation, and SMS gateway connections."

### Q11. What is the difference between your implemented work and future work?
- **Answer**: "Implemented work includes 4-tier microservices, TF-IDF + Logistic Regression ML, priority prediction, human review workflows, intent chatbot, and automated tests. Future work includes IndicBERT, IndicTrans2 translation, and active learning."

### Q12. Why preserve the original AI prediction when an admin corrects a category?
- **Answer**: "Preserving `ai_original_category` creates an immutable audit trail and collects labeled misclassifications for active learning retraining pipelines."
