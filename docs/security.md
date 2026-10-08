# Security & Production Hardening Documentation

## 1. Overview

Phase 11 implements comprehensive security hardening across backend APIs, RBAC authorization, input validation constraints, and AI service failure handling.

---

## 2. Input Validation Constraints

1. **Grievance Text Length:**
   - **Minimum Length:** 5 characters (Rejects empty, whitespace-only, or trivial inputs with HTTP 400).
   - **Maximum Length:** 5000 characters.
2. **Category Validation:**
   - Admin classification correction strictly validates category values against the 9 official categories (`Water Supply`, `Electricity`, `Roads and Transport`, `Healthcare`, `Education`, `Sanitation`, `Municipal Services`, `Revenue`, `Other`).
3. **Data Sanitization:**
   - Leading and trailing whitespace is automatically sanitized prior to processing.

---

## 3. RBAC & Endpoint Authorization

1. **Human Classification Correction (`PATCH /api/v1/admin/grievances/:id/classification`):**
   - Strictly restricted to `ADMIN` role.
   - Rejects `CITIZEN` and `OFFICER` roles with `HTTP 403 Forbidden`.
2. **AI Analytics (`GET /api/v1/admin/analytics/ai`):**
   - Strictly restricted to `ADMIN` role.
3. **Department Isolation:**
   - Officer queries remain strictly scoped to their assigned department (`department_id`).

---

## 4. AI Service Graceful Failure Handling

- When the Python AI microservice is offline or times out (10s limit):
  - Backend catches connection error cleanly.
  - Returns `HTTP 503 Service Unavailable` with user-friendly error message.
  - Internal Python stack traces and internal server IP paths are never exposed to citizens.
