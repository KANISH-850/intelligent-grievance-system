# AI Model Architecture & Inference Pipeline Documentation

## 1. Overview

Phase 10 upgrades the Python FastAPI AI Microservice with a genuine Machine Learning text classification pipeline based on TF-IDF feature extraction and calibrated multi-class Logistic Regression, paired with a singleton model loader, translation provider abstraction, and hybrid priority predictor.

---

## 2. End-to-End Pipeline Flow

```
Input Citizen Grievance Text
            ↓
    Text Preprocessing
  (Whitespace & Lowercase)
            ↓
    Language Detection
  (English, Tamil, Hindi, etc.)
            ↓
  Translation Abstraction
 (Fallback / IndicTrans Stub)
            ↓
       ML Inference
 (TF-IDF + Calibrated LogisticReg)
            ↓
 Hybrid Priority Predictor
(Category Risk + Urgency Keywords)
            ↓
Deterministic Department Router
            ↓
 Structured API Response
```

---

## 3. Model Architecture Details

- **Feature Vectorizer:** `TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)`
- **Classifier Head:** `LogisticRegression(C=2.5, solver='lbfgs', max_iter=1000)`
- **Probability Calibration:** Calibrated softmax probabilities via `predict_proba`
- **Model Storage:** Saved to `ai-service/models/grievance-classifier/model.joblib`
- **Singleton Loader:** `ModelLoaderSingleton` loads model into RAM once during FastAPI startup.

---

## 4. Fallback Architecture

If `model.joblib` is missing or corrupted:
1. `model_loader.is_loaded` evaluates to `False`.
2. Microservice logs warning and seamlessly delegates inference to `grievance_classifier_service.classify(text)`.
3. The response sets `"classification_method": "rule_based_fallback"` and `"model_used": "rule_based_baseline"`.
4. API uptime remains 100% without crashing.

---

## 5. Enhanced Priority Prediction Engine

Combines:
1. **Category Base Risk Weights:** (e.g., Healthcare = 0.70, Water Supply = 0.65, Other = 0.40)
2. **Emergency Keyword Indicators:** (`fire`, `life threatening`, `death`, `collapse`, `gas leak`, `live wire`, `explosion`)
3. **High Urgency Indicators:** (`broken`, `burst`, `flooded`, `blackout`, `sewage`, `contaminated`, `spark`)
4. **Calculated Priority Levels:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` with probability confidence score.
