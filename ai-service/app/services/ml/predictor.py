import re
from typing import Dict, Any

EMERGENCY_KEYWORDS = [
    r"\bfire\b", r"\blife[\s-]*threatening\b", r"\bdeath\b", r"\bdeadly\b",
    r"\baccident\b", r"\bemergency\b", r"\bsevere[\s-]*injury\b", r"\bcollapse\b",
    r"\bgas[\s-]*leak\b", r"\blive[\s-]*wire\b", r"\bexplosion\b", r"\bepidemic\b",
    r"\boutbreak\b", r"\btoxic\b", r"\bcasualty\b", r"\bpoison\b"
]

HIGH_URGENCY_KEYWORDS = [
    r"\bbroken\b", r"\bburst\b", r"\bflooded\b", r"\bno water\b", r"\bno power\b",
    r"\bblackout\b", r"\bsewage\b", r"\bcontaminated\b", r"\bdangerous\b", r"\bspark\b"
]

CATEGORY_BASE_RISK = {
    "Healthcare": 0.70,
    "Water Supply": 0.65,
    "Electricity": 0.65,
    "Sanitation": 0.60,
    "Roads and Transport": 0.55,
    "Education": 0.50,
    "Revenue": 0.45,
    "Municipal Services": 0.45,
    "Other": 0.40
}

class MLPriorityPredictor:
    """
    Hybrid Priority Prediction Engine.
    Combines text category risk, keyword urgency indicators, and emergency signals.
    """

    def predict_priority(self, text: str, category: str) -> Dict[str, Any]:
        text_lower = text.lower()

        # Check for emergency signals
        emergency_matches = [kw for kw in EMERGENCY_KEYWORDS if re.search(kw, text_lower)]
        high_matches = [kw for kw in HIGH_URGENCY_KEYWORDS if re.search(kw, text_lower)]

        base_risk = CATEGORY_BASE_RISK.get(category, 0.45)
        
        # Calculate dynamic urgency score
        urgency_score = base_risk + (len(emergency_matches) * 0.35) + (len(high_matches) * 0.15)

        if emergency_matches or urgency_score >= 0.95:
            priority = "CRITICAL"
            confidence = min(0.98, 0.85 + (len(emergency_matches) * 0.05))
        elif urgency_score >= 0.70:
            priority = "HIGH"
            confidence = min(0.92, 0.75 + (len(high_matches) * 0.05))
        elif urgency_score >= 0.50:
            priority = "MEDIUM"
            confidence = 0.80
        else:
            priority = "LOW"
            confidence = 0.85

        return {
            "priority": priority,
            "priority_confidence": round(confidence, 2)
        }

ml_priority_predictor = MLPriorityPredictor()
