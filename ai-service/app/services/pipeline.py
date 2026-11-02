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
from app.services.multi_issue_extractor import multi_issue_extractor

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

        # Detect the original text before normalization or translation.
        lang_result = language_detector_service.detect_language(raw_text)
        detected_language = lang_result["language"]
        detected_language_code = lang_result.get("language_code", "und")

        # Translate the exact submitted text; original_text remains persisted by the backend.
        trans_result = translation_provider.translate(
            text=raw_text,
            source_language=detected_language,
            target_language="English",
            source_language_code=detected_language_code
        )
        translated_text = trans_result["translated_text"]
        translation_status = trans_result.get("translation_status", "passthrough")
        translation_method = trans_result.get("translation_method", "native_english_passthrough")
        translation_error = trans_result.get("translation_error")
        translated_at = trans_result.get("translated_at")
        classification_text = text_preprocessor_service.preprocess(translated_text)["processed_text"]

        # Only classify text known to be English. An unavailable translation is
        # routed to Other for human review instead of treating source text as English.
        translation_valid = translation_status in {"translated", "passthrough", "completed"}
        class_result = ml_grievance_classifier.classify(classification_text) if translation_valid else {
            "category": "Other", "category_confidence": None,
            "classification_method": "translation_unavailable_review", "model_used": "none",
            "confidence_level": "LOW", "ai_review_required": True,
            "explanation": {"method": "translation_unavailable", "top_terms": []},
        }
        category = class_result["category"]
        category_confidence = class_result.get("category_confidence")
        classification_method = class_result.get("classification_method", "tfidf_logistic_regression")
        model_used = class_result.get("model_used", "tfidf-logistic-regression")
        confidence_level = class_result.get("confidence_level", "HIGH")
        ai_review_required = class_result.get("ai_review_required", False)
        explanation = class_result.get("explanation", {"method": "tfidf_feature_contribution", "top_terms": []})

        # 5. Hybrid Priority Prediction
        if translation_valid:
            prio_result = ml_priority_predictor.predict_priority(classification_text, category)
            priority = prio_result["priority"]
            priority_confidence = prio_result["priority_confidence"]
        else:
            priority = "MEDIUM"
            priority_confidence = None

        # 6. Multi-Issue Extraction and Multi-Department Routing
        all_probs = class_result.get("all_probabilities", {}) if translation_valid else {}
        detected_issues = []

        if translation_valid:
            detected_issues = multi_issue_extractor.extract_issues(classification_text)
            recommended_departments = multi_issue_extractor.decompose_into_departments(
                text=classification_text,
                primary_category=category,
                primary_confidence=category_confidence,
                ml_probabilities=all_probs,
            )
        else:
            primary_dept = department_router_service.route_department(category)
            recommended_departments = [{
                "department_name": primary_dept,
                "category": category,
                "confidence": category_confidence,
                "reason": "Translation unavailable, routed for administrative human review",
                "issues": [],
                "source": "text",
            }]

        if recommended_departments:
            primary_dept = recommended_departments[0]["department_name"]
            # Align category with primary detected issue if ML category was 'Other' or uncertain
            if category == "Other" and recommended_departments[0]["category"] != "Other":
                category = recommended_departments[0]["category"]
                category_confidence = recommended_departments[0].get("confidence", 0.85)
                ai_review_required = False
            elif not detected_issues and category == "Other":
                ai_review_required = True
        else:
            primary_dept = department_router_service.route_department(category)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return GrievanceResponse(
            language=detected_language,
            language_code=detected_language_code,
            original_text=raw_text,
            translated_text=translated_text,
            category=category,
            category_confidence=category_confidence,
            priority=priority,
            priority_confidence=priority_confidence,
            department=primary_dept,
            departments=recommended_departments,
            detected_issues=detected_issues,
            processing_time_ms=round(elapsed_ms, 2),
            model_used=model_used,
            classification_method=classification_method,
            confidence_level=confidence_level,
            ai_review_required=ai_review_required,
            explanation=explanation,
            translation_status=translation_status,
            translation_method=translation_method,
            translation_error=translation_error,
            translated_at=translated_at,
        )

analysis_pipeline = AnalysisPipeline()
