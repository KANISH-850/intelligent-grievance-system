import base64
import json
from types import SimpleNamespace

from app.core.config import settings
from app.services import translator, vision


def test_translation_uses_configured_provider_and_rejects_passthrough(monkeypatch):
    monkeypatch.setattr(settings, "TRANSLATION_API_URL", "https://translation.invalid/translate")
    monkeypatch.setattr(settings, "TRANSLATION_API_KEY", "server-secret")
    calls = []

    def post(url, **kwargs):
        calls.append((url, kwargs))
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"translatedText": "There is a pothole on the road."})

    monkeypatch.setattr(translator.httpx, "post", post)
    result = translator.translator_service.translate("சாலையில் பள்ளம் உள்ளது", "Tamil")
    assert calls[0][0] == "https://translation.invalid/translate"
    assert calls[0][1]["json"]["q"] == "சாலையில் பள்ளம் உள்ளது"
    assert result["translated_text"] == "There is a pothole on the road."
    assert result["translation_status"] == "translated"


def test_translation_provider_failure_preserves_original_and_reports_failure(monkeypatch):
    monkeypatch.setattr(settings, "TRANSLATION_API_URL", "https://translation.invalid/translate")
    monkeypatch.setattr(translator.httpx, "post", lambda *a, **k: (_ for _ in ()).throw(translator.httpx.TimeoutException("timeout")))
    source = "हमें पानी नहीं मिल रहा"
    result = translator.translator_service.translate(source, "Hindi")
    assert result["translated_text"] == source
    assert result["translation_status"] == "failed"


def test_indic_language_codes_and_native_english_passthrough(monkeypatch):
    monkeypatch.setattr(settings, "TRANSLATION_API_URL", "https://translation.invalid/translate")
    calls = []

    def post(url, **kwargs):
        calls.append(kwargs["json"]["source"])
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"translatedText": "English translation"})

    monkeypatch.setattr(translator.httpx, "post", post)
    for language, code in [("Hindi", "hi"), ("Tamil", "ta"), ("Telugu", "te"), ("Malayalam", "ml")]:
        result = translator.translator_service.translate("complaint text", language)
        assert result["translation_status"] == "translated"
        assert calls[-1] == code
    before = len(calls)
    native = translator.translator_service.translate("English complaint", "English")
    assert native["translated_text"] == "English complaint"
    assert native["translation_status"] == "passthrough"
    assert len(calls) == before


def test_vision_unsupported_format():
    assert vision.analyze_image("YWJj", "image/gif")["analysis_status"] == "unsupported_format"


def test_vision_invalid_base64_payload():
    result = vision.analyze_image("not-valid-base64!@#$", "image/jpeg")
    assert result["analysis_status"] == "failed"
    assert result["human_review_required"] is True
    assert result["is_grievance_related"] is False


def test_vision_oversized_payload():
    huge_bytes = b"0" * (6 * 1024 * 1024)
    huge_b64 = base64.b64encode(huge_bytes).decode("ascii")
    result = vision.analyze_image(huge_b64, "image/jpeg")
    assert result["analysis_status"] == "too_large"
    assert result["human_review_required"] is True


def test_vision_corrupted_image_bytes():
    corrupted_b64 = base64.b64encode(b"not a valid jpeg or png image").decode("ascii")
    result = vision.analyze_image(corrupted_b64, "image/jpeg")
    assert result["analysis_status"] in {"failed", "unavailable"}
    assert result["human_review_required"] is True


def test_vision_valid_image_mobilenet_inference():
    # 1x1 black pixel JPEG
    sample_jpeg_b64 = (
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////"
        "wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    )
    result = vision.analyze_image(sample_jpeg_b64, "image/jpeg")
    assert result["analysis_status"] == "analyzed"
    assert result["model_name"] == "MobileNetV3-Small-Civic"
    assert "detected_issue" in result
    assert "visual_observations" in result
    assert isinstance(result["visual_observations"], list)



