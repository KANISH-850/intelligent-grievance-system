"""Representative test suite for 16 vision inspection cases.

Verifies that the vision pipeline correctly analyzes, normalizes, categorizes,
or rejects each of the 16 representative defect and non-defect scenarios.
"""
import base64
import json
from types import SimpleNamespace
import pytest

from app.core.config import settings
from app.services import vision

# 16 Representative test cases matching Master Prompt specification
REPRESENTATIVE_CASES = [
    {
        "id": "CASE-01",
        "name": "Pothole",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Road damage",
            "issue_description": "Deep asphalt pothole cavity with loose aggregate on street.",
            "recommended_category": "Roads and Transport",
            "recommended_department": "Roads and Transport",
            "visual_observations": ["Asphalt crater", "Loose gravel"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Road damage",
        "expected_dept": "Roads and Transport",
    },
    {
        "id": "CASE-02",
        "name": "Damaged road",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Broken road surface",
            "issue_description": "Extensive road surface cracking and missing asphalt layer.",
            "recommended_category": "Roads and Transport",
            "recommended_department": "Roads and Transport",
            "visual_observations": ["Cracked road", "Eroded edge"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Road damage",
        "expected_dept": "Roads and Transport",
    },
    {
        "id": "CASE-03",
        "name": "Garbage accumulation",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Garbage/sanitation",
            "issue_description": "Overflowing waste pile spilling onto public footpath.",
            "recommended_category": "Sanitation",
            "recommended_department": "Sanitation",
            "visual_observations": ["Plastic bags", "Organic waste heap"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Garbage/sanitation",
        "expected_dept": "Sanitation",
    },
    {
        "id": "CASE-04",
        "name": "Water leakage",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Waterlogging/leakage",
            "issue_description": "Municipal drinking water pipe burst with high-pressure water spray.",
            "recommended_category": "Water Supply",
            "recommended_department": "Water Supply",
            "visual_observations": ["Broken joint", "Water jet"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Waterlogging/leakage",
        "expected_dept": "Water Supply",
    },
    {
        "id": "CASE-05",
        "name": "Blocked drainage",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Sewage overflow from blocked drain",
            "issue_description": "Blocked storm-water drain choking with silt and overflowing onto pavement.",
            "recommended_category": "Sanitation",
            "recommended_department": "Sanitation",
            "visual_observations": ["Clogged drain grating", "Black sewage"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Garbage/sanitation",
        "expected_dept": "Sanitation",
    },
    {
        "id": "CASE-06",
        "name": "Broken streetlight",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Electrical infrastructure damage",
            "issue_description": "Shattered public streetlight fixture dangling from pole.",
            "recommended_category": "Electricity",
            "recommended_department": "Electricity",
            "visual_observations": ["Dangling fixture", "Exposed wiring"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Electrical infrastructure damage",
        "expected_dept": "Electricity",
    },
    {
        "id": "CASE-07",
        "name": "Exposed electrical wires",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Electrical wire hanging hazard",
            "issue_description": "Low-hanging uninsulated power cable near pedestrian walkway.",
            "recommended_category": "Electricity",
            "recommended_department": "Electricity",
            "visual_observations": ["Live cable within reach", "Damaged pole"],
            "human_review_required": True,
        },
        "expected_related": True,
        "expected_issue": "Electrical infrastructure damage",
        "expected_dept": "Electricity",
    },
    {
        "id": "CASE-08",
        "name": "Waterlogging",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Waterlogging on road",
            "issue_description": "Knee-deep standing rainwater submerging entire road intersection.",
            "recommended_category": "Water Supply",
            "recommended_department": "Water Supply",
            "visual_observations": ["Submerged road", "Stagnant pool"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Waterlogging/leakage",
        "expected_dept": "Water Supply",
    },
    {
        "id": "CASE-09",
        "name": "Damaged public infrastructure",
        "mock_response": {
            "is_grievance_related": True,
            "image_type": "civic_issue",
            "issue_detected": True,
            "detected_issue": "Public infrastructure damage",
            "issue_description": "Vandalized public bus shelter with collapsed metal roof.",
            "recommended_category": "Municipal Services",
            "recommended_department": "Municipal Services",
            "visual_observations": ["Collapsed roof", "Bent metal frame"],
            "human_review_required": False,
        },
        "expected_related": True,
        "expected_issue": "Public infrastructure damage",
        "expected_dept": "Municipal Services",
    },
    {
        "id": "CASE-10",
        "name": "Normal portrait",
        "mock_response": {
            "is_grievance_related": False,
            "image_type": "unrelated",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "Close-up portrait of a woman indoors smiling at the camera.",
            "recommended_category": None,
            "recommended_department": None,
            "visual_observations": ["Person", "Face"],
            "human_review_required": False,
            "citizen_message": "This image does not appear to contain a recognizable civic or public-service issue.",
        },
        "expected_related": False,
        "expected_issue": None,
        "expected_dept": None,
    },
    {
        "id": "CASE-11",
        "name": "Dog or other animal",
        "mock_response": {
            "is_grievance_related": False,
            "image_type": "unrelated",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "A domestic golden retriever dog resting on grass in a garden.",
            "recommended_category": None,
            "recommended_department": None,
            "visual_observations": ["Dog", "Grass lawn"],
            "human_review_required": False,
        },
        "expected_related": False,
        "expected_issue": None,
        "expected_dept": None,
    },
    {
        "id": "CASE-12",
        "name": "Food photograph",
        "mock_response": {
            "is_grievance_related": False,
            "image_type": "unrelated",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "A plate of rice, curry, and vegetables on a restaurant dining table.",
            "recommended_category": None,
            "recommended_department": None,
            "visual_observations": ["Food plate", "Dining table"],
            "human_review_required": False,
        },
        "expected_related": False,
        "expected_issue": None,
        "expected_dept": None,
    },
    {
        "id": "CASE-13",
        "name": "General landscape",
        "mock_response": {
            "is_grievance_related": False,
            "image_type": "unrelated",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "Scenic landscape view of green hills and clouds under sunlight.",
            "recommended_category": None,
            "recommended_department": None,
            "visual_observations": ["Mountains", "Sky", "Trees"],
            "human_review_required": False,
        },
        "expected_related": False,
        "expected_issue": None,
        "expected_dept": None,
    },
    {
        "id": "CASE-14",
        "name": "Unrelated screenshot",
        "mock_response": {
            "is_grievance_related": False,
            "image_type": "unrelated",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "Mobile phone screenshot of a chat messaging application conversation.",
            "recommended_category": None,
            "recommended_department": None,
            "visual_observations": ["Text bubbles", "UI elements"],
            "human_review_required": False,
        },
        "expected_related": False,
        "expected_issue": None,
        "expected_dept": None,
    },
    {
        "id": "CASE-15",
        "name": "Blurry civic photograph",
        "mock_response": {
            "is_grievance_related": False,
            "image_type": "uncertain",
            "issue_detected": False,
            "detected_issue": None,
            "issue_description": "Heavily motion-blurred, dark photograph with indistinguishable shapes.",
            "recommended_category": None,
            "recommended_department": None,
            "visual_observations": ["Blur artifacts", "Dark lighting"],
            "human_review_required": True,
            "citizen_message": "The uploaded image is too blurry to identify a civic defect.",
        },
        "expected_related": False,
        "expected_issue": None,
        "expected_dept": None,
    },
]


@pytest.mark.parametrize("case", REPRESENTATIVE_CASES, ids=[c["id"] for c in REPRESENTATIVE_CASES])
def test_representative_vision_case(monkeypatch, case):
    monkeypatch.setattr(settings, "VISION_API_URL", "https://vision.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "VISION_API_KEY", "server-secret")

    def post(url, **kwargs):
        content = json.dumps(case["mock_response"])
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"choices": [{"message": {"content": content}}]})

    monkeypatch.setattr(vision.httpx, "post", post)
    payload = base64.b64encode(b"dummy image bytes").decode("ascii")
    result = vision.analyze_image(payload, "image/jpeg")

    assert result["analysis_status"] == "analyzed"
    assert result["is_grievance_related"] == case["expected_related"]
    assert result["detected_issue"] == case["expected_issue"]
    assert result["recommended_department"] == case["expected_dept"]

    if not case["expected_related"]:
        assert result["recommended_category"] is None
        assert "citizen_message" in result and len(result["citizen_message"]) > 0


def test_case_16_invalid_corrupted_image(monkeypatch):
    monkeypatch.setattr(settings, "VISION_API_URL", "https://vision.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "VISION_API_KEY", "server-secret")

    # Invalid base64 payload
    result = vision.analyze_image("not-valid-base64-content!@#$", "image/jpeg")
    assert result["analysis_status"] == "failed"
    assert result["human_review_required"] is True
    assert result["is_grievance_related"] is False
