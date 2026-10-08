import re
import logging
from typing import Dict, Any

logger = logging.getLogger("ai_service.classifier")

# Category keyword dictionaries with weights for English and regional words
CATEGORY_KEYWORDS = {
    "Water Supply": [
        "water", "water supply", "pipeline", "pipe", "tap", "drinking water", "drainage",
        "sewage", "leakage", "water cut", "borewell", "contamination", "dirty water", "tanker",
        "தண்ணீர்", "குடிநீர்", "சாக்கடை", "पानी", "जल", "नहाने का पानी", "நீர்", "நீரு", "త్రాగునీరు"
    ],
    "Electricity": [
        "electricity", "power", "power cut", "voltage", "transformer", "wire", "electric pole",
        "current", "outage", "blackout", "meter", "fuse", "eb bill", "electricity board",
        "மின்சாரம்", "மின்வெட்டு", "கரண்ட்", "बिजली", "पावर कट", "மின் கம்பி", "విద్యుత్", "కరెంట్"
    ],
    "Roads and Transport": [
        "road", "pothole", "street", "traffic", "bus", "highway", "bridge", "tar road",
        "asphalt", "speed breaker", "signal", "transport", "bus stop", "footpath",
        "சாலை", "தெரு", "பேருந்து", "குழி", "सड़क", "बस", "ट्रैफिक", "రహదారి", "రోడ్డు"
    ],
    "Healthcare": [
        "hospital", "doctor", "medicine", "health", "clinic", "ambulance", "disease",
        "phc", "nurse", "treatment", "medical", "pharmacy", "dengue", "fever",
        "மருத்துவமனை", "மருத்துவர்", "மருந்து", "அஸ்பத்திரி", "अस्पताल", "डॉक्टर", "दवा", "వైద్యం", "ఆసుపత్రి"
    ],
    "Education": [
        "school", "teacher", "college", "student", "education", "class", "classroom",
        "desk", "midday meal", "textbook", "tuition", "university",
        "பள்ளி", "ஆசிரியர்", "மாணவர்", "கல்வி", "स्कूल", "शिक्षक", "छात्र", "पाठशाला"
    ],
    "Sanitation": [
        "garbage", "waste", "cleaning", "trash", "bin", "unsanitary", "stink", "smell",
        "conservancy", "drain", "mosquito", "sweeper", "dustbin", "waste dumping",
        "குப்பை", "தூய்மை", "கழிவு", "कचरा", "सफाई", "गंदगी", "చెత్త", "పరిశుభ్రత"
    ],
    "Municipal Services": [
        "street light", "streetlight", "park", "community hall", "dog menace", "stray dogs",
        "birth certificate", "death certificate", "playground", "encroachment", "building plan",
        "தெருவிளக்கு", "நாய் தொல்லை", "स्ट्रीट लाइट", "कुत्ते", "వీధిలైటు"
    ],
    "Revenue": [
        "tax", "property tax", "land record", "patta", "chitta", "revenue", "certificate",
        "income certificate", "caste certificate", "land dispute", "registration", "stamp duty",
        "வரி", "பட்டா", "நிலம்", "कर", "भूमि", "పన్ను", "పట్టా"
    ],
}

class GrievanceClassifierService:
    """
    Grievance Classifier Service.
    Component Status: BASELINE (Rule-based Keyword & Semantic Pattern Matching).
    
    Future Roadmap:
    Can be replaced by fine-tuned BERT/DistilBERT transformer model in future iterations.
    """

    def classify(self, text: str) -> Dict[str, Any]:
        """
        Classifies grievance text into one of 9 standardized categories.
        Returns:
            dict containing category name, confidence score (0.0 to 1.0), and execution method.
        """
        if not text:
            return {
                "category": "Other",
                "category_confidence": 0.30,
                "is_baseline": True,
                "method": "BASELINE (Empty Input)"
            }

        text_lower = text.lower()

        scores = {}
        for category, keywords in CATEGORY_KEYWORDS.items():
            matches = 0
            for kw in keywords:
                kw_lower = kw.lower()
                # Boundary pattern for both ASCII and Indic scripts (spaces, punctuation, start/end of string)
                pattern = r'(?:^|[\s.,!?:;|\-–—()"\'])' + re.escape(kw_lower) + r'(?:$|[\s.,!?:;|\-–—()"\'])'
                if re.search(pattern, text_lower):
                    matches += 1
            if matches > 0:
                scores[category] = matches

        if not scores:
            return {
                "category": "Other",
                "category_confidence": 0.40,
                "is_baseline": True,
                "method": "BASELINE (No keyword matches)"
            }

        # Find top scoring category
        best_category = max(scores, key=scores.get)
        match_count = scores[best_category]

        # Calculate heuristic confidence
        if match_count >= 3:
            confidence = 0.95
        elif match_count == 2:
            confidence = 0.85
        else:
            confidence = 0.75

        return {
            "category": best_category,
            "category_confidence": round(confidence, 2),
            "is_baseline": True,
            "method": "BASELINE (Keyword Heuristic)"
        }

grievance_classifier_service = GrievanceClassifierService()
