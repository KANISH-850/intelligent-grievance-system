import os
import json
import joblib
import pandas as pd
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support, confusion_matrix

def evaluate_model():
    print("=" * 60)
    print("PHASE 10 — MODEL EVALUATION ON HELD-OUT TEST SET")
    print("=" * 60)

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    dataset_dir = os.path.join(base_dir, "datasets", "grievance-classification")
    test_path = os.path.join(dataset_dir, "test.csv")
    model_dir = os.path.join(base_dir, "ai-service", "models", "grievance-classifier")
    model_file = os.path.join(model_dir, "model.joblib")

    if not os.path.exists(model_file):
        raise FileNotFoundError(f"Model file not found at {model_file}. Run train_classifier.py first.")

    print(f"Loading test dataset: {test_path}")
    test_df = pd.read_csv(test_path)
    X_test = test_df["text"]
    y_test = test_df["category"]

    print(f"Loading trained ML pipeline: {model_file}")
    pipeline = joblib.load(model_file)

    print(f"Evaluating {len(X_test)} test samples...")
    test_preds = pipeline.predict(X_test)

    acc = accuracy_score(y_test, test_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, test_preds, average="weighted")

    print("\n------------------------------------------------------------")
    print("CLASSIFICATION EVALUATION METRICS (TEST SET)")
    print("------------------------------------------------------------")
    print(f"Accuracy : {acc * 100:.2f}%")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall   : {recall * 100:.2f}%")
    print(f"F1 Score : {f1 * 100:.2f}%")
    print("------------------------------------------------------------\n")

    print("PER-CLASS PERFORMANCE REPORT:")
    report = classification_report(y_test, test_preds)
    print(report)

    cm = confusion_matrix(y_test, test_preds, labels=pipeline.classes_)
    cm_df = pd.DataFrame(cm, index=pipeline.classes_, columns=pipeline.classes_)
    
    print("\nCONFUSION MATRIX:")
    print(cm_df.to_string())

    # Save evaluation report to docs/
    eval_doc_path = os.path.join(base_dir, "docs", "model-evaluation.md")
    os.makedirs(os.path.dirname(eval_doc_path), exist_ok=True)
    
    with open(eval_doc_path, "w", encoding="utf-8") as f:
        f.write(f"""# AI Grievance Classifier Evaluation Report

## Executive Summary
This report summarizes the empirical performance metrics for the **TF-IDF + Calibrated Logistic Regression** ML model on the held-out test dataset ({len(X_test)} samples).

## Performance Summary Metrics
- **Test Dataset Size:** {len(X_test)} samples
- **Accuracy:** {acc * 100:.2f}%
- **Weighted Precision:** {precision * 100:.2f}%
- **Weighted Recall:** {recall * 100:.2f}%
- **Weighted F1-Score:** {f1 * 100:.2f}%

## Detailed Classification Report
```
{report}
```

## Confusion Matrix
```
{cm_df.to_string()}
```
""")

    print(f"\nEvaluation summary saved to: {eval_doc_path}")
    print("=" * 60)

if __name__ == "__main__":
    evaluate_model()
