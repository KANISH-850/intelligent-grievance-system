# AI Confidence Thresholding & Low-Confidence Human Review

## 1. Overview

Phase 11 introduces a production-ready confidence evaluation framework for the **TF-IDF + Logistic Regression NLP Classification Pipeline**.

Rather than naively assuming all predictions are equally reliable, the framework evaluates the probability score returned by the calibrated softmax classifier against configurable confidence thresholds.

---

## 2. Configurable Confidence Thresholds

Thresholds are configurable via environment variables in `ai-service`:

- `AI_CONFIDENCE_THRESHOLD`: `0.75` (Default)
- `AI_LOW_CONFIDENCE_THRESHOLD`: `0.50` (Default)

### Confidence Tiers & Workflow Actions

| Confidence Score Range | Confidence Level | AI Review Required Flag | Action Taken |
|---|---|---|---|
| **`>= 0.75`** | `HIGH` | `false` | Automatic Department Dispatch |
| **`0.50 – 0.74`** | `MEDIUM` | `true` | Flagged for Human Review |
| **`< 0.50`** | `LOW` | `true` | Flagged for Human Review |

---

## 3. Low-Confidence Human Review Workflow

1. **Citizen Submission:** Citizen submits grievance text via portal or mobile app.
2. **AI Analysis:** Python AI microservice classifies text and calculates softmax confidence score.
3. **Threshold Check:** If confidence < `0.75`, the AI microservice sets `ai_review_required: true`.
4. **Prisma Persistence:** The Node.js backend stores `ai_confidence`, `ai_confidence_level`, and `ai_review_required: true` in PostgreSQL.
5. **UI Notification Badge:** Admin and Officer dashboards display an animated `AI Review Required` alert tag.
6. **Human Correction API:** Admin inspects complaint statement, confirms or overrides the predicted category via `PATCH /api/v1/admin/grievances/:id/classification`.
7. **Audit & Routing:** Department routing updates, `ai_review_required` clears to `false`, and historical AI prediction is preserved in `ai_original_category`.
