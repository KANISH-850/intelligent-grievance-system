# Mock Viva Practice Sessions & Self-Assessment Rubric

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  

---

## Session 1 — Basic Viva (15 Questions)

### Q1.1 What inspired you to choose this project topic?
- **Model Answer**: "Central government portals handle huge daily volumes of complaints. Manual dispatch leads to heavy backlogs, misrouting between departments, and delayed emergency response. We wanted to build an automated full-stack AI framework to solve these operational bottlenecks."
- **What Examiner is Testing**: Your awareness of real-world problem context and motivation.
- **Common Mistakes to Avoid**: Giving purely theoretical answers without mentioning real government portals like CPGRAMS.

### Q1.2 Who benefits from this application?
- **Model Answer**: "Citizens get faster processing, status transparency, and chatbot assistance. Department Officers get structured, department-locked queues and clear resolution workflows. Administrators get cross-department analytics and AI correction oversight."
- **What Examiner is Testing**: Understanding of stakeholder requirements.
- **Common Mistakes to Avoid**: Focusing only on citizens and forgetting officer/admin workflows.

### Q1.3 What are the major features of the system?
- **Model Answer**: "Automated AI classification across 9 domains, priority prediction with SLA deadlines, confidence scoring with human review flags, XAI term extraction, intent-based chatbot, role-based dashboards, and in-app notifications."
- **What Examiner is Testing**: High-level functional coverage.
- **Common Mistakes to Avoid**: Listing random UI buttons instead of core system capabilities.

### Q1.4 What government departments are included in the master catalog?
- **Model Answer**: "9 departments: Water Supply, Electricity, Roads and Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, and Other."
- **What Examiner is Testing**: Knowledge of system scope.
- **Common Mistakes to Avoid**: Guessing departments not present in `config.json`.

### Q1.5 How does a citizen know their complaint was received?
- **Model Answer**: "The system instantly returns a unique reference number formatted as `GRV-YYYY-XXXXXX` and creates a submission entry in the citizen's dashboard."
- **What Examiner is Testing**: User feedback loop and record generation.
- **Common Mistakes to Avoid**: Saying the system sends an automated SMS without clarifying that SMS is simulated.

### Q1.6 What priority levels can a complaint be assigned?
- **Model Answer**: "`LOW` (72h SLA), `MEDIUM` (48h SLA), `HIGH` (24h SLA), and `CRITICAL` (12h SLA)."
- **What Examiner is Testing**: System priority hierarchy.
- **Common Mistakes to Avoid**: Mixing up priority labels with confidence level labels (`HIGH`/`MEDIUM`/`LOW`).

### Q1.7 How does an officer handle a complaint in their queue?
- **Model Answer**: "The officer opens the complaint, updates status from `SUBMITTED` to `UNDER_REVIEW`, and finally to `RESOLVED` or `REJECTED` by entering mandatory resolution remarks."
- **What Examiner is Testing**: Officer workflow knowledge.
- **Common Mistakes to Avoid**: Forgetting to mention that resolution remarks are mandatory.

### Q1.8 What happens when an officer resolves a complaint?
- **Model Answer**: "Status updates in PostgreSQL, a `GrievanceStatusHistory` record is written, and an in-app `Notification` is sent to the citizen."
- **What Examiner is Testing**: Database transaction side effects.
- **Common Mistakes to Avoid**: Claiming an email is sent without specifying that notifications are in-app.

### Q1.9 What role does the administrator play in the system?
- **Model Answer**: "Overlooks system analytics, monitors low-confidence flagged complaints, and performs human classification corrections to reassign misrouted complaints."
- **What Examiner is Testing**: Administrator governance features.
- **Common Mistakes to Avoid**: Confusing officer duties with administrator duties.

### Q1.10 How does the chatbot assist citizens?
- **Model Answer**: "The chatbot answers status queries, provides filing guidance, explains department roles, and recalls reference numbers across multi-turn queries."
- **What Examiner is Testing**: Chatbot functional scope.
- **Common Mistakes to Avoid**: Describing the chatbot as a generative conversational AI.

### Q1.11 What visual indicators help users distinguish urgent complaints?
- **Model Answer**: "Color-coded UI badges: Red for CRITICAL, Orange for HIGH, Yellow for MEDIUM, and Blue for LOW."
- **What Examiner is Testing**: UI/UX design clarity.
- **Common Mistakes to Avoid**: Stating that all badges use the same color.

### Q1.12 What happens if a citizen inputs a very short complaint like 'water'?
- **Model Answer**: "Validation checks require a minimum of 5 characters. If accepted, low text length results in lower confidence, setting `ai_review_required: true`."
- **What Examiner is Testing**: Input validation and confidence handling.
- **Common Mistakes to Avoid**: Claiming the AI predicts 100% confidence on single-word inputs.

### Q1.13 How do you ensure demo accounts are ready for testing?
- **Model Answer**: "Using `npx prisma db seed` which seeds pre-configured credentials for citizens, officers, and administrators."
- **What Examiner is Testing**: Test setup reproducibility.
- **Common Mistakes to Avoid**: Admitting you create test accounts manually every time.

### Q1.14 What is the primary output returned to the citizen after filing?
- **Model Answer**: "A summary card showing assigned reference code, predicted category, department, priority, confidence level, and XAI explanation terms."
- **What Examiner is Testing**: Submission response payload contents.
- **Common Mistakes to Avoid**: Omission of AI metadata fields.

### Q1.15 What is the target SLA for a CRITICAL priority complaint?
- **Model Answer**: "12 hours."
- **What Examiner is Testing**: Specific domain rules.
- **Common Mistakes to Avoid**: Stating 24 or 48 hours.

---

## Session 2 — Technical Viva (20 Questions)

### Q2.1 Explain your technology choices for frontend, backend, and AI.
- **Model Answer**: "React + TypeScript for responsive type-safe UI, Node.js + Express for fast asynchronous REST API orchestration, Python FastAPI for Scikit-learn machine learning inference, and PostgreSQL for relational persistence."
- **What Examiner is Testing**: Architectural justification.
- **Common Mistakes to Avoid**: Saying you picked technologies randomly.

### Q2.2 What is the exact machine learning algorithm used?
- **Model Answer**: "TF-IDF Vectorization (`ngram_range=(1,2)`, `max_features=5000`) with multi-class Logistic Regression (`C=2.5`, `solver='lbfgs'`)."
- **What Examiner is Testing**: Precise ML configuration.
- **Common Mistakes to Avoid**: Saying 'BERT' or 'Neural Networks'.

### Q2.3 How is feature importance calculated for XAI explanation terms?
- **Model Answer**: "Token contribution score = $\text{TF-IDF}(t) \times w_{\text{class}}(t)$. Terms with highest positive contributions are extracted as explanation terms."
- **What Examiner is Testing**: Technical understanding of XAI code.
- **Common Mistakes to Avoid**: Claiming you used SHAP or LIME libraries.

### Q2.4 How does the language detector work?
- **Model Answer**: "Uses `langdetect` library to analyze n-gram character frequencies, returning ISO-639-1 language codes."
- **What Examiner is Testing**: NLP preprocessing pipeline.
- **Common Mistakes to Avoid**: Claiming custom language translation models were built.

### Q2.5 How does JWT authentication protect backend routes?
- **Model Answer**: "Tokens are signed with `JWT_SECRET` (24h expiry) and verified via Bearer header in `authenticate` middleware, attaching user object to `req.user`."
- **What Examiner is Testing**: Auth middleware implementation.
- **Common Mistakes to Avoid**: Confusing JWT authentication with role authorization.

### Q2.6 How does RBAC restrict access to admin endpoints?
- **Model Answer**: "`requireRole('ADMIN')` checks `req.user.role`. If not `ADMIN`, it immediately returns `403 Forbidden`."
- **What Examiner is Testing**: Security authorization logic.
- **Common Mistakes to Avoid**: Assuming frontend route hiding is sufficient security.

### Q2.7 How is citizen privacy enforced at the database level?
- **Model Answer**: "Queries include `where: { id: grievanceId, user_id: req.user.id }`, preventing access to grievances authored by other users."
- **What Examiner is Testing**: Data isolation design.
- **Common Mistakes to Avoid**: Stating that citizens can view any complaint if they have the ID.

### Q2.8 How is officer queue isolation enforced?
- **Model Answer**: "Officer queries filter by `where: { department_id: req.user.department_id }`."
- **What Examiner is Testing**: Officer department security boundary.
- **Common Mistakes to Avoid**: Claiming officers can switch departments without admin updates.

### Q2.9 How does Prisma ORM handle database transactions?
- **Model Answer**: "Using `$transaction([query1, query2])` ensuring atomic commits when updating status and inserting history/notification rows."
- **What Examiner is Testing**: Database transaction atomicity.
- **Common Mistakes to Avoid**: Executing queries sequentially without transaction safety.

### Q2.10 What intent classification logic is used in the chatbot?
- **Model Answer**: "Explicit regex pattern matching across 9 intent schemas, entity extraction for `GRV-\d{4}-\d{6}`, and session context memory."
- **What Examiner is Testing**: Chatbot internal architecture.
- **Common Mistakes to Avoid**: Claiming the chatbot uses OpenAI GPT APIs.

### Q2.11 How does session memory work in the chatbot?
- **Model Answer**: "Stores `last_grievance_number` in `session_context`. Pronouns like 'it' or 'this complaint' resolve to the saved reference ID."
- **What Examiner is Testing**: State management in multi-turn chat.
- **Common Mistakes to Avoid**: Claiming the chatbot maintains infinite conversational history.

### Q2.12 What happens if an admin overrides an AI category?
- **Model Answer**: "Category and department update, `ai_original_category` preserves initial prediction, `is_human_corrected` becomes `true`, and admin ID/timestamp are logged."
- **What Examiner is Testing**: Audit trail preservation.
- **Common Mistakes to Avoid**: Overwriting initial prediction without saving original category.

### Q2.13 How does the backend handle AI microservice downtime?
- **Model Answer**: "Catches network error exceptions, logs diagnostic alert, and applies local rule fallback with `ai_review_required: true`."
- **What Examiner is Testing**: Fault-tolerant microservice design.
- **Common Mistakes to Avoid**: Allowing Express API to crash when FastAPI is offline.

### Q2.14 What is the purpose of `sublinear_tf=True` in TF-IDF?
- **Model Answer**: "Replaces $tf$ with $1 + \log(tf)$, dampening the effect of word repetitions in long complaints."
- **What Examiner is Testing**: Mathematical feature engineering.
- **Common Mistakes to Avoid**: Claiming `sublinear_tf` removes stop words.

### Q2.15 Why is `C=2.5` used in Logistic Regression?
- **Model Answer**: "Inverse regularization strength parameter; 2.5 provides optimal balance between model fitting and regularization penalty."
- **What Examiner is Testing**: Hyperparameter tuning understanding.
- **Common Mistakes to Avoid**: Stating C is the learning rate.

### Q2.16 How does Docker Compose manage service dependencies?
- **Model Answer**: "Uses `depends_on` with `condition: service_healthy` to enforce PostgreSQL -> FastAPI -> Express startup sequence."
- **What Examiner is Testing**: Container orchestration ordering.
- **Common Mistakes to Avoid**: Assuming containers start instantly without health check gates.

### Q2.17 How is password security handled?
- **Model Answer**: "Salted bcrypt hashing with cost factor 10 before saving to PostgreSQL."
- **What Examiner is Testing**: Password storage security standards.
- **Common Mistakes to Avoid**: Stating passwords are encrypted with MD5 or AES.

### Q2.18 What is the role of Axios interceptors in the frontend?
- **Model Answer**: "Intercepts outgoing HTTP requests to attach `Authorization: Bearer <token>` and captures 401 response errors to redirect to login."
- **What Examiner is Testing**: Frontend API security integration.
- **Common Mistakes to Avoid**: Attaching tokens manually in every React component.

### Q2.19 How are static assets served in production Docker deployment?
- **Model Answer**: "Nginx serves compiled React production assets from `dist/` on port 80."
- **What Examiner is Testing**: Production deployment web server setup.
- **Common Mistakes to Avoid**: Running `vite dev` server in production.

### Q2.20 What test framework is used for Node.js backend tests?
- **Model Answer**: "Native Node.js test runner (`node --test`) combined with `supertest` for HTTP assertions."
- **What Examiner is Testing**: Automated test stack.
- **Common Mistakes to Avoid**: Claiming Jest was used when native runner is configured.

---

## Session 3 — Examiner Challenge (15 Questions)

### Q3.1 Why should we accept a TF-IDF model when LLMs like ChatGPT exist?
- **Model Answer**: "TF-IDF + Logistic Regression runs on standard CPUs in under 50ms without multi-gigabyte GPU memory overhead or subscription costs. It provides 100% mathematical explainability and zero hallucination risk."
- **What Examiner is Testing**: Defending lightweight engineering trade-offs.
- **Common Mistakes to Avoid**: Apologizing for not using ChatGPT instead of defending valid design choices.

### Q3.2 Does your system translate regional languages like Tamil or Hindi accurately?
- **Model Answer**: "No. The current implementation performs language detection (`langdetect`) and preserves original text safely. Full neural translation is documented as future work."
- **What Examiner is Testing**: Academic honesty regarding project scope.
- **Common Mistakes to Avoid**: Pretending Indic text is fully translated to English.

### Q3.3 Is your 100% test accuracy realistic for live government portals?
- **Model Answer**: "No. The 100% accuracy was achieved on our 101-sample synthetic validation set. Real-world complaints contain noise, typos, and multi-department overlaps that lower accuracy."
- **What Examiner is Testing**: Critical dataset analysis.
- **Common Mistakes to Avoid**: Claiming 100% real-world government portal accuracy.

### Q3.4 Is your chatbot truly intelligent without a generative model?
- **Model Answer**: "Yes. It delivers deterministic, hallucination-free intent classification and privacy-isolated database lookup, which is safer for public government service tracking than generative models."
- **What Examiner is Testing**: Understanding domain-specific chatbot safety requirements.
- **Common Mistakes to Avoid**: Claiming rule-based chatbots are inferior for simple transactional lookup.

### Q3.5 What prevents an officer from viewing complaints from another department?
- **Model Answer**: "Backend API endpoint enforces `where: { department_id: req.user.department_id }`. Even if an officer alters parameters, queries reject cross-department access."
- **What Examiner is Testing**: Security enforcement verification.
- **Common Mistakes to Avoid**: Relying on frontend sidebar hiding for security.

### Q3.6 What happens if a user submits a complaint containing gibberish?
- **Model Answer**: "If Softmax confidence falls below 0.35, out-of-domain logic assigns category 'Other', confidence 0.40, and flags `ai_review_required: true`."
- **What Examiner is Testing**: Edge case handling.
- **Common Mistakes to Avoid**: Claiming gibberish text is classified with 99% confidence.

### Q3.7 How does your system handle class imbalance in grievance data?
- **Model Answer**: "During dataset curation, synthetic samples were balanced across 9 categories. In production, class weights (`class_weight='balanced'`) can be enabled in Logistic Regression."
- **What Examiner is Testing**: ML class imbalance mitigation strategies.
- **Common Mistakes to Avoid**: Ignoring class imbalance concepts.

### Q3.8 Why not run Node.js and Python in a single server process?
- **Model Answer**: "Decoupling microservices allows Node API and Python AI to scale independently, prevents Python GIL blocking Node event loop, and isolates runtime crashes."
- **What Examiner is Testing**: Microservice isolation rationale.
- **Common Mistakes to Avoid**: Stating it was impossible to run them together.

### Q3.9 What happens if two officers update the same grievance simultaneously?
- **Model Answer**: "PostgreSQL transaction isolation handles concurrent updates cleanly, writing separate audit rows in `GrievanceStatusHistory`."
- **What Examiner is Testing**: Database concurrency awareness.
- **Common Mistakes to Avoid**: Stating simultaneous updates corrupt the database.

### Q3.10 How would you scale this architecture to handle 500,000 complaints daily?
- **Model Answer**: "Deploying stateless FastAPI AI containers behind a load balancer (AWS ALB), adding Redis caching for chatbot status lookups, and setting up PostgreSQL read replicas."
- **What Examiner is Testing**: System scalability vision.
- **Common Mistakes to Avoid**: Rebuilding the entire architecture from scratch.

### Q3.11 What is the biggest security vulnerability in your system if misconfigured?
- **Model Answer**: "Weak `JWT_SECRET` environment key or improper CORS origins in production."
- **What Examiner is Testing**: Real-world security risk assessment.
- **Common Mistakes to Avoid**: Claiming the system has zero security risks.

### Q3.12 Why preserve `ai_original_category` during human corrections?
- **Model Answer**: "It maintains an immutable audit trail and provides labeled ground-truth misclassifications for active learning model retraining."
- **What Examiner is Testing**: Data science feedback loop design.
- **Common Mistakes to Avoid**: Viewing human corrections as data overwrites.

### Q3.13 What happens if `langdetect` fails on a numeric complaint text like '123456'?
- **Model Answer**: "Exception handler catches `LangDetectException` and defaults to `English` with confidence `0.50`, allowing pipeline processing without crashing."
- **What Examiner is Testing**: Exception handling robust design.
- **Common Mistakes to Avoid**: Admitting the app crashes on numeric input.

### Q3.14 How does your Docker Compose setup ensure persistent storage?
- **Model Answer**: "Using named volume `postgres_data` mapped to `/var/lib/postgresql/data`, preserving data across container restarts."
- **What Examiner is Testing**: Docker volume persistence.
- **Common Mistakes to Avoid**: Thinking database data is stored inside ephemeral container layers.

### Q3.15 What is the single most valuable lesson you learned building this system?
- **Model Answer**: "Designing robust fallback mechanisms—ensuring that even if AI or language services encounter edge cases, the core business submission and database storage workflows remain 100% reliable."
- **What Examiner is Testing**: Engineering maturity and reflection.
- **Common Mistakes to Avoid**: Saying 'I learned how to code in React'.

---

## Self-Assessment Rubric

Use this 5-category scoring rubric to evaluate your readiness before the actual viva presentation:

| Evaluation Category | Target Score (1–5) | Criteria for Maximum Score (5) |
|---|---|---|
| **1. Technical Honesty** | **5 / 5** | Clearly states TF-IDF + Logistic Regression is used. Does NOT claim BERT, LLMs, or IndicTrans2 translation. Acknowledges synthetic dataset limits. |
| **2. Architectural Depth** | **5 / 5** | Seamlessly explains 4-tier flow (React -> Express -> FastAPI -> Postgres), Docker networking, and JWT/RBAC security boundaries. |
| **3. Machine Learning Mastery** | **5 / 5** | Explains TF-IDF formulas, Softmax probability, XAI token weight calculation, confidence thresholds, and hyperparameter choices (`C=2.5`, `max_features=5000`). |
| **4. Code & DB Traceability** | **5 / 5** | Mentions exact file names (`classifier.py`, `grievance.controller.js`, `schema.prisma`) and API endpoints without hesitation. |
| **5. Presentation Clarity** | **5 / 5** | Provides concise 30-second oral answers followed by structured technical explanations without memorization stumbling. |
