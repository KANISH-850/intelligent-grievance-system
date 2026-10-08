# Multilingual AI Chatbot Documentation

## Overview
The Multilingual AI Chatbot is a citizen-facing conversational assistant designed for central government grievance portals. It provides real-time guidance, answers process questions, and queries specific grievance statuses safely using authenticated PostgreSQL database records.

---

## Architecture Flow

```
Citizen UI (React Chatbot View)
  │
  ▼  POST /api/v1/chatbot/message (Bearer JWT - CITIZEN Role Required)
Node.js + Express Backend
  │  (Fetches authenticated Citizen's grievances from PostgreSQL for database context isolation)
  ▼
Python FastAPI AI Microservice (:8001/chatbot/process)
  ├── 1. Language Detector (langdetect + Unicode Script Heuristics)
  ├── 2. Intent Classifier (GRIEVANCE_STATUS, LIST_GRIEVANCES, GENERAL_GUIDANCE)
  └── 3. Safe Database Matching (verifies grievance ownership)
  │
  ▼ (Fallback available if AI microservice is offline)
Structured Response Object
```

---

## API Specification

### Endpoint: `POST /api/v1/chatbot/message`
- **Access Control:** Authenticated `CITIZEN` only (HTTP 401 for unauthenticated, HTTP 403 for Non-Citizen roles).
- **Request Headers:** `Authorization: Bearer <jwt_token>`

#### Request Body:
```json
{
  "message": "What is the status of my grievance GRV-2026-000003?"
}
```

#### Response (Success 200 OK):
```json
{
  "success": true,
  "message": "Your grievance GRV-2026-000003 is currently IN_PROGRESS. It is assigned to the Water Supply department under category 'Water Leakage'.",
  "language": "English",
  "intent": "GRIEVANCE_STATUS",
  "grievance": {
    "grievance_number": "GRV-2026-000003",
    "status": "IN_PROGRESS",
    "department": "Water Supply",
    "category": "Water Leakage",
    "created_at": "2026-10-07T12:00:00Z"
  }
}
```

---

## Security & Multilingual Capabilities

1. **Cross-User Privacy Isolation:**
   - The chatbot retrieves only the authenticated user's grievances from PostgreSQL (`where: { user_id: req.user.id }`).
   - If a citizen queries a grievance reference belonging to another user, the system responds:
     > *"No grievance record with reference GRV-XXXXXX was found under your registered account. For privacy and security, you can only check the status of grievances submitted by your own account."*
   - LLMs and NLP components are strictly forbidden from inventing or hallucinating grievance data.

2. **Multilingual Processing:**
   - **Supported Languages:** English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu.
   - **Implementation Distinction:**
     - *Language Detection:* Fully implemented using `langdetect` with Unicode Indic script fallback.
     - *Translation Mode:* Native English passthrough with baseline Indic script fallback preservation. Future production roadmap includes fine-tuned IndicTrans2 neural model integration.
