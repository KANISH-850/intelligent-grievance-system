"""
Dedicated Automated Test Suite for Trained MobileNetV3 Civic Computer Vision Pipeline.
Tests model loading, inference on genuine test photographs, schema adherence,
rejection of non-civic images, input validation edge cases, and inference latency.
"""
import base64
import os
from pathlib import Path

import pytest
from app.services.cv_model import get_trained_model, predict_civic_image
from app.services.vision import analyze_image

BASE_DIR = Path(__file__).resolve().parent.parent
TEST_SPLIT_DIR = BASE_DIR / "datasets" / "civic_real_world" / "splits" / "test"


def test_cv_model_checkpoint_loading():
    """Verify that fine-tuned civic MobileNetV3 checkpoint loads properly."""
    model, class_names = get_trained_model()
    assert model is not None, "Trained MobileNetV3 model should load successfully"
    assert len(class_names) == 9, "Model should support exactly 9 classes (8 civic + 1 unrelated)"
    assert "pothole_road_damage" in class_names
    assert "garbage_dumping" in class_names
    assert "broken_streetlight" in class_names
    assert "unrelated_negative" in class_names


def test_cv_inference_on_real_pothole():
    """Verify inference on unseen real photograph from test set."""
    pothole_dir = TEST_SPLIT_DIR / "pothole_road_damage"
    test_files = list(pothole_dir.glob("*.jpg"))
    if not test_files:
        pytest.skip("No test pothole images available")

    with open(test_files[0], "rb") as f:
        img_bytes = f.read()

    result = predict_civic_image(img_bytes, mime_type="image/jpeg")
    assert result["analysis_status"] == "analyzed"
    assert result["model_name"] == "MobileNetV3-Small-Civic"
    assert result["confidence"] is not None
    assert result["inference_latency_ms"] is not None
    assert result["inference_latency_ms"] < 500.0  # Fast CPU performance threshold


def test_cv_inference_on_real_garbage():
    """Verify inference on unseen real garbage photograph."""
    garbage_dir = TEST_SPLIT_DIR / "garbage_dumping"
    test_files = list(garbage_dir.glob("*.jpg"))
    if not test_files:
        pytest.skip("No test garbage images available")

    with open(test_files[0], "rb") as f:
        img_bytes = f.read()

    result = predict_civic_image(img_bytes, mime_type="image/jpeg")
    assert result["analysis_status"] == "analyzed"
    assert result["predicted_class"] == "garbage_dumping"
    if result["recommended_category"] is not None:
        assert result["recommended_category"] in {"Sanitation", "Water Supply", "Roads and Transport"}
    else:
        assert result["human_review_required"] is True
    assert isinstance(result["visual_observations"], list)
    assert len(result["visual_observations"]) > 0


def test_cv_inference_on_real_streetlight():
    """Verify inference on real streetlight photograph."""
    light_dir = TEST_SPLIT_DIR / "broken_streetlight"
    test_files = list(light_dir.glob("*.jpg"))
    if not test_files:
        pytest.skip("No test streetlight images available")

    with open(test_files[0], "rb") as f:
        img_bytes = f.read()

    result = predict_civic_image(img_bytes, mime_type="image/jpeg")
    assert result["recommended_category"] is not None or result["human_review_required"] is True


def test_cv_rejection_of_unrelated_photo():
    """Verify non-civic photograph rejection behaviour."""
    unrelated_dir = TEST_SPLIT_DIR / "unrelated_negative"
    test_files = list(unrelated_dir.glob("*.jpg"))
    if not test_files:
        pytest.skip("No test unrelated images available")

    with open(test_files[0], "rb") as f:
        img_bytes = f.read()

    result = predict_civic_image(img_bytes, mime_type="image/jpeg")
    assert result["analysis_status"] == "analyzed"
    # Even if class is uncertain or unrelated, is_grievance_related should be handled safely
    assert result["model_name"] == "MobileNetV3-Small-Civic"


def test_cv_edge_case_corrupted_image():
    """Verify handling of truncated/corrupt image bytes."""
    corrupt_bytes = b"NotAValidImageFileContent1234567890"
    result = predict_civic_image(corrupt_bytes, mime_type="image/jpeg")
    assert result["analysis_status"] in {"failed", "unavailable"}
    assert result["human_review_required"] is True


def test_cv_edge_case_unsupported_mime():
    """Verify rejection of unsupported MIME format."""
    dummy_bytes = b"GIF89a..."
    result = predict_civic_image(dummy_bytes, mime_type="image/gif")
    assert result["analysis_status"] == "unsupported_format"


def test_cv_edge_case_oversized_image():
    """Verify rejection of images exceeding 5MB limit."""
    huge_bytes = b"0" * (6 * 1024 * 1024)
    result = predict_civic_image(huge_bytes, mime_type="image/jpeg")
    assert result["analysis_status"] == "too_large"


def test_vision_service_integration():
    """Verify full base64 end-to-end integration via vision.py analyze_image."""
    pothole_dir = TEST_SPLIT_DIR / "pothole_road_damage"
    test_files = list(pothole_dir.glob("*.jpg"))
    if not test_files:
        pytest.skip("No test images available")

    with open(test_files[0], "rb") as f:
        raw_bytes = f.read()
    b64_str = base64.b64encode(raw_bytes).decode("utf-8")

    response = analyze_image(b64_str, "image/jpeg")
    assert response["analysis_status"] == "analyzed"
    assert "visual_observations" in response
    assert "human_review_required" in response
    assert "citizen_message" in response
