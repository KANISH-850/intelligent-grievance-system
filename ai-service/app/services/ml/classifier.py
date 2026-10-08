import re
import os
import logging
from typing import Dict, Any, List

from app.services.ml.model_loader import model_loader
from app.services.classifier import grievance_classifier_service

logger = logging.getLogger("ai_service.ml_classifier")

# Configurable confidence thresholds from environment
AI_CONFIDENCE_THRESHOLD = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.75"))
AI_LOW_CONFIDENCE_THRESHOLD = float(os.getenv("AI_LOW_CONFIDENCE_THRESHOLD", "0.50"))


def extract_explanation_terms(pipeline, text: str, predicted_category: str) -> Dict[str, Any]:
    """
    Computes explainability (XAI) for TF-IDF + Logistic Regression classification.
    Calculates exact token contribution scores = TF-IDF feature value * Logistic Regression coefficient
    for the predicted category.
    """
    try:
        tfidf = pipeline.named_steps.get("tfidf")
        clf = pipeline.named_steps.get("classifier")
        
        if not tfidf or not clf:
            return {"method": "tfidf_feature_contribution", "top_terms": []}

        classes = list(clf.classes_)
        if predicted_category not in classes:
            return {"method": "tfidf_feature_contribution", "top_terms": []}

        class_idx = classes.index(predicted_category)

        # Transform text to TF-IDF vector
        X_vec = tfidf.transform([text])
        feature_names = tfidf.get_feature_names_out()
        non_zero_indices = X_vec.nonzero()[1]

        if len(non_zero_indices) == 0:
            # Fallback to token extraction if no TF-IDF features match
            words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', text) if w.lower() not in {"the", "and", "for", "our", "in"}]
            return {"method": "keyword_matching_fallback", "top_terms": words[:3]}

        coefs = clf.coef_[class_idx]
        contributions = []
        for idx in non_zero_indices:
            term = feature_names[idx]
            val = X_vec[0, idx]
            weight = coefs[idx]
            score = val * weight
            contributions.append((term, float(score)))

        # Sort terms by highest positive score contribution
        contributions.sort(key=lambda x: x[1], reverse=True)
        top_terms = [t for t, s in contributions if s > 0][:4]
        
        if not top_terms:
            top_terms = [t for t, s in contributions[:3]]

        return {
            "method": "tfidf_feature_contribution",
            "top_terms": top_terms
        }
    except Exception as e:
        logger.warning(f"Error computing XAI explanation: {e}")
        return {"method": "tfidf_feature_contribution", "top_terms": []}


class MLGrievanceClassifier:
    """
    TF-IDF + Logistic Regression Classification Service with Hybrid Baseline Fallback,
    Explainability (XAI), and Confidence Thresholding.
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
                # 1. Indic Script Fallback
                if has_non_ascii and fallback_res["category"] != "Other":
                    conf = fallback_res["category_confidence"]
                    conf_level = "HIGH" if conf >= AI_CONFIDENCE_THRESHOLD else ("MEDIUM" if conf >= AI_LOW_CONFIDENCE_THRESHOLD else "LOW")
                    review_req = conf < AI_CONFIDENCE_THRESHOLD
                    
                    return {
                        "category": fallback_res["category"],
                        "category_confidence": conf,
                        "confidence_level": conf_level,
                        "ai_review_required": review_req,
                        "classification_method": "indic_keyword_fallback",
                        "model_used": "rule_based_baseline",
                        "explanation": {
                            "method": "indic_keyword_matching",
                            "top_terms": [fallback_res["category"].lower()]
                        }
                    }

                pipeline = model_loader.model
                probs = pipeline.predict_proba([text])[0]
                classes = pipeline.classes_

                best_idx = probs.argmax()
                predicted_category = classes[best_idx]
                confidence = float(probs[best_idx])

                # Out of domain fallback
                if confidence < 0.35 and fallback_res["category"] == "Other":
                    return {
                        "category": "Other",
                        "category_confidence": 0.40,
                        "confidence_level": "LOW",
                        "ai_review_required": True,
                        "classification_method": "out_of_domain_fallback",
                        "model_used": "rule_based_baseline",
                        "explanation": {
                            "method": "out_of_domain",
                            "top_terms": []
                        }
                    }

                # Keyword override for low ML confidence
                if fallback_res["category"] != "Other" and confidence < 0.45:
                    conf = fallback_res["category_confidence"]
                    return {
                        "category": fallback_res["category"],
                        "category_confidence": conf,
                        "confidence_level": "MEDIUM",
                        "ai_review_required": True,
                        "classification_method": "rule_based_fallback",
                        "model_used": "rule_based_baseline",
                        "explanation": {
                            "method": "rule_based_keyword_matching",
                            "top_terms": [fallback_res["category"].lower()]
                        }
                    }

                # Evaluate confidence thresholds
                rounded_conf = round(confidence, 2)
                if rounded_conf >= AI_CONFIDENCE_THRESHOLD:
                    conf_level = "HIGH"
                    review_req = False
                elif rounded_conf >= AI_LOW_CONFIDENCE_THRESHOLD:
                    conf_level = "MEDIUM"
                    review_req = True
                else:
                    conf_level = "LOW"
                    review_req = True

                explanation = extract_explanation_terms(pipeline, text, predicted_category)

                return {
                    "category": predicted_category,
                    "category_confidence": rounded_conf,
                    "confidence_level": conf_level,
                    "ai_review_required": review_req,
                    "classification_method": "tfidf_logistic_regression",
                    "model_used": model_loader.config.get("model_type", "tfidf-logistic-regression") if model_loader.config else "tfidf-logistic-regression",
                    "explanation": explanation
                }
            except Exception as e:
                logger.error(f"Error during ML inference: {e}. Executing rule-based fallback.")

        # Fallback to baseline rule-based classifier
        conf = fallback_res["category_confidence"]
        return {
            "category": fallback_res["category"],
            "category_confidence": conf,
            "confidence_level": "LOW" if conf < 0.50 else "MEDIUM",
            "ai_review_required": True,
            "classification_method": "rule_based_fallback",
            "model_used": "rule_based_baseline",
            "explanation": {
                "method": "rule_based_keyword_matching",
                "top_terms": [fallback_res["category"].lower()] if fallback_res["category"] != "Other" else []
            }
        }

ml_grievance_classifier = MLGrievanceClassifier()
