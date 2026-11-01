# Guide Review Fix Report — Intelligent Multilingual Grievance System

**Project:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Date:** October 19, 2026  
**Document Status:** Complete & Verified  

---

## 1. Executive Summary & Guide Review Comments

During the project review, four core problems were identified:
1. **Multilingual Translation & Admin Display:** Citizen complaints written in regional languages were not translated into English and displayed properly on the Admin page.
2. **Image Analysis & Issue Detection:** Uploaded images were not reliably detecting or explaining the issue shown in the image.
3. **Department Routing Verification:** The department-routing mechanism was unclear, and complaints needed verification that they are actually assigned to the correct departments and officers.
4. **Chatbot Runtime Error:** A chatbot query failed with an error during the review.

This report documents the root causes discovered, technical fixes implemented across the frontend, backend, database, and AI microservice, test results, and a repeatable demonstration script for the next review.

---

## 2. Issues Discovered, Root Causes & Resolutions

| # | Guide Comment | Discovered Root Cause | Technical Fix & Implementation |
|---|---|---|---|
| **1** | **Regional complaints not translating into English and displaying on Admin page** | 1. `SettingsConfigDict` in `ai-service/app/core/config.py` lacked `env_file=".env"`, preventing pydantic from loading `TRANSLATION_API_URL` from local environment files.<br>2. Endpoint URL in `translator.py` required trailing `/translate` normalization.<br>3. Admin detail page only displayed the translation card when `translation_status === "translated"`; if the external provider was unconfigured or offline, no status banner was shown, leaving the Admin unaware of why translation was absent. | 1. Configured `env_file=(".env", "../.env")` in `config.py`.<br>2. Normalized LibreTranslate endpoint path to always target `/translate`.<br>3. Added clear status cards on Admin, Officer, and Citizen detail views distinguishing *Translated*, *English Original (Passthrough)*, *Translation Unavailable*, and *Unsupported Language*, preserving native regional text without fabrication. |
| **2** | **Uploaded images not reliably detecting or explaining the issue** | 1. Vision models often wrap JSON in markdown code blocks (` ```json ... ``` `), which caused `json.loads()` in `vision.py` to throw `json.JSONDecodeError` and fall back to `failed`.<br>2. `detected_issue` was evaluated with strict equality against 6 hardcoded strings; slight variations (e.g., "pothole on road", "garbage dump on roadside") raised `ValueError` and discarded the entire analysis.<br>3. When `observations` was returned as a single string instead of a list, `isinstance(..., list)` failed. | 1. Implemented robust markdown fence stripping in `vision.py` before JSON parsing.<br>2. Added semantic issue normalizer using keyword/regex heuristics to map real-world model outputs reliably to the 6 allowed issue categories.<br>3. Safely coerced observation strings to array lists.<br>4. Preserved truthful `unavailable` status when external vision credentials are not supplied, without crashing or fabricating findings. |
| **3** | **Department routing mechanism unclear & officer verification missing** | 1. Detail views displayed a plain text tag `Routing: ASSIGNED` without explaining the routing policy, confidence threshold ($\ge 0.75$ for automated dispatch), or why a grievance was flagged for review.<br>2. In `backend/prisma/seed.js`, only 1 officer was seeded (assigned only to Water Supply). When complaints were filed for Roads, Electricity, Sanitation, etc., logging in as `officer@example.com` showed an empty queue because of strict departmental isolation. | 1. Enhanced Admin and Officer detail views to show clear dispatch badges: `✓ Auto-Dispatched to Department Queue` ($\ge 75\%$) vs `⚠ Pending Administrative Review` ($< 75\%$ or *Other* category).<br>2. Seeded dedicated demo officers for all 9 departments (`officer.roads@example.com`, `officer.elec@example.com`, `officer.sanitation@example.com`, etc.) with default password `Password@123`.<br>3. Added regression integration tests verifying that officers cannot access grievances of other departments (HTTP 404). |
| **4** | **Chatbot query failed with an error during review** | 1. **Fatal React Crash:** In `backend/src/services/ai.service.js` line 312, fallback `LIST_GRIEVANCES` returned raw Prisma object `userGrievances[0]` where `department` was an object `{ id, name, code }`. When React rendered `{msg.grievance.department}`, it threw `Uncaught Error: Objects are not valid as a React child`.<br>2. `StatusBadge.tsx` threw `TypeError: Cannot read properties of undefined (reading 'replace')` if status was missing.<br>3. `ChatbotView.tsx` masked all errors with a generic string instead of displaying real feedback. | 1. Normalized `grievance.department` to a string in `ai.service.js` fallback.<br>2. Added defensive object protection in `ChatbotView.tsx` so `{msg.grievance.department}` safely extracts `.name` or defaults to string.<br>3. Fixed `StatusBadge.tsx` to handle undefined status without `replace()` crashes.<br>4. Updated `ChatbotView.tsx` catch block to display actual descriptive error messages.<br>5. Synchronized fallback intent coverage for tracking and process guidance. |

---

## 3. Files Changed and Purpose of Each Change

### AI Microservice (`ai-service/`)
- **`app/core/config.py`**: Added `env_file=(".env", "../.env")` to `SettingsConfigDict` so environment variables are loaded from root or local `.env`.
- **`app/services/translator.py`**: Normalized endpoint URL with `.rstrip("/")` and `/translate` path matching.
- **`app/services/vision.py`**: Added markdown fence stripping for chat completion vision JSON responses and semantic issue normalizer with regex word boundaries.
- **`tests/test_provider_boundaries.py`**: Added regression test `test_vision_markdown_fences_and_issue_normalization`.

### Backend (`backend/`)
- **`src/services/ai.service.js`**: Normalized fallback `grievance.department` object to a string to eliminate React child rendering crashes; added fallback pattern matching for `TRACKING_GUIDANCE`, `PROCESS_INFORMATION`, and `PRIORITY_INFORMATION`.
- **`prisma/seed.js`**: Seeded dedicated demo officers for all 9 administrative departments with `Password@123`.
- **`tests/grievance.test.js`**: Added section 5 containing 4 regression tests for multilingual persistence, confidence routing policy, and officer cross-department isolation.

### Frontend (`frontend/`)
- **`src/shared/ui/StatusBadge.tsx`**: Prevented `TypeError: Cannot read properties of undefined (reading 'replace')` by safely guarding status string operations.
- **`src/apps/chatbot/ChatbotView.tsx`**: Protected `{msg.grievance.department}` from object rendering crashes and exposed real descriptive error messages on query failure.
- **`src/apps/admin/AdminGrievanceDetail.tsx`**: Added prominent translation cards (Translated, Passthrough, Unavailable, Unsupported) and routing decision badges.
- **`src/apps/officer/OfficerGrievanceDetail.tsx`**: Added translation display and departmental queue dispatch badges.

---

## 4. Before & After Behavior Comparison

| Feature / Flow | Before Fix | After Fix |
|---|---|---|
| **Regional Language Complaint on Admin Page** | If translation service was unconfigured, the translation section vanished completely. Admin had no indication whether translation had failed or was unavailable. | Explicit translation section renders: displays original text with language tag, clear translation status badge, and either the translated English text or an informative notice that provider is offline. |
| **Vision API Analysis of Uploaded Defect Images** | Failed with `JSONDecodeError` whenever the provider used markdown code blocks (` ```json `), or with `ValueError` on minor label phrasing variations. | Cleans markdown fences, normalizes defect categories (e.g. road potholes $\rightarrow$ `Road damage`, trash pile $\rightarrow$ `Garbage/sanitation`), and preserves genuine observations. |
| **Department Routing Demonstration** | Unclear routing status. Logging in as an officer for testing non-water complaints showed an empty queue because only one Water officer was seeded. | Clearly labels `Auto-Dispatched` vs `Pending Review` based on the $\ge 75\%$ confidence threshold. Officers exist for all 9 departments to demonstrate departmental queues. |
| **Chatbot Follow-up & Status Queries** | Fallback chatbot returned raw Prisma object for `department`, causing React to crash with `Objects are not valid as a React child`. Missing status crashed `StatusBadge`. | Robust string normalization in backend and frontend. Chatbot answers general FAQs, grievance status lookups, and contextual follow-ups safely without runtime exceptions. |

---

## 5. Database & Migration Changes

- **Schema:** The Prisma schema (`prisma/schema.prisma`) already contained all required fields (`translation_status`, `translation_method`, `ai_original_category`, `is_human_corrected`, `routing_status`, and `GrievanceImage` model). **No schema changes or migrations were required.**
- **Seed Data:** Enhanced `backend/prisma/seed.js` to seed demo officers for all 9 departments. Executed cleanly via `node prisma/seed.js` using idempotent upserts.

---

## 6. Test Suites and Execution Results

### 1. AI Microservice Tests (`ai-service/`)
- **Command:** `py -m pytest`
- **Result:** **`42 passed in 3.81s (100% pass rate)`**
- **Tested Scenarios:**
  - Health check & boundary input validation (empty text, oversized text)
  - Multilingual queries (Tamil, Hindi, English)
  - ML classification and priority level prediction
  - All 9 Chatbot intents, regex grievance extraction (`GRV-YYYY-XXXXXX`), and contextual follow-up
  - Vision provider image byte transport, format validation, timeout handling, markdown fence stripping, and issue normalization

### 2. Backend API Test Suite (`backend/`)
- **Command:** `npm test`
- **Result:** **`77 passed, 0 failed, 21 suites (100% pass rate)`**
- **Tested Scenarios:**
  - Auth, JWT tokens, RBAC permissions (`CITIZEN`, `OFFICER`, `ADMIN`)
  - Grievance creation & transaction persistence
  - Multilingual Tamil complaint persistence with English translation
  - Automated dispatch ($\ge 0.75$ confidence) vs Administrative Review ($< 0.75$ or `Other`)
  - Officer departmental isolation (cross-department access blocked with 404)
  - Admin category correction and rerouting
  - Chatbot RBAC tenant isolation, 9 intents, contextual follow-ups, and empty message rejection

### 3. Frontend Quality Checks (`frontend/`)
- **ESLint:** `npm run lint` $\rightarrow$ **0 errors, 0 warnings**
- **Production Build:** `npm run build` $\rightarrow$ **Success** (`dist/` generated with zero type errors)

---

## 7. External Services & Credentials Required

1. **Translation Service (LibreTranslate):**
   - Configured via `TRANSLATION_API_URL` and `TRANSLATION_API_KEY` in `ai-service/.env` or root `.env`.
   - *Graceful Fallback:* If omitted or offline, the system sets `translation_status: "unavailable"`, preserves the original complaint text, routes to human review, and displays an informative banner on the Admin page without crashing.
2. **Vision Service (OpenAI-Compatible Chat Completions):**
   - Configured via `VISION_API_URL`, `VISION_API_KEY`, and `VISION_MODEL` (e.g., `gpt-4o-mini`).
   - *Graceful Fallback:* If omitted, the system sets `analysis_status: "unavailable"` and flags the grievance for review without fake findings.
3. **Database (PostgreSQL):**
   - Configured via `DATABASE_URL` in `backend/.env`.

---

## 8. Remaining Limitations

1. **Ephemeral Local Storage on Free PaaS:**
   - Uploaded grievance images are stored locally under `backend/uploads/`. When deploying to free/ephemeral containers (such as Render standard web services without a persistent disk), container restarts will clear local uploads unless Render Disks or cloud object storage (AWS S3 / Cloudinary) is attached.
2. **Model Training Footprint:**
   - The ML classifier uses scikit-learn TF-IDF + Calibrated Logistic Regression trained on civic grievance datasets. It operates deterministically without generative hallucinations.

---

## 9. Exact Local Commands to Run the Project

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL running on localhost:5432 with database `intelligent_grievance`

### Terminal 1: AI Microservice
```bash
cd ai-service
py -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### Terminal 2: Backend API
```bash
cd backend
npm run dev
```

### Terminal 3: Frontend UI
```bash
cd frontend
npm run dev
```

The application is accessible at **`http://localhost:5173`**.

---

## 10. Step-by-Step Demonstration Script for Project Review

Use the following credentials:
- **Admin:** `admin@example.com` / `Password@123`
- **Citizen:** `citizen@example.com` / `Password@123`
- **Water Officer:** `officer@example.com` / `Password@123`
- **Roads Officer:** `officer.roads@example.com` / `Password@123`
- **Electricity Officer:** `officer.elec@example.com` / `Password@123`

### Step A: Multilingual Submission & Admin Translation Verification
1. Log in as **Citizen** (`citizen@example.com`).
2. Navigate to **Submit Grievance**.
3. Enter a Tamil complaint:
   > *"எங்கள் பகுதியில் குடிநீர் வரவில்லை. குழாய்கள் உடைந்து தண்ணீர் வீணாகிறது."*
4. Submit the grievance and note the generated reference (e.g., `GRV-2026-000004`).
5. Log out and log in as **Admin** (`admin@example.com`).
6. Open the newly submitted grievance:
   - Verify that **Citizen Complaint Statement** clearly shows the native Tamil text with the tag `Original: Tamil`.
   - Verify that the **Translation** section is clearly rendered with its status and method.
   - Verify that the original text is preserved intact.

### Step B: Image Attachment & Visual Observation Demonstration
1. Log in as **Citizen**.
2. Submit a complaint with an attached image (JPEG/PNG showing a road defect or civic issue).
3. Open the grievance details:
   - Observe the **Supporting Images** card.
   - Verify that the image preview renders correctly.
   - If a Vision API key is configured, verify that visual observations and detected defect appear. If no Vision key is configured, verify that `Analysis unavailable` is truth-tellingly displayed without fabricating fake defect detections.

### Step C: Department Routing & Officer Queue Verification
1. Submit an English road complaint:
   > *"Massive potholes on the highway near the bus terminus causing accidents."*
2. Observe that the AI classifies this as **Roads and Transport** with HIGH confidence.
3. Observe that dispatch status is set to `Auto-Dispatched to Department Queue`.
4. Log out and log in as **Roads Officer** (`officer.roads@example.com`).
5. Open **Department Queue**:
   - Verify that the road complaint appears in the Roads queue.
   - Advance the status: `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`.
6. Log out and log in as **Water Officer** (`officer@example.com`).
7. Open **Department Queue**:
   - Verify that the Roads complaint is completely invisible in the Water queue, confirming departmental security isolation.

### Step D: Admin Classification Correction & Rerouting
1. Log in as **Admin**.
2. Select a grievance in **All Grievances** and click **Correct Category**.
3. Change category from e.g. `Water Supply` to `Sanitation`.
4. Submit the correction:
   - Verify that `is_human_corrected` is flagged.
   - Verify that `Original AI Category` is retained.
   - Verify that the department assignment updates to `Sanitation`.

### Step E: Chatbot Status Tracking & Contextual Follow-Up
1. Log in as **Citizen** and open **AI Assistant Chat**.
2. Query live grievance status:
   > *"What is the status of my grievance GRV-2026-XXXXXX?"*
3. Verify that the live status and assigned department are returned.
4. Follow up contextually:
   > *"Which department is handling this?"*
5. Verify that the chatbot correctly recalls the grievance and responds with the assigned department name and SLA without throwing a runtime error.
6. Ask a general FAQ:
   > *"How do I track my grievance?"* or *"Help"*
7. Verify that the chatbot returns clear instructions and guidance.
