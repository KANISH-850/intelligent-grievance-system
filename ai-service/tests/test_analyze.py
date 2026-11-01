import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Verify GET /health returns status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-service"

def test_english_water_complaint():
    """Test 1: English water supply complaint."""
    payload = {"text": "There has been no water supply in our area for three days."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "English"
    assert data["category"] == "Water Supply"
    assert data["department"] == "Water Supply"
    assert data["priority"] in ["HIGH", "CRITICAL"]
    assert 0.0 <= data["category_confidence"] <= 1.0

def test_english_electricity_complaint():
    """Test 2: English electricity complaint."""
    payload = {"text": "The power has been out in our street since morning due to a blown transformer."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Electricity"
    assert data["department"] == "Electricity"

def test_english_road_complaint():
    """Test 3: English road and transport complaint."""
    payload = {"text": "Huge potholes on Main Street are causing frequent accidents and traffic delay."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Roads and Transport"
    assert data["department"] == "Roads and Transport"

def test_english_healthcare_complaint():
    """Test 4: English healthcare complaint."""
    payload = {"text": "The local primary healthcare center clinic has no doctors or essential medicines available."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Healthcare"
    assert data["department"] == "Healthcare"

def test_english_education_complaint():
    """Test 5: English education complaint."""
    payload = {"text": "Government primary school building roof is leaking and teachers are absent."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Education"
    assert data["department"] == "Education"

def test_english_sanitation_complaint():
    """Test 6: English sanitation complaint."""
    payload = {"text": "Garbage dumping near market has not been cleaned for a week and stinks."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Sanitation"
    assert data["department"] == "Sanitation"

def test_tamil_complaint():
    """Test 7: Tamil language complaint."""
    payload = {"text": "எங்கள் பகுதியில் மூன்று நாட்களாக தண்ணீர் வரவில்லை."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "Tamil"
    if data["translation_status"] == "translated":
        assert data["category"] == "Water Supply"
    else:
        assert data["translated_text"] == payload["text"]
        assert data["category"] == "Other"
        assert data["ai_review_required"] is True

def test_hindi_complaint():
    """Test 8: Hindi language complaint."""
    payload = {"text": "हमारे इलाके में दो दिन से बिजली नहीं आ रही है।"}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "Hindi"
    if data["translation_status"] == "translated":
        assert data["category"] == "Electricity"
    else:
        assert data["translated_text"] == payload["text"]
        assert data["category"] == "Other"
        assert data["ai_review_required"] is True

def test_critical_priority_complaint():
    """Test 9: Critical emergency complaint."""
    payload = {"text": "Live high voltage electric wire fallen on flooded street creating immediate life threatening hazard!"}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == "CRITICAL"

def test_low_priority_complaint():
    """Test 10: Low priority information request."""
    payload = {"text": "Requesting general guidance and information request regarding birth certificate procedure."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == "LOW"

def test_unknown_category_complaint():
    """Test 11: Text with no specific category keywords."""
    payload = {"text": "The quick brown fox jumps over the lazy dog."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Other"
    assert data["department"] == "Other"

def test_empty_input_validation():
    """Test 12: Empty / whitespace input should return HTTP 422."""
    payload = {"text": "   "}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 422

def test_too_long_input_validation():
    """Test 13: Extremely long input (>5000 chars) should return HTTP 422."""
    payload = {"text": "A" * 5005}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 422


def test_multi_department_detection():
    """Test 14: Multi-department complaint with pothole, drainage, and streetlights."""
    payload = {"text": "A large pothole is flooding the road because a drainage pipe is broken and street lights are not working."}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "departments" in data
    dept_names = [d["department_name"] for d in data["departments"]]
    assert len(dept_names) >= 2
    # Verify Roads, Water/Drainage or Municipal are represented
    assert any("Road" in d for d in dept_names)
    assert any("Water" in d or "Municipal" in d or "Sanitation" in d for d in dept_names)
