# AI & Machine Learning Pipeline Deep-Dive Guide

**Project Title:** Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework  
**Primary Source Code:** `ai-service/app/services/ml/classifier.py`, `ai-service/scripts/train_classifier.py`  

---

## 1. Complete AI Execution Pipeline Flow

When a citizen submits a complaint text, it passes sequentially through the 9-stage pipeline implemented in the FastAPI microservice:

```text
  [ Raw Grievance Text Input ]
               │
               ▼
  [ 1. Language Detection ] ─────────────> (ISO Code: en, hi, ta, te, etc.)
               │
               ▼
  [ 2. Text Normalization ] ─────────────> (Lowercasing, noise removal, tokenization)
               │
               ▼
  [ 3. TF-IDF Feature Extraction ] ──────> (5000 n-gram vector, unigrams & bigrams)
               │
               ▼
  [ 4. Logistic Regression Inference ] ──> (Softmax logits across 9 categories)
               │
               ▼
  [ 5. Category & Confidence Score ] ────> (Best class + confidence probability)
               │
               ▼
  [ 6. Department Mapping ] ─────────────> (Maps category string to Department code)
               │
               ▼
  [ 7. Priority & Urgency Prediction ] ──> (Keyword severity + SLA assignment)
               │
               ▼
  [ 8. Human Review & XAI Calculation ] ─> (Confidence threshold check & token contributions)
               │
               ▼
  [ 9. PostgreSQL Database Storage ] ────> (Saved via Express API Gateway & Prisma ORM)
```

- **Source Code Verification**: `ai-service/app/services/ml/classifier.py` line 76 (`MLGrievanceClassifier.classify()`).

---

## 2. Fully Worked Grievance Walkthrough Example

Let's trace a concrete complaint step by step through the exact code execution logic.

### Input Complaint Text:
> `"Major pipeline rupture near Sector 4 causing dirty water contamination and heavy leakage for 2 days."`

### Step 1: Language Detection
- Executed by `language_detector_service.detect_language()` (`language_detector.py`).
- Output: `{ "language": "English", "confidence": 0.99 }`.

### Step 2: Text Normalization
- Executed by `app/services/preprocessor.py`.
- Lowercased, noise stripped.
- Clean tokens: `['major', 'pipeline', 'rupture', 'sector', 'dirty', 'water', 'contamination', 'heavy', 'leakage', 'days']`.

### Step 3: TF-IDF Feature Extraction
- Vectorizer: `TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)`.
- Extracted matching n-grams: `pipeline`, `water`, `contamination`, `leakage`, `water contamination`, `pipeline rupture`.
- Generates a 5,000-dimensional sparse feature vector $\mathbf{x}$.

### Step 4: Logistic Regression Inference & Softmax Logits
- Model: `LogisticRegression(C=2.5, solver="lbfgs")` loaded from `models/grievance-classifier/model.joblib`.
- Linear Logits Calculation: $z_k = \mathbf{w}_k \cdot \mathbf{x} + b_k$ for each of the 9 categories.
- Softmax Probability Distribution:

| Category Class | Computed Probability $P(y = k \mid \mathbf{x})$ |
|---|---|
| **Water Supply** | **0.885 (88.5%)** ◄ *WINNER* |
| Sanitation | 0.045 (4.5%) |
| Municipal Services | 0.030 (3.0%) |
| Healthcare | 0.015 (1.5%) |
| Roads and Transport | 0.010 (1.0%) |
| Electricity / Education / Revenue / Other | < 0.015 (< 1.5%) |

### Step 5: Confidence Thresholding & Human Review Flag
- Predicted Category: `Water Supply`
- Confidence Score: `0.88` (88%)
- Code Evaluation (`classifier.py` line 147):
  - Threshold `AI_CONFIDENCE_THRESHOLD = 0.75`
  - Since `0.88 >= 0.75`, `confidence_level` is set to `"HIGH"` and `ai_review_required` is set to `False`.

### Step 6: Explainable AI (XAI) Token Contribution Calculation
- Executed by `extract_explanation_terms()` (`classifier.py` line 16).
- Token Score = $\text{TF-IDF}(t) \times w_{\text{Water Supply}}(t)$.

| Extracted Token | TF-IDF Value | Logistic Regression Weight $w$ | Token Contribution Score |
|---|---|---|---|
| `pipeline` | 0.45 | +3.20 | +1.440 (Top 1) |
| `water` | 0.40 | +2.95 | +1.180 (Top 2) |
| `leakage` | 0.38 | +2.50 | +0.950 (Top 3) |
| `contamination` | 0.35 | +2.10 | +0.735 (Top 4) |

- Returned `explanation_terms`: `['pipeline', 'water', 'leakage', 'contamination']`.

### Step 7: Priority & SLA Target Prediction
- Executed by `priority_predictor_service.predict_priority()` (`priority_predictor.py`).
- Scans text for urgency keywords: `"rupture"`, `"contamination"`, `"leakage"`.
- Priority Level assigned: `"HIGH"` (SLA deadline: 24 hours).

### Step 8: Department Mapping
- Department Router maps `Water Supply` to Department Code `WS` (Department ID in PostgreSQL).

---

## 3. Mathematical Intuition of Key Algorithms

### 3.1 TF-IDF (Term Frequency - Inverse Document Frequency)
$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)$$

- **Sublinear Term Frequency**:
  $$\text{TF}(t, d) = 1 + \log(\text{count}(t, d)) \quad \text{if count} > 0$$
- **Inverse Document Frequency**:
  $$\text{IDF}(t, D) = \log\left(\frac{N}{|\{d \in D : t \in d\}|}\right) + 1$$
- **Intuition**: Words that appear frequently in a specific complaint (high TF) but rarely across other complaints (high IDF) receive maximum weights.

### 3.2 Logistic Regression & Softmax Function
For a multi-class problem with $K = 9$ classes:
$$P(y = k \mid \mathbf{x}) = \frac{\exp(\mathbf{w}_k \cdot \mathbf{x} + b_k)}{\sum_{j=1}^{K} \exp(\mathbf{w}_j \cdot \mathbf{x} + b_j)}$$

- **Intuition**: Computes a weighted sum of TF-IDF feature values for each category. The Softmax function exponentiates and normalizes logit scores into a valid probability distribution where $\sum P = 1.0$.

---

## 4. Evaluation Metrics & Formulas

$$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

$$\text{Precision} = \frac{TP}{TP + FP}$$

$$\text{Recall} = \frac{TP}{TP + FN}$$

$$\text{F1-Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

---

## 5. Dataset Metrics & Ground-Truth Specifications

Verified from `datasets/grievance-classification/README.md` and `scripts/train_classifier.py`:

- **Dataset Type**: Academic Synthetic Dataset (`is_synthetic=True`)
- **Total Samples**: 675 samples
- **Split Ratio**: 70% Train (472), 15% Validation (101), 15% Test (102)
- **Random Seed**: 42
- **Trained Model Artifact**: `ai-service/models/grievance-classifier/model.joblib`
- **Metadata Config Artifact**: `ai-service/models/grievance-classifier/config.json`

---

## 6. What Model Confidence Means and Does Not Mean

- **What it means**: Model confidence ($\hat{P}$) is the Softmax probability output computed by the Logistic Regression classifier based on the learned linear decision boundaries.
- **What it DOES NOT mean**: Model confidence is NOT a guarantee of real-world truth. Probabilistic models can return high confidence on out-of-domain text if certain learned features happen to appear. This is why our system incorporates **human-in-the-loop review thresholds** and **administrator correction workflows**.
