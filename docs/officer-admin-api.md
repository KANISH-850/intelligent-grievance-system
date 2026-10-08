# Officer & Admin Management Workflows API Specification

## Overview
Phase 6 implements administrative and departmental officer workflows for managing citizen grievances, evaluating complaints, executing state-validated status transitions, recording audit history, and providing system-wide oversight for Central Government Portal Administrators.

---

## Architecture & Security Controls

```
                               ┌─────────────────────────┐
                               │     JWT Auth Header     │
                               └────────────┬────────────┘
                                            │
                                            ▼
                        ┌──────────────────────────────────────┐
                        │      Role & Department RBAC          │
                        └──────┬───────────────────────┬───────┘
                               │                       │
                ROLE: OFFICER  │                       │ ROLE: ADMIN
                               ▼                       ▼
            ┌──────────────────────┐       ┌──────────────────────┐
            │ Officer Department   │       │  System-Wide Admin   │
            │ Grievances Endpoint  │       │ Monitoring Endpoint  │
            └──────────┬───────────┘       └───────────┬──────────┘
                       │                               │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │ Reusable Status Transition Engine │
                     │  (State Machine & Validation)    │
                     └─────────────────┬─────────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │     Prisma $transaction DB        │
                     │  1. Update Grievance.status       │
                     │  2. Create StatusHistory Record   │
                     └───────────────────────────────────┘
```

### Department Access Control Rules
1. **Officer Scope:** An `OFFICER` user is strictly restricted to grievances belonging to their assigned department (`user.department_id`).
   - Attempting to list grievances (`GET /api/v1/officer/grievances`) returns **only** grievances matching `officer.department_id`.
   - Attempting to view or update a grievance belonging to another department returns `404 Not Found` (preventing resource enumeration).
   - If an officer is unassigned to any department (`department_id === null`), endpoints return `400 Bad Request`.
2. **Admin Scope:** An `ADMIN` user has full system-wide access to all grievances across all departments (`GET /api/v1/admin/grievances` and `GET /api/v1/admin/departments/:departmentId/grievances`).

---

## Status Transition State Machine Rules

Grievance status transitions are governed by a central state machine helper (`statusTransition.service.js`):

```
                        ┌───────────┐
                        │ SUBMITTED │
                        └─────┬─────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
      ┌───────────┐    ┌──────────────┐   ┌───────────┐
      │ ASSIGNED  │───►│ UNDER_REVIEW │──►│REJECTED * │
      └───────────┘    └──────┬───────┘   └───────────┘
                              │                 ▲
                              ▼                 │
                       ┌──────────────┐         │
                       │ IN_PROGRESS  ├─────────┘
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ RESOLVED *   │
                       └──────────────┘

* Terminal States (cannot transition out of RESOLVED or REJECTED)
```

### Transition Matrix
- **`SUBMITTED`** → `ASSIGNED`, `UNDER_REVIEW`, `IN_PROGRESS`, `REJECTED`
- **`ASSIGNED`** → `UNDER_REVIEW`, `IN_PROGRESS`, `REJECTED`
- **`UNDER_REVIEW`** → `IN_PROGRESS`, `RESOLVED`, `REJECTED`
- **`IN_PROGRESS`** → `RESOLVED`, `REJECTED`
- **`RESOLVED`** → None (Terminal State)
- **`REJECTED`** → None (Terminal State)

### Remarks Validation Rules
- **Mandatory Remarks:** Changing status to `RESOLVED` or `REJECTED` **requires** non-empty `remarks`.
- **Officer Reversion Restriction:** Officers cannot revert a grievance status back to `SUBMITTED`.
- **Max Length:** `remarks` must not exceed 2000 characters.

---

## Officer API Endpoints

### 1. List Officer Department Grievances
- **Endpoint:** `GET /api/v1/officer/grievances`
- **Authentication:** Required (`OFFICER` Role)
- **Query Parameters:**
  - `status` (optional): Filter by status (`SUBMITTED`, `UNDER_REVIEW`, `IN_PROGRESS`, etc.)
  - `priority` (optional): Filter by priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "e8da597d-d916-4622-a84d-e79e06503175",
      "grievance_number": "GRV-2026-000003",
      "category": "Water Supply",
      "priority": "HIGH",
      "status": "SUBMITTED",
      "created_at": "2026-10-07T14:19:01.000Z",
      "department": {
        "id": "0121a86b-16ac-4b1f-a6ce-a9b52d3a51d7",
        "name": "Water Supply",
        "code": "WS"
      }
    }
  ]
}
```

---

### 2. View Single Department Grievance
- **Endpoint:** `GET /api/v1/officer/grievances/:id`
- **Authentication:** Required (`OFFICER` Role)

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "e8da597d-d916-4622-a84d-e79e06503175",
    "grievance_number": "GRV-2026-000003",
    "original_text": "Major water supply pipeline burst on Main Road...",
    "category": "Water Supply",
    "priority": "HIGH",
    "status": "UNDER_REVIEW",
    "department": {
      "id": "0121a86b-16ac-4b1f-a6ce-a9b52d3a51d7",
      "name": "Water Supply",
      "code": "WS"
    },
    "status_history": [
      {
        "id": "...",
        "status": "SUBMITTED",
        "remarks": "Grievance submitted successfully",
        "created_at": "...",
        "user": { "name": "Demo Citizen", "role": "CITIZEN" }
      }
    ]
  }
}
```

---

### 3. Update Grievance Status (Officer)
- **Endpoint:** `PATCH /api/v1/officer/grievances/:id/status`
- **Authentication:** Required (`OFFICER` Role)

#### Request Body
```json
{
  "status": "RESOLVED",
  "remarks": "Pipeline repair completed. Water supply restored."
}
```

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "message": "Grievance status updated successfully",
  "data": {
    "id": "e8da597d-d916-4622-a84d-e79e06503175",
    "grievance_number": "GRV-2026-000003",
    "status": "RESOLVED",
    "updated_at": "2026-10-07T14:19:03.000Z"
  }
}
```

---

## Admin API Endpoints

### 1. List All System Grievances
- **Endpoint:** `GET /api/v1/admin/grievances`
- **Authentication:** Required (`ADMIN` Role)
- **Query Parameters:** `department_id`, `status`, `priority`

### 2. View Any Grievance Details
- **Endpoint:** `GET /api/v1/admin/grievances/:id`
- **Authentication:** Required (`ADMIN` Role)

### 3. Admin Status Update
- **Endpoint:** `PATCH /api/v1/admin/grievances/:id/status`
- **Authentication:** Required (`ADMIN` Role)

### 4. Admin Department Grievances View
- **Endpoint:** `GET /api/v1/admin/departments/:departmentId/grievances`
- **Authentication:** Required (`ADMIN` Role)
- **Parameter:** `departmentId` accepts UUID or Department Code (e.g. `WS`, `ELEC`, `RT`, `HC`).

---

## Error Handling Matrix

| Status Code | Trigger Condition | Example Message |
|---|---|---|
| `400 Bad Request` | Invalid status transition, missing remarks for RESOLVED/REJECTED, unassigned officer | `{"success": false, "message": "Remarks are required when changing status to 'RESOLVED'."}` |
| `401 Unauthorized` | Missing/invalid JWT token | `{"success": false, "message": "Authentication required. Missing token."}` |
| `403 Forbidden` | Non-Officer/Admin accessing management route | `{"success": false, "message": "Access denied. Requires role: OFFICER"}` |
| `404 Not Found` | Grievance ID invalid or belonging to another department | `{"success": false, "message": "Grievance not found"}` |
| `500 Server Error` | Database transaction error | `{"success": false, "message": "Internal Server Error"}` |
