# AI Processing Pipeline Documentation

**System:** Intelligent Grievance System — AI Microservice  
**Service Location:** `ai-service/`  
**API Endpoints:** `POST /analyze`, `GET /health`, Swagger Docs: `GET /docs`  

---

## Overview

The AI Microservice provides an automated NLP pipeline that ingests raw citizen grievance text and outputs structured metadata, including language identification, sanitized text, translation status, category classification, priority rating, and department routing.

---

## Architectural Breakdown & Component Status

To ensure engineering transparency and maintain production standards, every pipeline component is explicitly classified by its current implementation tier:

| Component | Current Implementation | Implementation Status | Future Model Upgrade |
|---|---|---|---|
| **Input Validation** | Pydantic v2 Schema Validation | **IMPLEMENTED** | — |
| **Language Detection** | `langdetect` + Devanagari/Indic Unicode Script Heuristics | **BASELINE** | Fine-tuned XLM-RoBERTa language identification model |
| **Text Preprocessing** | Control character stripping & space normalization | **IMPLEMENTED** | Custom domain-specific token cleaning pipeline |
| **Translation** | English Passthrough & Passthrough Fallback | **FALLBACK** | Fine-tuned IndicTrans2 Neural Machine Translation (NMT) |
| **Grievance Classification** | Boundary-Aware Keyword & Semantic Heuristic | **BASELINE** | Fine-tuned BERT / DistilBERT multi-class classifier |
| **Priority Prediction** | Urgency Triggers & Category Severity Defaults | **BASELINE** | Supervised XGBoost / Transformer Priority Classifier |
| **Department Routing** | Deterministic Category-to-Department Mapping | **IMPLEMENTED** | Graph-based multi-department routing network |

> [!NOTE]
> **Honesty & Transparency Statement:**  
> The current Phase 4 prototype uses transparent, deterministic baseline rules and light heuristic engines. Heavy transformer models (e.g., BERT/DistilBERT or IndicTrans2) are **not** performing live inference in this baseline stage to avoid fake model claims and unnecessary resource overhead prior to dataset labeling.

---

## Pipeline Execution Flow

```
[ POST /analyze ]
       │
       ▼
 1. Request Validation (Pydantic 422 check)
       │
       ▼
 2. Text Preprocessing (Sanitization & Normalization)
       │
       ▼
 3. Language Detection (langdetect + Indic Script Fallback)
       │
       ▼
 4. Translation (Passthrough / Fallback)
       │
       ▼
 5. Grievance Classification (9 Categories)
       │
       ▼
 6. Priority Prediction (LOW | MEDIUM | HIGH | CRITICAL)
       │
       ▼
 7. Department Routing (Deterministic Map)
       │
       ▼
[ JSON Response ]
```

---

## Pipeline Components Detail

### 1. Language Detection (`language_detector.py`)
- **Supported Languages:** English, Hindi (`hi`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Malayalam (`ml`), Bengali (`bn`), Gujarati (`gu`), Marathi (`mr`), Punjabi (`pa`), Urdu (`ur`), and `Unknown`.
- **Approach:** Evaluates text using `langdetect.detect_langs`. If confidence is low or script is non-Latin, applies Unicode regex pattern matching across Indic script blocks (e.g., Devanagari `U+0900–U+097F`, Tamil `U+0B80–U+0BFF`).

### 2. Preprocessing (`preprocessor.py`)
- **Sanitization:** Removes non-printable control characters (`\x00-\x1f`).
- **Normalization:** Collapses multiple tabs and spaces into single spaces while preserving paragraph breaks.
- **Data Integrity:** Preserves `original_text` intact alongside `processed_text`.

### 3. Translation Abstraction (`translator.py`)
- **English Input:** Directly returns original text (`PASSTHROUGH`).
- **Regional Languages:** In the baseline version, returns original text with a metadata fallback flag (`FALLBACK`). This architecture preserves the source text for human officers until the offline IndicTrans2 NMT model engine is loaded.

### 4. Grievance Classification (`classifier.py`)
- **Categories:**
  1. `Water Supply`
  2. `Electricity`
  3. `Roads and Transport`
  4. `Healthcare`
  5. `Education`
  6. `Sanitation`
  7. `Municipal Services`
  8. `Revenue`
  9. `Other`
- **Matching Mechanism:** Uses word-boundary-aware regex patterns across multilingual keyword dictionaries to prevent partial character substring mismatches. Confidence ratings range from `0.75` (single match) to `0.95` (multi-keyword match).

### 5. Priority Prediction (`priority_predictor.py`)
- **Levels:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Emergency Keywords:**
  - `CRITICAL`: Life-threatening hazards, electrocution risks, active structural collapses, toxic leaks.
  - `HIGH`: Outages lasting 3+ days, acute healthcare shortages, severe road hazards.
  - `MEDIUM`: Standard municipal issues, potholes, defective streetlights.
  - `LOW`: Information/documentation queries, feedback, procedural requests.

### 6. Department Routing (`department_router.py`)
- Maps the predicted category directly to the corresponding administrative department (`Water Supply`, `Electricity`, `Roads and Transport`, etc.).

---

## Verification & Test Results

The suite includes 14 unit test scenarios covering:
- English complaints across 6 distinct categories (Water, Power, Roads, Health, Education, Sanitation).
- Tamil (`ta`) and Hindi (`hi`) Indic complaints.
- Emergency `CRITICAL` priority detection.
- Information request `LOW` priority detection.
- Unclassified input (`Other` category fallback).
- Boundary validation tests (empty text `422`, exceeded length limit `422`).

**Test Execution Summary:**
- **Total Tests:** 14
- **Passed:** 14
- **Failed:** 0
- **Execution Latency:** ~0.9 seconds total (~10–25ms per request)

---

## Known Limitations & Future Roadmap

1. **Current Baseline Limitations:**
   - Keyword classifier relies on curated dictionaries; domain slang or unseen typos may fall back to `Other`.
   - Neural Machine Translation (IndicTrans2) requires GPU acceleration and is currently mocked via fallback passthrough.
2. **Phase 5 Upgrade Plan:**
   - Collect and label 1,000+ real citizen complaints.
   - Train a custom `DistilBERT-base-multilingual` classifier for automated category and priority inference.
   - Integrate `IndicTrans2` model weights for seamless Indic-to-English translation.
