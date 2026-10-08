import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_intent_greeting():
    response = client.post("/chatbot/process", json={"message": "Hello", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "GREETING"
    assert "Hello" in data["message"] or "Welcome" in data["message"] or "Namaste" in data["message"]

def test_intent_grievance_status_query():
    response = client.post("/chatbot/process", json={"message": "Where is my grievance?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "GRIEVANCE_STATUS"

def test_intent_grievance_status_explicit_number():
    payload = {
        "message": "What is the status of my grievance GRV-2026-000003?",
        "user_grievances": [
            {
                "grievance_number": "GRV-2026-000003",
                "status": "IN_PROGRESS",
                "department": {"name": "Water Supply"},
                "category": "Water Leakage",
                "created_at": "2026-10-07T12:00:00Z"
            }
        ]
    }
    response = client.post("/chatbot/process", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "GRIEVANCE_STATUS"
    assert data["grievance_number"] == "GRV-2026-000003"
    assert "GRV-2026-000003" in data["message"]
    assert "IN_PROGRESS" in data["message"]
    assert data["grievance"]["status"] == "IN_PROGRESS"

def test_intent_grievance_blocked_security():
    payload = {
        "message": "Status of GRV-2026-999999",
        "user_grievances": [
            {
                "grievance_number": "GRV-2026-000001",
                "status": "SUBMITTED",
                "department": {"name": "Electricity"}
            }
        ]
    }
    response = client.post("/chatbot/process", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "GRIEVANCE_STATUS"
    assert data["grievance_number"] == "GRV-2026-999999"
    assert "No grievance record" in data["message"] or "not found" in data["message"]
    assert data["grievance"] is None

def test_intent_department_information():
    response = client.post("/chatbot/process", json={"message": "Which department handles electricity complaints?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "DEPARTMENT_INFORMATION"
    assert "Electricity" in data["message"]

def test_intent_submit_grievance_guidance():
    response = client.post("/chatbot/process", json={"message": "How can I submit a complaint?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "SUBMIT_GRIEVANCE_GUIDANCE"
    assert "submit" in data["message"].lower()

def test_intent_process_information():
    response = client.post("/chatbot/process", json={"message": "How does this system work?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "PROCESS_INFORMATION"
    assert "Citizen submits" in data["message"] or "workflow" in data["message"].lower()

def test_intent_help():
    response = client.post("/chatbot/process", json={"message": "Help me", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "HELP"

def test_intent_priority_information():
    response = client.post("/chatbot/process", json={"message": "How is priority assigned to my complaint?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "PRIORITY_INFORMATION"
    assert "HIGH" in data["message"] or "priority" in data["message"].lower()

def test_intent_tracking_guidance():
    response = client.post("/chatbot/process", json={"message": "How to track my application status?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "TRACKING_GUIDANCE"

def test_intent_unknown():
    response = client.post("/chatbot/process", json={"message": "Who won yesterday's cricket match?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "UNKNOWN"
    assert "don't have enough information" in data["message"] or "I can help you submit" in data["message"]

def test_grievance_number_extraction():
    response = client.post("/chatbot/process", json={"message": "Can you check GRV-2026-123456?", "user_grievances": []})
    assert response.status_code == 200
    data = response.json()
    assert data["grievance_number"] == "GRV-2026-123456"

def test_context_awareness_followup():
    payload = {
        "message": "When was it submitted?",
        "session_context": {
            "last_grievance_number": "GRV-2026-123456"
        },
        "user_grievances": [
            {
                "grievance_number": "GRV-2026-123456",
                "status": "RESOLVED",
                "category": "Roads and Transport",
                "created_at": "2026-09-15T10:00:00Z"
            }
        ]
    }
    response = client.post("/chatbot/process", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "GRIEVANCE_DETAILS"
    assert "GRV-2026-123456" in data["message"]
    assert "2026-09-15" in data["message"]

def test_ai_explanation_query():
    payload = {
        "message": "Why was my complaint classified as Water Supply?",
        "session_context": {
            "last_grievance_number": "GRV-2026-123456"
        },
        "user_grievances": [
            {
                "grievance_number": "GRV-2026-123456",
                "category": "Water Supply",
                "explanation_terms": ["water", "supply", "pipeline"]
            }
        ]
    }
    response = client.post("/chatbot/process", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "water" in data["message"].lower()

def test_multilingual_inputs():
    # Tamil
    resp_ta = client.post("/chatbot/process", json={"message": "வணக்கம், எனது புகார் நிலை என்ன?", "user_grievances": []})
    assert resp_ta.status_code == 200
    assert resp_ta.json()["language"] == "Tamil"

    # Hindi
    resp_hi = client.post("/chatbot/process", json={"message": "नमस्ते, मेरी शिकायत की स्थिति क्या है?", "user_grievances": []})
    assert resp_hi.status_code == 200
    assert resp_hi.json()["language"] == "Hindi"
