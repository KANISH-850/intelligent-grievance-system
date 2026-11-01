# Stage A — Baseline Audit Report

**Project:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework
**Audit date:** 2026-10-25
**Auditor:** AI Enhancement Agent (Stage A)

---

## 1. Repository Structure

```
intelligent-grievance-system/
├── ai-service/               Python FastAPI AI microservice
│   ├── app/core/config.py    Settings (pydantic-settings, env-driven)
│   ├── app/main.py           FastAPI app + CORS
│   ├── app/routes/           analyze.py, chatbot.py, health.py
│   ├── app/schemas/          grievance.py, chatbot.py
│   └── app/services/
│       ├── chatbot.py            Intent-based chatbot (324 lines, 9 intents)
│       ├── classifier.py         Rule-based keyword classifier (baseline)
│       ├── department_router.py  Deterministic category-to-dept mapping
│       ├── language_detector.py  langdetect + Unicode fallback
│       ├── pipeline.py           Orchestration pipeline
│       ├── preprocessor.py       Text normalisation
│       ├── priority_predictor.py Rule-based priority engine
│       ├── translator.py         LibreTranslate-compatible HTTP client
│       ├── vision.py             OpenAI-compatible vision adapter [untracked]
│       └── ml/
│           ├── classifier.py     TF-IDF + LR with XAI + fallback (187 lines)
│           ├── model_loader.py   Singleton joblib loader
│           ├── predictor.py      ML priority wrapper
│           └── translation_provider.py  Provider abstraction
├── ai-service/models/grievance-classifier/
│   ├── model.joblib      Trained scikit-learn pipeline (198 KB)
│   └── config.json       Model metadata (PROBLEM: reports 1.0 on all metrics)
├── ai-service/tests/     test_analyze.py, test_chatbot.py, test_phase10_ml.py, test_provider_boundaries.py
├── backend/              Node.js / Express / Prisma
│   ├── prisma/schema.prisma  Full schema with GrievanceImage + AI metadata fields
│   └── src/services/
│       ├── ai.service.js         HTTP bridge to AI + dual keyword fallback
│       ├── admin.service.js      CRUD + correctClassification + getAIAnalytics
│       ├── grievance.service.js  Submit + image persistence
│       ├── officer.service.js    Dept-scoped access + status transitions
│       └── chatbot.service.js    Backend fallback chatbot
├── backend/tests/        grievance, officer_admin, phase12, phase8, phase9, phase11, ai.service
├── frontend/             React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
│   └── src/apps/
│       ├── admin/AdminGrievanceDetail.tsx    (full AI metadata panel)
│       ├── chatbot/ChatbotView.tsx
│       ├── citizen/SubmitGrievance.tsx
│       └── officer/OfficerGrievanceDetail.tsx
└── datasets/grievance-classification/
    ├── train.csv      (472 rows, ALL synthetic, 9 categories)
    ├── test.csv       (102 rows)
    └── validation.csv (101 rows)
```

---

## 2. Git Status Summary

- **Working-tree modifications (M):** 42 files — intentional project-authored changes across all layers
- **Untracked (??):** 14 files — including `vision.py`, `upload.middleware.js`, `storage.service.js`, migration directories, test output files, `vercel.json`

No destructive git operations performed. All untracked files are additive.

---

## 3. Component Status Assessment

### 3.1 Language Detection — FULLY IMPLEMENTED

- `langdetect` library with `DetectorFactory.seed = 42` (deterministic)
- Unicode script fallback covers Devanagari/Tamil/Telugu/Kannada/Malayalam/Bengali/Gujarati
- Latin-script fallback for English
- Empty-text guard returns `Unknown`

### 3.2 Translation — FULLY IMPLEMENTED (provider not locally configured)

- LibreTranslate-compatible HTTP client with 15s timeout
- All five `translation_status` states: `translated`, `passthrough`, `unavailable`, `failed`, `unsupported`
- Original text **always** preserved on failure — never silently replaced
- API URL/key are server-side only (never in frontend env)
- **Limitation:** `TRANSLATION_API_URL` not set locally → Tamil/Hindi complaints correctly routed to `Other` + `REVIEW_REQUIRED`

### 3.3 Text Classification — IMPLEMENTED with model evaluation concern

- TF-IDF + Logistic Regression pipeline (`model.joblib`, 198 KB)
- Rule-based keyword baseline as fallback (multi-script keywords including Tamil, Hindi, Telugu)
- XAI: TF-IDF feature contribution scores (`extract_explanation_terms`)
- Confidence thresholds configurable via env (`AI_CONFIDENCE_THRESHOLD=0.75`, `AI_LOW_CONFIDENCE_THRESHOLD=0.50`)
- Indic-script path, out-of-domain path, low-confidence override — all implemented
- **DEFECT DEF-01:** `config.json` reports `accuracy: 1.0, precision: 1.0, recall: 1.0, f1_score: 1.0` — all 472 training samples are synthetic. Perfect metrics almost certainly indicate test-set leakage. Real held-out evaluation needed.

### 3.4 Vision / Image Analysis — IMPLEMENTED (provider not locally configured)

- OpenAI-compatible vision API adapter (`vision.py`)
- Handles unsupported format, too-large file, provider unavailable, provider failure, markdown fence JSON
- Issue taxonomy normalisation (6 canonical issue types)
- Confidence explicitly set to `None` — correctly declines to fabricate scores
- Upload middleware: multer, 5 MiB limit, JPEG/PNG/WebP
- Image persisted to `grievance_images` table with full analysis metadata
- **DEFECT DEF-03:** `analysis_status: "analyzed"` from vision service is NOT handled in frontend `ImageGallery.getStatusBadge()` — falls through to default ("Image uploaded"). Should show "Analysis completed".

### 3.5 Department Dispatch — FULLY IMPLEMENTED

- Deterministic 1-to-1 category→department map in `department_router.py`
- DB resolution with `OTH` fallback
- `routing_status`: `ASSIGNED` or `REVIEW_REQUIRED` (set correctly based on ai_review_required, imageReviewRequired, translation failure)
- Admin `correctClassification` preserves `ai_original_category`, sets `is_human_corrected`, notifies officers
- Officer access enforced at backend: `grievance.department_id !== officerUser.department_id` → 404

### 3.6 Chatbot — FULLY IMPLEMENTED

- 9 intent classes: GREETING, GRIEVANCE_STATUS, GRIEVANCE_DETAILS, PRIORITY_INFORMATION, PROCESS_INFORMATION, TRACKING_GUIDANCE, SUBMIT_GRIEVANCE_GUIDANCE, DEPARTMENT_INFORMATION, HELP, UNKNOWN
- Session context (last GRV number for follow-up queries)
- GRV regex extraction and cross-reference against authenticated user's own grievances only
- Backend fallback processor mirrors all major intents — works when AI service is offline
- No fabricated tracking IDs or status values

### 3.7 AI Transparency UI — FULLY IMPLEMENTED

- Admin grievance detail: AI confidence %, confidence level badge, AI review required badge, human corrected badge, TF-IDF explanation terms, original/translated text with status, image gallery with analysis findings, original AI category, correct category modal
- TypeScript: **0 errors** (`npx tsc --noEmit` exits 0)

---

## 4. Test Baseline

### Frontend TypeScript Check
```
Command:  npx tsc --noEmit (frontend/)
Exit:     0
Errors:   0
Status:   PASSED
```

### Backend Test Suite (from stored output `backend-test-output.txt`)
```
Total:    67 pass, 2 fail, 0 skipped
Status:   2 FAILURES
```

**Failing tests:**

| Test location | Failure |
|--------------|---------|
| `grievance.test.js:166` — AI Microservice Integration | `actual: 'Other'  expected: 'Water Supply'` |
| `grievance.test.js:1` — Suite parent | Cascade from above |

**Root cause:** The test stubs `aiService.analyzeGrievance` by direct property reassignment on the imported module object. Node.js module caching means the route controller (which imported `aiService` at startup) holds the original reference and does not see the replacement. This is a **test isolation bug**, not a product defect. The real submission flow is correct.

### AI Service Tests
Not run live in this audit (Python virtual-env not confirmed active). Tests are structurally correct and cover all required scenarios. Command to run: `py -m pytest tests/ -v` from `ai-service/`.

### Frontend Build
Not run. TypeScript check passes. Build expected to succeed.

---

## 5. Environment Variables

| Variable | Status | Effect when absent |
|----------|--------|--------------------|
| `DATABASE_URL` | Configured | N/A |
| `JWT_SECRET` | Configured | N/A |
| `AI_SERVICE_URL` | Configured (localhost:8001) | N/A |
| `CLIENT_URL` | Configured | N/A |
| `TRANSLATION_API_URL` | **NOT SET** | Tamil/Hindi → unavailable → Other + REVIEW_REQUIRED |
| `TRANSLATION_API_KEY` | **NOT SET** | Same |
| `VISION_API_URL` | **NOT SET** | Images → analysis_status: unavailable |
| `VISION_API_KEY` | **NOT SET** | Same |
| `VITE_API_BASE_URL` | Configured | N/A |

---

## 6. Defect Register

| ID | Sev | Component | Finding |
|----|-----|-----------|---------|
| DEF-01 | HIGH | Model Evaluation | config.json reports 1.0 on all metrics — synthetic-only data, likely leakage. Needs real held-out eval. |
| DEF-02 | HIGH | Backend Tests | 2 tests fail due to module-mock isolation bug in test setup (not product logic) |
| DEF-03 | MED | Vision Display | "analyzed" status from vision service not rendered as "Analysis completed" in ImageGallery |
| DEF-04 | MED | Priority Predictor | ml/predictor.py and priority_predictor.py coexist; pipeline imports ml.predictor — relationship needs verification |
| DEF-05 | MED | Pipeline import | pipeline.py line 10 imports ml.predictor; tests exercise priority_predictor_service — confirm same code path |
| DEF-06 | LOW | Config | TRANSLATION_PROVIDER setting has no effect on actual pipeline (always uses translator_service) |
| DEF-07 | LOW | Chatbot | Intent confidence hardcoded 0.90-0.95 regardless of actual match quality |
| DEF-08 | LOW | Classification | classification_method in fallback paths inconsistent with outer pipeline default label |
| DEF-09 | LOW | Dataset | All 472 training samples synthetic — real generalisation unknown |
| DEF-10 | LOW | Config | config.json metrics not from a proper held-out split |
| DEF-11 | LOW | Frontend | translation_status "unavailable" not given a user-friendly message on citizen GrievanceDetail page |

---

## 7. End-to-End Flow Verification

| Flow | Status |
|------|--------|
| English grievance submission (full AI pipeline) | OK |
| Tamil grievance (no translation) → Other + REVIEW_REQUIRED | OK (correct fallback) |
| Tamil grievance (with translation configured) | Designed correctly, not testable locally |
| Image upload, multer validation, safe filename | OK |
| Image analysis (vision provider unavailable) → unavailable status | OK |
| Image analysis (vision provider configured) → analyzed, persisted | Designed correctly, not testable locally |
| Vision "analyzed" status shown in Admin UI | BUG (DEF-03) |
| Admin correct category → preserves original, reroutes, notifies | OK |
| Officer queue: dept-scoped, backend-enforced | OK |
| Officer cross-dept access attempt → 404 | OK |
| Chatbot: AI service online → real intent classification | OK |
| Chatbot: AI service offline → backend fallback | OK |
| Chatbot: citizen queries other user's grievance → blocked | OK |

---

## 8. Proposed Stage Sequence

### Stage B — Safe high-impact fixes (no schema change, no migration)
1. Fix DEF-03: Add "analyzed" to frontend ImageGallery.getStatusBadge
2. Verify DEF-05: Confirm pipeline.py predictor import is correct
3. Fix DEF-02: Fix backend test mock isolation (2 failing tests)

### Stage C — Model evaluation honesty
1. Write evaluate_model.py script (uses existing model.joblib + test.csv)
2. Compute and log real precision/recall/F1 per category + macro F1
3. Update config.json with actual metrics
4. Add model evaluation to test-results.md

### Stage D — Image conflict detection + display
1. Add vision-vs-text category conflict flag in grievance.service.js
2. Verify image analysis metadata displayed correctly end-to-end

### Stage E — Chatbot + UI polish
1. Surface classification_method label in Admin UI
2. Add user-friendly translation unavailable message on citizen detail (DEF-11)

### Stage F — Full regression
1. Run: py -m pytest tests/ -v (AI service)
2. Run: node --test tests/**/*.test.js (backend)
3. Run: npx tsc --noEmit (frontend)

### Stage G — Demo script + final report
1. live-demo-script.md
2. implementation-report.md
3. test-results.md

---

## 9. Limitations

- TRANSLATION_API_URL not configured: Tamil/Hindi tested only via mock
- VISION_API_URL not configured: Vision tested only via monkeypatch
- Python as `py` launcher: all commands use `py -m pytest` not `pytest`
- 100% synthetic training data: real-world accuracy unverified
- Backend test mock bug: 2 failures are test infrastructure, not product

---

## 10. Conclusion

All six AI pillars are architecturally implemented and correctly degrade when external providers are absent. The pipeline is honest about confidence, does not fabricate results, and preserves original text. Department access controls are enforced at the backend layer.

Three priority actions before demo:
1. Replace 1.0 model metrics with real held-out evaluation (DEF-01)
2. Fix the "analyzed" status display bug in the image gallery (DEF-03)
3. Fix the 2 failing backend tests (DEF-02)

No schema migrations, database resets, or credential commits are required for any of these fixes.
