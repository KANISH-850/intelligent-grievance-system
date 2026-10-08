# AI Grievance Classifier Evaluation Report

## Executive Summary
This report summarizes the empirical performance metrics for the **TF-IDF + Calibrated Logistic Regression** ML model on the held-out test dataset (102 samples).

## Performance Summary Metrics
- **Test Dataset Size:** 102 samples
- **Accuracy:** 100.00%
- **Weighted Precision:** 100.00%
- **Weighted Recall:** 100.00%
- **Weighted F1-Score:** 100.00%

## Detailed Classification Report
```
                     precision    recall  f1-score   support

          Education       1.00      1.00      1.00        10
        Electricity       1.00      1.00      1.00        12
         Healthcare       1.00      1.00      1.00        11
 Municipal Services       1.00      1.00      1.00        19
              Other       1.00      1.00      1.00         7
            Revenue       1.00      1.00      1.00         8
Roads and Transport       1.00      1.00      1.00        11
         Sanitation       1.00      1.00      1.00        11
       Water Supply       1.00      1.00      1.00        13

           accuracy                           1.00       102
          macro avg       1.00      1.00      1.00       102
       weighted avg       1.00      1.00      1.00       102

```

## Confusion Matrix
```
                     Education  Electricity  Healthcare  Municipal Services  Other  Revenue  Roads and Transport  Sanitation  Water Supply
Education                   10            0           0                   0      0        0                    0           0             0
Electricity                  0           12           0                   0      0        0                    0           0             0
Healthcare                   0            0          11                   0      0        0                    0           0             0
Municipal Services           0            0           0                  19      0        0                    0           0             0
Other                        0            0           0                   0      7        0                    0           0             0
Revenue                      0            0           0                   0      0        8                    0           0             0
Roads and Transport          0            0           0                   0      0        0                   11           0             0
Sanitation                   0            0           0                   0      0        0                    0          11             0
Water Supply                 0            0           0                   0      0        0                    0           0            13
```
