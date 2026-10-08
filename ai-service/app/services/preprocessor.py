import re
from typing import Dict

class TextPreprocessorService:
    """
    Text Preprocessing Service.
    Component Status: IMPLEMENTED (Production Standard Sanitization).
    """

    def preprocess(self, text: str) -> Dict[str, str]:
        """
        Sanitizes and normalizes grievance text while preserving original text.
        """
        if not text:
            return {
                "original_text": "",
                "processed_text": ""
            }

        original = text

        # Remove null bytes and non-printable control characters (\x00-\x08\x0b\x0c\x0e-\x1f\x7f)
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

        # Normalize multiple spaces / tabs / repeated blank lines while keeping single linebreaks
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

        # Strip leading/trailing whitespace
        cleaned = cleaned.strip()

        return {
            "original_text": original,
            "processed_text": cleaned
        }

text_preprocessor_service = TextPreprocessorService()
