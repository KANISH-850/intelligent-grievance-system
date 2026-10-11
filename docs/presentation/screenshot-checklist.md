# Screenshot Verification Checklist & 5-Minute Live Presentation Sequence

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  
**Deployment Target:** `http://localhost:5173` (Vite Frontend), `http://localhost:5000` (Node Backend), `http://localhost:8001` (FastAPI AI Service)  
**Status:** ALL 11 AUTHENTIC SCREENSHOTS CAPTURED & VERIFIED FROM RUNNING SYSTEM

---

## Part 1 — Comprehensive Authentic Screenshot Inventory

All screenshots have been captured directly from the live, fully running application using headless Chrome automation (`puppeteer-core`). No synthetic placeholders or PIL mockups are used.

| # | Filename | Application Route | Role / Workflow | Status | Verified Capabilities Proved |
|---|---|---|---|---|---|
| **01** | `01_login.png` | `/login` | Public / Unauthenticated | **CAPTURED** | Clean authentication card, role switchers (`Citizen`, `Officer`, `Admin`), password masking, and input validation. |
| **02** | `02_citizen_submission.png` (`01_citizen_submission.png`) | `/citizen/grievances/new` | `CITIZEN` (`citizen@example.com`) | **CAPTURED** | Multi-line complaint submission textarea, real-time input validation, responsive submit action. |
| **03** | `03_submission_result.png` | `/citizen/grievances/new` | `CITIZEN` (`citizen@example.com`) | **CAPTURED** | Instant AI prediction card showing generated reference number `GRV-2026-XXXXXX`, department routing, priority level, confidence score, and XAI feature terms. |
| **04** | `04_citizen_grievance_list.png` | `/citizen/grievances` | `CITIZEN` (`citizen@example.com`) | **CAPTURED** | Citizen-isolated grievance table, reference tracking numbers, department assignments, status tags, and submission dates. |
| **05** | `05_grievance_detail.png` | `/citizen/grievances/:id` | `CITIZEN` (`citizen@example.com`) | **CAPTURED** | Full grievance details, original text, AI category, priority badge, and sequential status history timeline (`SUBMITTED` → `UNDER_REVIEW`). |
| **06** | `06_officer_queue.png` (`03_officer_queue.png`) | `/officer/grievances` | `OFFICER` (`officer.water@example.com`) | **CAPTURED** | Department-isolated officer queue (`Water Supply & Sanitation`), priority badges, language tags, and "Review & Update" action buttons. |
| **07** | `07_officer_status_update.png` | `/officer/grievances/:id` | `OFFICER` (`officer.water@example.com`) | **CAPTURED** | Officer status transition modal open with new status selection (`RESOLVED`), mandatory resolution remarks validation, and audit timeline tracking. |
| **08** | `08_admin_dashboard.png` (`04_admin_dashboard.png`) | `/admin/grievances` | `ADMIN` (`admin@example.com`) | **CAPTURED** | Administrative system-wide grievance control center across all 9 government departments, priority badges, and inspection actions. |
| **09** | `09_admin_ai_review.png` | `/admin/grievances/:id` | `ADMIN` (`admin@example.com`) | **CAPTURED** | Admin grievance detail with "Human Classification Correction" modal open, preserving `ai_original_category` in the database audit log. |
| **10** | `10_chatbot_interaction.png` (`02_chatbot_interaction.png`) | `/chatbot` (Widget) | `CITIZEN` (`citizen@example.com`) | **CAPTURED** | 24/7 conversational citizen assistant demonstrating multi-turn greeting, regex tracking extraction, and contextual status lookups. |
| **11** | `11_admin_analytics.png` | `/admin/analytics` | `ADMIN` (`admin@example.com`) | **CAPTURED** | Executive analytics overview displaying category breakdown charts, priority distribution, resolution velocity, and review flag metrics. |

---

## Part 2 — Presentation Slide Embedding Mapping

Slide 13 of `docs/presentation/final-project-presentation.pptx` embeds four high-resolution authentic screenshots to showcase the portal's core workflows:

1. **Top-Left (Citizen Ingestion & AI Triage):** `docs/presentation/screenshots/01_citizen_submission.png`  
   *Proves:* Citizen complaint submission interface and real-time validation.
2. **Top-Right (24/7 Conversational AI Assistance):** `docs/presentation/screenshots/02_chatbot_interaction.png`  
   *Proves:* Multilingual intent detection, regex reference extraction, and multi-turn contextual memory.
3. **Bottom-Left (Department Officer Queue):** `docs/presentation/screenshots/03_officer_queue.png`  
   *Proves:* Strict department isolation, priority triage, and status review controls.
4. **Bottom-Right (Administrative Control Center):** `docs/presentation/screenshots/04_admin_dashboard.png`  
   *Proves:* Cross-department administrative oversight, human classification review, and system-wide visibility.

---

## Part 3 — 5-Minute Timed Presentation Live Demo Sequence

Follow this exact 300-second sequence during the live academic evaluation:

| Time | Presenter Action | Logged-In Account | Target Screen / Component | Spoken Narrative & Key Features |
|---|---|---|---|---|
| **0:00 – 0:30** | System Overview | Unauthenticated | Slide 1 / Landing Page | "Demonstrating the 4-tier microservices stack running live with React, Express, FastAPI, and PostgreSQL." |
| **0:30 – 1:15** | Citizen Grievance Submission | `citizen@example.com` (`Password@123`) | New Grievance Page | Submit water pipe rupture complaint. Highlight real-time AI classification, priority prediction, confidence score, and XAI terms. |
| **1:15 – 2:00** | Chatbot Status Tracking | `citizen@example.com` | AI Chatbot Widget | Type `"Status of GRV-2026-000001"`. Show regex reference extraction and contextual follow-up query `"When was it resolved?"`. |
| **2:00 – 2:40** | Officer Queue & Status Update | `officer.water@example.com` (`Password@123`) | Officer Queue Page | Demonstrate department isolation (Water Supply only). Change status to `RESOLVED` with mandatory resolution remarks. |
| **2:40 – 3:20** | Admin Review & Human Correction | `admin@example.com` (`Password@123`) | Admin Grievance Dashboard | Inspect grievance. Open Human Classification Correction modal, reassign category, and prove `ai_original_category` is preserved. |
| **3:20 – 4:00** | Analytics & Citizen Notification | Switch to Admin / Citizen Window | Executive Analytics & Notification Bell | View category distribution charts. Demonstrate real-time in-app notification received by citizen for status update. |
| **4:00 – 4:30** | Diagnostic Health Verification | Terminal / Browser | `http://localhost:5000/api/v1/health` | Show JSON health response verifying database and microservice readiness. |
| **4:30 – 5:00** | Conclusion & Q&A | Presentation | Slide 15 (Conclusion) | Summarize test pass counts (99 automated tests), state verified limitations honestly, and open for examiner Q&A. |
