# Explainable AI (XAI) Documentation

## 1. Overview

Phase 11 implements Explainable AI (XAI) for the **TF-IDF + Logistic Regression** text classification pipeline.

Instead of operating as an opaque black box, the microservice calculates the exact mathematical feature contribution of each token present in the citizen's grievance query.

---

## 2. Explanation Calculation Methodology

For an input text \(T\) and predicted category \(C\):

1. **TF-IDF Vectorization:** The input text is transformed into a sparse feature vector \(X_{\text{vec}}\).
2. **Coefficient Matrix Lookup:** The Logistic Regression weight vector \(W_{C}\) corresponding to predicted class \(C\) is fetched.
3. **Feature Score Contribution:** For each active n-gram feature \(i\) present in the text:
   \[
   \text{Score}_i = X_{\text{vec}}[i] \times W_{C}[i]
   \]
4. **Ranking & Filtering:** Terms with positive contribution scores are sorted in descending order, returning the top contributing terms (`top_terms`).

---

## 3. Example XAI Response Structure

```json
{
  "category": "Water Supply",
  "category_confidence": 0.92,
  "confidence_level": "HIGH",
  "ai_review_required": false,
  "model_used": "tfidf-logistic-regression",
  "classification_method": "tfidf_logistic_regression",
  "explanation": {
    "method": "tfidf_feature_contribution",
    "top_terms": [
      "water",
      "supply",
      "pipeline"
    ]
  }
}
```

---

## 4. UI Visibility

Top contributing terms are displayed as interactive chip tags in the Citizen, Officer, and Admin grievance detail views, giving officers instant explainable visibility into why the AI assigned a specific department.
