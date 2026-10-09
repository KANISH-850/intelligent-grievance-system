# Complete Project Viva Question Bank (145 Questions & Answers)

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  

---

## SECTION A — PROJECT FUNDAMENTALS (15 Questions)

### Q1. How would you introduce this project in 30 seconds during your viva?
- **Short Oral Answer**: "Our project is an Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework designed for Central Government portals like CPGRAMS. It automates the classification, priority assignment, and department routing of citizen grievances using a TF-IDF + Logistic Regression machine learning pipeline, while providing an intent-based chatbot for status tracking."
- **Detailed Explanation**: Government portals receive thousands of public complaints daily. Manual sorting causes backlogs, delayed resolutions, and misrouting. Our framework microservices architecture (React, Node.js/Express, Python FastAPI, PostgreSQL) automates complaint processing, assigns priority levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), flags low-confidence complaints for human review, and provides multi-turn chatbot assistance.
- **Source Reference**: `docs/final-project-report.md`, `docs/viva/source-of-truth.md`

### Q2. What exact problem does this system address?
- **Short Oral Answer**: "It addresses manual dispatch bottlenecks, misclassification errors, opaque tracking, and delayed emergency response in public grievance portals."
- **Detailed Explanation**: In manual setups, officers must read every complaint to decide which department handles it. Misrouted complaints get transferred between departments, wasting weeks. Urgent issues like pipe bursts or electrical hazards wait in line behind routine complaints. Our system classifies text in milliseconds and evaluates urgency terms to prioritize emergency complaints immediately.
- **Source Reference**: `docs/final-project-report.md` Section 1

### Q3. Who are the primary stakeholders and user roles in the system?
- **Short Oral Answer**: "The system supports three distinct user roles: Citizens, Department Officers, and Administrators."
- **Detailed Explanation**:
  1. **Citizens**: Register complaints, receive AI classification results, track status via reference IDs, interact with the AI chatbot, and receive in-app notifications.
  2. **Department Officers**: Access department-restricted grievance queues, update complaint resolution states (`UNDER_REVIEW`, `RESOLVED`, `REJECTED`), and submit mandatory resolution remarks.
  3. **Administrators**: Monitor system analytics, review low-confidence AI predictions, perform human classification overrides, and oversee department workloads.
- **Source Reference**: `backend/src/middleware/role.middleware.js`

### Q4. What are the key functional requirements of the system?
- **Short Oral Answer**: "Grievance submission, AI categorization and priority prediction, department routing, role-based workflows, chatbot status tracking, human review overrides, and in-app notifications."
- **Detailed Explanation**: Functional requirements ensure citizens can submit complaints in multiple languages, receive AI predictions with feature importance terms, track complaint status via reference numbers like `GRV-2026-000001`, and receive notifications when officers update complaint states.
- **Source Reference**: `docs/final-project-report.md` Section 2

### Q5. What are the main non-functional requirements?
- **Short Oral Answer**: "Sub-second AI inference latency, role-based privacy isolation, sub-second API response times, responsive mobile-friendly UI, and clean containerized deployment."
- **Detailed Explanation**: Latency for AI classification is under 50ms per request. Security non-functional requirements mandate JWT authorization with 24-hour expiration, bcrypt password hashing (cost factor 10), and strict data isolation preventing citizens from viewing complaints filed by others.
- **Source Reference**: `docs/final-system-audit.md`

### Q6. What makes this system novel compared to traditional complaint portals?
- **Short Oral Answer**: "The combination of explainable AI (XAI) feature term extraction, confidence-based human-in-the-loop review, and multi-turn intent-based chatbot assistance."
- **Detailed Explanation**: Traditional complaint forms rely on citizens manually selecting the correct department (which citizens often get wrong). Our system automatically determines the department from natural text, explains why it picked that category using token contribution scores, and routes low-confidence predictions to human administrators for approval.
- **Source Reference**: `ai-service/app/services/ml/classifier.py`

### Q7. What is the scope of the current implementation?
- **Short Oral Answer**: "The scope includes 9 government departments, 4 priority levels, TF-IDF + Logistic Regression classification, language detection, intent-based chatbot, and role-based web portals."
- **Detailed Explanation**: The implementation covers 9 domains: Water Supply, Electricity, Roads and Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, and Other. It is tested on an academic dataset of 675 synthetic samples and containerized via Docker.
- **Source Reference**: `datasets/grievance-classification/README.md`

### Q8. What are the major architectural modules of the application?
- **Short Oral Answer**: "React Frontend UI, Express API Gateway, FastAPI AI Microservice, PostgreSQL Database, and Docker Orchestration."
- **Detailed Explanation**: Decoupled microservice architecture separates frontend user interactions from business logic, database management, and machine learning inference, allowing each component to scale independently.
- **Source Reference**: `docker-compose.yml`

### Q9. What are the technical limitations of the project?
- **Short Oral Answer**: "The AI classifier uses TF-IDF + Logistic Regression rather than deep transformers, language handling preserves regional text without full neural translation, and SMS/email notifications are simulated."
- **Detailed Explanation**: As documented in `docs/known-limitations.md`, the classifier does not use BERT/LLMs. Regional language complaints undergo language detection (`langdetect`), but deep translation (e.g., IndicTrans2) is not integrated.
- **Source Reference**: `docs/known-limitations.md`

### Q10. What are the planned future enhancements for this project?
- **Short Oral Answer**: "Upgrading to fine-tuned IndicBERT transformer models, integrating IndicTrans2 for full 22 Indic language translations, active learning for auto-retraining, and WhatsApp/SMS gateway integration."
- **Detailed Explanation**: Future enhancements focus on deep neural language models, active learning pipelines that collect administrator human corrections to retrain models, and telecommunication gateways.
- **Source Reference**: `docs/final-project-report.md` Section 14

### Q11. How does the system handle an emergency or high-urgency complaint?
- **Short Oral Answer**: "By detecting critical urgency terms (e.g., 'pipe burst', 'fire hazard', 'electrocution') and escalating priority to CRITICAL or HIGH with shortened SLA response times."
- **Detailed Explanation**: The priority predictor evaluates keyword severity scores alongside ML category outputs, elevating complaints involving life safety or major infrastructure failure to top queue visibility for department officers.
- **Source Reference**: `ai-service/app/services/priority_predictor.py`

### Q12. What is human-in-the-loop review in your system?
- **Short Oral Answer**: "When AI prediction confidence is below 75%, the system sets `ai_review_required: true`, flagging the complaint for administrator review and manual correction."
- **Detailed Explanation**: Instead of automatically routing uncertain predictions to officers, low-confidence grievances are flagged. An administrator can correct the category, which updates the assigned department while preserving the original AI prediction for model audit.
- **Source Reference**: `backend/src/controllers/admin.controller.js`

### Q13. What database ORM is used and why?
- **Short Oral Answer**: "Prisma ORM with PostgreSQL, because Prisma provides type-safe query building, automated migrations, and schema validation."
- **Detailed Explanation**: Prisma manages database relations, migrations (`prisma migrate deploy`), and seeding (`prisma db seed`), eliminating raw SQL injection vulnerabilities while ensuring consistent object types across the Express backend.
- **Source Reference**: `backend/prisma/schema.prisma`

### Q14. How is data isolation enforced between citizens?
- **Short Oral Answer**: "Every database lookup for a citizen includes `where: { id: grievanceId, user_id: req.user.id }`, preventing unauthorized access."
- **Detailed Explanation**: The backend extracts the authenticated user's ID from the validated JWT token (`req.user.id`) and attaches it to all database queries. Attempts to access another citizen's grievance return `404 Not Found`.
- **Source Reference**: `backend/src/controllers/grievance.controller.js`

### Q15. What are the demo credentials used during testing?
- **Short Oral Answer**: "Citizen: `citizen@example.com`, Water Officer: `officer.water@example.com`, PWD Officer: `officer.pwd@example.com`, Admin: `admin@example.com`."
- **Detailed Explanation**: These credentials are pre-seeded in the database via `npx prisma db seed` for testing role-based features without manual account creation.
- **Source Reference**: `backend/prisma/seed.js`

---

## SECTION B — SYSTEM ARCHITECTURE (12 Questions)

### Q16. Can you explain the overall system architecture using a text diagram?
- **Short Oral Answer**: "Yes, the architecture is a 4-tier system: React Frontend -> Express API Gateway -> FastAPI AI Microservice -> PostgreSQL Database."
- **Detailed Explanation**:
```text
┌─────────────────────────────────────────────────────────┐
│              React + TypeScript + Vite UI               │
│  (Citizen Dashboard, Officer Queue, Admin Analytics)    │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP REST API (Bearer JWT)
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
- **Source Reference**: `docs/final-project-report.md` Section 3

### Q17. Why did you separate the Backend API from the AI Microservice?
- **Short Oral Answer**: "Node.js excels at asynchronous I/O and REST API handling, while Python is the standard environment for machine learning libraries like Scikit-learn and Pandas."
- **Detailed Explanation**: Decoupling allows the AI microservice to be updated or scaled independently without restarting the API Gateway or interrupting active user sessions.
- **Source Reference**: `docs/deployment.md`

### Q18. How do requests flow when a citizen submits a new complaint?
- **Short Oral Answer**: "Frontend POSTs complaint text to Node API -> Node validates JWT -> Node POSTs text to FastAPI `/api/v1/analyze` -> FastAPI runs ML pipeline -> FastAPI returns prediction -> Node saves grievance to PostgreSQL -> Node returns response to Frontend."
- **Detailed Explanation**: The Express API acts as orchestrator. Upon receiving text from the citizen, it calls `POST http://ai-service:8001/api/v1/analyze`, extracts prediction metadata, connects to PostgreSQL via Prisma to insert the record, and emits an in-app notification before responding to the client.
- **Source Reference**: `backend/src/controllers/grievance.controller.js`

### Q19. What protocol and format are used for service-to-service communication?
- **Short Oral Answer**: "HTTP/1.1 REST APIs with standard JSON payloads."
- **Detailed Explanation**: Express communicates with FastAPI over internal Docker bridge network (`http://ai-service:8001`) using `fetch` with `Content-Type: application/json`.
- **Source Reference**: `backend/src/services/ai.service.js`

### Q20. How is Docker Compose used in this project?
- **Short Oral Answer**: "Docker Compose orchestrates four containers: `grievance_frontend`, `grievance_backend`, `grievance_ai_service`, and `grievance_postgres` on a shared bridge network."
- **Detailed Explanation**: `docker-compose.yml` defines build contexts, container dependencies (`depends_on` with health checks), port mappings, and persistent volume storage (`postgres_data`).
- **Source Reference**: `docker-compose.yml`

### Q21. How does the backend handle failure of the AI microservice?
- **Short Oral Answer**: "The Express API catches HTTP timeout/error exceptions from FastAPI and applies a local rule-based fallback, assigning category 'Other' and setting `ai_review_required: true`."
- **Detailed Explanation**: If FastAPI is unreachable, Express logs an error, assigns default department metadata, sets `ai_review_required: true`, and successfully stores the grievance in PostgreSQL so citizen submissions are never lost.
- **Source Reference**: `backend/src/services/ai.service.js`

### Q22. What environment variables are required for the Backend API?
- **Short Oral Answer**: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `AI_SERVICE_URL`, and `CLIENT_URL`.
- **Detailed Explanation**: Configured in `backend/.env`, these control database connection strings, JWT signing keys, service URLs, and CORS permissions.
- **Source Reference**: `backend/.env.example`

### Q23. What environment variables are required for the AI Microservice?
- **Short Oral Answer**: `PORT`, `HOST`, `MODEL_PATH`, `AI_CONFIDENCE_THRESHOLD`, and `LOG_LEVEL`.
- **Detailed Explanation**: Configured in `ai-service/.env`, these set server bindings, model loading paths (`models/grievance-classifier/model.joblib`), and review thresholds.
- **Source Reference**: `ai-service/.env.example`

### Q24. What is the role of Prisma ORM in the system architecture?
- **Short Oral Answer**: "Prisma manages database migrations, models schema tables, and executes type-safe CRUD operations against PostgreSQL."
- **Detailed Explanation**: Prisma abstracts raw SQL queries into Javascript methods like `prisma.grievance.create()` and `prisma.user.findUnique()`, ensuring compiled query safety and automatic data validation.
- **Source Reference**: `backend/prisma/schema.prisma`

### Q25. How does Docker networking enable container communication?
- **Short Oral Answer**: "Docker Compose creates a virtual bridge network (`grievance-network`) allowing containers to reach each other using service names like `postgres` and `ai-service` as DNS hostnames."
- **Detailed Explanation**: Container hostnames automatically resolve inside the Docker bridge network, so `DATABASE_URL` uses `@postgres:5432` and `AI_SERVICE_URL` uses `http://ai-service:8001`.
- **Source Reference**: `docker-compose.yml`

### Q26. How are database migrations executed during deployment?
- **Short Oral Answer**: "Using `npx prisma migrate deploy` which executes pending SQL migration scripts against PostgreSQL without resetting existing user data."
- **Detailed Explanation**: Migration scripts stored in `backend/prisma/migrations/` track schema version history, ensuring schema changes like new columns or tables are safely applied in production.
- **Source Reference**: `backend/package.json`

### Q27. What is the responsibility of Nginx in the frontend production deployment?
- **Short Oral Answer**: "Nginx serves compiled static React production build assets (`dist/`) on port 80 and handles client-side routing fallback to `index.html`."
- **Detailed Explanation**: Built into the multi-stage `frontend/Dockerfile`, Nginx serves production JS/CSS assets with optimal caching headers and proxies client requests.
- **Source Reference**: `frontend/Dockerfile`

---

## SECTION C — ARTIFICIAL INTELLIGENCE & MACHINE LEARNING (20 Questions)

### Q28. What machine learning model is implemented for grievance classification?
- **Short Oral Answer**: "TF-IDF (Term Frequency-Inverse Document Frequency) Vectorization combined with a Logistic Regression classifier."
- **Detailed Explanation**: As verified in `ai-service/scripts/train_classifier.py` and `ai-service/app/services/ml/classifier.py`, text features are extracted using TF-IDF n-grams and classified using multi-class Logistic Regression.
- **Source Reference**: `ai-service/scripts/train_classifier.py`

### Q29. What are the exact hyperparameters of the TF-IDF Vectorizer?
- **Short Oral Answer**: `ngram_range=(1, 2)`, `max_features=5000`, `sublinear_tf=True`, and `lowercase=True`.
- **Detailed Explanation**:
  - `ngram_range=(1, 2)`: Captures single words (unigrams) and 2-word phrases (bigrams) like "water pipe" or "power cut".
  - `max_features=5000`: Limits vocabulary to the top 5,000 most informative features.
  - `sublinear_tf=True`: Replaces term frequency $tf$ with $1 + \log(tf)$ to diminish the impact of repetitive words.
  - `lowercase=True`: Converts all input string characters to lowercase.
- **Source Reference**: `ai-service/scripts/train_classifier.py` line 38

### Q30. What are the exact hyperparameters of the Logistic Regression classifier?
- **Short Oral Answer**: `C=2.5`, `max_iter=1000`, `solver="lbfgs"`, `random_state=42`, and `multi_class="multinomial"`.
- **Detailed Explanation**:
  - `C=2.5`: Inverse regularization strength; a value of 2.5 balances model complexity against overfitting.
  - `max_iter=1000`: Allows up to 1,000 optimization iterations for L-BFGS solver convergence.
  - `solver="lbfgs"`: Limited-memory Broyden–Fletcher–Goldfarb–Shanno algorithm suitable for multiclass log-loss minimization.
  - `random_state=42`: Fixed seed for reproducible parameter weight optimization.
- **Source Reference**: `ai-service/scripts/train_classifier.py` line 44

### Q31. What dataset was used to train and evaluate the model?
- **Short Oral Answer**: "An academic synthetic dataset of 675 citizen grievances curated specifically for 9 government domains."
- **Detailed Explanation**: Documented in `datasets/grievance-classification/README.md`, the dataset contains 675 samples split into:
  - **Train Set (70%)**: 472 samples (`train.csv`)
  - **Validation Set (15%)**: 101 samples (`validation.csv`)
  - **Test Set (15%)**: 102 samples (`test.csv`)
  - Random Seed: 42. All rows are explicitly tagged with `is_synthetic=True`.
- **Source Reference**: `datasets/grievance-classification/README.md`

### Q32. What are the 9 target grievance categories in the dataset?
- **Short Oral Answer**: "Water Supply, Electricity, Roads and Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, and Other."
- **Detailed Explanation**: These categories represent standard central government ministry operational domains, mapping directly to department table records in PostgreSQL.
- **Source Reference**: `ai-service/models/grievance-classifier/config.json`

### Q33. How does TF-IDF feature extraction work mathematical intuition?
- **Short Oral Answer**: "TF measures how frequently a term appears in a complaint, while IDF measures how rare or unique the term is across all complaints in the dataset."
- **Detailed Explanation**:
  $$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)$$
  $$\text{IDF}(t, D) = \log\left(\frac{N}{|\{d \in D : t \in d\}|}\right)$$
  Common words like "the" or "complaint" appear everywhere and receive an IDF weight near zero. Unique domain terms like "transformer", "patwari", or "sewage" receive high TF-IDF weights.
- **Source Reference**: `docs/viva/ai-ml-deep-dive.md`

### Q34. How does Logistic Regression calculate probability scores for multiple categories?
- **Short Oral Answer**: "It computes linear dot products for each class score $z_k$ and applies the Softmax function to convert scores into normalized probability distributions sum to 1.0."
- **Detailed Explanation**:
  $$z_k = \mathbf{w}_k \cdot \mathbf{x} + b_k$$
  $$P(y = k \mid \mathbf{x}) = \frac{e^{z_k}}{\sum_{j=1}^{K} e^{z_j}}$$
  The category with the highest Softmax probability is chosen as `predicted_category`, and its score becomes `category_confidence`.
- **Source Reference**: `docs/viva/ai-ml-deep-dive.md`

### Q35. What confidence thresholds trigger human-in-the-loop review?
- **Short Oral Answer**: "High confidence is $\ge 0.75$ (no review required). Medium confidence is $0.50 \le c < 0.75$ (review required). Low confidence is $< 0.50$ (review required)."
- **Detailed Explanation**: Defined in `ai-service/app/services/ml/classifier.py` via `AI_CONFIDENCE_THRESHOLD=0.75` and `AI_LOW_CONFIDENCE_THRESHOLD=0.50`. If prediction confidence falls below 0.75, `ai_review_required` is set to `true`.
- **Source Reference**: `ai-service/app/services/ml/classifier.py` lines 11-13

### Q36. How does Explainable AI (XAI) feature term extraction work in your code?
- **Short Oral Answer**: "It multiplies the TF-IDF feature vector values by the Logistic Regression weight coefficients for the predicted class, extracting the top positive scoring terms."
- **Detailed Explanation**:
  In `extract_explanation_terms()` (`classifier.py` line 16), the method computes token contribution score $S(t) = \text{TF-IDF}(t) \times w_{\text{predicted\_class}}(t)$. Terms with the highest positive scores are returned as `explanation_terms` (e.g., `['pipeline', 'leakage', 'water']`).
- **Source Reference**: `ai-service/app/services/ml/classifier.py` line 16

### Q37. What happens if the trained model file `model.joblib` is missing or corrupted?
- **Short Oral Answer**: "The service gracefully catches the error and executes a keyword rule-based baseline fallback, setting `ai_review_required: true`."
- **Detailed Explanation**: `model_loader.py` handles missing files. When uninitialized, `MLGrievanceClassifier.classify()` falls back to `grievance_classifier_service.classify(text)`, returning baseline category matching with `classification_method: "rule_based_fallback"`.
- **Source Reference**: `ai-service/app/services/ml/classifier.py` line 171

### Q38. What validation performance metrics were achieved on the synthetic validation set?
- **Short Oral Answer**: "100.0% accuracy, precision, recall, and F1-score on the 101-sample synthetic validation set."
- **Detailed Explanation**: As saved in `ai-service/models/grievance-classifier/config.json`, the trained TF-IDF + Logistic Regression pipeline achieved 1.0 accuracy on the clean synthetic validation split (`validation.csv`).
- **Source Reference**: `ai-service/models/grievance-classifier/config.json`

### Q39. Why should you NOT claim 100% accuracy on real-world government complaints?
- **Short Oral Answer**: "Because the dataset is synthetic and curated. Real-world citizen complaints contain heavy noise, typos, slang, and complex multi-issue complaints."
- **Detailed Explanation**: Academic honesty requires acknowledging that synthetic validation performance does not translate directly to real CPGRMAS portals where noise, spelling errors, and multi-department overlaps lower real-world accuracy.
- **Source Reference**: `docs/final-system-audit.md` Section 4

### Q40. Why did you choose TF-IDF + Logistic Regression over a Transformer model like BERT?
- **Short Oral Answer**: "TF-IDF + Logistic Regression provides sub-50ms CPU inference latency, small memory footprint (<50MB), full mathematical explainability, and clean deployment without requiring GPUs."
- **Detailed Explanation**: Transformer models (e.g., BERT, RoBERTa) require multi-gigabyte GPU memory, high computational latency, and complex black-box explainability toolkits (SHAP/LIME). TF-IDF + Logistic Regression fulfills all project requirements on low-cost infrastructure.
- **Source Reference**: `docs/known-limitations.md`

### Q41. Are alternative classifiers like Naive Bayes or Random Forest available in the repository?
- **Short Oral Answer**: "They are referenced as baseline code in evaluation scripts, but TF-IDF + Logistic Regression is the sole production classifier used."
- **Detailed Explanation**: Logistic Regression is the single trained and serialized model artifact loaded by `model_loader.py` (`model.joblib`).
- **Source Reference**: `ai-service/app/services/ml/model_loader.py`

### Q42. What is the difference between Precision and Recall in complaint classification?
- **Short Oral Answer**: "Precision is the proportion of complaints assigned to Category X that actually belong to Category X. Recall is the proportion of actual Category X complaints correctly identified by the model."
- **Detailed Explanation**:
  $$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}$$
  High precision avoids sending wrong complaints to a department, while high recall ensures no department complaints are missed.
- **Source Reference**: `docs/viva/ai-ml-deep-dive.md`

### Q43. What is the F1-Score?
- **Short Oral Answer**: "The harmonic mean of Precision and Recall, providing a single balanced metric."
- **Detailed Explanation**:
  $$F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
- **Source Reference**: `docs/viva/ai-ml-deep-dive.md`

### Q44. How are out-of-domain complaints handled by the classifier?
- **Short Oral Answer**: "If prediction confidence is below 0.35, the system assigns category 'Other', confidence 0.40, and flags `ai_review_required: true`."
- **Detailed Explanation**: Handled in `classifier.py` line 115 under out-of-domain fallback logic, routing unfamiliar complaints to category `Other` for human administrator sorting.
- **Source Reference**: `ai-service/app/services/ml/classifier.py` line 115

### Q45. How does text preprocessing normalize complaint inputs?
- **Short Oral Answer**: "Lowercasing, removing special characters/numbers, stripping extra whitespace, and filtering common stop words."
- **Detailed Explanation**: Implemented in `app/services/preprocessor.py`, regex operations strip noise while preserving domain-specific terms.
- **Source Reference**: `ai-service/app/services/preprocessor.py`

### Q46. How does the model model multi-class classification?
- **Short Oral Answer**: "Using multinomial Logistic Regression (Softmax regression) where all 9 category class probabilities are estimated simultaneously."
- **Detailed Explanation**: Softmax parameterization computes 9 logit values, normalizing them into a joint probability distribution where $\sum_{i=1}^{9} P(y_i) = 1.0$.
- **Source Reference**: `ai-service/scripts/train_classifier.py`

### Q47. How is the trained model pipeline saved and loaded in Python?
- **Short Oral Answer**: "Saved using `joblib.dump(pipeline, 'model.joblib')` and loaded into memory using `joblib.load()` on FastAPI startup."
- **Detailed Explanation**: `model_loader.py` initializes a singleton object that loads `model.joblib` once into memory during application startup (`@app.on_event("startup")`), avoiding disk read overhead on individual requests.
- **Source Reference**: `ai-service/app/services/ml/model_loader.py`

---

## SECTION D — MULTILINGUAL PROCESSING (10 Questions)

### Q48. How does language detection work in the AI microservice?
- **Short Oral Answer**: "Using the `langdetect` library, which analyzes character n-gram frequencies to identify ISO-639-1 language codes."
- **Detailed Explanation**: Implemented in `language_detector_service.detect_language()` (`language_detector.py`), text is passed to `langdetect.detect()`, returning language names like `English`, `Hindi`, `Tamil`, `Telugu`, `Marathi`, etc.
- **Source Reference**: `ai-service/app/services/language_detector.py`

### Q49. Which languages are supported for language detection?
- **Short Oral Answer**: "English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, and Punjabi."
- **Detailed Explanation**: The language detector maps ISO codes (`en`, `hi`, `ta`, `te`, `mr`, `bn`, `gu`, `kn`, `ml`, `pa`) to full language names.
- **Source Reference**: `ai-service/app/services/language_detector.py`

### Q50. How does the system handle regional Indic script text complaints?
- **Short Oral Answer**: "It detects non-ASCII Unicode characters, preserves the original text in PostgreSQL, and applies keyword fallback rules or passes the text to the classifier."
- **Detailed Explanation**: In `classifier.py` line 79, `has_non_ascii` checks for characters outside standard ASCII range (`ord(c) > 127`). If non-English text contains domain keywords, it routes using `indic_keyword_fallback`.
- **Source Reference**: `ai-service/app/services/ml/classifier.py` line 79

### Q51. Does the system perform real-time neural translation (e.g., IndicTrans2)?
- **Short Oral Answer**: "No. The system does not implement neural translation models. It preserves original regional text and performs language identification."
- **Detailed Explanation**: Academic honesty requires stating clearly that deep neural translation is not implemented. Regional complaints store original text in `original_text` and language code in `detected_language`.
- **Source Reference**: `docs/known-limitations.md` Section 1.2

### Q52. Why is storing original text and detected language important for future work?
- **Short Oral Answer**: "It preserves data integrity and allows future neural translation models or regional officers to inspect the exact citizen complaint."
- **Detailed Explanation**: Altering regional text with imperfect translation algorithms risks corrupting critical details (e.g. street names or landmark locations).
- **Source Reference**: `docs/final-project-report.md` Section 10

### Q53. How does the chatbot respond to non-English greetings or inquiries?
- **Short Oral Answer**: "The chatbot detects the input language and returns appropriate responses or English guidance with language metadata."
- **Detailed Explanation**: `chatbot_service.process_message()` calls `language_detector_service`, setting `language` metadata field in the `ChatbotResponse` payload.
- **Source Reference**: `ai-service/app/services/chatbot.py` line 74

### Q54. What happens if language detection fails or receives ambiguous short text?
- **Short Oral Answer**: "It defaults to `English` with confidence `0.50` and proceeds through the pipeline safely."
- **Detailed Explanation**: Exception handlers in `language_detector.py` catch `LangDetectException` (which occurs on empty or short numeric strings) and return `{ "language": "English", "confidence": 0.50 }`.
- **Source Reference**: `ai-service/app/services/language_detector.py`

### Q55. What is the difference between Unicode script detection and machine translation?
- **Short Oral Answer**: "Unicode script detection identifies character encodings (e.g. Devanagari vs Tamil), whereas translation converts sentence meaning from one language to another."
- **Detailed Explanation**: Script detection checks character code point ranges (e.g. `U+0900` to `U+097F` for Devanagari). Translation requires sequence-to-sequence neural models.
- **Source Reference**: `docs/viva/technical-glossary.md`

### Q56. Why is multilingual handling vital for Central Government portals in India?
- **Short Oral Answer**: "India has 22 official languages. Citizens in regional states submit complaints in native scripts like Hindi, Tamil, or Marathi."
- **Detailed Explanation**: Central portals like CPGRAMS serve over 1.4 billion citizens. Supporting multilingual detection ensures citizens are not forced to write complaints in English.
- **Source Reference**: `docs/final-project-report.md` Section 1

### Q57. What are the limitations of the current multilingual implementation?
- **Short Oral Answer**: "No automatic neural translation to English, reliance on English TF-IDF model for English text, and keyword fallback for Indic scripts."
- **Detailed Explanation**: Documented in `docs/known-limitations.md`, full translation requires future integration of transformer-based NMT models like `IndicTrans2`.
- **Source Reference**: `docs/known-limitations.md`

---

## SECTION E — GRIEVANCE CLASSIFICATION, PRIORITY & ROUTING (12 Questions)

### Q58. How does category prediction map to government departments?
- **Short Oral Answer**: "Each predicted category string maps directly to a pre-seeded Department record in PostgreSQL via exact string matching."
- **Detailed Explanation**: Implemented in `ai-service/app/services/department_router.py` and `backend/src/controllers/grievance.controller.js`, category names like `Water Supply` map to Department record code `WS`.
- **Source Reference**: `ai-service/app/services/department_router.py`

### Q59. How is grievance priority predicted in the system?
- **Short Oral Answer**: "Using a keyword severity and urgency analysis algorithm that evaluates emergency terms in the complaint text."
- **Detailed Explanation**: Implemented in `ai-service/app/services/priority_predictor.py`, `PriorityPredictor.predict_priority()` scans text for critical keywords (e.g. "spark", "burst", "hazard", "fire") and assigns `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` priority.
- **Source Reference**: `ai-service/app/services/priority_predictor.py`

### Q60. What are the Service Level Agreement (SLA) target times for each priority level?
- **Short Oral Answer**: "CRITICAL: 12 hours, HIGH: 24 hours, MEDIUM: 48 hours, LOW: 72 hours."
- **Detailed Explanation**: Urgency levels automatically attach SLA resolution deadlines, helping department officers prioritize critical public safety issues.
- **Source Reference**: `ai-service/app/services/priority_predictor.py`

### Q61. What is the difference between learned ML classification and rule-based priority prediction?
- **Short Oral Answer**: "Category classification is learned from data using TF-IDF + Logistic Regression, whereas priority prediction uses deterministic keyword urgency rules."
- **Detailed Explanation**: Category prediction uses statistical machine learning weights derived from training data. Priority assignment uses explicit domain rules to ensure critical safety keywords always trigger high urgency.
- **Source Reference**: `docs/viva/source-of-truth.md` Section 3

### Q62. What metadata is stored in PostgreSQL for each grievance's AI prediction?
- **Short Oral Answer**: `category`, `priority`, `department_id`, `ai_confidence`, `ai_confidence_level`, `ai_review_required`, `ai_classification_method`, and `ai_explanation_terms`.
- **Detailed Explanation**: Defined in `backend/prisma/schema.prisma`, these columns record full prediction provenance for UI display and administrator auditing.
- **Source Reference**: `backend/prisma/schema.prisma`

### Q63. How is a unique Grievance Reference Number generated?
- **Short Oral Answer**: "Formatted as `GRV-YYYY-XXXXXX` using current year and auto-incrementing padded sequence numbers."
- **Detailed Explanation**: Generated in `backend/src/controllers/grievance.controller.js` (e.g. `GRV-2026-000001`), providing citizens with an easily readable reference code for status tracking.
- **Source Reference**: `backend/src/controllers/grievance.controller.js`

### Q64. How does an administrator perform a Human Classification Correction?
- **Short Oral Answer**: "Admin calls `PATCH /api/v1/admin/grievances/:id/classification` with new `category` and `department_id`."
- **Detailed Explanation**: Implemented in `backend/src/controllers/admin.controller.js`, the endpoint updates `category` and `department_id`, stores original prediction in `ai_original_category`, sets `is_human_corrected: true`, and logs `human_corrected_by` and `human_corrected_at`.
- **Source Reference**: `backend/src/controllers/admin.controller.js`

### Q65. Why is it vital to preserve `ai_original_category` when an admin corrects a classification?
- **Short Oral Answer**: "It maintains an immutable audit trail and provides labeled ground-truth data for future model retraining."
- **Detailed Explanation**: Overwriting AI predictions without preserving original values destroys tracking of model mistakes. Storing both allows data scientists to analyze misclassified examples.
- **Source Reference**: `docs/final-project-report.md` Section 8

### Q66. What valid status transitions are allowed for a grievance?
- **Short Oral Answer**: `SUBMITTED` -> `UNDER_REVIEW` -> `RESOLVED` or `REJECTED`.
- **Detailed Explanation**: Enforced in `backend/src/controllers/officer.controller.js`, status progression follows a state machine where resolving or rejecting a complaint mandates officer remarks.
- **Source Reference**: `backend/src/controllers/officer.controller.js`

### Q67. Are officers allowed to resolve a grievance without submitting remarks?
- **Short Oral Answer**: "No. Non-empty `remarks` (minimum 5 characters) are strictly enforced by the backend."
- **Detailed Explanation**: Updating status to `RESOLVED` or `REJECTED` without remarks returns `400 Bad Request`, ensuring citizens always receive explanation comments upon closure.
- **Source Reference**: `backend/src/controllers/officer.controller.js`

### Q68. What happens when a grievance status is updated by an officer?
- **Short Oral Answer**: "The database updates status, creates a `GrievanceStatusHistory` record, and generates a `Notification` for the citizen owner."
- **Detailed Explanation**: Executed inside a Prisma database transaction, preserving history and notifying the citizen via `STATUS_CHANGED` notification type.
- **Source Reference**: `backend/src/controllers/officer.controller.js`

### Q69. What failure cases can occur during classification and routing?
- **Short Oral Answer**: "Unfamiliar out-of-domain text, ambiguous complaints spanning multiple departments, or AI microservice offline."
- **Detailed Explanation**: All failure cases route gracefully to category `Other` or trigger `ai_review_required: true`, ensuring complaints are never dropped.
- **Source Reference**: `ai-service/app/services/ml/classifier.py`

---

## SECTION F — CHATBOT & CONVERSATIONAL CONTEXT (10 Questions)

### Q70. What architecture powers the project's chatbot?
- **Short Oral Answer**: "An explicit intent classification engine with regex pattern matching, entity extraction, and session context recall."
- **Detailed Explanation**: Implemented in `ai-service/app/services/chatbot.py`, the chatbot evaluates 9 explicit intent schemas, extracts reference numbers, and recalls session context without requiring generative LLMs.
- **Source Reference**: `ai-service/app/services/chatbot.py`

### Q71. What are the 9 explicit intents recognized by the chatbot?
- **Short Oral Answer**: `GREETING`, `PRIORITY_INFORMATION`, `PROCESS_INFORMATION`, `TRACKING_GUIDANCE`, `SUBMIT_GRIEVANCE_GUIDANCE`, `DEPARTMENT_INFORMATION`, `HELP`, `GRIEVANCE_STATUS` / `GRIEVANCE_DETAILS`, and `UNKNOWN`.
- **Detailed Explanation**: Implemented in `chatbot_service.process_message()`, each intent returns specific structured text and guidance.
- **Source Reference**: `ai-service/app/services/chatbot.py` lines 104-280

### Q72. How does the chatbot extract grievance reference numbers from user messages?
- **Short Oral Answer**: "Using regular expression regex pattern matching for `GRV-\\d{4}-\\d{6}`."
- **Detailed Explanation**: In `chatbot.py` line 78, `re.compile(r'\b(GRV-?\d{4}-?\d{6})\b', re.IGNORECASE)` matches codes like `GRV-2026-000001` or `GRV2026000001`, normalizing hyphens automatically.
- **Source Reference**: `ai-service/app/services/chatbot.py` line 78

### Q73. How does contextual follow-up recall work in the chatbot?
- **Short Oral Answer**: "The session context stores `last_grievance_number`. If follow-up questions use pronouns like 'it' or 'this complaint', the chatbot uses the stored reference number."
- **Detailed Explanation**: In `chatbot.py` line 97, if no new reference code is found but `session_context.last_grievance_number` exists and user text contains pronouns like "it" or "why classified", the chatbot binds query to the previous reference ID.
- **Source Reference**: `ai-service/app/services/chatbot.py` line 97

### Q74. How does the chatbot enforce citizen data privacy and ownership isolation?
- **Short Oral Answer**: "The Express API passes only the authenticated user's grievances (`user_grievances`) to the chatbot. Querying another citizen's reference ID returns 'No grievance record found'."
- **Detailed Explanation**: In `backend/src/controllers/chatbot.controller.js`, Express fetches `prisma.grievance.findMany({ where: { user_id: req.user.id } })` and sends it to FastAPI. The chatbot cannot view complaints of other users.
- **Source Reference**: `backend/src/controllers/chatbot.controller.js`

### Q75. Why should the chatbot NOT be described as a generative LLM or RAG system?
- **Short Oral Answer**: "Because it uses deterministic intent matching and authenticated database lookups rather than generative language models or vector search retrieval."
- **Detailed Explanation**: Academic honesty requires clarifying that the chatbot is a rule-based intent processor. Describing it as ChatGPT or RAG would be inaccurate.
- **Source Reference**: `docs/known-limitations.md` Section 1.3

### Q76. What information does the chatbot provide for `PRIORITY_INFORMATION` intent?
- **Short Oral Answer**: "Detailed definitions of CRITICAL, HIGH, MEDIUM, and LOW priority levels with example scenarios."
- **Detailed Explanation**: Returns structured guidance explaining emergency criteria (e.g. fire/toxic leaks for CRITICAL, road damage for HIGH, service cuts for MEDIUM).
- **Source Reference**: `ai-service/app/services/chatbot.py` line 114

### Q77. What information does the chatbot provide for `PROCESS_INFORMATION` intent?
- **Short Oral Answer**: "Explains the complete 9-step grievance lifecycle from submission to resolution and notifications."
- **Detailed Explanation**: Outlines steps: Submission -> Language Detection -> Preprocessing -> AI Classification -> Priority Assessment -> Department Routing -> Officer Review -> Status Updates -> Notifications.
- **Source Reference**: `ai-service/app/services/chatbot.py` line 126

### Q78. How does the chatbot handle `UNKNOWN` or out-of-domain queries?
- **Short Oral Answer**: "It returns a helpful fallback response stating available capabilities and suggesting commands."
- **Detailed Explanation**: Returns `confidence: 0.50` and structured suggestions (e.g., "Ask 'Status of GRV-2026-000001' or 'How do I submit a complaint?'").
- **Source Reference**: `ai-service/app/services/chatbot.py` line 279

### Q79. What response metadata is returned by the chatbot endpoint?
- **Short Oral Answer**: `message`, `language`, `intent`, `confidence`, `grievance_number`, `grievance` details object, `session_context`, and `processing_time_ms`.
- **Detailed Explanation**: Defined in `app/schemas/chatbot.py`, enabling the frontend UI to render status badges and explanation chips dynamically.
- **Source Reference**: `ai-service/app/schemas/chatbot.py`

---

## SECTION G — BACKEND, DATABASE & APIs (15 Questions)

### Q80. What framework and language power the Backend API Gateway?
- **Short Oral Answer**: "Node.js v20+ with Express.js framework written in CommonJS JavaScript."
- **Detailed Explanation**: Express provides lightweight middleware routing, CORS handling (`cors`), request logging (`morgan`), and body parsing for RESTful endpoints.
- **Source Reference**: `backend/package.json`

### Q81. What framework powers the AI Microservice?
- **Short Oral Answer**: "Python FastAPI with Pydantic schema validation and Uvicorn ASGI server."
- **Detailed Explanation**: FastAPI delivers automatic OpenAPI documentation (`/docs`), asynchronous request handling, and Pydantic request/response payload validation.
- **Source Reference**: `ai-service/app/main.py`

### Q82. What database is used and what is its relational structure?
- **Short Oral Answer**: "PostgreSQL 15 with 5 core tables: `users`, `departments`, `grievances`, `grievance_status_history`, and `notifications`."
- **Detailed Explanation**: Defined in `backend/prisma/schema.prisma`:
  - `User` belongs to `Department` (optional, for officers).
  - `Grievance` belongs to `User` (citizen author) and `Department` (assigned department).
  - `GrievanceStatusHistory` belongs to `Grievance` (1-to-many relationship).
  - `Notification` belongs to `User` (citizen recipient) and `Grievance`.
- **Source Reference**: `backend/prisma/schema.prisma`

### Q83. What are the key fields of the `Grievance` database model?
- **Short Oral Answer**: `id`, `grievance_number`, `user_id`, `original_text`, `detected_language`, `category`, `priority`, `department_id`, `status`, `ai_confidence`, `ai_review_required`, `ai_explanation_terms`, `is_human_corrected`, `created_at`.
- **Detailed Explanation**: Captures complaint data, status state, AI metadata, XAI explanation terms, and human correction flags in a single relational schema.
- **Source Reference**: `backend/prisma/schema.prisma` line 45

### Q84. What primary API endpoints are available under `/api/v1/auth`?
- **Short Oral Answer**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, and `GET /api/v1/auth/me`.
- **Detailed Explanation**:
  - `register`: Validates input, hashes password with bcrypt, creates User.
  - `login`: Verifies password hash, issues 24-hour JWT token.
  - `me`: Returns authenticated user profile object.
- **Source Reference**: `backend/src/routes/auth.routes.js`

### Q85. What primary API endpoints are available under `/api/v1/grievances`?
- **Short Oral Answer**: `POST /api/v1/grievances` (Submit grievance) and `GET /api/v1/grievances` (List user grievances).
- **Detailed Explanation**: Restricted to `CITIZEN` role. `POST` triggers AI microservice analysis and saves grievance; `GET` returns complaints authored by logged-in citizen.
- **Source Reference**: `backend/src/routes/grievance.routes.js`

### Q86. What primary API endpoints are available under `/api/v1/officer`?
- **Short Oral Answer**: `GET /api/v1/officer/grievances`, `PATCH /api/v1/officer/grievances/:id/status`, and `GET /api/v1/officer/analytics`.
- **Detailed Explanation**: Restricted to `OFFICER` role. `GET` filters queue by officer's `department_id`; `PATCH` updates status (`RESOLVED`/`REJECTED`) enforcing remarks.
- **Source Reference**: `backend/src/routes/officer.routes.js`

### Q87. What primary API endpoints are available under `/api/v1/admin`?
- **Short Oral Answer**: `GET /api/v1/admin/grievances`, `PATCH /api/v1/admin/grievances/:id/classification`, and `GET /api/v1/admin/analytics`.
- **Detailed Explanation**: Restricted to `ADMIN` role. Grants system-wide grievance access, classification override rights, and executive analytics summaries.
- **Source Reference**: `backend/src/routes/admin.routes.js`

### Q88. How are database transactions used in the backend?
- **Short Oral Answer**: "Prisma `$transaction` operations ensure atomic updates when modifying grievance status and creating history/notification records simultaneously."
- **Detailed Explanation**: In `officer.controller.js`, updating grievance status, creating `GrievanceStatusHistory`, and creating `Notification` execute inside a transaction. If any step fails, all changes roll back.
- **Source Reference**: `backend/src/controllers/officer.controller.js`

### Q89. How does input validation protect API endpoints?
- **Short Oral Answer**: "Validates email formats, password minimum lengths, non-empty grievance text (min 5 chars), and valid role values."
- **Detailed Explanation**: Middleware validates request payloads before controller processing, returning `400 Bad Request` with specific field error messages on invalid input.
- **Source Reference**: `backend/src/controllers/grievance.controller.js`

### Q90. How does the system handle database connection errors on startup?
- **Short Oral Answer**: "The Express server logs the error, attempts reconnects, and returns HTTP 500 status on database queries while remaining online."
- **Detailed Explanation**: Configured in `backend/src/config/database.js`, connection failures output log diagnostics without crashing Node process ungracefully.
- **Source Reference**: `backend/src/config/database.js`

### Q91. What is the purpose of database seed data?
- **Short Oral Answer**: "Populates default departments and demo user accounts for testing."
- **Detailed Explanation**: `prisma/seed.js` inserts 9 master departments and pre-configured test users (`citizen@example.com`, `officer.water@example.com`, `admin@example.com`).
- **Source Reference**: `backend/prisma/seed.js`

### Q92. What HTTP status codes are returned by the API Gateway?
- **Short Oral Answer**: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.
- **Detailed Explanation**: Express controllers return standard REST HTTP codes indicating exact response status.
- **Source Reference**: `backend/src/middleware/error.middleware.js`

### Q93. What CORS settings are configured on the Express backend?
- **Short Oral Answer**: "CORS allows requests from `CLIENT_URL` (e.g. `http://localhost:5173`) with headers `Authorization` and `Content-Type`."
- **Detailed Explanation**: Configured in `backend/src/server.js` using `cors()` middleware to prevent unauthorized cross-origin browser requests.
- **Source Reference**: `backend/src/server.js`

### Q94. How does the health check endpoint work?
- **Short Oral Answer**: `GET /api/v1/health` checks database connectivity and returns HTTP 200 with status `UP`."
- **Detailed Explanation**: Used by Docker Compose health checks (`wget http://localhost:5000/api/v1/health`) to monitor container readiness.
- **Source Reference**: `backend/src/routes/health.routes.js`

---

## SECTION H — AUTHENTICATION AND SECURITY (10 Questions)

### Q95. How is user authentication implemented in the application?
- **Short Oral Answer**: "Using JSON Web Tokens (JWT) issued upon successful login and passed in the `Authorization: Bearer <token>` header."
- **Detailed Explanation**: Implemented in `backend/src/utils/jwt.js` and `auth.middleware.js`. The token payload contains user ID (`sub`) and role, signed with `JWT_SECRET` and expiring in 24 hours.
- **Source Reference**: `backend/src/middleware/auth.middleware.js`

### Q96. How are passwords stored securely in PostgreSQL?
- **Short Oral Answer**: "Passwords are hashed using bcrypt algorithm with a salt cost factor of 10."
- **Detailed Explanation**: Plaintext passwords are never stored. `bcrypt.hash(password, 10)` generates one-way salted hashes during user registration.
- **Source Reference**: `backend/src/controllers/auth.controller.js`

### Q97. How does Role-Based Access Control (RBAC) middleware protect API routes?
- **Short Oral Answer**: "The `requireRole(...allowedRoles)` middleware checks `req.user.role` and blocks unauthorized requests with `403 Forbidden`."
- **Detailed Explanation**:
  ```javascript
  router.post("/", authenticate, requireRole("CITIZEN"), createGrievance);
  router.patch("/:id/classification", authenticate, requireRole("ADMIN"), updateClassification);
  ```
  If an officer attempts to access an admin endpoint, `requireRole` rejects the call before it reaches the controller.
- **Source Reference**: `backend/src/middleware/role.middleware.js`

### Q98. How is citizen privacy enforced for grievance details?
- **Short Oral Answer**: "Grievance queries include `user_id: req.user.id`, ensuring citizens can only fetch their own submitted complaints."
- **Detailed Explanation**: Even if a citizen guesses another grievance ID, `prisma.grievance.findFirst({ where: { id, user_id: req.user.id } })` evaluates to `null` and returns `404 Not Found`.
- **Source Reference**: `backend/src/controllers/grievance.controller.js`

### Q99. How is department queue isolation enforced for officers?
- **Short Oral Answer**: "Officer queries include `department_id: req.user.department_id`, preventing officers from viewing or editing complaints from other departments."
- **Detailed Explanation**: In `officer.controller.js`, all queue listing and status update operations filter strictly by the officer's assigned department ID.
- **Source Reference**: `backend/src/controllers/officer.controller.js`

### Q100. How does the backend prevent SQL Injection vulnerabilities?
- **Short Oral Answer**: "By using Prisma ORM, which parameterizes all SQL queries automatically."
- **Detailed Explanation**: Prisma separates SQL query commands from user input values, eliminating raw string concatenation and preventing SQL injection attacks.
- **Source Reference**: `backend/prisma/schema.prisma`

### Q101. How are sensitive configuration secrets protected?
- **Short Oral Answer**: "Stored in `.env` files which are excluded from Git repository tracking via `.gitignore`."
- **Detailed Explanation**: `.env.example` files contain placeholder strings. Real JWT secrets and database passwords exist only in local/server environment files.
- **Source Reference**: `.gitignore`

### Q102. What happens when a JWT token expires?
- **Short Oral Answer**: "The `authenticate` middleware catches `TokenExpiredError` and returns HTTP `401 Unauthorized` with message 'Invalid or expired token'."
- **Detailed Explanation**: The frontend API client interceptor detects 401 responses, clears local storage tokens, and redirects the user to the login screen.
- **Source Reference**: `backend/src/middleware/auth.middleware.js` line 30

### Q103. Does the application sanitize user inputs against Cross-Site Scripting (XSS)?
- **Short Oral Answer**: "React automatically escapes rendered string values in the DOM, preventing script injection."
- **Detailed Explanation**: React JSX syntax treats string variables as safe text text content rather than executable HTML script tags.
- **Source Reference**: `frontend/src/features/grievances/`

### Q104. How are notification ownership checks enforced?
- **Short Oral Answer**: "Notification fetch and read endpoints filter strictly by `user_id: req.user.id`."
- **Detailed Explanation**: In `notification.controller.js`, marking notifications as read updates only records belonging to the authenticated user ID.
- **Source Reference**: `backend/src/controllers/notification.controller.js`

---

## SECTION I — FRONTEND AND USER EXPERIENCE (8 Questions)

### Q105. What technology stack powers the frontend UI?
- **Short Oral Answer**: "React 18, TypeScript, Vite build tool, Tailwind CSS, and Lucide React icons."
- **Detailed Explanation**: React provides component-based UI views, TypeScript enforces strict interface types, Vite delivers fast development builds, and Tailwind CSS styles modern UI layouts.
- **Source Reference**: `frontend/package.json`

### Q106. How does the frontend handle authentication state across pages?
- **Short Oral Answer**: "Using React Context API (`AuthContext`) which stores current user object and JWT token in `localStorage`."
- **Detailed Explanation**: `AuthContext.tsx` provides `user`, `login()`, `logout()`, and `isAuthenticated` states to the entire component tree.
- **Source Reference**: `frontend/src/features/auth/AuthContext.tsx`

### Q107. How are protected routes implemented in the frontend?
- **Short Oral Answer**: "Using a `ProtectedRoute` wrapper component that checks `user` role and redirects unauthenticated users to `/login`."
- **Detailed Explanation**: If a user tries to access `/admin` without `ADMIN` role, `ProtectedRoute` renders a redirect component to login or dashboard.
- **Source Reference**: `frontend/src/components/ProtectedRoute.tsx`

### Q108. How does the frontend API client attach JWT tokens to backend requests?
- **Short Oral Answer**: "Using an Axios HTTP client request interceptor that automatically reads JWT from `localStorage` and sets `Authorization: Bearer <token>`."
- **Detailed Explanation**: Every outgoing API request receives the Bearer header automatically without needing manual token retrieval in individual components.
- **Source Reference**: `frontend/src/shared/api/client.ts`

### Q109. How does the UI display loading, empty, and error states?
- **Short Oral Answer**: "Using loading skeletons, empty state illustrations, and user-friendly toast/alert banners."
- **Detailed Explanation**: UI components check loading flags to render animated pulse skeletons, show empty placeholders when list arrays are empty, and capture API catch errors in banner alerts.
- **Source Reference**: `frontend/src/features/grievances/GrievanceList.tsx`

### Q110. How is the chatbot UI integrated into the citizen dashboard?
- **Short Oral Answer**: "As a slide-over/floating widget and full-page chat interface that streams message history and grievance status cards."
- **Detailed Explanation**: The chatbot UI sends user prompts to `POST /api/v1/chatbot/query` and renders intent-based responses, reference ID links, and explanation badges.
- **Source Reference**: `frontend/src/features/chatbot/ChatbotWidget.tsx`

### Q111. How are grievance status and priority visually represented in the UI?
- **Short Oral Answer**: "Using color-coded badges: Red for CRITICAL/REJECTED, Orange for HIGH/UNDER_REVIEW, Yellow for MEDIUM, Blue for LOW/SUBMITTED, Green for RESOLVED."
- **Detailed Explanation**: Consistent visual design system tokens map status and priority strings to distinct Tailwind CSS color classes for immediate visual recognition.
- **Source Reference**: `frontend/src/shared/ui/badge.tsx`

### Q112. How does the executive analytics dashboard visualize department metrics?
- **Short Oral Answer**: "Using interactive chart components displaying category distribution pie charts, priority breakdowns, and human correction rates."
- **Detailed Explanation**: The Admin Analytics page fetches summary statistics from `GET /api/v1/admin/analytics` and renders category distribution charts.
- **Source Reference**: `frontend/src/features/admin/AdminAnalytics.tsx`

---

## SECTION J — TESTING AND RESULTS (10 Questions)

### Q113. What automated test suites exist in the repository?
- **Short Oral Answer**: "Python `pytest` suite for the AI microservice and Node.js native test runner suite (`supertest`) for backend APIs."
- **Detailed Explanation**:
  - Python tests: `ai-service/tests/` (34 passed)
  - Node tests: `backend/tests/` (65 passed across 18 test suites)
- **Source Reference**: `docs/final-testing-report.md`

### Q114. What exact test results were achieved for the Python AI microservice?
- **Short Oral Answer**: "34 out of 34 passed (100% pass rate) in 15.26 seconds using `pytest`."
- **Detailed Explanation**: Verified in `docs/final-testing-report.md` Section 2:
  - `test_analyze.py`: 14 passed (preprocessing, language detection, TF-IDF, classification, priority, XAI terms)
  - `test_chatbot.py`: 15 passed (intents, reference extraction, session context recall)
  - `test_phase10_ml.py`: 5 passed (model loading, fallback logic, synthetic dataset evaluation)
- **Source Reference**: `docs/final-testing-report.md` Section 2

### Q115. What exact test results were achieved for the Node.js backend API?
- **Short Oral Answer**: "65 out of 65 passed (100% pass rate) across 18 test suites in 7.44 seconds using `npm test`."
- **Detailed Explanation**: Verified in `docs/final-testing-report.md` Section 3:
  - Covers auth, registration, JWT, RBAC, citizen isolation, officer department locking, admin classification corrections, chatbot lookup, and notifications.
- **Source Reference**: `docs/final-testing-report.md` Section 3

### Q116. What were the results of frontend code quality checks and production build?
- **Short Oral Answer**: "ESLint completed with 0 errors (2 fast-refresh warnings). Vite production build (`npm run build`) completed successfully."
- **Detailed Explanation**: Verified in `docs/final-testing-report.md` Section 4. Compiled production bundle output: `dist/index.html` (0.45 kB), `dist/assets/index-B7mHgqFy.css` (56.13 kB), and `dist/assets/index-Ct2Cywsw.js` (428.42 kB).
- **Source Reference**: `docs/final-testing-report.md` Section 4

### Q117. How was Docker Compose setup validated?
- **Short Oral Answer**: "Validated using `docker compose config` which confirmed error-free syntax across all 4 container services."
- **Detailed Explanation**: Confirmed port bindings (80, 5000, 8001, 5433:5432), environment schemas, health checks, and bridge networking topology.
- **Source Reference**: `docs/final-testing-report.md` Section 5

### Q118. What is the difference between static configuration validation and full runtime execution testing?
- **Short Oral Answer**: "`docker compose config` verifies YAML syntax and variable expansion, whereas runtime testing verifies container startup and database connections."
- **Detailed Explanation**: Academic honesty requires distinguishing syntax configuration validation (`docker compose config`) from running live container instances.
- **Source Reference**: `docs/final-testing-report.md`

### Q119. How was citizen ownership isolation tested in the automated backend test suite?
- **Short Oral Answer**: "A test registers Citizen A and Citizen B, creates a complaint for Citizen A, and verifies that Citizen B receives `404 Not Found` when trying to fetch Citizen A's complaint."
- **Detailed Explanation**: Located in `backend/tests/grievance.test.js`, confirming that privacy filters cannot be bypassed by changing grievance IDs in API calls.
- **Source Reference**: `backend/tests/`

### Q120. How was officer department isolation tested in the backend test suite?
- **Short Oral Answer**: "An officer assigned to Water Supply attempts to access a PWD complaint, and the test verifies that the complaint is excluded from their queue."
- **Detailed Explanation**: Located in `backend/tests/officer.test.js`, confirming department filtering logic.
- **Source Reference**: `backend/tests/`

### Q121. Were any automated tests blocked or skipped during final testing?
- **Short Oral Answer**: "No. 0 tests failed, 0 were skipped, and 0 were cancelled across all suites."
- **Detailed Explanation**: Total executed tests: 34 Python tests + 65 Node tests = 99 passed automated test cases.
- **Source Reference**: `docs/final-testing-report.md`

### Q122. How are unit tests distinguished from integration tests in this codebase?
- **Short Oral Answer**: "Unit tests test isolated functions (like text preprocessing or regex extraction), while integration tests test complete HTTP request-response flows with database interactions."
- **Detailed Explanation**: `test_analyze.py` unit tests individual service functions. Backend tests use `supertest` to make HTTP calls against the Express app and PostgreSQL database.
- **Source Reference**: `docs/final-testing-report.md`

---

## SECTION K — DEPLOYMENT AND PRACTICAL SCENARIOS (8 Questions)

### Q123. What are the exact steps to launch the application using Docker Compose?
- **Short Oral Answer**:
  1. `docker compose up --build -d`
  2. `docker exec -it grievance_backend npx prisma migrate deploy`
  3. `docker exec -it grievance_backend npx prisma db seed`
  4. Access UI at `http://localhost:80`.
- **Detailed Explanation**: Builds container images, starts PostgreSQL, FastAPI, Express, and Nginx containers, applies database migrations, and seeds initial demo data.
- **Source Reference**: `docs/deployment.md` Section 3

### Q124. What are the exact steps to run the stack natively without Docker?
- **Short Oral Answer**:
  1. PostgreSQL on port 5433 (`intelligent_grievance` database).
  2. AI service: `cd ai-service && pip install -r requirements.txt && python -m app.main`
  3. Backend API: `cd backend && npm install && npx prisma migrate deploy && npx prisma db seed && npm run dev`
  4. Frontend UI: `cd frontend && npm install && npm run dev` (Access at `http://localhost:5173`).
- **Detailed Explanation**: Runs services as independent local development processes.
- **Source Reference**: `docs/deployment.md` Section 4

### Q125. How do container hostnames differ between Docker Compose and native local execution?
- **Short Oral Answer**: "Inside Docker Compose, backend uses `http://ai-service:8001` and `postgres:5432`. In native local execution, backend uses `http://localhost:8001` and `localhost:5433`."
- **Detailed Explanation**: Docker bridge networking relies on container names as DNS hostnames, whereas native execution uses `localhost` port bindings.
- **Source Reference**: `docs/deployment.md` Section 6

### Q126. What command is used to apply database schema changes in production?
- **Short Oral Answer**: `npx prisma migrate deploy` inside the backend directory or container.
- **Detailed Explanation**: `prisma migrate deploy` executes pending SQL files from `prisma/migrations/` without dropping tables or resetting user data.
- **Source Reference**: `backend/package.json`

### Q127. How can you verify that all four services are healthy?
- **Short Oral Answer**:
  - `docker compose ps` (Check container status).
  - Backend health: `GET http://localhost:5000/api/v1/health`
  - AI health: `GET http://localhost:8001/health`
  - Postgres: `pg_isready -h localhost -p 5433 -U postgres`
- **Detailed Explanation**: Each service exposes diagnostic health endpoints for monitoring.
- **Source Reference**: `docs/deployment.md` Section 6

### Q128. What should you do if the backend fails to connect to PostgreSQL during Docker startup?
- **Short Oral Answer**: "Check container status (`docker compose ps`), verify `DATABASE_URL` credentials in `.env`, and check postgres logs using `docker logs grievance_postgres`."
- **Detailed Explanation**: PostgreSQL may take 3-5 seconds to initialize on first launch. `depends_on` healthcheck condition prevents backend from starting until Postgres passes `pg_isready`.
- **Source Reference**: `docs/deployment.md` Section 7

### Q129. How do you wipe the database and re-initialize a completely clean environment in Docker?
- **Short Oral Answer**:
  1. `docker compose down -v` (Stops containers and removes database volume).
  2. `docker compose up -d`
  3. `docker exec -it grievance_backend npx prisma migrate deploy`
  4. `docker exec -it grievance_backend npx prisma db seed`
- **Detailed Explanation**: `down -v` removes persistent Docker volume `postgres_data`, forcing a fresh database initialization.
- **Source Reference**: `docs/deployment.md` Section 3.4

### Q130. What production deployment considerations should be addressed before public cloud launch?
- **Short Oral Answer**: "Enabling HTTPS/TLS certificates, configuring strong JWT secrets, setting production domain CORS origins, and using managed database services (e.g. AWS RDS)."
- **Detailed Explanation**: Production deployments require SSL termination, secure secret managers, and production database backups.
- **Source Reference**: `docs/deployment.md`

---

## SECTION L — CHALLENGING EXAMINER QUESTIONS (15 Questions)

### Q131. Why should a government portal use your system instead of a standard complaint form with dropdowns?
- **Short Oral Answer**: "Citizens often select the wrong department in dropdowns, causing misrouted complaints. Natural language AI automatically determines the correct department, estimates urgency, and flags low-confidence complaints for review."
- **Detailed Explanation**: Citizens lack technical knowledge of government administrative boundaries. For example, a broken streetlamp might be submitted under 'Roads' instead of 'Electricity'. Our AI analyzes the full text description to route correctly, reducing manual transfer delays by days.
- **Source Reference**: `docs/final-project-report.md` Section 1

### Q132. Is this a real AI project or just keyword matching?
- **Short Oral Answer**: "It is a real statistical machine learning model using TF-IDF vectorization and Logistic Regression trained on dataset samples, supported by keyword rules as a safety fallback."
- **Detailed Explanation**: The core classifier extracts 5,000 TF-IDF n-gram features and optimizes Logistic Regression probability weights ($C=2.5$). Keyword matching exists strictly as a fallback when the ML model is uninitialized or text is out of domain.
- **Source Reference**: `ai-service/scripts/train_classifier.py`

### Q133. What exactly is learned by your ML model during training?
- **Short Oral Answer**: "The model learns numerical coefficient weight matrices ($W$) and bias vectors ($b$) that associate specific word n-grams with each of the 9 category classes."
- **Detailed Explanation**: During `pipeline.fit(X_train, y_train)`, the optimization algorithm finds coefficient weights for 5,000 TF-IDF features across 9 categories. Words like "transformer" receive high positive weights for category `Electricity`.
- **Source Reference**: `docs/viva/ai-ml-deep-dive.md`

### Q134. How do you know your classification is accurate?
- **Short Oral Answer**: "We evaluated the model on a 101-sample validation split using Scikit-learn accuracy, precision, recall, and F1-score metrics, achieving 100% on the synthetic validation dataset."
- **Detailed Explanation**: Evaluated via `classification_report()` in `train_classifier.py`, saving exact validation metrics to `config.json`. We also conduct human review on predictions under 75% confidence.
- **Source Reference**: `ai-service/models/grievance-classifier/config.json`

### Q135. Why did you use TF-IDF instead of modern Transformer models like BERT?
- **Short Oral Answer**: "TF-IDF + Logistic Regression delivers sub-50ms CPU inference latency, low memory footprint (<50MB), full mathematical explainability, and easy deployment on standard hardware without GPUs."
- **Detailed Explanation**: Transformer models require significant GPU resources, larger deployment footprints, and complex SHAP explainability. TF-IDF + Logistic Regression satisfies all project constraints while maintaining complete mathematical transparency.
- **Source Reference**: `docs/known-limitations.md`

### Q136. Does your project translate every Indian language correctly?
- **Short Oral Answer**: "No. The system performs language detection and preserves original regional text, applying keyword rules or passing text to the classifier. It does not perform full neural translation."
- **Detailed Explanation**: Honest academic disclosure: full neural translation requires future integration of NMT models like IndicTrans2. The current system detects language codes and stores original text safely.
- **Source Reference**: `docs/known-limitations.md` Section 1.2

### Q137. Is the chatbot really intelligent if it does not use a generative LLM?
- **Short Oral Answer**: "Yes. It uses intent classification, entity regex extraction, and session context recall to provide safe, deterministic, privacy-isolated responses without hallucination."
- **Detailed Explanation**: Generative LLMs frequently hallucinate grievance statuses or expose unauthorized data. Our intent-based chatbot guarantees accurate status reports directly from PostgreSQL with privacy isolation.
- **Source Reference**: `ai-service/app/services/chatbot.py`

### Q138. How does the system prevent one citizen from viewing another citizen's complaint?
- **Short Oral Answer**: "By enforcing `where: { id: grievanceId, user_id: req.user.id }` at the database query layer for all citizen endpoints."
- **Detailed Explanation**: The Express API extracts the authenticated user ID from the validated JWT token (`req.user.id`). Even if a citizen specifies another grievance ID, the database query returns no match, returning `404 Not Found`.
- **Source Reference**: `backend/src/controllers/grievance.controller.js`

### Q139. What happens if the AI microservice goes down during production?
- **Short Oral Answer**: "The Express API catches the network timeout exception and applies a local rule-based fallback, storing the complaint safely in PostgreSQL with `ai_review_required: true`."
- **Detailed Explanation**: Microservice isolation ensures that an AI service outage never blocks citizen complaint submissions or database persistence.
- **Source Reference**: `backend/src/services/ai.service.js`

### Q140. Can an administrator correct a wrong AI prediction?
- **Short Oral Answer**: "Yes. Administrators can perform a Human Correction, updating category and department while preserving `ai_original_category` for model audit."
- **Detailed Explanation**: Accessible via `PATCH /api/v1/admin/grievances/:id/classification`. Updates department assignment, sets `is_human_corrected: true`, and logs administrative audit metadata.
- **Source Reference**: `backend/src/controllers/admin.controller.js`

### Q141. Why do you need human review if you have machine learning?
- **Short Oral Answer**: "Machine learning is probabilistic. Ambiguous or low-confidence complaints (<75%) require human review to ensure citizens are not misrouted."
- **Detailed Explanation**: Human-in-the-loop architecture combines AI speed for clear complaints with human accuracy for complex ambiguous cases, preventing misrouting.
- **Source Reference**: `docs/final-project-report.md` Section 8

### Q142. What happens when the model encounters an unfamiliar or gibberish complaint?
- **Short Oral Answer**: "If prediction confidence falls below 0.35, the system assigns category 'Other', confidence 0.40, and flags `ai_review_required: true`."
- **Detailed Explanation**: Out-of-domain logic in `classifier.py` traps low confidence scores and routes unfamiliar text to category `Other` for manual administrator review.
- **Source Reference**: `ai-service/app/services/ml/classifier.py` line 115

### Q143. How would you scale this project to handle national portal traffic (e.g. 100,000 complaints/day)?
- **Short Oral Answer**: "By deploying FastAPI AI instances behind a load balancer, using Redis caching for reference lookups, and scaling PostgreSQL read replicas."
- **Detailed Explanation**: Because the FastAPI microservice is stateless, horizontal auto-scaling can launch multiple FastAPI container instances behind Nginx/AWS ALB to handle high throughput.
- **Source Reference**: `docs/deployment.md`

### Q144. What is the biggest technical weakness of your current implementation?
- **Short Oral Answer**: "The reliance on keyword/TF-IDF features for English and rule fallbacks for regional Indic scripts, which cannot capture complex multi-sentence semantics."
- **Detailed Explanation**: An honest self-assessment acknowledges that n-gram representations lack deep semantic understanding compared to contextual embeddings, pointing directly to fine-tuned transformer models as the logical next step.
- **Source Reference**: `docs/known-limitations.md`

### Q145. What would you improve if given another three months on this project?
- **Short Oral Answer**: "Fine-tuning an IndicBERT transformer model, integrating IndicTrans2 for 22 Indic language translations, building an active learning auto-retraining pipeline, and integrating WhatsApp/SMS gateways."
- **Detailed Explanation**: Three months would allow collecting real anonymized portal datasets, training fine-tuned IndicBERT embeddings, automating model retraining from administrator human corrections, and connecting real telecommunication gateways.
- **Source Reference**: `docs/final-project-report.md` Section 14
