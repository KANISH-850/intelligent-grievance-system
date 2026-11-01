"""
Civic Infrastructure CV Model Evaluation on Held-Out Real Photographs
Computes accuracy, precision, recall, F1, confusion matrix, per-class metrics,
inference latency, and rejection performance on completely unseen test photographs.
"""
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("evaluate_cv_model")

BASE_DIR = Path(__file__).resolve().parent.parent
SPLITS_DIR = BASE_DIR / "datasets" / "civic_real_world" / "splits"
MODELS_DIR = BASE_DIR / "models"


def load_model(checkpoint_path: Path, num_classes: int, device: torch.device) -> Tuple[nn.Module, List[str]]:
    """Load MobileNetV3 checkpoint with trained civic weights."""
    checkpoint = torch.load(checkpoint_path, map_location=device)
    class_names = checkpoint.get("class_names", [])

    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes),
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()
    return model, class_names


def main():
    logger.info("Initializing CV Model Held-Out Test Evaluation...")
    device = torch.device("cpu")  # Strictly benchmark on CPU per deployment environment

    best_checkpoint = MODELS_DIR / "civic_mobilenet_v3_best.pth"
    if not best_checkpoint.exists():
        best_checkpoint = MODELS_DIR / "civic_mobilenet_v3.pth"

    if not best_checkpoint.exists():
        logger.error("No model checkpoint found! Train model first.")
        return

    test_dir = SPLITS_DIR / "test"
    test_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    test_dataset = datasets.ImageFolder(test_dir, transform=test_transforms)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)

    class_names = test_dataset.classes
    model, _ = load_model(best_checkpoint, num_classes=len(class_names), device=device)

    all_preds: List[int] = []
    all_targets: List[int] = []
    all_probs: List[float] = []
    inference_times_ms: List[float] = []
    detailed_cases: List[Dict] = []

    logger.info(f"Evaluating {len(test_dataset)} unseen test photographs...")

    with torch.no_grad():
        for i, (inputs, targets) in enumerate(test_loader):
            img_path, target_idx = test_dataset.samples[i]
            filename = Path(img_path).name

            start_t = time.perf_counter()
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            pred_conf, pred_idx = torch.max(probs, dim=1)
            latency_ms = (time.perf_counter() - start_t) * 1000.0

            pred_val = pred_idx.item()
            target_val = targets.item()
            conf_val = float(pred_conf.item())

            all_preds.append(pred_val)
            all_targets.append(target_val)
            all_probs.append(conf_val)
            inference_times_ms.append(latency_ms)

            detailed_cases.append({
                "image_id": filename,
                "actual_class": class_names[target_val],
                "predicted_class": class_names[pred_val],
                "confidence": round(conf_val, 4),
                "correct": bool(pred_val == target_val),
                "inference_time_ms": round(latency_ms, 2),
            })

    # Global Metrics
    acc = accuracy_score(all_targets, all_preds)
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average="macro", zero_division=0)
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average="weighted", zero_division=0)

    # Per-Class Metrics
    per_class_p, per_class_r, per_class_f1, per_class_support = precision_recall_fscore_support(
        all_targets, all_preds, average=None, zero_division=0
    )

    per_class_report = {}
    for idx, cname in enumerate(class_names):
        per_class_report[cname] = {
            "precision": round(float(per_class_p[idx]), 4),
            "recall": round(float(per_class_r[idx]), 4),
            "f1_score": round(float(per_class_f1[idx]), 4),
            "support": int(per_class_support[idx]),
        }

    # Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds).tolist()

    # Rejection performance on unrelated_negative
    unrelated_idx = class_names.index("unrelated_negative") if "unrelated_negative" in class_names else -1
    if unrelated_idx >= 0:
        unrelated_total = sum(1 for t in all_targets if t == unrelated_idx)
        unrelated_correct = sum(1 for t, p in zip(all_targets, all_preds) if t == unrelated_idx and p == unrelated_idx)
        false_positive_civic = unrelated_total - unrelated_correct
        fp_rate = (false_positive_civic / unrelated_total) if unrelated_total > 0 else 0.0
    else:
        unrelated_total = 0
        unrelated_correct = 0
        fp_rate = 0.0

    avg_latency = float(np.mean(inference_times_ms))
    p95_latency = float(np.percentile(inference_times_ms, 95))

    logger.info("=== HELD-OUT TEST EVALUATION RESULTS ===")
    logger.info(f"Accuracy: {acc:.4f}")
    logger.info(f"Macro Precision: {macro_p:.4f} | Recall: {macro_r:.4f} | F1: {macro_f1:.4f}")
    logger.info(f"Average CPU Latency: {avg_latency:.2f} ms (p95: {p95_latency:.2f} ms)")
    logger.info(f"Unrelated Negative Rejection Rate: {(unrelated_correct/unrelated_total*100) if unrelated_total else 0:.1f}%")

    report = {
        "evaluation_dataset": "civic_real_world/splits/test",
        "total_test_samples": len(test_dataset),
        "overall_metrics": {
            "accuracy": round(float(acc), 4),
            "macro_precision": round(float(macro_p), 4),
            "macro_recall": round(float(macro_r), 4),
            "macro_f1": round(float(macro_f1), 4),
            "weighted_f1": round(float(weighted_f1), 4),
        },
        "performance_latency": {
            "device": "CPU",
            "avg_latency_ms": round(avg_latency, 2),
            "p95_latency_ms": round(p95_latency, 2),
            "min_latency_ms": round(float(np.min(inference_times_ms)), 2),
            "max_latency_ms": round(float(np.max(inference_times_ms)), 2),
        },
        "unrelated_rejection": {
            "unrelated_samples": unrelated_total,
            "correctly_rejected": unrelated_correct,
            "false_positive_rate": round(fp_rate, 4),
        },
        "per_class_metrics": per_class_report,
        "classes": class_names,
        "confusion_matrix": cm,
        "test_cases": detailed_cases,
    }

    report_path = MODELS_DIR / "evaluation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info(f"Evaluation report successfully saved to {report_path}")


if __name__ == "__main__":
    main()
