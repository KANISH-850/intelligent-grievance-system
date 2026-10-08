import logging
from typing import Dict, Any

logger = logging.getLogger("ai_service.translator")

class TranslatorService:
    """
    Translator Service Abstraction.
    Component Status: FALLBACK / BASELINE
    
    Future Roadmap:
    Will be upgraded to fine-tuned neural translation (e.g., IndicTrans2 model)
    when GPU/model weights are attached in Phase 4+.
    """

    def translate(
        self, text: str, source_language: str, target_language: str = "English"
    ) -> Dict[str, Any]:
        """
        Translates text from source_language to target_language.
        
        For English text: returns original text directly.
        For Non-English text: returns original text with a fallback notification metadata tag,
        without inventing artificial or inaccurate translations.
        """
        if not text:
            return {
                "translated_text": "",
                "is_fallback": True,
                "method": "FALLBACK (Empty Text)"
            }

        # Case 1: Source language is already English
        if source_language.lower() == "english" or source_language == "en":
            return {
                "translated_text": text,
                "is_fallback": False,
                "method": "PASSTHROUGH (Native English)"
            }

        # Case 2: Regional/Foreign Language (Fallback mode when IndicTrans2 weights are not loaded)
        logger.info(
            f"Translation requested for language '{source_language}'. "
            "IndicTrans2 neural model is not present in baseline environment. Using pass-through fallback."
        )

        return {
            "translated_text": text,
            "is_fallback": True,
            "method": f"FALLBACK (IndicTrans2 offline - Preserved original {source_language} text)"
        }

translator_service = TranslatorService()
