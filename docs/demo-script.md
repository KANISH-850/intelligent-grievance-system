# 5-Minute Live Academic Demonstration Script

**Project:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Target Duration:** Exactly 5 Minutes (300 Seconds)  

---

## Pre-Demo Preparation Checklist

1. Launch application using Docker Compose or local dev servers.
2. Ensure database is seeded (`npx prisma db seed`).
3. Open two browser windows:
   - Window A: Citizen view (`http://localhost:5173`)
   - Window B: Officer / Admin view (Incognito or separate browser)

---

## Timed Demo Walkthrough

### 0:00 – 0:30 | Segment 1: Problem Statement & Architecture
- **Presenter Action**: Display system homepage / architecture slide or landing page.
- **Talking Points**:
  > "Good morning, respected evaluators. Central government portals receive thousands of grievances daily. Manual dispatch causes severe backlogs and misrouting.
  > Today, we present our Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework.
  > Our architecture couples a React-TypeScript frontend with a Node.js Express API gateway, a Python FastAPI AI microservice powered by TF-IDF and Logistic Regression, and a PostgreSQL database."

---

### 0:30 – 1:15 | Segment 2: Citizen Login & Grievance Submission
- **Presenter Action**: Log in as `citizen@example.com` (Password: `Citizen@123`). Navigate to **New Grievance**.
- **Sample Text**:
  > `"Severe pipeline rupture in Sector 4 causing heavy water leakage on main road for 2 days."`
- **Click**: **Submit Grievance**.
- **Talking Points**:
  > "We log in as a citizen. The citizen inputs a complaint regarding a major water pipe leak. Upon submission, the API routes the payload to our Python AI microservice in real time."

---

### 1:15 – 2:00 | Segment 3: AI Analysis, Priority & Department Routing
- **Presenter Action**: Point out the grievance result card.
- **Highlight Visual Features**:
  - **Category**: `Water Supply & Sanitation`
  - **Priority**: `URGENT` / `HIGH` (due to rupture keyword)
  - **Confidence Score**: `88.5%` (Level: `HIGH`)
  - **Department**: `Water Supply & Sanitation`
  - **Explanation Terms**: Highlighted keywords (`pipeline`, `rupture`, `leakage`, `water`).
- **Talking Points**:
  > "Notice how the AI service instantly analyzes the grievance: it correctly classifies the category as Water Supply, assigns URGENT priority based on safety risk terms, and routes it directly to the Water Supply Department with 88% confidence and explainable term highlights."

---

### 2:00 – 2:40 | Segment 4: Grievance Tracking & Multilingual Chatbot
- **Presenter Action**: Copy the generated Grievance Reference (e.g. `GRV-2026-XXXXX`). Open the **AI Chatbot** tab.
- **Chatbot Input 1**: `"What is the status of GRV-2026-10001?"`
- **Chatbot Input 2 (Contextual Follow-Up)**: `"Which department is handling this?"`
- **Talking Points**:
  > "Citizens can track their grievance anytime using our integrated AI Chatbot. The chatbot extracts the reference code, retrieves live status from PostgreSQL, and retains multi-turn context for follow-up questions."

---

### 2:40 – 3:20 | Segment 5: Officer Queue & Status Update
- **Presenter Action**: Switch to Window B. Log in as `officer.water@example.com` (Password: `Officer@123`).
- **Demonstrate**:
  1. Officer sees ONLY Water Supply department grievances (Department isolation verified).
  2. Open the newly submitted grievance.
  3. Change status from `SUBMITTED` to `UNDER_REVIEW`.
  4. Change status from `UNDER_REVIEW` to `RESOLVED` with remark: `"Repair team dispatched and pipeline leak sealed."`
- **Talking Points**:
  > "Now logging in as an officer assigned to Water Supply. Department isolation ensures officers only access their own queue. We update the status to RESOLVED with mandatory resolution remarks recorded in the immutable audit history."

---

### 3:20 – 4:00 | Segment 6: Administrator Review & Human Correction
- **Presenter Action**: Log out and log in as `admin@example.com` (Password: `Admin@123`).
- **Demonstrate**:
  1. Open Admin Grievance Overview.
  2. Inspect an ambiguous or low-confidence flagged grievance.
  3. Trigger **Human Classification Correction**: Reassign category to `Public Works Department`.
  4. Show that original AI prediction (`ai_original_category`) is preserved while flagging `is_human_corrected: true`.
- **Talking Points**:
  > "As Administrator, we have system-wide visibility. For grievances flagged for human review, the administrator can override the AI category. Crucially, academic transparency is maintained: the system preserves the original AI prediction for audit and retraining."

---

### 4:00 – 4:30 | Segment 7: Analytics & Notifications
- **Presenter Action**: Navigate to **Admin Analytics Dashboard** and back to Citizen Window A to view **Notifications**.
- **Demonstrate**:
  1. View category distribution pie charts, priority breakdowns, and confidence distribution.
  2. Citizen receives real-time notification: `"Your grievance GRV-2026-10001 status changed to RESOLVED"`.
- **Talking Points**:
  > "The executive analytics dashboard provides administrators with real-time insights into department bottlenecks and AI accuracy. Meanwhile, the citizen receives an instant in-app notification when their grievance status changes."

---

### 4:30 – 5:00 | Segment 8: Testing Results, Limitations & Future Scope
- **Presenter Action**: Display final slide or document summary (`docs/final-testing-report.md`).
- **Talking Points**:
  > "To conclude: the system is backed by 34 Python pytest cases, 65 Node backend integration tests, 0 ESLint errors, and full Docker containerization.
  > Current model uses TF-IDF + Logistic Regression for fast, explainable inference. Future work includes fine-tuning IndicBERT transformer models for deep regional language understanding. Thank you!"
