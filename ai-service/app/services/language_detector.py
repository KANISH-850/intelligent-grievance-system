import re
import logging
from typing import Dict, Any, Tuple
from langdetect import detect_langs, DetectorFactory

# Set seed for deterministic language detection
DetectorFactory.seed = 42

logger = logging.getLogger("ai_service.language_detector")

# Complete ISO 639-1 code to language name mappings (12 Indian + 7 International + English)
ISO_TO_LANGUAGE = {
    # 12 Official Indian Languages
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "ml": "Malayalam",
    "kn": "Kannada",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "or": "Odia",
    "ur": "Urdu",
    "as": "Assamese",
    # 7 International Languages
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "ar": "Arabic",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "pt": "Portuguese",
    # Primary Language
    "en": "English",
}

LANGUAGE_TO_ISO = {v: k for k, v in ISO_TO_LANGUAGE.items()}

# Common English vocabulary indicators to avoid false positives on short Latin text
COMMON_ENGLISH_WORDS = {
    "the", "is", "are", "was", "were", "have", "has", "had", "not", "no",
    "in", "on", "at", "to", "for", "of", "with", "from", "by", "our",
    "area", "road", "water", "street", "light", "lights", "garbage", "waste",
    "drain", "drainage", "pothole", "potholes", "pipeline", "pipe", "power",
    "electricity", "pole", "wire", "wires", "hospital", "school", "days",
    "day", "week", "three", "please", "help", "broken", "clean", "cleaning",
    "there", "been", "since", "yesterday", "colony", "nagar", "ward",
    "drinking", "supply", "problem", "issue", "complaint", "repair", "urgent"
}

# Marathi distinctive grammatical particles & common civic words in Devanagari
MARATHI_MARKERS = [
    "आहे", "नाही", "च्या", "चे", "मध्ये", "झाले", "झाला", "झाली",
    "गेल्या", "दिवसांपासून", "येत", "पाणी", "रस्ता", "कचरा", "आम्ही",
    "आमच्या", "भागात", "करावे", "लाईट"
]

# Assamese distinctive characters & vocabulary (Eastern Nagari script shared with Bengali)
ASSAMESE_MARKERS = [
    "আমাৰ", "খোৱাপানী", "খোৱাপানীৰ", "যোগান", "নহয়", "হৈছে", "নাই",
    "ৰাস্তা", "পোহৰ", "আলোক", "নলা", "দাবীনামা"
]

# Urdu distinctive markers & Perso-Arabic characters
URDU_SPECIFIC_CHARS = re.compile(r'[\u0679\u0688\u0691\u06BA\u06D2\u06C1\u06BE]')
URDU_COMMON_WORDS = [
    "ہمارے", "علاقے", "میں", "تین", "دن", "سے", "پینے", "کا", "پانی",
    "نہیں", "آ", "رہا", "ہے", "سڑک", "خراب", "بجلی"
]


class LanguageDetectorService:
    """
    Production-grade Language Detection Service for Civic Grievance Framework.
    Supports 12 Indian Languages, 7 International Languages, and English.
    Utilizes multi-script Unicode heuristics, grammatical token analysis,
    and deterministic N-gram probabilistic classification.
    """

    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detects language of input text.
        Returns:
            dict containing language name, ISO 639-1 code, confidence score,
            is_mixed flag, and detection method.
        """
        if not text or not text.strip():
            return {
                "language": "Unknown",
                "language_code": "und",
                "confidence": 0.0,
                "is_mixed": False,
                "is_baseline": True,
                "method": "EMPTY_INPUT"
            }

        cleaned = text.strip()

        # Step 1: Analyze Unicode script presence
        has_odia = bool(re.search(r'[\u0B00-\u0B7F]', cleaned))
        has_tamil = bool(re.search(r'[\u0B80-\u0BFF]', cleaned))
        has_telugu = bool(re.search(r'[\u0C00-\u0C7F]', cleaned))
        has_kannada = bool(re.search(r'[\u0C80-\u0CFF]', cleaned))
        has_malayalam = bool(re.search(r'[\u0D00-\u0D7F]', cleaned))
        has_gujarati = bool(re.search(r'[\u0A80-\u0AFF]', cleaned))
        has_gurmukhi = bool(re.search(r'[\u0A00-\u0A7F]', cleaned))
        has_bengali_assamese = bool(re.search(r'[\u0980-\u09FF]', cleaned))
        has_devanagari = bool(re.search(r'[\u0900-\u097F]', cleaned))
        has_arabic = bool(re.search(r'[\u0600-\u06FF]', cleaned))
        has_japanese_kana = bool(re.search(r'[\u3040-\u309F\u30A0-\u30FF]', cleaned))
        has_hanzi = bool(re.search(r'[\u4E00-\u9FFF]', cleaned))
        has_latin = bool(re.search(r'[a-zA-Z]', cleaned))

        indic_script_present = any([
            has_odia, has_tamil, has_telugu, has_kannada, has_malayalam,
            has_gujarati, has_gurmukhi, has_bengali_assamese, has_devanagari
        ])

        is_mixed = (indic_script_present and has_latin) or (has_arabic and has_latin)

        # ── Script-Specific Deterministic Heuristics ──

        # 1. Odia (Unique Unicode block 0B00-0B7F)
        if has_odia:
            return {
                "language": "Odia",
                "language_code": "or",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "UNICODE_SCRIPT_ODIA"
            }

        # 2. Tamil (0B80-0BFF)
        if has_tamil:
            return {
                "language": "Tamil",
                "language_code": "ta",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "UNICODE_SCRIPT_TAMIL"
            }

        # 3. Telugu (0C00-0C7F)
        if has_telugu:
            return {
                "language": "Telugu",
                "language_code": "te",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "UNICODE_SCRIPT_TELUGU"
            }

        # 4. Kannada (0C80-0CFF)
        if has_kannada:
            return {
                "language": "Kannada",
                "language_code": "kn",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "UNICODE_SCRIPT_KANNADA"
            }

        # 5. Malayalam (0D00-0D7F)
        if has_malayalam:
            return {
                "language": "Malayalam",
                "language_code": "ml",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "UNICODE_SCRIPT_MALAYALAM"
            }

        # 6. Gujarati (0A80-0AFF)
        if has_gujarati:
            return {
                "language": "Gujarati",
                "language_code": "gu",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "UNICODE_SCRIPT_GUJARATI"
            }

        # 7. Punjabi (Gurmukhi script 0A00-0A7F)
        if has_gurmukhi:
            return {
                "language": "Punjabi",
                "language_code": "pa",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "UNICODE_SCRIPT_GURMUKHI"
            }

        # 8. Assamese vs Bengali (Shared Eastern Nagari script 0980-09FF)
        if has_bengali_assamese:
            # Check for unique Assamese letters: Ra (ৰ U+09F0), Wa (ৱ U+09F1) or distinctive words
            has_assamese_chars = bool(re.search(r'[\u09F0\u09F1]', cleaned))
            has_assamese_words = any(w in cleaned for w in ASSAMESE_MARKERS)
            if has_assamese_chars or has_assamese_words:
                return {
                    "language": "Assamese",
                    "language_code": "as",
                    "confidence": 0.98,
                    "is_mixed": is_mixed,
                    "is_baseline": True,
                    "method": "EASTERN_NAGARI_ASSAMESE_MARKERS"
                }
            return {
                "language": "Bengali",
                "language_code": "bn",
                "confidence": 0.98,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "EASTERN_NAGARI_BENGALI"
            }

        # 9. Marathi vs Hindi (Devanagari script 0900-097F)
        if has_devanagari:
            # Check for Marathi markers first
            if any(marker in cleaned for marker in MARATHI_MARKERS):
                return {
                    "language": "Marathi",
                    "language_code": "mr",
                    "confidence": 0.98,
                    "is_mixed": is_mixed,
                    "is_baseline": True,
                    "method": "DEVANAGARI_MARATHI_GRAMMATICAL_MARKERS"
                }
            # Attempt probabilistic disambiguation
            try:
                preds = detect_langs(cleaned)
                for p in preds:
                    if p.lang == "mr" and p.prob >= 0.55:
                        return {
                            "language": "Marathi",
                            "language_code": "mr",
                            "confidence": round(float(p.prob), 2),
                            "is_mixed": is_mixed,
                            "is_baseline": True,
                            "method": "LANGDETECT_MARATHI"
                        }
            except Exception:
                pass
            return {
                "language": "Hindi",
                "language_code": "hi",
                "confidence": 0.98,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "DEVANAGARI_HINDI"
            }

        # 10. Urdu vs Arabic (Arabic script 0600-06FF)
        if has_arabic:
            # Check for Urdu specific characters or words
            if URDU_SPECIFIC_CHARS.search(cleaned) or any(w in cleaned for w in URDU_COMMON_WORDS):
                return {
                    "language": "Urdu",
                    "language_code": "ur",
                    "confidence": 0.98,
                    "is_mixed": is_mixed,
                    "is_baseline": True,
                    "method": "ARABIC_SCRIPT_URDU_MARKERS"
                }
            try:
                preds = detect_langs(cleaned)
                for p in preds:
                    if p.lang == "ur" and p.prob >= 0.60:
                        return {
                            "language": "Urdu",
                            "language_code": "ur",
                            "confidence": round(float(p.prob), 2),
                            "is_mixed": is_mixed,
                            "is_baseline": True,
                            "method": "LANGDETECT_URDU"
                        }
            except Exception:
                pass
            return {
                "language": "Arabic",
                "language_code": "ar",
                "confidence": 0.98,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "ARABIC_SCRIPT"
            }

        # 11. Japanese (Hiragana / Katakana)
        if has_japanese_kana:
            return {
                "language": "Japanese",
                "language_code": "ja",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "JAPANESE_KANA_SCRIPT"
            }

        # 12. Chinese (Simplified) (Hanzi characters without Kana)
        if has_hanzi and not has_japanese_kana:
            return {
                "language": "Chinese (Simplified)",
                "language_code": "zh",
                "confidence": 0.99,
                "is_mixed": is_mixed,
                "is_baseline": True,
                "method": "CHINESE_HANZI_SCRIPT"
            }

        # ── Step 2: Latin Script Classification (English, French, Spanish, German, Portuguese) ──
        if has_latin:
            words = re.findall(r'[a-zA-Z]+', cleaned.lower())
            total_words = len(words)
            matched_en = sum(1 for w in words if w in COMMON_ENGLISH_WORDS)

            # Robust English detection: 2+ common English words or high English ratio
            if total_words > 0 and (matched_en >= 2 or (total_words <= 3 and matched_en >= 1)):
                return {
                    "language": "English",
                    "language_code": "en",
                    "confidence": 0.98,
                    "is_mixed": False,
                    "is_baseline": True,
                    "method": "LATIN_ENGLISH_LEXICON_MATCH"
                }

            # Run langdetect for international Latin-script languages
            try:
                preds = detect_langs(cleaned)
                if preds:
                    top_pred = preds[0]
                    iso = top_pred.lang
                    prob = float(top_pred.prob)

                    # Map ISO codes to supported Latin languages
                    latin_iso_map = {
                        "fr": ("French", "fr"),
                        "es": ("Spanish", "es"),
                        "de": ("German", "de"),
                        "pt": ("Portuguese", "pt"),
                        "en": ("English", "en"),
                    }

                    if iso in latin_iso_map and prob >= 0.70:
                        lang_name, lang_code = latin_iso_map[iso]
                        # Safeguard: If langdetect says es/fr on English text with English words
                        if lang_code != "en" and matched_en >= 1 and (matched_en / max(1, total_words)) >= 0.35:
                            return {
                                "language": "English",
                                "language_code": "en",
                                "confidence": 0.95,
                                "is_mixed": False,
                                "is_baseline": True,
                                "method": "LATIN_ENGLISH_SAFEGUARD"
                            }
                        return {
                            "language": lang_name,
                            "language_code": lang_code,
                            "confidence": round(prob, 2),
                            "is_mixed": False,
                            "is_baseline": True,
                            "method": f"LANGDETECT_LATIN({lang_code})"
                        }
            except Exception as exc:
                logger.debug(f"Langdetect Latin pass error: {exc}")

            # Fallback for Latin text if no other European language matched with confidence
            return {
                "language": "English",
                "language_code": "en",
                "confidence": 0.85 if matched_en > 0 else 0.70,
                "is_mixed": False,
                "is_baseline": True,
                "method": "LATIN_DEFAULT_ENGLISH"
            }

        # Step 3: Unidentified or numbers/symbols only
        return {
            "language": "Unknown",
            "language_code": "und",
            "confidence": 0.0,
            "is_mixed": False,
            "is_baseline": True,
            "method": "UNIDENTIFIED"
        }


language_detector_service = LanguageDetectorService()
