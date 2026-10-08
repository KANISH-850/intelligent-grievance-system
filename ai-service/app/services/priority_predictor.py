import re
from typing import Dict, Any

# Urgency and severity keyword triggers
CRITICAL_KEYWORDS = [
    "life threatening", "emergency", "severe injury", "public danger", "explosion",
    "electric shock", "electrocution", "toxic", "poisonous", "casualty", "death",
    "collapse", "fire hazard", "gushing sewer", "live wire", "flooding inside home",
    "அவசரம்", "உயிர் ஆபத்து", "आपातकालीन", "जान का खतरा"
]

HIGH_KEYWORDS = [
    "three days", "3 days", "four days", "4 days", "week", "several days", "no water",
    "total blackout", "outage", "major leak", "hospital emergency", "severe road hazard",
    "overflowing drain", "contaminated water", "no power", "24 hours", "48 hours",
    "மூன்று நாட்கள்", "दोन दिन से", "तीन दिन से"
]

LOW_KEYWORDS = [
    "information request", "inquiry", "how to apply", "procedure", "general request",
    "suggestion", "feedback", "minor", "guidance", "certificate application"
]

class PriorityPredictorService:
    """
    Priority Predictor Service.
    Component Status: BASELINE (Rule-Based Urgency & Severity Pattern Matching).
    
    Future Roadmap:
    Can be upgraded to trained supervised classification model (XGBoost/DistilBERT).
    """

    def predict_priority(self, text: str, category: str) -> Dict[str, Any]:
        """
        Predicts priority level (LOW, MEDIUM, HIGH, CRITICAL) and confidence.
        """
        if not text:
            return {
                "priority": "MEDIUM",
                "priority_confidence": 0.50,
                "is_baseline": True,
                "method": "BASELINE (Default Fallback)"
            }

        text_lower = text.lower()

        # 1. Check CRITICAL triggers
        for kw in CRITICAL_KEYWORDS:
            if kw in text_lower:
                return {
                    "priority": "CRITICAL",
                    "priority_confidence": 0.90,
                    "is_baseline": True,
                    "method": "BASELINE (Critical Urgency Keyword Match)"
                }

        # 2. Check HIGH triggers
        for kw in HIGH_KEYWORDS:
            if kw in text_lower:
                return {
                    "priority": "HIGH",
                    "priority_confidence": 0.85,
                    "is_baseline": True,
                    "method": "BASELINE (High Urgency Keyword Match)"
                }

        # 3. Check LOW triggers
        for kw in LOW_KEYWORDS:
            if kw in text_lower:
                return {
                    "priority": "LOW",
                    "priority_confidence": 0.80,
                    "is_baseline": True,
                    "method": "BASELINE (Low Urgency Keyword Match)"
                }

        # 4. Category-based baseline priority defaults if no explicit keyword trigger matches
        category_defaults = {
            "Healthcare": "HIGH",
            "Water Supply": "MEDIUM",
            "Electricity": "MEDIUM",
            "Roads and Transport": "MEDIUM",
            "Sanitation": "MEDIUM",
            "Municipal Services": "LOW",
            "Education": "LOW",
            "Revenue": "LOW",
            "Other": "MEDIUM"
        }

        default_priority = category_defaults.get(category, "MEDIUM")
        
        return {
            "priority": default_priority,
            "priority_confidence": 0.65,
            "is_baseline": True,
            "method": f"BASELINE (Category Default: {category})"
        }

priority_predictor_service = PriorityPredictorService()
