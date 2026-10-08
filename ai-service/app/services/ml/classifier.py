import logging
from typing import Dict, Any

from app.services.ml.model_loader import model_loader
from app.services.classifier import grievance_classifier_service

logger = logging.getLogger("ai_service.ml_classifier")

class MLGrievanceClassifier:
    """
    ML/Transformer Classification Service with Hybrid Baseline Fallback.
    Combines high-precision ML inference for normalized text with baseline
    keyword & Indic-script matching for non-English/out-of-vocabulary queries.
    """

    def classify(self, text: str) -> Dict[str, Any]:
        # Always compute baseline keyword fallback as ground-truth anchor
        fallback_res = grievance_classifier_service.classify(text)
        has_non_ascii = any(ord(c) > 127 for c in text)

        # Ensure model attempt has been made
        if not model_loader.is_loaded:
            model_loader.load_model()

        if model_loader.is_loaded and model_loader.model is not None:
            try:
                # If text contains non-ASCII Indic script and baseline keyword classifier finds specific match
                if has_non_ascii and fallback_res["category"] != "Other":
                    return {
                        "category": fallback_res["category"],
                        "category_confidence": fallback_res["category_confidence"],
                        "classification_method": "indic_keyword_fallback",
                        "model_used": "rule_based_baseline"
                    }

                pipeline = model_loader.model
                probs = pipeline.predict_proba([text])[0]
                classes = pipeline.classes_

                best_idx = probs.argmax()
                predicted_category = classes[best_idx]
                confidence = float(probs[best_idx])

                # If ML confidence is low or text has no grievance keywords (out-of-domain)
                if confidence < 0.35 and fallback_res["category"] == "Other":
                    return {
                        "category": "Other",
                        "category_confidence": 0.40,
                        "classification_method": "out_of_domain_fallback",
                        "model_used": "rule_based_baseline"
                    }

                # If baseline found strong explicit keyword match and ML confidence is moderate
                if fallback_res["category"] != "Other" and confidence < 0.45:
                    return {
                        "category": fallback_res["category"],
                        "category_confidence": fallback_res["category_confidence"],
                        "classification_method": "rule_based_fallback",
                        "model_used": "rule_based_baseline"
                    }

                return {
                    "category": predicted_category,
                    "category_confidence": round(confidence, 2),
                    "classification_method": "ml_transformer_pipeline",
                    "model_used": model_loader.config.get("model_type", "tfidf-logistic-regression") if model_loader.config else "tfidf-logistic-regression"
                }
            except Exception as e:
                logger.error(f"Error during ML inference: {e}. Executing rule-based fallback.")

        # Fallback to baseline rule-based classifier
        return {
            "category": fallback_res["category"],
            "category_confidence": fallback_res["category_confidence"],
            "classification_method": "rule_based_fallback",
            "model_used": "rule_based_baseline"
        }

ml_grievance_classifier = MLGrievanceClassifier()
