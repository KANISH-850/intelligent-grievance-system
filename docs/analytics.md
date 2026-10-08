# Advanced Analytics Documentation

## Overview
The Advanced Analytics module provides real-time performance, workload, and resolution metrics powered by PostgreSQL database aggregations (`prisma.grievance.count` and `prisma.grievance.groupBy`). No random or artificial data is generated.

---

## API Endpoints

### 1. Officer Departmental Analytics
- **Endpoint:** `GET /api/v1/officer/analytics`
- **Access Control:** Authenticated `OFFICER` only.
- **Authorization Enforcement:** Scoped strictly to `req.user.department_id` extracted from database session context. Frontend cannot override department boundaries.

#### Response Structure (200 OK):
```json
{
  "success": true,
  "data": {
    "department": {
      "id": "dept-uuid",
      "name": "Water Supply",
      "code": "WS"
    },
    "summary": {
      "total": 12,
      "submitted": 2,
      "assigned": 1,
      "under_review": 1,
      "in_progress": 4,
      "resolved": 3,
      "rejected": 1,
      "high_critical_count": 5,
      "resolution_rate": 25.0
    },
    "priority": {
      "LOW": 2,
      "MEDIUM": 5,
      "HIGH": 3,
      "CRITICAL": 2
    },
    "categories": [
      { "category": "Pipe Leakage", "count": 7 },
      { "category": "Low Pressure", "count": 5 }
    ]
  }
}
```

---

### 2. Admin System-Wide Analytics
- **Endpoint:** `GET /api/v1/admin/analytics`
- **Access Control:** Authenticated `ADMIN` only.
- **Scope:** System-wide database metrics across all government departments.

#### Response Structure (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 45,
      "submitted": 8,
      "assigned": 5,
      "under_review": 6,
      "in_progress": 14,
      "resolved": 10,
      "rejected": 2,
      "high_critical_count": 15,
      "resolution_rate": 22.2
    },
    "priority": {
      "LOW": 10,
      "MEDIUM": 20,
      "HIGH": 11,
      "CRITICAL": 4
    },
    "departments": [
      { "id": "uuid-1", "code": "WS", "name": "Water Supply", "count": 12 },
      { "id": "uuid-2", "code": "ELEC", "name": "Electricity", "count": 15 }
    ],
    "categories": [
      { "category": "Power Outage", "count": 10 },
      { "category": "Pipe Leakage", "count": 7 }
    ]
  }
}
```

---

## Performance & Aggregation Strategy
- **Prisma Aggregations:** Uses `prisma.grievance.groupBy` and `prisma.grievance.count` directly inside the database query engine for maximum speed and minimal memory footprint.
- **Role Isolation:** Department filtering is enforced on the database query level (`where: { department_id: officerUser.department_id }`).
