from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

from app.services.translator import translator_service

logger = logging.getLogger("ai_service.translation_provider")

class BaseTranslationProvider(ABC):
    """Abstract interface for translation providers."""

    @abstractmethod
    def translate(
        self,
        text: str,
        source_language: str,
        target_language: str = "English",
        source_language_code: Optional[str] = None
    ) -> Dict[str, Any]:
        pass


class FallbackTranslationProvider(BaseTranslationProvider):
    """Configured real translation provider with explicit failure reporting."""

    def translate(
        self,
        text: str,
        source_language: str,
        target_language: str = "English",
        source_language_code: Optional[str] = None
    ) -> Dict[str, Any]:
        res = translator_service.translate(
            text=text,
            source_language=source_language,
            target_language=target_language,
            source_language_code=source_language_code
        )
        res["translation_backend"] = res.get("translation_method")
        return res


class IndicTransProvider(BaseTranslationProvider):
    """Legacy name retained for compatibility; delegates to configured provider."""

    def __init__(self):
        self._fallback = FallbackTranslationProvider()

    def translate(
        self,
        text: str,
        source_language: str,
        target_language: str = "English",
        source_language_code: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._fallback.translate(
            text=text,
            source_language=source_language,
            target_language=target_language,
            source_language_code=source_language_code
        )


translation_provider = FallbackTranslationProvider()
