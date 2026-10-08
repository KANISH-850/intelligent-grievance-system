import re
import logging
from typing import Dict, Any
from langdetect import detect, detect_langs, DetectorFactory

# Set seed for deterministic language detection
DetectorFactory.seed = 42

logger = logging.getLogger("ai_service.language_detector")

ISO_TO_LANGUAGE = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "ur": "Urdu",
}

# Unicode script ranges for fallback Indic script identification
SCRIPT_RANGES = [
    (re.compile(r'[\u0900-\u097F]'), "Hindi"),      # Devanagari
    (re.compile(r'[\u0B80-\u0BFF]'), "Tamil"),      # Tamil
    (re.compile(r'[\u0C00-\u0C7F]'), "Telugu"),     # Telugu
    (re.compile(r'[\u0C80-\u0CFF]'), "Kannada"),    # Kannada
    (re.compile(r'[\u0D00-\u0D7F]'), "Malayalam"),  # Malayalam
    (re.compile(r'[\u0980-\u09FF]'), "Bengali"),    # Bengali
    (re.compile(r'[\u0A80-\u0AFF]'), "Gujarati"),   # Gujarati
]

class LanguageDetectorService:
    """
    Language Detection Service.
    Component Status: IMPLEMENTED (Baseline: langdetect library + Unicode script fallback).
    """

    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detects language of input text.
        Returns:
            dict containing language name, confidence score, and detection method.
        """
        if not text or not text.strip():
            return {
                "language": "Unknown",
                "confidence": 0.0,
                "is_baseline": True,
                "method": "BASELINE (Empty Input)"
            }

        # 1. Attempt langdetect detection
        try:
            detected_predictions = detect_langs(text)
            if detected_predictions:
                top_pred = detected_predictions[0]
                iso_code = top_pred.lang
                prob = float(top_pred.prob)

                lang_name = ISO_TO_LANGUAGE.get(iso_code, "Unknown")
                
                # If langdetect gives high confidence and maps to known language
                if lang_name != "Unknown" and prob >= 0.5:
                    return {
                        "language": lang_name,
                        "confidence": round(prob, 2),
                        "is_baseline": True,
                        "method": f"BASELINE (langdetect:{iso_code})"
                    }
        except Exception as e:
            logger.warning(f"langdetect failed or threw error: {e}")

        # 2. Fallback: Unicode Script matching for Indic languages
        for regex, lang in SCRIPT_RANGES:
            matches = regex.findall(text)
            if len(matches) > 0:
                # Estimate confidence based on ratio of Indic characters
                total_chars = len(text.replace(" ", ""))
                ratio = min(1.0, len(matches) / max(1, total_chars))
                return {
                    "language": lang,
                    "confidence": round(max(0.70, ratio), 2),
                    "is_baseline": True,
                    "method": "BASELINE (Unicode Script Heuristic)"
                }

        # 3. Default fallback for Latin script if langdetect was uncertain
        if re.search(r'[a-zA-Z]', text):
            return {
                "language": "English",
                "confidence": 0.60,
                "is_baseline": True,
                "method": "BASELINE (Latin Script Fallback)"
            }

        return {
            "language": "Unknown",
            "confidence": 0.0,
            "is_baseline": True,
            "method": "FALLBACK (Unidentified)"
        }

language_detector_service = LanguageDetectorService()
