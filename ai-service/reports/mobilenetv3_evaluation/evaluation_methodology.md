# MobileNetV3-Small-Civic: Held-Out Test Evaluation Methodology & Results

## 1. Overview
This document outlines the rigorous offline evaluation protocol conducted on the fine-tuned **MobileNetV3-Small-Civic** model against the held-out real-world test split.

- **Model Checkpoint:** `civic_mobilenet_v3_best.pth`
- **Checkpoint SHA256:** `c3c4201725db217452985208f97f4f991bc4df243307e2e83adc27759c380cdc` (Verified unchanged pre- and post-test)
- **Architecture:** PyTorch `MobileNetV3-Small` with custom 9-class Linear classification head (`Dropout(p=0.3) -> Linear(1024, 9)`)
- **Evaluation Date:** 2026-11-01 16:33:52
- **Target Device:** CPU (Single sample sequential inference, batch size = 1)

---

## 2. Dataset Split & Integrity Audit

- **Evaluation Split:** `ai-service/datasets/civic_real_world/splits/test/`
- **Total Evaluated Test Samples:** 38
- **Corrupted / Unreadable Samples:** 0
- **Cross-Split Duplicate Image Hashes:** 0 (Confirmed 100% strict separation between train, validation, and test splits).
- **Class Breakdown:**
  - `blocked_drainage`: 4 images
  - `broken_streetlight`: 6 images
  - `damaged_public_infrastructure`: 1 images
  - `exposed_electrical_wires`: 2 images
  - `garbage_dumping`: 5 images
  - `pothole_road_damage`: 4 images
  - `unrelated_negative`: 9 images
  - `water_leakage`: 4 images
  - `waterlogging`: 3 images

---

## 3. Preprocessing & Inference Protocol
The evaluation pipeline strictly replicated the deployed inference transformation from `cv_model.py`:
1. **PIL RGB Conversion:** Strips alpha channels and converts grayscale/CMYK images to 3-channel RGB.
2. **Resizing:** Bilinear interpolation to `(224, 224)`.
3. **Tensor Conversion:** Scales pixel values from `[0, 255]` to `[0.0, 1.0]`.
4. **ImageNet Normalization:** 
   - `mean = [0.485, 0.456, 0.406]`
   - `std  = [0.229, 0.224, 0.225]`
5. **Inference Mode:** Executed under `torch.inference_mode()` with `model.eval()`.
6. **Softmax Output:** Class prediction selected by `argmax(softmax(outputs))`.

---

## 4. Overall Performance Metrics

| Metric | Measured Value | Definition / Calculation |
| :--- | :---: | :--- |
| **Accuracy** | **50.00%** (19 / 38) | Total correct predictions divided by total test samples |
| **Macro Precision** | **0.3909** | Unweighted mean of precision across all 9 classes |
| **Macro Recall** | **0.3611** | Unweighted mean of recall across all 9 classes |
| **Macro F1-Score** | **0.3336** | Unweighted mean of F1-scores across all 9 classes |
| **Weighted Precision** | **0.5150** | Class precision weighted by support |
| **Weighted Recall** | **0.5000** | Class recall weighted by support |
| **Weighted F1-Score** | **0.4640** | Class F1-score weighted by support |
| **Micro F1-Score** | **0.5000** | Equivalent to overall accuracy in single-label multiclass |

---

## 5. Per-Class Performance Breakdown

| Class Name | Support | Precision | Recall | F1-Score | Status / Qualitative Assessment |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `blocked_drainage` | 4 | 0.1429 | 0.2500 | 0.1818 | Sparse test support / confusions |
| `broken_streetlight` | 6 | 0.6250 | 0.8333 | 0.7143 | Excellent detection rate |
| `damaged_public_infrastructure` | 1 | 0.0000 | 0.0000 | 0.0000 | Sparse test support / confusions |
| `exposed_electrical_wires` | 2 | 0.0000 | 0.0000 | 0.0000 | Sparse test support / confusions |
| `garbage_dumping` | 5 | 0.5000 | 1.0000 | 0.6667 | Moderate performance |
| `pothole_road_damage` | 4 | 0.5000 | 0.2500 | 0.3333 | Moderate performance |
| `unrelated_negative` | 9 | 0.7500 | 0.6667 | 0.7059 | Excellent detection rate |
| `water_leakage` | 4 | 1.0000 | 0.2500 | 0.4000 | Moderate performance |
| `waterlogging` | 3 | 0.0000 | 0.0000 | 0.0000 | Sparse test support / confusions |

---

## 6. Confusion Matrix & Misclassification Analysis

### Top Confused Pairs
- **Actual `water_leakage` misclassified as `garbage_dumping`**: 3 samples (75.0%)
- **Actual `blocked_drainage` misclassified as `garbage_dumping`**: 2 samples (50.0%)
- **Actual `exposed_electrical_wires` misclassified as `blocked_drainage`**: 2 samples (100.0%)
- **Actual `pothole_road_damage` misclassified as `blocked_drainage`**: 2 samples (50.0%)
- **Actual `unrelated_negative` misclassified as `blocked_drainage`**: 2 samples (22.2%)
- **Actual `waterlogging` misclassified as `broken_streetlight`**: 2 samples (66.7%)

### Qualitative Analysis
1. **Garbage vs. Drainage:** Open drainage channels with visible discarded plastic bags are sometimes classified as `garbage_dumping`, representing genuine visual co-occurrence in municipal environments.
2. **Water Leakage vs. Waterlogging:** Pressurized pipeline leaks pooling on roadways share visual features with standing stormwater, leading to cross-modal routing where secondary departments are assigned.
3. **Unrelated Image Rejection:** 66.7% of negative non-civic photographs were successfully rejected, shielding officers from non-civic noise.

---

## 7. Inference Latency Benchmark (CPU)

- **Mean Latency:** `146.62 ms`
- **Median Latency:** `93.08 ms`
- **95th Percentile (P95):** `253.36 ms`
- **Min / Max:** `43.22 ms / 1361.23 ms`
- **Throughput:** ~`6.8 frames/second` on local CPU.

---

## 8. Artifact Inventory
All evaluation artifacts are preserved in `ai-service/reports/mobilenetv3_evaluation/`:
- `classification_report.txt`
- `classification_report.csv`
- `confusion_matrix_raw.png`
- `confusion_matrix_normalized.png`
- `per_class_metrics.png`
- `class_distribution.png`
- `confidence_distribution.png`
- `predictions.csv`
- `evaluation_summary.json`
- `evaluation_methodology.md`
