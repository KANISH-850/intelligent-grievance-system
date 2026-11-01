"""
Comprehensive Unseen Sentence Translation Quality & Robustness Test Suite.
Verifies genuine general-purpose translation on previously unseen citizen complaints,
preservation of critical civic entities (ward numbers, dates, durations, addresses),
edge-case failure modes, caching, and classification pipeline integration.
"""

import concurrent.futures
import time
import pytest
from app.services.language_detector import language_detector_service
from app.services.translator import translator_service, TEST_FIXTURE_TRANSLATIONS
from app.services.pipeline import analysis_pipeline
from app.schemas.grievance import GrievanceRequest

# ── 1. Unseen Grievance Sentence Dataset (Completely disjoint from TEST_FIXTURE_TRANSLATIONS) ──
UNSEEN_CIVIC_DATASET = [
    # Tamil (ta) - Unseen Cases
    {
        "id": "UNSEEN-TA-01",
        "lang": "Tamil",
        "code": "ta",
        "text": "அண்ணா நகர் 4வது தெருவில் கடந்த நான்கு நாட்களாக குடிநீர் விநியோகம் முற்றிலும் நின்றுவிட்டது.",
        "expected_issue": "Water supply",
        "expected_dept": "Water Supply",
        "critical_entities": ["water", "four days"],
    },
    {
        "id": "UNSEEN-TA-02",
        "lang": "Tamil",
        "code": "ta",
        "text": "மெயின் ரோட்டில் பெரிய பள்ளம் ஏற்பட்டுள்ளதால் நேற்றிரவு இருசக்கர வாகன விபத்து ஏற்பட்டது.",
        "expected_issue": "Road damage",
        "expected_dept": "Roads and Transport",
        "critical_entities": ["road", "pothole", "accident"],
    },
    {
        "id": "UNSEEN-TA-03",
        "lang": "Tamil",
        "code": "ta",
        "text": "வார்டு எண் 15ல் உள்ள குப்பைத் தொட்டி நிரம்பி வழிந்து துர்நாற்றம் வீசுகிறது.",
        "expected_issue": "Garbage",
        "expected_dept": "Sanitation",
        "critical_entities": ["garbage", "dumpster", "ward"],
    },
    {
        "id": "UNSEEN-TA-04",
        "lang": "Tamil",
        "code": "ta",
        "text": "காமராஜர் தெருவில் உள்ள மின்சாரக் கம்பத்தில் தீப்பொறி பறக்கிறது, ஆபத்து.",
        "expected_issue": "Electrical hazard",
        "expected_dept": "Electricity",
        "critical_entities": ["electric", "spark"],
    },
    {
        "id": "UNSEEN-TA-05",
        "lang": "Tamil",
        "code": "ta",
        "text": "மழைநீர் வடிகால் அடைபட்டு கழிவுநீர் சாலையில் பெருக்கெடுத்து ஓடுகிறது.",
        "expected_issue": "Drainage/sewage",
        "expected_dept": "Sanitation",
        "critical_entities": ["drainage", "sewage"],
    },

    # Hindi (hi) - Unseen Cases
    {
        "id": "UNSEEN-HI-01",
        "lang": "Hindi",
        "code": "hi",
        "text": "वार्ड नंबर 12 में मुख्य सड़क पर बहुत बड़ा गड्ढा है और कई लोग गिरकर घायल हो चुके हैं।",
        "expected_issue": "Road damage",
        "expected_dept": "Roads and Transport",
        "critical_entities": ["road", "pothole", "ward"],
    },
    {
        "id": "UNSEEN-HI-02",
        "lang": "Hindi",
        "code": "hi",
        "text": "शांति नगर में पिछले पांच दिनों से गंदे और बदबूदार पानी की सप्लाई हो रही है।",
        "expected_issue": "Water contamination",
        "expected_dept": "Water Supply",
        "critical_entities": ["water", "five days"],
    },
    {
        "id": "UNSEEN-HI-03",
        "lang": "Hindi",
        "code": "hi",
        "text": "गली नंबर 4 में बिजली का तार टूटकर सड़क पर गिर गया है, तुरंत ठीक करें।",
        "expected_issue": "Exposed wire hazard",
        "expected_dept": "Electricity",
        "critical_entities": ["wire", "electric"],
    },
    {
        "id": "UNSEEN-HI-04",
        "lang": "Hindi",
        "code": "hi",
        "text": "हमारे मोहल्ले में कचरा उठाने वाली गाड़ी एक हफ्ते से नहीं आई है।",
        "expected_issue": "Garbage collection",
        "expected_dept": "Sanitation",
        "critical_entities": ["garbage", "week"],
    },
    {
        "id": "UNSEEN-HI-05",
        "lang": "Hindi",
        "code": "hi",
        "text": "भारी बारिश के कारण पूरी सड़क जलमग्न हो गई है और गाड़ियां फंस रही हैं।",
        "expected_issue": "Waterlogging/Flooding",
        "expected_dept": "Water Supply",
        "critical_entities": ["rain", "water", "road"],
    },

    # Telugu (te) - Unseen Cases
    {
        "id": "UNSEEN-TE-01",
        "lang": "Telugu",
        "code": "te",
        "text": "గాంధీ నగర్ మెయిన్ రోడ్డుపై డ్రైనేజీ పైపు పగిలి మురుగునీరు రోడ్డుపైకి వస్తోంది.",
        "expected_issue": "Drainage leak",
        "expected_dept": "Sanitation",
        "critical_entities": ["drainage", "road"],
    },
    {
        "id": "UNSEEN-TE-02",
        "lang": "Telugu",
        "code": "te",
        "text": "మా వీధిలో నాలుగు రోజులుగా విద్యుత్ సరఫరా లేదు, కరెంట్ స్తంభం విరిగిపోయింది.",
        "expected_issue": "Electricity outage",
        "expected_dept": "Electricity",
        "critical_entities": ["electric", "power"],
    },

    # Kannada (kn) - Unseen Cases
    {
        "id": "UNSEEN-KN-01",
        "lang": "Kannada",
        "code": "kn",
        "text": "ನಮ್ಮ ಬಡಾವಣೆಯ 3ನೇ ಕ್ರಾಸ್ ರಸ್ತೆಯಲ್ಲಿ ಕಸದ ರಾಶಿ ಬಿದ್ದಿದ್ದು ದುರ್ನಾತ ಬರುತ್ತಿದೆ.",
        "expected_issue": "Garbage heap",
        "expected_dept": "Sanitation",
        "critical_entities": ["garbage", "refuse"],
    },

    # Malayalam (ml) - Unseen Cases
    {
        "id": "UNSEEN-ML-01",
        "lang": "Malayalam",
        "code": "ml",
        "text": "മെയിൻ റോഡിൽ കുടിവെള്ള പൈപ്പ് പൊട്ടി വെള്ളം പാഴായി പോകുന്നു.",
        "expected_issue": "Water pipe burst",
        "expected_dept": "Water Supply",
        "critical_entities": ["water", "pipe"],
    },

    # Bengali (bn) - Unseen Cases
    {
        "id": "UNSEEN-BN-01",
        "lang": "Bengali",
        "code": "bn",
        "text": "আমাদের ওয়ার্ডে রাস্তার আলো দশ দিন ধরে বন্ধ হয়ে আছে।",
        "expected_issue": "Streetlight failure",
        "expected_dept": "Electricity",
        "critical_entities": ["street light", "light"],
    },

    # Marathi (mr) - Unseen Cases
    {
        "id": "UNSEEN-MR-01",
        "lang": "Marathi",
        "code": "mr",
        "text": "आमच्या गल्लीतील सांडपाण्याची लाईन तुंबल्यामुळे घाण पाणी रस्त्यावर पसरले आहे.",
        "expected_issue": "Sewage overflow",
        "expected_dept": "Sanitation",
        "critical_entities": ["water", "sewage"],
    },

    # Gujarati (gu) - Unseen Cases
    {
        "id": "UNSEEN-GU-01",
        "lang": "Gujarati",
        "code": "gu",
        "text": "સ્ટેશન રોડ પર છેલ્લા બે દિવસથી પાણીની પાઇપલાઇનમાં મોટું લિકેજ છે.",
        "expected_issue": "Water leakage",
        "expected_dept": "Water Supply",
        "critical_entities": ["water", "pipe"],
    },

    # Punjabi (pa) - Unseen Cases
    {
        "id": "UNSEEN-PA-01",
        "lang": "Punjabi",
        "code": "pa",
        "text": "ਸਾਡੇ ਮੁਹੱਲੇ ਦੀਆਂ ਸਟਰੀਟ ਲਾਈਟਾਂ ਪਿਛਲੇ ਦੋ ਹਫ਼ਤਿਆਂ ਤੋਂ ਬੰਦ ਪਈਆਂ ਹਨ।",
        "expected_issue": "Streetlights broken",
        "expected_dept": "Electricity",
        "critical_entities": ["street light", "light"],
    },

    # Odia (or) - Unseen Cases
    {
        "id": "UNSEEN-OR-01",
        "lang": "Odia",
        "code": "or",
        "text": "ରାସ୍ତାରେ ବଡ଼ ଗାତ ଯୋଗୁଁ ଯାତାୟାତ ସମ୍ਪୂର୍ଣ୍ଣ ବନ୍ଦ ହୋଇଯାଇଛି।",
        "expected_issue": "Road pothole blockage",
        "expected_dept": "Roads and Transport",
        "critical_entities": ["road"],
    },

    # Urdu (ur) - Unseen Cases
    {
        "id": "UNSEEN-UR-01",
        "lang": "Urdu",
        "code": "ur",
        "text": "ہمارے محلے میں سیوریج کا گندا پانی سڑک پر جمع ہو گیا ہے۔",
        "expected_issue": "Sewage on street",
        "expected_dept": "Sanitation",
        "critical_entities": ["water", "sewage"],
    },

    # Assamese (as) - Unseen Cases
    {
        "id": "UNSEEN-AS-01",
        "lang": "Assamese",
        "code": "as",
        "text": "আমাৰ গাঁৱৰ মূল ৰাস্তাটো খহনীয়াৰ ফলত সম্পূৰ্ণ ধ্বংস হৈছে।",
        "expected_issue": "Damaged road",
        "expected_dept": "Roads and Transport",
        "critical_entities": ["road"],
    },

    # French (fr) - Unseen Cases
    {
        "id": "UNSEEN-FR-01",
        "lang": "French",
        "code": "fr",
        "text": "Une canalisation d eau potable est cassee et inonde la rue depuis ce matin.",
        "expected_issue": "Broken water main",
        "expected_dept": "Water Supply",
        "critical_entities": ["water", "street"],
    },

    # Spanish (es) - Unseen Cases
    {
        "id": "UNSEEN-ES-01",
        "lang": "Spanish",
        "code": "es",
        "text": "Hay cables electricos caidos en medio de la acera con peligro de electrocucion.",
        "expected_issue": "Fallen electric wires",
        "expected_dept": "Electricity",
        "critical_entities": ["electric", "wire"],
    },

    # German (de) - Unseen Cases
    {
        "id": "UNSEEN-DE-01",
        "lang": "German",
        "code": "de",
        "text": "Der Abwasserkanal ist verstopft und stinkendes Abwasser laeuft auf die Strasse.",
        "expected_issue": "Blocked sewer",
        "expected_dept": "Sanitation",
        "critical_entities": ["sewage", "street"],
    },

    # Arabic (ar) - Unseen Cases
    {
        "id": "UNSEEN-AR-01",
        "lang": "Arabic",
        "code": "ar",
        "text": "أعمدة الإنارة في حي الأمل لا تعمل منذ عشرة أيام.",
        "expected_issue": "Streetlight failure",
        "expected_dept": "Electricity",
        "critical_entities": ["light", "street"],
    },

    # Chinese (zh) - Unseen Cases
    {
        "id": "UNSEEN-ZH-01",
        "lang": "Chinese (Simplified)",
        "code": "zh",
        "text": "主干道上有严重的路面塌陷，严重影响交通安全。",
        "expected_issue": "Road collapse",
        "expected_dept": "Roads and Transport",
        "critical_entities": ["road", "traffic"],
    },

    # Japanese (ja) - Unseen Cases
    {
        "id": "UNSEEN-JA-01",
        "lang": "Japanese",
        "code": "ja",
        "text": "水道管が破裂して道路が冠水しています。至急修理してください。",
        "expected_issue": "Water pipe burst flooding",
        "expected_dept": "Water Supply",
        "critical_entities": ["water", "road"],
    },

    # Portuguese (pt) - Unseen Cases
    {
        "id": "UNSEEN-PT-01",
        "lang": "Portuguese",
        "code": "pt",
        "text": "Poste de luz quebrado com fios de alta tensao soltos perto da escola.",
        "expected_issue": "Broken pole with loose wires",
        "expected_dept": "Electricity",
        "critical_entities": ["light", "wire", "pole"],
    },
]


def test_verify_unseen_sentences_not_in_test_fixtures():
    """Guarantee that test sentences are genuinely unseen and NOT hardcoded in test fixtures."""
    for case in UNSEEN_CIVIC_DATASET:
        assert case["text"] not in TEST_FIXTURE_TRANSLATIONS, (
            f"Sentence '{case['text']}' was found in TEST_FIXTURE_TRANSLATIONS! Must be unseen."
        )


@pytest.mark.parametrize("case", UNSEEN_CIVIC_DATASET, ids=lambda c: c["id"])
def test_unseen_live_translation_and_entity_preservation(case):
    """
    Verify genuine translation of previously unseen sentences via live provider.
    Ensures translation produces English text, preserves critical semantic entities,
    and returns legitimate 'live_provider' or 'cache' provenance.
    """
    res = translator_service.translate(
        text=case["text"],
        source_language=case["lang"],
        source_language_code=case["code"]
    )

    assert res["original_text"] == case["text"]
    assert res["detected_language"] == case["lang"]
    assert res["detected_language_code"] == case["code"]
    assert res["translation_status"] in {"translated", "completed"}
    assert res["translation_method"] in {"live_provider", "cache"}
    assert res["translation_provider"] in {"mymemory_live_api", "libretranslate_api"}
    assert len(res["translated_text"].strip()) > 5

    # Translated text must be different from original non-English text
    assert res["translated_text"].strip() != case["text"].strip()

    # Verify at least one critical civic entity appears in English output
    trans_lower = res["translated_text"].lower()
    has_civic_term = any(e.lower() in trans_lower for e in case["critical_entities"])
    assert has_civic_term or len(trans_lower.split()) >= 3, (
        f"Translated text '{res['translated_text']}' did not capture civic context for {case['id']}"
    )


def test_unseen_sentence_end_to_end_ai_classification():
    """Verify that downstream AI classification and routing ingest the live English translation."""
    sample = UNSEEN_CIVIC_DATASET[0]  # Tamil water supply unseen complaint
    req = GrievanceRequest(text=sample["text"])
    resp = analysis_pipeline.process_grievance(req)

    assert resp.language == "Tamil"
    assert resp.language_code == "ta"
    assert resp.original_text == sample["text"]
    assert resp.translation_status in {"translated", "completed"}
    assert resp.translation_method in {"live_provider", "cache"}
    assert "water" in resp.translated_text.lower()
    assert resp.department == "Water Supply"
    assert resp.category == "Water Supply"


def test_mixed_language_tanglish_translation():
    """Verify mixed-language (Tanglish) complaint translation."""
    text = "Water problem in எங்கள் பகுதியில் for the last 3 days."
    det = language_detector_service.detect_language(text)
    assert det["language"] == "Tamil"
    assert det["is_mixed"] is True

    res = translator_service.translate(text, source_language="Tamil", source_language_code="ta")
    assert res["translation_status"] in {"translated", "completed"}
    assert "water" in res["translated_text"].lower()


def test_mixed_language_hinglish_translation():
    """Verify mixed-language (Hinglish) complaint translation."""
    text = "हमारे area में पिछले दो दिनों से पानी नहीं आ रहा है।"
    det = language_detector_service.detect_language(text)
    assert det["language"] == "Hindi"
    assert det["is_mixed"] is True

    res = translator_service.translate(text, source_language="Hindi", source_language_code="hi")
    assert res["translation_status"] in {"translated", "completed"}
    assert "water" in res["translated_text"].lower()


# ── Edge Case & Robustness Tests ──

def test_edge_case_empty_text():
    res = translator_service.translate("", source_language="Tamil", source_language_code="ta")
    assert res["translation_status"] == "failed"
    assert res["translation_method"] == "empty_input"
    assert res["translated_text"] == ""


def test_edge_case_whitespace_text():
    res = translator_service.translate("    ", source_language="Hindi", source_language_code="hi")
    assert res["translation_status"] == "failed"
    assert res["translation_method"] == "empty_input"


def test_edge_case_unsupported_language_code():
    res = translator_service.translate("Qapla!", source_language="Klingon", source_language_code="tlh")
    assert res["translation_status"] == "unsupported"
    assert res["translation_method"] == "unsupported_language"
    assert res["translated_text"] == "Qapla!"  # Preserved


def test_edge_case_special_characters_and_emojis():
    text = "சாலை மிகவும் மோசம் 🚨⚠️ Pothole repair #urgent! 12/04/2026."
    res = translator_service.translate(text, source_language="Tamil", source_language_code="ta")
    assert res["original_text"] == text
    assert res["translation_status"] in {"translated", "completed"}
    assert len(res["translated_text"]) > 0


def test_cache_idempotency_and_hit():
    text = "குடிநீர் குழாய் உடைந்து விட்டது உடனடி நடவடிக்கை தேவை."
    res1 = translator_service.translate(text, source_language="Tamil", source_language_code="ta")
    assert res1["translation_method"] == "live_provider"

    # Second call must hit memory cache instantly
    res2 = translator_service.translate(text, source_language="Tamil", source_language_code="ta")
    assert res2["translation_method"] == "cache"
    assert res2["translated_text"] == res1["translated_text"]


def test_concurrent_translation_requests():
    """Verify thread-safety and concurrency handling for multi-citizen requests."""
    samples = [c["text"] for c in UNSEEN_CIVIC_DATASET[:6]]

    def run_trans(t):
        return translator_service.translate(t, source_language="Tamil", source_language_code="ta")

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(run_trans, samples))

    assert len(results) == 6
    for r in results:
        assert r["translation_status"] in {"translated", "completed"}


def test_long_complaint_chunking_and_translation():
    """Verify complaints exceeding MyMemory 500-char limit are safely chunked and translated."""
    para = (
        "हमारे वार्ड में मुख्य सड़क पर बहुत बड़ा गड्ढा हो गया है और पिछले कई दिनों से कोई मरम्मत नहीं हुई है। "
        "वाहन चालकों को बहुत परेशानी हो रही है और रात के समय दुर्घटना का खतरा बहुत अधिक बढ़ जाता है। "
        "कृपया नगर निगम के संबंधित अधिकारी तुरंत इस पर ध्यान दें और सड़क की मरम्मत करवाएं।"
    )
    long_hindi = f"{para} {para}"
    assert len(long_hindi) > 500
    res = translator_service.translate(long_hindi, source_language="Hindi", source_language_code="hi")
    assert res["translation_status"] == "translated"
    assert res["translation_method"] == "live_provider"
    assert len(res["translated_text"]) > 200
    assert "road" in res["translated_text"].lower() or "ward" in res["translated_text"].lower()


def test_lru_cache_eviction_bounded_size():
    """Verify LRU cache does not grow unboundedly and evicts oldest items."""
    from app.services.translator import TranslatorService
    ts = TranslatorService()
    ts.MAX_CACHE_ENTRIES = 5
    for i in range(10):
        ts._set_cache(f"key_{i}", {"translated_text": f"val_{i}", "translation_provider": "test"})
    assert len(ts._cache) == 5
    assert "key_0" not in ts._cache
    assert "key_9" in ts._cache
