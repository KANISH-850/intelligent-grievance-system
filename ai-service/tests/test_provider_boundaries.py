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


def test_vision_provider_receives_actual_image_bytes(monkeypatch):
    monkeypatch.setattr(settings, "VISION_API_URL", "https://vision.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "VISION_API_KEY", "server-secret")
    observed = {}

    def post(url, **kwargs):
        observed.update(kwargs)
        content = '{"image_description":"A damaged road surface","detected_issue":"Road damage","observations":["Large broken patch in the road"],"human_review_required":true}'
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"choices": [{"message": {"content": content}}]})

    monkeypatch.setattr(vision.httpx, "post", post)
    payload = base64.b64encode(b"test image bytes").decode("ascii")
    result = vision.analyze_image(payload, "image/jpeg")
    sent_content = observed["json"]["messages"][1]["content"][1]["image_url"]["url"]
    assert payload in sent_content
    assert result["analysis_status"] == "analyzed"
    assert result["detected_issue"] == "Road damage"
    assert result["confidence"] is None


def test_vision_missing_credentials_and_unsupported_format(monkeypatch):
    monkeypatch.setattr(settings, "VISION_API_URL", None)
    monkeypatch.setattr(settings, "VISION_API_KEY", None)
    assert vision.analyze_image("YWJj", "image/jpeg")["analysis_status"] == "unavailable"
    assert vision.analyze_image("YWJj", "image/gif")["analysis_status"] == "unsupported_format"


def test_vision_provider_error_returns_reviewable_failure(monkeypatch):
    monkeypatch.setattr(settings, "VISION_API_URL", "https://vision.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "VISION_API_KEY", "server-secret")
    monkeypatch.setattr(vision.httpx, "post", lambda *a, **k: (_ for _ in ()).throw(vision.httpx.TimeoutException("timeout")))
    result = vision.analyze_image("YWJj", "image/jpeg")
    assert result["analysis_status"] == "failed"
    assert result["human_review_required"] is True


def test_vision_markdown_fences_and_issue_normalization(monkeypatch):
    monkeypatch.setattr(settings, "VISION_API_URL", "https://vision.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "VISION_API_KEY", "server-secret")

    def post(url, **kwargs):
        content = "```json\n{\"image_description\":\"Overflowing community trash bin\",\"detected_issue\":\"Garbage dump on roadside\",\"observations\":\"Visible plastic and debris\"}\n```"
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"choices": [{"message": {"content": content}}]})

    monkeypatch.setattr(vision.httpx, "post", post)
    payload = base64.b64encode(b"test image bytes").decode("ascii")
    result = vision.analyze_image(payload, "image/jpeg")
    assert result["analysis_status"] == "analyzed"
    assert result["detected_issue"] == "Garbage/sanitation"
    assert "Visible plastic and debris" in result["observations"]
    assert result["human_review_required"] is True


def test_vision_unrelated_image_rejection(monkeypatch):
    monkeypatch.setattr(settings, "VISION_API_URL", "https://vision.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "VISION_API_KEY", "server-secret")

    def post(url, **kwargs):
        content = json.dumps({
            "is_grievance_related": False,
            "image_type": "unrelated",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "A portrait selfie of a person indoors smiling.",
            "recommended_category": None,
            "recommended_department": None,
            "additional_departments": [],
            "visual_observations": ["Person smiling", "Indoor room wall"],
            "human_review_required": False,
            "citizen_message": "This image does not appear to contain a recognizable civic or public-service issue."
        })
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"choices": [{"message": {"content": content}}]})

    monkeypatch.setattr(vision.httpx, "post", post)
    payload = base64.b64encode(b"selfie bytes").decode("ascii")
    result = vision.analyze_image(payload, "image/jpeg")

    assert result["analysis_status"] == "analyzed"
    assert result["is_grievance_related"] is False
    assert result["image_type"] == "unrelated"
    assert result["detected_issue"] is None
    assert result["recommended_category"] is None
    assert result["recommended_department"] is None
    assert "This image does not appear to contain a recognizable civic" in result["citizen_message"]


def test_vision_uncertain_blurry_image(monkeypatch):
    monkeypatch.setattr(settings, "VISION_API_URL", "https://vision.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "VISION_API_KEY", "server-secret")

    def post(url, **kwargs):
        content = json.dumps({
            "is_grievance_related": False,
            "image_type": "uncertain",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "Extremely dark and blurry image with unidentifiable shapes.",
            "recommended_category": None,
            "recommended_department": None,
            "visual_observations": ["Blurry artifacts"],
            "human_review_required": True,
            "citizen_message": "The image is too blurry to identify a civic defect."
        })
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"choices": [{"message": {"content": content}}]})

    monkeypatch.setattr(vision.httpx, "post", post)
    payload = base64.b64encode(b"blurry bytes").decode("ascii")
    result = vision.analyze_image(payload, "image/jpeg")

    assert result["analysis_status"] == "analyzed"
    assert result["image_type"] == "uncertain"
    assert result["human_review_required"] is True
    assert result["recommended_department"] is None


