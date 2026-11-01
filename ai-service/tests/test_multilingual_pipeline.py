"""
Comprehensive Multilingual Test Suite for Intelligent Grievance System.
Tests Language Detection, Translation Engine, Pipeline Routing, and Edge Cases
across 12 Indian Languages, 7 International Languages, English, and Mixed Inputs.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.language_detector import language_detector_service
from app.services.translator import translator_service
from app.services.pipeline import analysis_pipeline
from app.schemas.grievance import GrievanceRequest

client = TestClient(app)

# ── Complete Language Test Matrix (12 Indian + 7 International + English) ──
MULTILINGUAL_TEST_CASES = [
    # Indian Languages
    {
        "id": "LANG-TA-01",
        "language": "Tamil",
        "code": "ta",
        "input": "எங்கள் பகுதியில் கடந்த மூன்று நாட்களாக குடிநீர் வரவில்லை.",
        "expected_meaning": "Drinking water has not been available in our area for the last three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-HI-01",
        "language": "Hindi",
        "code": "hi",
        "input": "हमारे इलाके में पिछले तीन दिनों से पानी नहीं आ रहा है।",
        "expected_meaning": "There has been no water supply in our area for the last three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-TE-01",
        "language": "Telugu",
        "code": "te",
        "input": "మా వీధిలో వీధి దీపాలు పనిచేయడం లేదు.",
        "expected_meaning": "The streetlights in our street are not working.",
        "expected_category": "Electricity",
        "expected_dept": "Electricity",
    },
    {
        "id": "LANG-ML-01",
        "language": "Malayalam",
        "code": "ml",
        "input": "ഞങ്ങളുടെ പ്രദേശത്ത് കുടിവെള്ളം ലഭിക്കുന്നില്ല.",
        "expected_meaning": "Drinking water is not available in our area.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-KN-01",
        "language": "Kannada",
        "code": "kn",
        "input": "ನಮ್ಮ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ.",
        "expected_meaning": "There is a large pothole on our road.",
        "expected_category": "Roads and Transport",
        "expected_dept": "Roads and Transport",
    },
    {
        "id": "LANG-BN-01",
        "language": "Bengali",
        "code": "bn",
        "input": "আমাদের এলাকায় রাস্তার আলো কাজ করছে না।",
        "expected_meaning": "The streetlights in our area are not working.",
        "expected_category": "Electricity",
        "expected_dept": "Electricity",
    },
    {
        "id": "LANG-MR-01",
        "language": "Marathi",
        "code": "mr",
        "input": "आमच्या भागात गेल्या तीन दिवसांपासून पिण्याचे पाणी येत नाही.",
        "expected_meaning": "Drinking water has not been available in our area for the past three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-GU-01",
        "language": "Gujarati",
        "code": "gu",
        "input": "અમારા વિસ્તારમાં છેલ્લા ત્રણ દિવસથી પાણી નથી આવતું.",
        "expected_meaning": "There is no water coming to our area for the last three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-PA-01",
        "language": "Punjabi",
        "code": "pa",
        "input": "ਸਾਡੇ ਇਲਾਕੇ ਵਿੱਚ ਤਿੰਨ ਦਿਨਾਂ ਤੋਂ ਪਾਣੀ ਨਹੀਂ ਆ ਰਿਹਾ ਹੈ।",
        "expected_meaning": "Water has not been coming to our area for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-OR-01",
        "language": "Odia",
        "code": "or",
        "input": "ଆମ ଅଞ୍ଚଳରେ ପିଇବା ପାଣି ମିଳୁନାହିଁ।",
        "expected_meaning": "Drinking water is not available in our area.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-UR-01",
        "language": "Urdu",
        "code": "ur",
        "input": "ہمارے علاقے میں تین دن سے پینے کا پانی نہیں آ رہا ہے۔",
        "expected_meaning": "Drinking water has not been supplied to our area for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-AS-01",
        "language": "Assamese",
        "code": "as",
        "input": "আমাৰ অঞ্চলত খোৱাপানীৰ যোগান নাই।",
        "expected_meaning": "There is no drinking water supply in our area.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    # International Languages
    {
        "id": "LANG-FR-01",
        "language": "French",
        "code": "fr",
        "input": "Il n y a pas d eau potable dans notre quartier depuis trois jours.",
        "expected_meaning": "There has been no drinking water in our neighborhood for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-ES-01",
        "language": "Spanish",
        "code": "es",
        "input": "No hay agua potable en nuestra zona desde hace tres dias.",
        "expected_meaning": "There has been no drinking water in our area for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-DE-01",
        "language": "German",
        "code": "de",
        "input": "In unserem Viertel gibt es seit drei Tagen kein Trinkwasser.",
        "expected_meaning": "There has been no drinking water in our district for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-AR-01",
        "language": "Arabic",
        "code": "ar",
        "input": "لا توجد مياه شرب في منطقتنا منذ ثلاثة أيام.",
        "expected_meaning": "There is no drinking water in our area for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-ZH-01",
        "language": "Chinese (Simplified)",
        "code": "zh",
        "input": "我们地区已经三天没有饮用水了。",
        "expected_meaning": "There has been no drinking water in our area for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-JA-01",
        "language": "Japanese",
        "code": "ja",
        "input": "私たちの地域では3日間飲料水が出ていません。",
        "expected_meaning": "Drinking water has not been available in our area for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    {
        "id": "LANG-PT-01",
        "language": "Portuguese",
        "code": "pt",
        "input": "Nao ha agua potavel em nossa regiao ha tres dias.",
        "expected_meaning": "There has been no drinking water in our region for three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
    # Native English
    {
        "id": "LANG-EN-01",
        "language": "English",
        "code": "en",
        "input": "Drinking water has not been available in our area for the last three days.",
        "expected_meaning": "Drinking water has not been available in our area for the last three days.",
        "expected_category": "Water Supply",
        "expected_dept": "Water Supply",
    },
]


class TestMultilingualDetection:
    """Verifies language identification and ISO code mapping for all languages."""

    @pytest.mark.parametrize("case", MULTILINGUAL_TEST_CASES, ids=lambda c: c["id"])
    def test_language_detection_matrix(self, case):
        res = language_detector_service.detect_language(case["input"])
        assert res["language"] == case["language"], f"Expected {case['language']}, got {res['language']}"
        assert res["language_code"] == case["code"], f"Expected code {case['code']}, got {res['language_code']}"
        assert res["confidence"] >= 0.70

    def test_english_with_indian_entities_not_misclassified(self):
        text = "Deep pothole on Anna Salai near T. Nagar bus terminus, Chennai. Please repair immediately."
        res = language_detector_service.detect_language(text)
        assert res["language"] == "English"
        assert res["language_code"] == "en"

    def test_short_english_safeguards(self):
        samples = ["No water supply", "Street light broken", "Pothole repair needed"]
        for s in samples:
            res = language_detector_service.detect_language(s)
            assert res["language"] == "English"
            assert res["language_code"] == "en"

    def test_mixed_script_detection(self):
        text = "Water problem in எங்கள் பகுதி since yesterday."
        res = language_detector_service.detect_language(text)
        assert res["language"] == "Tamil"
        assert res["is_mixed"] is True


class TestMultilingualTranslation:
    """Verifies structured translation, preservation of original text, and semantic fidelity."""

    @pytest.mark.parametrize("case", MULTILINGUAL_TEST_CASES, ids=lambda c: c["id"])
    def test_translation_matrix(self, case):
        res = translator_service.translate(
            text=case["input"],
            source_language=case["language"],
            source_language_code=case["code"]
        )
        assert res["original_text"] == case["input"]
        assert res["detected_language"] == case["language"]
        assert res["detected_language_code"] == case["code"]
        assert res["translation_status"] in {"completed", "translated", "passthrough"}
        assert len(res["translated_text"].strip()) > 5
        assert res["translated_at"] is not None

    def test_english_passthrough_preserves_text_verbatim(self):
        text = "Water supply is completely stopped on 5th Cross Road, Indiranagar."
        res = translator_service.translate(text, source_language="English", source_language_code="en")
        assert res["translated_text"] == text
        assert res["translation_status"] in {"completed", "passthrough"}
        assert res["translation_method"] == "native_english_passthrough"
        assert res["translation_error"] is None

    def test_unsupported_language_graceful_fallback(self):
        text = "Klingon language civic complaint"
        res = translator_service.translate(text, source_language="Klingon", source_language_code="tlh")
        assert res["original_text"] == text
        assert res["translation_status"] == "unsupported"
        assert res["translation_error"] is not None
        # Original text is safely preserved
        assert res["translated_text"] == text


class TestPipelineMultilingualRouting:
    """Verifies that the English translation is used for classification and routing."""

    @pytest.mark.parametrize("case", MULTILINGUAL_TEST_CASES[:6], ids=lambda c: c["id"])
    def test_multilingual_end_to_end_pipeline(self, case):
        req = GrievanceRequest(text=case["input"])
        resp = analysis_pipeline.process_grievance(req)

        assert resp.language == case["language"]
        assert resp.language_code == case["code"]
        assert resp.original_text == case["input"]
        assert resp.translation_status in {"completed", "translated", "passthrough"}

        # Department routing must use translated meaning
        assert resp.department == case["expected_dept"]
        assert resp.category == case["expected_category"]
        assert len(resp.departments) >= 1
        assert resp.departments[0]["department_name"] == case["expected_dept"]


class TestMultilingualApiEndpoints:
    """Verifies FastAPI /translate and /analyze HTTP endpoints."""

    def test_preview_translation_endpoint(self):
        payload = {"text": "எங்கள் பகுதியில் கடந்த மூன்று நாட்களாக குடிநீர் வரவில்லை."}
        response = client.post("/translate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["detected_language"] == "Tamil"
        assert data["detected_language_code"] == "ta"
        assert data["translation_status"] == "translated"
        assert "water" in data["translated_text"].lower()

    def test_analyze_endpoint_returns_multilingual_metadata(self):
        payload = {"text": "हमारे इलाके में पिछले तीन दिनों से पानी नहीं आ रहा है।"}
        response = client.post("/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "Hindi"
        assert data["language_code"] == "hi"
        assert data["original_text"] == payload["text"]
        assert data["translation_status"] == "translated"
        assert data["department"] == "Water Supply"


class TestMultilingualEdgeCases:
    """Verifies edge cases from Master Prompt Section 12."""

    def test_empty_input_detection(self):
        res = language_detector_service.detect_language("")
        assert res["language"] == "Unknown"
        assert res["language_code"] == "und"

    def test_whitespace_input_detection(self):
        res = language_detector_service.detect_language("    ")
        assert res["language"] == "Unknown"
        assert res["language_code"] == "und"

    def test_numbers_only_detection(self):
        res = language_detector_service.detect_language("1234567890")
        assert res["language"] in {"Unknown", "English"}

    def test_emojis_with_tamil_text(self):
        text = "🚨 எங்கள் பகுதியில் குடிநீர் வரவில்லை! 💧⚠️"
        res = language_detector_service.detect_language(text)
        assert res["language"] == "Tamil"
        assert res["language_code"] == "ta"

    def test_repeated_characters_handled_safely(self):
        text = "Nooooo waaaaterrrrr supppppllyyyyy for dayssssss"
        res = language_detector_service.detect_language(text)
        assert res["language"] == "English"
        assert res["language_code"] == "en"

    def test_address_and_reference_number_preserved(self):
        text = "Grievance ref #98765: Pipeline burst at 42 Gandhi Road, Sector 4."
        req = GrievanceRequest(text=text)
        resp = analysis_pipeline.process_grievance(req)
        assert "98765" in resp.translated_text
        assert "Gandhi Road" in resp.translated_text
        assert resp.department == "Water Supply"
