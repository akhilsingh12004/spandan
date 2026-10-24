import requests

res_cardiac = requests.post(
    "http://localhost:8000/api/predict/cardiac",
    files={"file": open("backend/tests/sample_data/sample_ecg.png", "rb")}
)
print("Cardiac Response:", res_cardiac.status_code, res_cardiac.json().get("topCondition"), res_cardiac.json().get("topConfidence"))

