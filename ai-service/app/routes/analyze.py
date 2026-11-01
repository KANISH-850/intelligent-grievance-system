import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.grievance import (
    GrievanceRequest,
    GrievanceResponse,
    ImageAnalysisRequest,
    ImageAnalysisResponse,
    TranslatePreviewRequest,
    TranslatePreviewResponse,
)
from app.services.pipeline import analysis_pipeline
from app.services.vision import analyze_image
from app.services.language_detector import language_detector_service
from app.services.ml.translation_provider import translation_provider

logger = logging.getLogger("ai_service.routes.analyze")

router = APIRouter(tags=["Analysis"])


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_grievance_image(request: ImageAnalysisRequest) -> ImageAnalysisResponse:
    result = analyze_image(request.image_base64, request.mime_type)
    return ImageAnalysisResponse(**result)


@router.post(
    "/translate",
    response_model=TranslatePreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Preview Language Detection & English Translation",
    description="Detects language of citizen input text and translates to English without performing classification or persisting."
)
async def preview_translation(request: TranslatePreviewRequest) -> TranslatePreviewResponse:
    raw_text = request.text
    if not raw_text or not raw_text.strip():
        return TranslatePreviewResponse(
            original_text=raw_text,
            detected_language="Unknown",
            detected_language_code="und",
            translated_text="",
            translation_status="failed",
            translation_method="empty_input",
            translation_error="Input text is empty",
            translated_at=None,
            confidence=0.0,
            is_mixed=False
        )

    lang_result = language_detector_service.detect_language(raw_text)
    detected_lang = lang_result["language"]
    detected_code = lang_result.get("language_code", "und")

    trans_result = translation_provider.translate(
        text=raw_text,
        source_language=detected_lang,
        target_language="English",
        source_language_code=detected_code
    )

    return TranslatePreviewResponse(
        original_text=raw_text,
        detected_language=detected_lang,
        detected_language_code=detected_code,
        translated_text=trans_result.get("translated_text", raw_text),
        translation_status=trans_result.get("translation_status", "unavailable"),
        translation_method=trans_result.get("translation_method", "unknown"),
        translation_error=trans_result.get("translation_error"),
        translated_at=trans_result.get("translated_at"),
        confidence=lang_result.get("confidence", 1.0),
        is_mixed=lang_result.get("is_mixed", False)
    )


@router.post(
    "/analyze",
    response_model=GrievanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Citizen Grievance",
    description="Processes raw grievance text through language detection, translation, category classification, priority prediction, and department routing."
)
async def analyze_grievance(request: GrievanceRequest) -> GrievanceResponse:
    """
    Analyzes input grievance text and returns structured classification metadata.
    """
    try:
        response = analysis_pipeline.process_grievance(request)
        return response
    except ValueError as val_err:
        logger.warning(f"Validation error in analyze_grievance: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as exc:
        logger.error(f"Internal error processing grievance: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing the grievance text."
        )
