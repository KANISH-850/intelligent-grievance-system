# Screenshot Verification Checklist & 5-Minute Live Presentation Sequence

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  
**Deployment Target:** `http://localhost:80` (Docker Compose) or `http://localhost:5173` (Vite Dev)  

---

## Part 1 — Comprehensive Authentic Screenshot Checklist

This checklist details the exact visual evidence required for academic project reports and presentation slides.

---

### Screenshot 1 — User Authentication & Login Interface
- **Demonstrates**: Multi-role user authentication interface, clean input validation, and password masking.
- **Required Logged-in Role**: None (Unauthenticated State).
- **Setup / Seed Data Needed**: Pre-seeded user accounts (`npx prisma db seed`).
- **Expected Visible Outcome**:
  - Email input field, Password input field, and Role indicator.
  - "Log In" button and link to registration page.
  - Form validation messages for invalid inputs.
- **Privacy & Secret Redaction Precautions**:
  - Mask password input dots (`••••••••`).
  - Ensure no JWT tokens or database connection strings are visible in browser URL bar or console overlays.

---

### Screenshot 2 — Citizen Grievance Submission Form
- **Demonstrates**: Citizen grievance submission interface with multi-line text input and instant submission controls.
- **Required Logged-in Role**: `CITIZEN` (`citizen@example.com`).
- **Setup / Seed Data Needed**: Active citizen login session.
- **Expected Visible Outcome**:
  - Multiline text area for complaint description (minimum 5 characters).
  - Sample text entered: `"Severe pipeline rupture in Sector 4 causing heavy water leakage and road flooding for 2 days."`
  - Active "Submit Grievance" action button.
- **Privacy & Secret Redaction Precautions**:
  - Do not use real citizen personal names, Aadhaar numbers, or phone numbers in demo text. Use synthetic locations (e.g. "Sector 4").

---

### Screenshot 3 — Grievance Submission Result & AI Prediction Card
- **Demonstrates**: Real-time AI classification response, department routing, priority estimation, confidence level, and XAI feature terms.
- **Required Logged-in Role**: `CITIZEN` (`citizen@example.com`).
- **Setup / Seed Data Needed**: Successful submission of a water leakage complaint.
- **Expected Visible Outcome**:
  - Generated Reference Number badge: `GRV-2026-000001`.
  - Predicted Category: `Water Supply & Sanitation` (Blue badge).
  - Priority Assignment: `HIGH` or `URGENT` (Red/Orange badge).
  - AI Confidence Level: `88.5%` (`HIGH` confidence badge).
  - XAI Explanation Terms: Highlighted chips (`['pipeline', 'rupture', 'leakage', 'water']`).
- **Privacy & Secret Redaction Precautions**:
  - Ensure internal database UUID strings are hidden; display human-readable reference `GRV-2026-XXXXXX`.

---

### Screenshot 4 — Citizen Grievance List & Timeline Detail View
- **Demonstrates**: Citizen personal grievance list, ownership isolation, and historical status timeline.
- **Required Logged-in Role**: `CITIZEN` (`citizen@example.com`).
- **Setup / Seed Data Needed**: Multiple submitted grievances under citizen account.
- **Expected Visible Outcome**:
  - Table of grievances authored by logged-in citizen only.
  - Clicked detail modal showing status timeline (`SUBMITTED` → `UNDER_REVIEW` → `RESOLVED`).
  - Assigned department name and timestamp.
- **Privacy & Secret Redaction Precautions**:
  - Verify no grievances belonging to other citizens appear in the list array.

---

### Screenshot 5 — Officer Department-Locked Queue View
- **Demonstrates**: Officer queue isolation, department filtering, and status action controls.
- **Required Logged-in Role**: `OFFICER` (`officer.water@example.com`).
- **Setup / Seed Data Needed**: Seeded complaints assigned to `Water Supply & Sanitation` department.
- **Expected Visible Outcome**:
  - Department header: "Water Supply & Sanitation Queue".
  - Filtered table listing ONLY Water Supply complaints.
  - Color-coded priority badges (`CRITICAL`, `HIGH`, `MEDIUM`).
  - Action buttons: "Update Status".
- **Privacy & Secret Redaction Precautions**:
  - Confirm complaints belonging to PWD, Electricity, or Healthcare are completely excluded from the queue table.

---

### Screenshot 6 — Officer Status Update Modal with Mandatory Remarks
- **Demonstrates**: Enforcement of valid status state machine transitions and mandatory resolution remarks.
- **Required Logged-in Role**: `OFFICER` (`officer.water@example.com`).
- **Setup / Seed Data Needed**: Open grievance detail in officer portal.
- **Expected Visible Outcome**:
  - Dropdown selecting new status: `RESOLVED`.
  - Textarea containing mandatory resolution remarks: `"Repair team dispatched to Sector 4. Main pipeline valve replaced and leak sealed."`
  - "Save Status Update" button.
- **Privacy & Secret Redaction Precautions**:
  - Remarks should contain clear operational explanation without exposing internal server IP addresses.

---

### Screenshot 7 — Administrator System Overview Dashboard
- **Demonstrates**: Cross-department administrative visibility, system-wide grievance metrics, and navigation overview.
- **Required Logged-in Role**: `ADMIN` (`admin@example.com`).
- **Setup / Seed Data Needed**: Active administrator session.
- **Expected Visible Outcome**:
  - High-level metric cards: Total Grievances, Pending Review, Resolved Count, Human Corrections Count.
  - System-wide grievance list spanning all 9 government departments.
  - Action button: "Inspect / Correct Classification".
- **Privacy & Secret Redaction Precautions**:
  - Hide internal database connection strings or secret environment flags.

---

### Screenshot 8 — Admin Human Classification Review & Correction Modal
- **Demonstrates**: Confidence-based human-in-the-loop review, low-confidence review flags, and administrative category override.
- **Required Logged-in Role**: `ADMIN` (`admin@example.com`).
- **Setup / Seed Data Needed**: Grievance flagged with `ai_review_required: true` (confidence < 75%).
- **Expected Visible Outcome**:
  - Review Flag Alert Banner: "Low AI Confidence (62%) — Human Review Required".
  - Original AI Prediction displayed: `Roads and Transport`.
  - Admin Override Dropdowns: Reassign Category to `Public Works Department`.
  - Checkbox / Note: "Preserve Original Prediction in Audit Trail".
  - "Apply Correction" button.
- **Privacy & Secret Redaction Precautions**:
  - Verify `ai_original_category` is clearly preserved in the UI modal display.

---

### Screenshot 9 — Multilingual Citizen Chatbot Interaction
- **Demonstrates**: 24/7 intent-based conversational assistant, regex reference code extraction (`GRV-2026-XXXXXX`), and contextual follow-up status retrieval.
- **Required Logged-in Role**: `CITIZEN` (`citizen@example.com`).
- **Setup / Seed Data Needed**: Active chat session with submitted grievance.
- **Expected Visible Outcome**:
  - User Prompt 1: `"What is the status of GRV-2026-000001?"`
  - Chatbot Response 1: Card showing status `RESOLVED`, assigned to `Water Supply & Sanitation`.
  - User Prompt 2 (Contextual Follow-up): `"When was it resolved?"`
  - Chatbot Response 2: Recalls `GRV-2026-000001` from session context memory and displays timestamp and resolution remarks.
- **Privacy & Secret Redaction Precautions**:
  - Querying reference codes belonging to another user must demonstrate privacy rejection: `"No grievance record found under your account."`

---

### Screenshot 10 — Executive Analytics & AI Performance Dashboard
- **Demonstrates**: Executive data visualization, department workload pie charts, priority distribution, and AI review rate metrics.
- **Required Logged-in Role**: `ADMIN` (`admin@example.com`).
- **Setup / Seed Data Needed**: Analytics summary endpoint output.
- **Expected Visible Outcome**:
  - Category distribution pie/bar chart.
  - Priority breakdown progress bars (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - AI Model Performance Card: Automated Dispatch Rate (%), Human Review Flag Rate (%).
- **Privacy & Secret Redaction Precautions**:
  - Labels must clearly state "Academic Synthetic Dataset Metrics".

---

### Screenshot 11 — Microservice API Health Endpoints & Diagnostics
- **Demonstrates**: Backend API Gateway health endpoint and Docker container health readiness.
- **Required Logged-in Role**: Public / System Administrator.
- **Setup / Seed Data Needed**: Running stack (`docker compose up -d`).
- **Expected Visible Outcome**:
  - Browser/Postman GET `http://localhost:5000/api/v1/health` returning JSON:
    `{ "status": "UP", "database": "CONNECTED", "timestamp": "2026-10-09T..." }`
  - GET `http://localhost:8001/health` returning AI Service status `OK`.
- **Privacy & Secret Redaction Precautions**:
  - Redact local file system absolute paths if exposed in stack trace headers.

---

## Part 2 — 5-Minute Timed Presentation Live Demo Sequence

Follow this exact 300-second sequence during the live academic evaluation:

| Time | Presenter Action | Logged-In Account | Target Screen / Component | Spoken Narrative & Key Features |
|---|---|---|---|---|
| **0:00 – 0:30** | System Overview | Unauthenticated | Slide 1 / Landing Page | "Demonstrating the 4-tier microservices stack running live on Docker containers." |
| **0:30 – 1:15** | Citizen Grievance Submission | `citizen@example.com` (`Citizen@123`) | New Grievance Page | Submit water pipe rupture text. Highlight real-time AI classification, priority prediction, confidence score, and XAI terms. |
| **1:15 – 2:00** | Chatbot Status Tracking | `citizen@example.com` | AI Chatbot Widget | Type `"Status of GRV-2026-000001"`. Show regex reference extraction and contextual follow-up query `"Who resolved it?"`. |
| **2:00 – 2:40** | Officer Queue & Status Update | `officer.water@example.com` (`Officer@123`) | Officer Queue Page | Demonstrate department isolation (Water Supply only). Change status to `RESOLVED` with mandatory resolution remarks. |
| **2:40 – 3:20** | Admin Review & Human Correction | `admin@example.com` (`Admin@123`) | Admin Grievance Dashboard | Filter low-confidence flagged grievance. Perform Human Classification Correction, preserving `ai_original_category`. |
| **3:20 – 4:00** | Analytics & Citizen Notification | Switch to Citizen Window | Executive Analytics & Notification Bell | View category distribution charts. Demonstrate real-time in-app notification received by citizen for status update. |
| **4:00 – 4:30** | Diagnostic Health Verification | Terminal / Browser | `http://localhost:5000/api/v1/health` | Show JSON health response verifying database and microservice readiness. |
| **4:30 – 5:00** | Conclusion & Q&A | Presentation | Slide 15 (Conclusion) | Summarize test pass counts (99 tests), state limitations honestly, and open for examiner Q&A. |
