import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chatbot_process_grievance_status_success():
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
    assert "GRV-2026-000003" in data["message"]
    assert "IN_PROGRESS" in data["message"]
    assert data["grievance"]["status"] == "IN_PROGRESS"

def test_chatbot_process_other_user_grievance_blocked():
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
    assert "GRV-2026-999999" in data["message"]
    assert "No grievance record with reference" in data["message"]
    assert data["grievance"] is None

def test_chatbot_list_grievances():
    payload = {
        "message": "Show all my complaints",
        "user_grievances": [
            {
                "grievance_number": "GRV-2026-000001",
                "status": "SUBMITTED"
            }
        ]
    }
    response = client.post("/chatbot/process", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "LIST_GRIEVANCES"
    assert "GRV-2026-000001" in data["message"]
