import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ml.model_loader import model_loader
from app.services.ml.classifier import ml_grievance_classifier
from app.services.ml.predictor import ml_priority_predictor

client = TestClient(app)

def test_ml_model_loader():
    """Verify ML model singleton is loaded."""
    assert model_loader.is_loaded is True
    assert model_loader.model is not None
    assert model_loader.config is not None
    assert "model_type" in model_loader.config

def test_ml_classification_response_structure():
    """Verify /analyze response contains Phase 10 ML metadata fields."""
    payload = {"text": "No water supply in our street for 3 days."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Water Supply"
    assert data["category_confidence"] > 0.0
    assert "model_used" in data
    assert "classification_method" in data
    assert data["processing_time_ms"] is not None

def test_multilingual_queries():
    """Test regional language grievances across multiple Indian languages."""
    languages_tests = [
        ("No drinking water in Ward 10", "Water Supply", "English"),
        ("எங்கள் பகுதியில் மூன்று நாட்களாக தண்ணீர் வரவில்லை.", "Water Supply", "Tamil"),
        ("हमारे इलाके में दो दिन से बिजली नहीं आ रही है।", "Electricity", "Hindi"),
    ]
    for text, expected_category, expected_lang in languages_tests:
        response = client.post("/analyze", json={"text": text})
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == expected_category
        assert data["language"] == expected_lang

def test_priority_prediction_levels():
    """Verify LOW, MEDIUM, HIGH, CRITICAL priority calculations."""
    # Emergency keyword -> CRITICAL
    res1 = ml_priority_predictor.predict_priority("Gas leak and fire near residential apartment", "Electricity")
    assert res1["priority"] == "CRITICAL"
    assert res1["priority_confidence"] >= 0.85

    # High urgency -> HIGH
    res2 = ml_priority_predictor.predict_priority("Deep dangerous potholes on main ring road", "Roads and Transport")
    assert res2["priority"] in ["HIGH", "CRITICAL"]

    # Normal inquiry -> LOW
    res3 = ml_priority_predictor.predict_priority("Requesting update on birth certificate application status", "Municipal Services")
    assert res3["priority"] in ["LOW", "MEDIUM"]

def test_fallback_mechanism():
    """Verify system degrades to fallback without crashing if model is unavailable."""
    original_loaded = model_loader._loaded
    original_model = model_loader._model
    try:
        model_loader._loaded = True  # Prevent re-loading from disk
        model_loader._model = None   # Force model object to None
        res = ml_grievance_classifier.classify("No water supply in tap")
        assert res["category"] == "Water Supply"
        assert res["classification_method"] == "rule_based_fallback"
    finally:
        model_loader._loaded = original_loaded
        model_loader._model = original_model

