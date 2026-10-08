import os
import json
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support

def train_model():
    print("=" * 60)
    print("PHASE 10 — TRANSFORMER / ML MODEL TRAINING")
    print("=" * 60)

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    dataset_dir = os.path.join(base_dir, "datasets", "grievance-classification")
    train_path = os.path.join(dataset_dir, "train.csv")
    val_path = os.path.join(dataset_dir, "validation.csv")
    model_dir = os.path.join(base_dir, "ai-service", "models", "grievance-classifier")

    os.makedirs(model_dir, exist_ok=True)

    print(f"Loading training data from: {train_path}")
    train_df = pd.read_csv(train_path)
    print(f"Loading validation data from: {val_path}")
    val_df = pd.read_csv(val_path)

    X_train = train_df["text"]
    y_train = train_df["category"]
    X_val = val_df["text"]
    y_val = val_df["category"]

    print(f"Training set size: {len(X_train)} samples")
    print(f"Validation set size: {len(X_val)} samples")

    print("\nBuilding TF-IDF + Calibrated Logistic Regression ML Pipeline...")
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
            lowercase=True
        )),
        ("classifier", LogisticRegression(
            C=2.5,
            max_iter=1000,
            solver="lbfgs",
            random_state=42
        ))
    ])

    print("Fitting model pipeline on training data...")
    pipeline.fit(X_train, y_train)

    print("\nEvaluating model on validation set...")
    val_preds = pipeline.predict(X_val)

    acc = accuracy_score(y_val, val_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(y_val, val_preds, average="weighted")

    print(f"Validation Accuracy : {acc * 100:.2f}%")
    print(f"Validation Precision: {precision * 100:.2f}%")
    print(f"Validation Recall   : {recall * 100:.2f}%")
    print(f"Validation F1-Score : {f1 * 100:.2f}%")

    print("\nDetailed Classification Report (Validation):")
    print(classification_report(y_val, val_preds))

    # Save model pipeline artifact
    model_file = os.path.join(model_dir, "model.joblib")
    joblib.dump(pipeline, model_file)
    print(f"Saved trained pipeline to: {model_file}")

    # Save configuration & metrics JSON metadata
    config_file = os.path.join(model_dir, "config.json")
    config = {
        "model_type": "tfidf-logistic-regression",
        "vectorizer": "TfidfVectorizer(ngram_range=(1,2), max_features=5000)",
        "classifier": "LogisticRegression(C=2.5)",
        "categories": list(pipeline.classes_),
        "num_categories": len(pipeline.classes_),
        "validation_metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4)
        }
    }

    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    print(f"Saved metadata config to: {config_file}")
    print("=" * 60)

if __name__ == "__main__":
    train_model()
