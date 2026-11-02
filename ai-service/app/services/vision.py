"""
Multimodal vision analysis service for civic infrastructure grievance inspection.

Analyzes uploaded citizen defect photographs using a fine-tuned MobileNetV3-Small neural network.
Distinguishes genuine civic/public infrastructure issues from unrelated photographs (selfies,
pets, food, vehicles without damage, personal documents, indoor rooms, screenshots, etc.).
"""
import base64
import logging
from typing import Any, Dict

from app.services.cv_model import predict_civic_image

logger = logging.getLogger("ai_service.vision")


def analyze_image(image_base64: str, mime_type: str) -> Dict[str, Any]:
    """
    Analyze image bytes using fine-tuned MobileNetV3-Small Civic model.
    Decodes base64 payload and delegates to predict_civic_image.
    Returns structured analysis result adhering to ImageAnalysisResponse schema.
    """
    fallback_base: Dict[str, Any] = {
        "analysis_status": "unavailable",
        "image_type": "uncertain",
        "is_grievance_related": False,
        "issue_detected": False,
        "detected_issue": None,
        "issue_description": None,
        "image_description": None,
        "recommended_category": None,
        "recommended_department": None,
        "additional_departments": [],
        "visual_observations": [],
        "observations": [],
        "confidence": None,
        "confidence_level": "LOW",
        "predicted_class": None,
        "human_review_required": True,
        "review_reason": "AI vision analysis offline or unconfigured; queued for manual officer review.",
        "citizen_message": "AI vision analysis is currently unavailable. Your photo will be reviewed manually by an officer.",
        "model_name": "MobileNetV3-Small-Civic",
        "model_version": "1.0.0",
        "inference_latency_ms": None,
    }

    if mime_type not in {"image/jpeg", "image/png", "image/webp"}:
        return {
            **fallback_base,
            "analysis_status": "unsupported_format",
            "citizen_message": "Unsupported file format. Please upload JPEG, PNG, or WebP photographs.",
        }

    try:
        raw = base64.b64decode(image_base64, validate=True)
    except Exception:
        return {
            **fallback_base,
            "analysis_status": "failed",
            "citizen_message": "Invalid base64 image data.",
        }

    if len(raw) > 5 * 1024 * 1024:
        return {
            **fallback_base,
            "analysis_status": "too_large",
            "citizen_message": "Image file exceeds the 5 MB limit. Please upload a smaller photograph.",
        }

    return predict_civic_image(raw, mime_type)
