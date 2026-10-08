from abc import ABC, abstractmethod
from typing import Dict, Any
import logging

from app.services.translator import translator_service

logger = logging.getLogger("ai_service.translation_provider")

class BaseTranslationProvider(ABC):
    """Abstract interface for translation providers."""

    @abstractmethod
    def translate(self, text: str, source_language: str, target_language: str = "English") -> Dict[str, Any]:
        pass


class FallbackTranslationProvider(BaseTranslationProvider):
    """
    Rule/Dictionary-based baseline translation provider.
    Used for local development and academic baseline environments.
    """

    def translate(self, text: str, source_language: str, target_language: str = "English") -> Dict[str, Any]:
        res = translator_service.translate(text, source_language, target_language)
        res["translation_backend"] = "fallback_dictionary_baseline"
        return res


class IndicTransProvider(BaseTranslationProvider):
    """
    Abstraction stub for future IndicTrans2 neural translation integration.
    Currently delegates to baseline fallback provider when neural model weights are not loaded.
    """

    def __init__(self):
        self._fallback = FallbackTranslationProvider()

    def translate(self, text: str, source_language: str, target_language: str = "English") -> Dict[str, Any]:
        # Neural IndicTrans2 model weights are intentionally omitted in demo environment.
        res = self._fallback.translate(text, source_language, target_language)
        res["translation_backend"] = "indictrans2_stub_fallback"
        return res


translation_provider = FallbackTranslationProvider()
