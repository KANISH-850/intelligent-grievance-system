import time
import logging
from typing import Dict, Any

from app.schemas.grievance import GrievanceRequest, GrievanceResponse
from app.services.language_detector import language_detector_service
from app.services.preprocessor import text_preprocessor_service
from app.services.ml.translation_provider import translation_provider
from app.services.ml.classifier import ml_grievance_classifier
from app.services.ml.predictor import ml_priority_predictor
from app.services.department_router import department_router_service

logger = logging.getLogger("ai_service.pipeline")

class AnalysisPipeline:
    """
    Modular AI Processing Pipeline for Grievance Analysis (Phase 10).
    Unifies language detection, preprocessing, ML translation abstraction, ML classification,
    enhanced priority prediction, and deterministic department routing.
    """

    def process_grievance(self, request: GrievanceRequest) -> GrievanceResponse:
        start_time = time.perf_counter()

        raw_text = request.text

        # 1. Text Preprocessing (Preserves original text, cleans whitespace/characters)
        prep_result = text_preprocessor_service.preprocess(raw_text)
        cleaned_text = prep_result["processed_text"]

        # 2. Language Detection
        lang_result = language_detector_service.detect_language(cleaned_text)
        detected_language = lang_result["language"]

        # 3. Multilingual Translation (TranslationProvider abstraction)
        trans_result = translation_provider.translate(
            text=cleaned_text,
            source_language=detected_language,
            target_language="English"
        )
        translated_text = trans_result["translated_text"]

        # 4. Grievance Classification (ML / Transformer Pipeline with Fallback)
        class_result = ml_grievance_classifier.classify(translated_text)
        category = class_result["category"]
        category_confidence = class_result["category_confidence"]
        classification_method = class_result.get("classification_method", "ml_transformer_pipeline")
        model_used = class_result.get("model_used", "tfidf-logistic-regression")

        # 5. Hybrid Priority Prediction
        prio_result = ml_priority_predictor.predict_priority(translated_text, category)
        priority = prio_result["priority"]
        priority_confidence = prio_result["priority_confidence"]

        # 6. Department Routing (Deterministic mapping)
        department = department_router_service.route_department(category)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return GrievanceResponse(
            language=detected_language,
            translated_text=translated_text,
            category=category,
            category_confidence=category_confidence,
            priority=priority,
            priority_confidence=priority_confidence,
            department=department,
            processing_time_ms=round(elapsed_ms, 2),
            model_used=model_used,
            classification_method=classification_method
        )

analysis_pipeline = AnalysisPipeline()
