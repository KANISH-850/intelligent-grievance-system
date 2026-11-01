# 🚀 Practical Startup & Live Demonstration Guide

**Project:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Date:** November 1, 2026 (Preparation for Tomorrow's Practical Examination)  
**System Status:** **100% Operational & Verified**  

---

## 1. Prerequisites

Before launching the system, verify that your computer has:
1. **Node.js**: v18.x or v20.x (`node -v`)
2. **Python**: v3.11+ (`py --version` or `python --version`)
3. **PostgreSQL**: Running locally on port `5432` with database `intelligent_grievance`
4. **Git**: Installed and accessible

---

## 2. Environment Configuration

The environment configuration is pre-configured and ready:

- **Backend (`backend/.env`):**
  ```env
  PORT=5000
  NODE_ENV=development
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/intelligent_grievance?schema=public"
  JWT_SECRET="your-development-jwt-secret-key-min-32-chars-long"
  AI_SERVICE_URL="http://127.0.0.1:8001"
  FRONTEND_URL="http://localhost:5173"
  ```
- **AI Microservice (`ai-service/.env`):**
  ```env
  AI_SERVICE_PORT=8001
  CLASSIFICATION_CONFIDENCE_THRESHOLD=0.75
  # Optional on-premise translation URL:
  # TRANSLATION_API_URL=http://localhost:5000/translate
  ```
- **Frontend (`frontend/.env`):**
  ```env
  VITE_API_BASE_URL="http://localhost:5000/api/v1"
  VITE_AI_SERVICE_URL="http://127.0.0.1:8001"
  ```

---

## 3. Database Initialization (Run Once if Fresh)

If PostgreSQL is running and you need to ensure tables and demo users exist:

```bash
cd backend
npx prisma migrate dev --name init
node prisma/seed.js
```
*Note: Seeding is idempotent and safely upserts demo departments and users.*

---

## 4. Startup Commands (Three Terminals)

Open **3 separate command prompt / PowerShell terminals** in the project root directory:

### Terminal 1: Python AI Microservice (Port 8001)
```powershell
cd E:\VS_CODE\S5\intelligent-grievance-system\ai-service
py -m uvicorn app.main:app --port 8001 --host 127.0.0.1
```
*Expected output: `Uvicorn running on http://127.0.0.1:8001` and `ML classification model loaded successfully.`*

### Terminal 2: Node.js Express Backend API (Port 5000)
```powershell
cd E:\VS_CODE\S5\intelligent-grievance-system\backend
node src/server.js
```
*Expected output: `Server running in development mode on port 5000` and `Database connected successfully`.*

### Terminal 3: React Vite Frontend UI (Port 5173)
```powershell
cd E:\VS_CODE\S5\intelligent-grievance-system\frontend
npm run dev
```
*Expected output: `VITE v6.x ready in ... ms` -> `Local: http://localhost:5173/`.*

---

## 5. System Access URLs

| Application Component | URL | Description |
|---|---|---|
| **Web Application Portal** | **`http://localhost:5173`** | Main Citizen, Officer & Admin Web UI |
| **Backend REST API Health** | **`http://localhost:5000/api/v1/health`** | Backend status & PostgreSQL connection |
| **AI Service OpenAPI Docs** | **`http://127.0.0.1:8001/docs`** | Interactive FastAPI Swagger documentation |
| **AI Service Health** | **`http://127.0.0.1:8001/health`** | AI microservice health status |

---

## 6. Demo Accounts (Passwords: `Password@123`)

| Role | Email | Password | Department Scope |
|---|---|---|---|
| 🧑 **Citizen** | `citizen@example.com` | `Password@123` | Citizen grievance filing, tracking, chatbot |
| 👮 **Water Officer** | `officer@example.com` | `Password@123` | Water Supply Department Queue |
| 👮 **Roads Officer** | `officer.roads@example.com` | `Password@123` | Roads and Transport Queue |
| 👮 **Sanitation Officer** | `officer.sanitation@example.com` | `Password@123` | Sanitation Department Queue |
| 👮 **Electricity Officer** | `officer.elec@example.com` | `Password@123` | Electricity Department Queue |
| 🛡️ **Administrator** | `admin@example.com` | `Password@123` | System-wide overview, analytics, human AI correction |

---

## 7. Recommended 5-Minute Practical Demonstration Sequence

Follow this exact sequence during the live practical examination:

### Step 1: Architecture & System Overview (1 Minute)
1. Open `http://localhost:5173` in Browser Window A (Google Chrome).
2. Briefly highlight the three-tier architecture:
   - React-TypeScript responsive UI.
   - Node.js Express API Gateway with Prisma ORM.
   - Python FastAPI AI microservice with TF-IDF + Logistic Regression NLP and MobileNetV3 CV.
   - Local PostgreSQL relational database.

### Step 2: Citizen Multilingual Grievance Filing (1.5 Minutes)
1. Log in as Citizen: `citizen@example.com` / `Password@123`.
2. Click **Submit Grievance** (`http://localhost:5173/citizen/submit`).
3. Enter a regional language grievance to demonstrate live NLP translation:
   - **Title:** `குடிநீர் தட்டுப்பாடு` (or in Hindi: `सड़क पर गहरा गड्ढा`)
   - **Description:** `அண்ணா நகர் 4வது தெருவில் கடந்த நான்கு நாட்களாக குடிநீர் விநியோகம் முற்றிலும் நின்றுவிட்டது.`
4. **Pause 1 second** and point out the **Live Translation Preview Box**:
   - Detected Language badge: `Tamil (ta)`.
   - Real-time English translation: *"Drinking water shortage: Water supply in Anna Nagar 4th Street has been completely stopped for the last four days."*
5. Click **Submit Grievance**.
6. Point out the instant result:
   - Reference ID: `GRV-2026-XXXXXX`.
   - Categorization: `Water Supply`.
   - Department: `Water Supply`.
   - Priority: `HIGH` / `MEDIUM`.
   - Status: `SUBMITTED`.

### Step 3: Officer Department Queue & Status Resolution (1 Minute)
1. Open an **Incognito Window** or Browser Window B.
2. Log in as Water Supply Officer: `officer@example.com` / `Password@123`.
3. Point out **Department Queue Isolation**: The officer only sees Water Supply grievances.
4. Click on the grievance just submitted by the citizen:
   - **Bilingual Interface:** Show the English translation displayed prominently for the officer's working convenience.
   - **Original Text Preservation:** Click "View Original Tamil Submission" to show academic transparency and verbatim record preservation.
5. Update Status:
   - Change Status from `SUBMITTED` to `IN_PROGRESS` with remark: *"Field engineering team dispatched to inspect water supply pipeline."*
   - Change Status to `RESOLVED` with remark: *"Pipeline repaired and water supply fully restored."*

### Step 4: Admin Governance & Human AI Correction (1 Minute)
1. In Window B, log out and log in as Administrator: `admin@example.com` / `Password@123`.
2. Navigate to **Admin Grievances** (`http://localhost:5173/admin/grievances`).
3. Highlight system-wide visibility across all departments.
4. Demonstrate **Human-in-the-Loop AI Classification Correction**:
   - Open a grievance.
   - Click **Correct Classification**.
   - Change category to `Municipal Services` with remarks.
   - Point out that academic audit integrity is maintained: the system preserves `ai_original_category` while logging `is_human_corrected: true` and the admin user ID.
5. Click **Analytics** to show the category breakdown pie charts and resolution metrics.

### Step 5: Citizen Real-Time Tracking & Notifications (30 Seconds)
1. Switch back to Window A (Citizen view).
2. Click on the **Notification Bell** icon in the header.
3. Show the instant real-time notification:
   - *"Grievance Status: RESOLVED — Pipeline repaired and water supply fully restored."*
4. Click **My Grievances** to verify the updated status badge is now green (`RESOLVED`).

---

## 8. Troubleshooting During Practical

| Issue | Root Cause | Instant Fix |
|---|---|---|
| **Port 5000 or 8001 already in use** | A previous Node or Python process is still running | In PowerShell: `Get-Process node, python | Stop-Process` then restart. |
| **"Network Error" on Frontend** | Backend or AI service terminal is not started | Check Terminal 1 and Terminal 2 to ensure both servers are running. |
| **Database Connection Refused** | PostgreSQL service is stopped | Open Windows Services (`services.msc`), find **postgresql-x64-XX**, and click **Start**. |
| **Officer queue is empty** | Logged in with wrong officer for the department | Check department: Water complaints go to `officer@example.com`, Road complaints go to `officer.roads@example.com`. |
| **Translation takes a couple seconds** | First request connects to live provider | In-memory LRU cache stores repeated requests instantly (<1ms). Subsequent requests are instant. |
