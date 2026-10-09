# Technical Architecture & API Reference Guide

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework  
**Repository:** `https://github.com/KANISH-850/intelligent-grievance-system.git`  

---

## 1. System Architecture Diagram

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

---

## 2. Component Responsibilities

| Service | Technology | Port | Responsibilities |
|---|---|---|---|
| **Frontend UI** | React 18, Vite, TypeScript | `80` (Docker) / `5173` (Dev) | User interfaces, AuthContext, Axios API client, responsive tables, badge badges, chart visualizations. |
| **Backend API** | Node.js, Express, Prisma ORM | `5000` | JWT issuance/verification, RBAC middleware, workflow routing, PostgreSQL CRUD, notification triggers. |
| **AI Microservice** | Python 3.11/3.13, FastAPI | `8001` | Preprocessing, language detection, TF-IDF + Logistic Regression classification, XAI term extraction, intent-based chatbot processing. |
| **Database** | PostgreSQL 15 | `5432` / `5433` | Relational tables for Users, Departments, Grievances, Status History, and Notifications. |

---

## 3. Core Sequence Flows

### 3.1 Grievance Submission Sequence Flow
```text
Citizen UI                 Express API                 FastAPI AI                PostgreSQL
    │                           │                           │                         │
    │ ─── POST /grievances ────>│                           │                         │
    │     (Text + JWT)          │ ──── POST /analyze ──────>│                         │
    │                           │      (Grievance Text)     │                         │
    │                           │                           │ ── Run TF-IDF + LogReg  │
    │                           │                           │ ── Predict Category & Priority
    │                           │ <── Return AI Payload ────│                         │
    │                           │     (Cat, Conf, XAI)      │                         │
    │                           │                                                     │
    │                           │ ───────────── Insert Grievance & History ──────────>│
    │                           │ <──────────── Return Saved Grievance ───────────────│
    │ <── 201 Created JSON ─────│                                                     │
    │     (Grievance + AI Meta) │                                                     │
```

### 3.2 Officer Status Update Sequence Flow
```text
Officer UI                 Express API                                           PostgreSQL
    │                           │                                                     │
    │ ── PATCH /status ────────>│                                                     │
    │    (New Status + Remarks) │ ── Validate JWT & Department Match ─────────────────>│
    │                           │ ── Enforce Non-Empty Remarks ───────────────────────│
    │                           │                                                     │
    │                           │ ── BEGIN TRANSACTION ──────────────────────────────>│
    │                           │ ── Update Grievance Status ─────────────────────────>│
    │                           │ ── Insert GrievanceStatusHistory ───────────────────>│
    │                           │ ── Insert Notification (STATUS_CHANGED) ───────────>│
    │                           │ ── COMMIT TRANSACTION ──────────────────────────────>│
    │                           │                                                     │
    │ <── 200 OK Response ──────│                                                     │
```

### 3.3 Admin Classification Correction Flow
```text
Admin UI                   Express API                                           PostgreSQL
    │                           │                                                     │
    │ ── PATCH /classification >│                                                     │
    │    (New Dept + Category)  │ ── Validate JWT & ADMIN Role ──────────────────────>│
    │                           │                                                     │
    │                           │ ── Preserve ai_original_category ──────────────────>│
    │                           │ ── Set is_human_corrected = true ───────────────────>│
    │                           │ ── Update category & department_id ─────────────────>│
    │                           │ ── Record human_corrected_by & timestamp ──────────>│
    │                           │                                                     │
    │ <── 200 OK Response ──────│                                                     │
```

---

## 4. Primary Database Schema (Prisma Models)

Verified from `backend/prisma/schema.prisma`:

- `User`: `id`, `name`, `email`, `password_hash`, `role` (`CITIZEN`, `OFFICER`, `ADMIN`), `department_id`, `created_at`
- `Department`: `id`, `name`, `code`, `description`, `created_at`
- `Grievance`: `id`, `grievance_number`, `user_id`, `original_text`, `detected_language`, `category`, `priority`, `department_id`, `status` (`SUBMITTED`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`), `ai_confidence`, `ai_confidence_level`, `ai_review_required`, `ai_classification_method`, `ai_explanation_terms`, `ai_original_category`, `is_human_corrected`, `human_corrected_by`, `created_at`
- `GrievanceStatusHistory`: `id`, `grievance_id`, `status`, `remarks`, `changed_by`, `created_at`
- `Notification`: `id`, `user_id`, `grievance_id`, `type` (`STATUS_CHANGED`, `REVIEW_FLAGGED`), `title`, `message`, `is_read`, `created_at`

---

## 5. Comprehensive API Endpoint Reference Matrix

| Endpoint Path | HTTP Method | Required Role | Description |
|---|---|---|---|
| `/api/v1/health` | GET | Public | Microservice health check & PostgreSQL status |
| `/api/v1/auth/register` | POST | Public | Registers new citizen account |
| `/api/v1/auth/login` | POST | Public | Authenticates user & returns 24h JWT token |
| `/api/v1/auth/me` | GET | Authenticated | Fetches current user profile |
| `/api/v1/grievances` | POST | `CITIZEN` | Submits complaint text, triggers AI analysis & saves record |
| `/api/v1/grievances` | GET | `CITIZEN` | Lists complaints authored by authenticated citizen |
| `/api/v1/grievances/:id` | GET | `CITIZEN` | Fetches single complaint detail (isolated by `user_id`) |
| `/api/v1/officer/grievances` | GET | `OFFICER` | Lists queue filtered by officer's `department_id` |
| `/api/v1/officer/grievances/:id/status` | PATCH | `OFFICER` | Updates status & records mandatory resolution remarks |
| `/api/v1/officer/analytics` | GET | `OFFICER` | Fetches department-level summary analytics |
| `/api/v1/admin/grievances` | GET | `ADMIN` | System-wide grievance list across all departments |
| `/api/v1/admin/grievances/:id/classification` | PATCH | `ADMIN` | Human correction override for AI category & department |
| `/api/v1/admin/analytics` | GET | `ADMIN` | System-wide analytics & AI confidence metrics |
| `/api/v1/chatbot/query` | POST | Authenticated | Processes user chat prompt with privacy-isolated grievance list |
| `/api/v1/notifications` | GET | Authenticated | Fetches user's in-app notifications |
| `/api/v1/notifications/read-all` | PATCH | Authenticated | Marks all unread user notifications as read |
