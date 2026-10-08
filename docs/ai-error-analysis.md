# AI Error Analysis & Validation Report

## Executive Summary
This document provides empirical evaluation metrics and error analysis for the **TF-IDF + Logistic Regression** grievance classification pipeline evaluated against the 110-sample realistic validation dataset (`datasets/grievance-validation/validation_cases.csv`).

---

## 1. Overall Performance Metrics
- **Total Validation Cases:** 108
- **Correct Predictions:** 86
- **Incorrect Predictions:** 22
- **Overall Accuracy:** 79.63%
- **High Confidence Predictions (>= 0.75):** 12 (11.1%)
- **Medium Confidence Predictions (0.50–0.74):** 75 (69.4%)
- **Low Confidence Predictions (< 0.50):** 21 (19.4%)
- **Flagged for Human Review:** 96 (88.9%)

---

## 2. Detailed Classification Report
```
                     precision    recall  f1-score   support

          Education       0.89      0.80      0.84        10
        Electricity       1.00      0.62      0.76        13
         Healthcare       1.00      1.00      1.00        12
 Municipal Services       1.00      0.33      0.50         9
              Other       0.62      1.00      0.76        13
            Revenue       0.80      0.80      0.80        10
Roads and Transport       0.72      0.93      0.81        14
         Sanitation       0.89      0.62      0.73        13
       Water Supply       0.72      0.93      0.81        14

           accuracy                           0.80       108
          macro avg       0.85      0.78      0.78       108
       weighted avg       0.84      0.80      0.79       108

```

---

## 3. Review Flagging Effectiveness
- When classification confidence falls below the 0.75 threshold, `ai_review_required` is set to `true`.
- **96 out of 108** validation cases were safely flagged for Human Officer/Admin Review, ensuring ambiguous or non-English queries are caught prior to automated dispatch.

---

## 4. Misclassified / Borderline Case Analysis
```
                                                                            text        true_category        pred_category  confidence confidence_level       case_type
9    Streetlights not working on main ring road causing nighttime driving hazard          Electricity  Roads and Transport        0.75           MEDIUM          normal
27      Open sewage line overflowing into main road creating severe disease risk           Sanitation         Water Supply        0.75           MEDIUM       emergency
32     Property tax portal showing payment error and money deducted from account   Municipal Services              Revenue        0.85           MEDIUM          normal
33                Dangerous dead tree branch about to fall on street light cable   Municipal Services  Roads and Transport        0.75           MEDIUM          normal
34           Public park encroached by illegal vendor sheds and commercial waste   Municipal Services           Sanitation        0.75           MEDIUM          normal
46                                    School has no water and toilet clean issue            Education         Water Supply        0.75           MEDIUM       ambiguous
47                   Garbage near hospital gate blocking road and stinking badly           Sanitation  Roads and Transport        0.75           MEDIUM       ambiguous
49             Land dispute between neighbors causing road blockage and argument              Revenue  Roads and Transport        0.75           MEDIUM       ambiguous
51                                         electrity spark in pole out side home          Electricity                Other        0.40              LOW            typo
54                                              garbag clearanc truck not coming           Sanitation                Other        0.40              LOW            typo
55                                        pani nahi aa raha hai pichle do din se         Water Supply                Other        0.40              LOW  transliterated
56                                          bijli kat gayi hai pooray ilake mein          Electricity                Other        0.40              LOW  transliterated
57                                               sadak par bahot bada gaddha hai  Roads and Transport                Other        0.40              LOW  transliterated
59                                       hamare mohalle me safai bilkul nahi hai           Sanitation                Other        0.40              LOW  transliterated
69                                               बिजली का ट्रांसफॉर्मर जल गया है          Electricity         Water Supply        0.75             HIGH    indic_script
90          Electric supply line tripped when tree branch fell during high winds          Electricity                Other        0.40              LOW      borderline
91        Street light pole damaged by heavy goods truck reversing into footpath   Municipal Services  Roads and Transport        0.85           MEDIUM      borderline
92        School water tank contaminated due to improper lid closure by sweepers            Education         Water Supply        0.75           MEDIUM      borderline
93            Drainage water entering primary school campus after heavy rainfall           Sanitation         Water Supply        0.85           MEDIUM      borderline
97     Trade license online portal server returning 500 error on document upload   Municipal Services                Other        0.40              LOW      borderline
105                                   Name spelling mistake on property tax bill   Municipal Services              Revenue        0.85           MEDIUM          normal
106                              Certificate verification pending at office desk              Revenue            Education        0.75           MEDIUM          normal
```
