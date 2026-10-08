# Grievance API & AI Integration Specification

## Overview
Phase 5 integrates the Node.js Express backend with the Python AI Microservice (`http://localhost:8001/analyze`) to enable citizen grievance submission, automated AI classification & routing, PostgreSQL persistence, and secure citizen grievance tracking.

---

## Architecture & Data Flow

```
Citizen (Frontend / HTTP Client)
       │
       ▼  (JWT Bearer Auth)
Node.js Express Backend (/api/v1/grievances)
       │
       ├─► 1. Request Validation (non-empty string, 3..5000 chars)
       ├─► 2. AI Service Client (POST http://localhost:8001/analyze)
       │       └── Language Detection, Translation, Category, Priority, Department
       ├─► 3. Department Resolution (Lookup seeded Department in PostgreSQL)
       ├─► 4. Unique Grievance Number Generation (GRV-YYYY-XXXXXX)
       └─► 5. Database Transaction ($transaction)
               ├── Create Grievance Record (Status: SUBMITTED)
               └── Create Initial GrievanceStatusHistory Record (Remarks: "Grievance submitted successfully")
```

---

## Environment Configuration

| Variable Key | Default Value | Description |
|---|---|---|
| `AI_SERVICE_URL` | `http://localhost:8001` | Base URL of the Python AI Microservice |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/intelligent_grievance` | PostgreSQL database connection string |
| `JWT_SECRET` | Secret String | Secret key used for signing/verifying JWT tokens |

---

## API Endpoints

### 1. Submit Citizen Grievance
- **Endpoint:** `POST /api/v1/grievances`
- **Authentication:** Required (Bearer Token)
- **Role Control:** `CITIZEN`

#### Request Headers
```http
Authorization: Bearer <CITIZEN_JWT_TOKEN>
Content-Type: application/json
```

#### Request Body
```json
{
  "text": "There has been no water supply in our area for three days and pipeline seems leaked."
}
```

#### Successful Response (`201 Created`)
```json
{
  "success": true,
  "message": "Grievance submitted successfully",
  "data": {
    "id": "35753719-3bbe-4da1-b8b5-8f564928bff2",
    "grievance_number": "GRV-2026-000002",
    "user_id": "b5469a51-1c16-4a81-b975-6f2a6a8d1428",
    "original_text": "There has been no water supply in our area for three days and pipeline seems leaked.",
    "detected_language": "English",
    "translated_text": "There has been no water supply in our area for three days and pipeline seems leaked.",
    "category": "Water Supply",
    "priority": "HIGH",
    "department_id": "0121a86b-16ac-4b1f-a6ce-a9b52d3a51d7",
    "status": "SUBMITTED",
    "created_at": "2026-10-07T14:08:02.283Z",
    "updated_at": "2026-10-07T14:08:02.283Z",
    "department": {
      "id": "0121a86b-16ac-4b1f-a6ce-a9b52d3a51d7",
      "name": "Water Supply",
      "code": "WS"
    }
  }
}
```

---

### 2. List Citizen's Grievances
- **Endpoint:** `GET /api/v1/grievances`
- **Authentication:** Required (Bearer Token)
- **Role Control:** `CITIZEN`
- **Security:** Returns **only** grievances submitted by the authenticated citizen.

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "35753719-3bbe-4da1-b8b5-8f564928bff2",
      "grievance_number": "GRV-2026-000002",
      "user_id": "b5469a51-1c16-4a81-b975-6f2a6a8d1428",
      "original_text": "There has been no water supply in our area for three days and pipeline seems leaked.",
      "detected_language": "English",
      "translated_text": "There has been no water supply in our area for three days and pipeline seems leaked.",
      "category": "Water Supply",
      "priority": "HIGH",
      "status": "SUBMITTED",
      "created_at": "2026-10-07T14:08:02.283Z",
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

### 3. Get Single Grievance Details
- **Endpoint:** `GET /api/v1/grievances/:id`
- **Authentication:** Required (Bearer Token)
- **Security & Ownership:** Citizens can **only** view grievances they personally submitted. Attempting to view another citizen's grievance returns `404 Not Found` to prevent resource enumeration.

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "35753719-3bbe-4da1-b8b5-8f564928bff2",
    "grievance_number": "GRV-2026-000002",
    "user_id": "b5469a51-1c16-4a81-b975-6f2a6a8d1428",
    "original_text": "There has been no water supply in our area for three days and pipeline seems leaked.",
    "detected_language": "English",
    "translated_text": "There has been no water supply in our area for three days and pipeline seems leaked.",
    "category": "Water Supply",
    "priority": "HIGH",
    "status": "SUBMITTED",
    "created_at": "2026-10-07T14:08:02.283Z",
    "updated_at": "2026-10-07T14:08:02.283Z",
    "department": {
      "id": "0121a86b-16ac-4b1f-a6ce-a9b52d3a51d7",
      "name": "Water Supply",
      "code": "WS"
    },
    "status_history": [
      {
        "id": "695ddb9b-e0ee-41f2-9947-a8bc6b200588",
        "status": "SUBMITTED",
        "remarks": "Grievance submitted successfully",
        "created_at": "2026-10-07T14:08:02.289Z",
        "user": {
          "id": "b5469a51-1c16-4a81-b975-6f2a6a8d1428",
          "name": "Demo Citizen",
          "role": "CITIZEN"
        }
      }
    ]
  }
}
```

---

## Error Responses

| Status Code | Reason | Example Response Body |
|---|---|---|
| `400 Bad Request` | Missing/empty text, text < 3 chars or > 5000 chars | `{"success": false, "message": "Grievance text is required."}` |
| `401 Unauthorized` | Missing, malformed, or expired JWT | `{"success": false, "message": "Authentication required. Missing token."}` |
| `403 Forbidden` | Authenticated user lacks required role (e.g. OFFICER submitting citizen grievance) | `{"success": false, "message": "Access denied. Requires role: CITIZEN"}` |
| `404 Not Found` | Grievance ID does not exist OR belongs to another citizen | `{"success": false, "message": "Grievance not found"}` |
| `503 Service Unavailable` | AI Microservice offline, timed out, or connection failed | `{"success": false, "message": "AI grievance analysis service is currently unavailable"}` |

---

## Safety & Transaction Guarantees
1. **Atomicity:** Creation of `Grievance` and initial `GrievanceStatusHistory` occurs within a single Prisma `$transaction`. If either fails, the transaction rolls back cleanly.
2. **AI Hard Dependency:** If the AI microservice is unreachable, no partial grievance data is persisted, and HTTP 503 is returned.
3. **No Request Body Manipulation:** `user_id` is extracted strictly from verified JWT claims (`req.user.id`).
