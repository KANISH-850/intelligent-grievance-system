# Grievance Validation & Error Analysis Dataset

## Overview

This dataset contains **110 curated academic synthetic grievance test cases** created specifically to validate AI model performance, confidence thresholding, low-confidence human review flagging, error analysis, and edge case handling for the **Intelligent Multilingual Grievance Categorization and Automated Dispatch Framework for Central Government Portals**.

All records are explicitly designated as academic synthetic demo validation data.

---

## Dataset Characteristics & Coverage

The 110 cases span all 9 official government categories across 12 distinct case types:

1. **Normal Complaints:** Clear, well-formed single-domain complaints.
2. **Ambiguous Complaints:** Complaints touching multiple categories (e.g., water + electricity).
3. **Short Complaints:** Brief 2–4 word queries (e.g., "No water").
4. **Long Complaints:** Detailed multi-sentence descriptions.
5. **Typo / Misspelled Complaints:** Text with spelling mistakes (e.g., "watr not comin").
6. **Transliterated Indian Languages:** Hinglish/Tamil-English transliterations (e.g., "pani nahi aa raha hai").
7. **Indic Script Complaints:** Native Hindi, Tamil, and regional scripts.
8. **Emergency Complaints:** Critical life-threatening events (e.g., "Gas leak and fire").
9. **Borderline Category Cases:** Complaints lying on the boundary of two departments.
10. **Unrelated Complaints:** Out-of-domain queries (e.g., "The quick brown fox").
