import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from typing import Dict, Any
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

from app.services.ml.classifier import ml_grievance_classifier

def run_error_analysis():
    print("=" * 60)
    print("PHASE 11 — REALISTIC AI VALIDATION & ERROR ANALYSIS")
    print("=" * 60)

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    val_csv_path = os.path.join(base_dir, "datasets", "grievance-validation", "validation_cases.csv")
    doc_out_path = os.path.join(base_dir, "docs", "ai-error-analysis.md")

    if not os.path.exists(val_csv_path):
        raise FileNotFoundError(f"Validation dataset not found at {val_csv_path}")

    print(f"Loading validation cases from: {val_csv_path}")
    df = pd.read_csv(val_csv_path)

    results = []
    correct_count = 0
    incorrect_count = 0
    review_required_count = 0
    high_conf_count = 0
    med_conf_count = 0
    low_conf_count = 0

    print(f"Evaluating {len(df)} validation cases through ML Classifier...")

    for idx, row in df.iterrows():
        text = str(row["text"])
        true_category = str(row["category"])
        case_type = str(row.get("case_type", "normal"))

        res = ml_grievance_classifier.classify(text)
        pred_category = res["category"]
        conf = res["category_confidence"]
        conf_level = res.get("confidence_level", "HIGH")
        review_req = res.get("ai_review_required", False)
        terms = res.get("explanation", {}).get("top_terms", [])

        is_correct = (pred_category == true_category)

        if is_correct:
            correct_count += 1
        else:
            incorrect_count += 1

        if review_req:
            review_required_count += 1

        if conf_level == "HIGH":
            high_conf_count += 1
        elif conf_level == "MEDIUM":
            med_conf_count += 1
        else:
            low_conf_count += 1

        results.append({
            "text": text,
            "true_category": true_category,
            "pred_category": pred_category,
            "confidence": conf,
            "confidence_level": conf_level,
            "review_required": review_req,
            "is_correct": is_correct,
            "case_type": case_type,
            "top_terms": ", ".join(terms)
        })

    res_df = pd.DataFrame(results)

    acc = accuracy_score(res_df["true_category"], res_df["pred_category"])
    
    print("\n------------------------------------------------------------")
    print("VALIDATION SUMMARY METRICS")
    print("------------------------------------------------------------")
    print(f"Total Validation Cases       : {len(df)}")
    print(f"Correct Predictions         : {correct_count}")
    print(f"Incorrect Predictions       : {incorrect_count}")
    print(f"Accuracy Rate               : {acc * 100:.2f}%")
    print(f"High Confidence predictions : {high_conf_count}")
    print(f"Medium Confidence predictions: {med_conf_count}")
    print(f"Low Confidence predictions  : {low_conf_count}")
    print(f"Human Review Flagged        : {review_required_count} ({review_required_count / len(df) * 100:.1f}%)")
    print("------------------------------------------------------------\n")

    report_str = classification_report(res_df["true_category"], res_df["pred_category"], zero_division=0)
    print("DETAILED CLASSIFICATION REPORT:")
    print(report_str)

    # Common confusion pairs
    mismatches = res_df[res_df["is_correct"] == False]
    
    # Save report to docs/ai-error-analysis.md
    with open(doc_out_path, "w", encoding="utf-8") as f:
        f.write(f"""# AI Error Analysis & Validation Report

## Executive Summary
This document provides empirical evaluation metrics and error analysis for the **TF-IDF + Logistic Regression** grievance classification pipeline evaluated against the 110-sample realistic validation dataset (`datasets/grievance-validation/validation_cases.csv`).

---

## 1. Overall Performance Metrics
- **Total Validation Cases:** {len(df)}
- **Correct Predictions:** {correct_count}
- **Incorrect Predictions:** {incorrect_count}
- **Overall Accuracy:** {acc * 100:.2f}%
- **High Confidence Predictions (>= 0.75):** {high_conf_count} ({high_conf_count / len(df) * 100:.1f}%)
- **Medium Confidence Predictions (0.50–0.74):** {med_conf_count} ({med_conf_count / len(df) * 100:.1f}%)
- **Low Confidence Predictions (< 0.50):** {low_conf_count} ({low_conf_count / len(df) * 100:.1f}%)
- **Flagged for Human Review:** {review_required_count} ({review_required_count / len(df) * 100:.1f}%)

---

## 2. Detailed Classification Report
```
{report_str}
```

---

## 3. Review Flagging Effectiveness
- When classification confidence falls below the 0.75 threshold, `ai_review_required` is set to `true`.
- **{review_required_count} out of {len(df)}** validation cases were safely flagged for Human Officer/Admin Review, ensuring ambiguous or non-English queries are caught prior to automated dispatch.

---

## 4. Misclassified / Borderline Case Analysis
```
{mismatches[['text', 'true_category', 'pred_category', 'confidence', 'confidence_level', 'case_type']].to_string()}
```
""")

    print(f"\nSaved Error Analysis report to: {doc_out_path}")
    print("=" * 60)

if __name__ == "__main__":
    run_error_analysis()
