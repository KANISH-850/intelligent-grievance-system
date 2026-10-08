# Frontend Integration Specification (Phase 7)

## Overview
Phase 7 connected the React TypeScript frontend (`http://localhost:5173`) to the Node.js Express backend (`http://localhost:5000/api/v1`) and Python AI microservice (`http://localhost:8001`), completing the end-to-end user experience for Citizens, Departmental Officers, and Portal Administrators.

---

## Application Architecture

```
                               ┌───────────────────────────┐
                               │   Vite + React (Port 5173) │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             ┌───────────────────┐                       ┌───────────────────┐
             │   Auth Context    │                       │   Central API     │
             │   (Token/User)    │                       │   Client          │
             └─────────┬─────────┘                       └─────────┬─────────┘
                       │                                           │
         ┌─────────────┴─────────────┐                             │ (Bearer Auth)
         ▼                           ▼                             ▼
  ┌──────────────┐            ┌──────────────┐          ┌──────────────────────┐
  │ PublicRoute  │            │Protected     │          │  Express Backend     │
  │ (/login)     │            │Route         │          │  (Port 5000)         │
  └──────────────┘            └──────┬───────┘          └──────────┬───────────┘
                                     │                             │
             ┌───────────────────────┼───────────────────────┐     ▼
             ▼                       ▼                       ▼  ┌──────────────────────┐
      CITIZEN PORTAL          OFFICER PORTAL           ADMIN    │  AI Microservice     │
      - /citizen/dashboard    - /officer/dashboard    PORTAL    │  (Port 8001)         │
      - /citizen/submit       - /officer/grievances   - /admin/ │  - Language          │
      - /citizen/grievances   - /officer/grievances/    dash    │  - Translation       │
      - /citizen/grievance/     :id                   - /admin/ │  - Classification    │
        :id                                             griev   │  - Priority          │
                                                        - /admin│  - Routing           │
                                                          depts └──────────────────────┘
```

---

## Environment Configuration

In `frontend/.env` and `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## Central API Client (`frontend/src/core/api/client.ts`)

- **Token Management:** Injects `Authorization: Bearer <token>` automatically from `authStorage`.
- **Status Codes Handled:**
  - `200/201`: Returns parsed JSON.
  - `400 Bad Request`: Formats backend validation messages.
  - `401 Unauthorized`: Clears session tokens, dispatches `unauthorized` event for redirection.
  - `403 Forbidden`: Displays clear permission restriction error.
  - `404 Not Found`: Displays resource not found state.
  - `503 Service Unavailable`: Displays friendly AI service unavailable message ("Grievance analysis service is temporarily unavailable").

---

## Role-Based Portal Workflows

### 1. Citizen Portal
- **Submit Grievance (`POST /api/v1/grievances`):**
  - Allows citizens to input grievance text in any Indian language or English.
  - Automatically dispatches to backend AI pipeline for language detection, translation, category classification, priority prediction, and department routing.
  - Returns immediate submission feedback with Grievance Number (`GRV-YYYY-XXXXXX`), priority badge, category, and department.
- **My Grievances (`GET /api/v1/grievances`):**
  - Displays user's personal complaints list with status badges.
- **Grievance Details & Tracking (`GET /api/v1/grievances/:id`):**
  - Features visual `StatusTimeline` component tracking progress (`SUBMITTED` → `ASSIGNED` → `UNDER_REVIEW` → `IN_PROGRESS` → `RESOLVED`).
  - Displays complete audit history with timestamps, remarks, and user names.

### 2. Officer Portal
- **Department Queue (`GET /api/v1/officer/grievances`):**
  - Restricts access strictly to complaints routed to the officer's assigned department (e.g., `Water Supply [WS]`).
  - Includes `status` and `priority` backend dropdown filters.
- **Status Updates (`PATCH /api/v1/officer/grievances/:id/status`):**
  - Features `UpdateStatusModal` allowing status transitions.
  - Enforces mandatory remarks for `RESOLVED` and `REJECTED` statuses.

### 3. Admin Portal
- **System-Wide Oversight (`GET /api/v1/admin/grievances`):**
  - Displays all grievances across all government departments.
- **Department Breakdown View (`GET /api/v1/admin/departments/:code/grievances`):**
  - Provides instant department selection pills for all 9 seeded departments (`WS`, `ELEC`, `RT`, `HC`, `EDU`, `SAN`, `MS`, `REV`, `OTH`).
- **Administrative Override (`PATCH /api/v1/admin/grievances/:id/status`):**
  - Allows administrative status overrides using shared state machine rules.

---

## Running the Complete System End-to-End

### 1. Start PostgreSQL
Ensure PostgreSQL is active on port `5432` with database `intelligent_grievance`.

### 2. Start Python AI Microservice (Port 8001)
```bash
cd ai-service
py -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### 3. Start Node.js Express Backend (Port 5000)
```bash
cd backend
node src/server.js
```

### 4. Start React Frontend (Port 5173)
```bash
cd frontend
npm run dev
```

### Demo Accounts for Live Verification
- **Citizen:** `citizen@example.com` / `Password@123`
- **Officer (Water Supply):** `officer@example.com` / `Password@123`
- **Admin:** `admin@example.com` / `Password@123`
