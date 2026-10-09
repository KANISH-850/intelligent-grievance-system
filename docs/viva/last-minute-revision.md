# Last-Minute Viva Revision Sheet (10-Minute Read)

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  

---

## 1. 60-Second Elevating Project Summary

> "Respected evaluators, our project is an Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework designed for Central Government portals like CPGRAMS.
> It addresses manual dispatch backlogs and misrouting by using a machine learning pipeline—specifically **TF-IDF Vectorization with Logistic Regression**—to automatically classify citizen grievances into 9 government domains, estimate urgency priorities (`LOW` to `CRITICAL`), and route them to responsible department queues.
> For predictions with confidence below 75%, it flags complaints for human administrator review. It also includes an intent-based chatbot for citizen status tracking and a multi-container Docker Compose architecture."

---

## 2. Key Technical Facts (Ground Truth)

- **Architecture**: React 18 UI + Node.js Express API Gateway + Python FastAPI AI Microservice + PostgreSQL 15 + Docker Compose.
- **Machine Learning Model**: **TF-IDF Vectorizer + Logistic Regression** (`ai-service/scripts/train_classifier.py`).
  - `TfidfVectorizer`: `ngram_range=(1, 2)`, `max_features=5000`, `sublinear_tf=True`
  - `LogisticRegression`: `C=2.5`, `max_iter=1000`, `solver="lbfgs"`, `random_state=42`
  - Model Artifact: `models/grievance-classifier/model.joblib`
- **Dataset**: Academic synthetic dataset of **675 samples** (70% Train [472], 15% Val [101], 15% Test [102]).
- **Categories (9)**: Water Supply, Electricity, Roads and Transport, Healthcare, Education, Sanitation, Municipal Services, Revenue, Other.
- **Priority Levels (4)**: LOW (72h SLA), MEDIUM (48h SLA), HIGH (24h SLA), CRITICAL (12h SLA).
- **Human Review Thresholds**:
  - High Confidence ($\ge 0.75$): No review required (`ai_review_required: false`).
  - Medium ($0.50 \le c < 0.75$) & Low ($< 0.50$): Flagged for human review (`ai_review_required: true`).
- **Explainable AI (XAI)**: Exact token contribution scores = `TF-IDF value * Logistic Regression coefficient` for the predicted class.
- **Multilingual Handling**: Uses `langdetect` for language code identification. Preserves original regional script text in PostgreSQL without claiming neural translation.
- **Chatbot**: 9 explicit intents, regex reference extraction (`GRV-\d{4}-\d{6}`), multi-turn session memory (`last_grievance_number`), and authenticated privacy isolation.
- **Security**: JWT tokens (24h expiry), bcrypt password hashing (cost factor 10), RBAC (`CITIZEN`, `OFFICER`, `ADMIN`), citizen privacy filter (`user_id == req.user.id`), and officer queue filter (`department_id == req.user.department_id`).
- **Verified Test Results**: 34/34 Python `pytest` cases passed, 65/65 Node `node --test` backend cases passed, 0 ESLint errors, successful Vite production build.

---

## 3. Five Main Strengths vs. Five Limitations

### Strengths
1. Sub-50ms CPU inference latency without requiring expensive GPU hardware.
2. Full mathematical explainability (XAI) via exact token weight contributions.
3. Human-in-the-loop fallback architecture for ambiguous complaints.
4. Strict role-based privacy isolation between citizens and department officers.
5. Complete automated test suite and Docker Compose containerization.

### Limitations
1. Uses TF-IDF + Logistic Regression rather than deep contextual Transformer models (BERT).
2. Does not perform real-time neural translation (IndicTrans2) for regional languages.
3. Chatbot uses explicit intent schemas rather than generative LLMs.
4. SMS and email notifications are simulated rather than connected to live gateways.
5. Evaluated on academic synthetic data rather than live government portal data.

---

## 4. Top 10 Most Likely Examiner Questions & Rapid Answers

1. **Q: What algorithm is used for complaint classification?**  
   *A: TF-IDF vectorization with Logistic Regression ($C=2.5$, max features 5,000).*
2. **Q: Does this project use BERT, GPT, or LLMs?**  
   *A: No. It uses TF-IDF + Logistic Regression for fast, explainable, low-resource inference.*
3. **Q: Does the system translate regional Indian languages?**  
   *A: No. It performs language detection (`langdetect`) and preserves original text safely in PostgreSQL.*
4. **Q: How does the system handle low-confidence AI predictions?**  
   *A: Predictions below 75% confidence set `ai_review_required: true`, routing them to administrators for review.*
5. **Q: How are emergency complaints prioritized?**  
   *A: An urgency predictor evaluates safety keywords (e.g. 'rupture', 'hazard'), escalating priority to CRITICAL/HIGH with shortened SLA targets.*
6. **Q: How do you prevent Citizen A from viewing Citizen B's complaint?**  
   *A: The API enforces `where: { id, user_id: req.user.id }` at the database layer using JWT user authentication.*
7. **Q: How are officers restricted to their department?**  
   *A: Officer queries filter strictly by `department_id: req.user.department_id`.*
8. **Q: What happens if an admin corrects an AI prediction?**  
   *A: Category and department update, original category is saved in `ai_original_category`, and `is_human_corrected` is set to `true`.*
9. **Q: What happens if the Python AI microservice goes down?**  
   *A: The Express API catches the timeout exception and applies a local rule-based fallback, saving the complaint with `ai_review_required: true`.*
10. **Q: How was the project tested?**  
    *A: Tested using 34 Python `pytest` cases, 65 Node integration tests, ESLint, Vite build, and Docker config validation.*

---

## 5. CRITICAL REMINDER BEFORE YOUR VIVA

> **DO NOT** claim that the project uses BERT, Transformers, LLMs, RAG, or IndicTrans2 translation!
> Defend your project honestly as a **fast, lightweight, highly explainable, fully containerized full-stack framework using TF-IDF + Logistic Regression**. Technical honesty will earn maximum respect from your examiners!
