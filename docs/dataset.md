# Grievance Classification Dataset Documentation

## 1. Dataset Overview

This dataset consists of 675 curated academic synthetic citizen grievances spanning 9 standardized government department categories and 4 priority levels.

All records are explicitly designated as academic synthetic data (`is_synthetic=True`) created for the **Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals**.

---

## 2. Dataset Split & Parameters

- **Total Samples:** 675
- **Train Set (70%):** 472 samples (`datasets/grievance-classification/train.csv`)
- **Validation Set (15%):** 101 samples (`datasets/grievance-classification/validation.csv`)
- **Test Set (15%):** 102 samples (`datasets/grievance-classification/test.csv`)
- **Random Seed:** `42` (Fixed split reproducibility)

---

## 3. Categories & Class Distribution

| Category Name | Full Dataset Count | Train Count | Validation Count | Test Count |
|---|---|---|---|---|
| Water Supply | 75 | 57 | 5 | 13 |
| Electricity | 75 | 52 | 11 | 12 |
| Roads and Transport | 75 | 51 | 13 | 11 |
| Healthcare | 75 | 52 | 12 | 11 |
| Education | 75 | 57 | 8 | 10 |
| Sanitation | 75 | 51 | 13 | 11 |
| Municipal Services | 75 | 45 | 11 | 19 |
| Revenue | 75 | 50 | 17 | 8 |
| Other | 75 | 57 | 11 | 7 |
| **Total** | **675** | **472** | **101** | **102** |

---

## 4. Priority Distribution

- **LOW:** 206 samples
- **MEDIUM:** 165 samples
- **HIGH:** 179 samples
- **CRITICAL:** 125 samples

---

## 5. Preprocessing & Normalization

1. Whitespace contraction (`re.sub(r'\s+', ' ', text)`)
2. Lowercase conversion & token normalization
3. Null & empty string filter
4. Categorical label validation
