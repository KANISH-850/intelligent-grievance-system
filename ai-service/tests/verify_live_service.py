import subprocess
import time
import requests
import sys

# Ensure UTF-8 output encoding for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

def verify():
    print("Starting uvicorn server process on port 8001...")
    proc = subprocess.Popen(
        ["py", "-m", "uvicorn", "app.main:app", "--port", "8001", "--host", "127.0.0.1"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    time.sleep(2.5) # Allow server startup

    try:
        # 1. Test GET /health
        print("Testing GET http://127.0.0.1:8001/health ...")
        res_health = requests.get("http://127.0.0.1:8001/health", timeout=5)
        print(f"Health Response Status: {res_health.status_code}, Body: {res_health.json()}")
        assert res_health.status_code == 200

        # 2. Test POST /analyze (English)
        print("Testing POST http://127.0.0.1:8001/analyze (English Water Complaint)...")
        payload = {"text": "There has been no water supply in our area for three days."}
        res_analyze = requests.post("http://127.0.0.1:8001/analyze", json=payload, timeout=5)
        print(f"Analyze Response Status: {res_analyze.status_code}, Body: {res_analyze.json()}")
        assert res_analyze.status_code == 200
        data = res_analyze.json()
        assert data["category"] == "Water Supply"
        assert data["department"] == "Water Supply"

        # 3. Test POST /analyze (Tamil)
        print("Testing POST http://127.0.0.1:8001/analyze (Tamil Complaint)...")
        payload_ta = {"text": "எங்கள் பகுதியில் மூன்று நாட்களாக தண்ணீர் வரவில்லை."}
        res_ta = requests.post("http://127.0.0.1:8001/analyze", json=payload_ta, timeout=5)
        print(f"Tamil Response Status: {res_ta.status_code}, Body: {res_ta.json()}")
        assert res_ta.status_code == 200

        print("\nSUCCESS: All live server endpoint tests passed perfectly!")

    finally:
        proc.terminate()
        proc.wait(timeout=3)
        print("Uvicorn server stopped cleanly.")

if __name__ == "__main__":
    verify()
