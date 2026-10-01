"""
Spandan AI - End-to-End API Integration Test Suite
Validates health check, module detection, cardiac pipeline, skin pipeline,
blood report analysis, Grad-CAM overlays, and mandatory medical disclaimers.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from main import app, MEDICAL_DISCLAIMER
from config import CARDIAC_CLASSES, SKIN_CLASSES
from modules.blood_reference_ranges import REFERENCE_RANGES

client = TestClient(app)

SAMPLE_DIR = Path(__file__).resolve().parent / "sample_data"
ECG_SAMPLE_PATH = SAMPLE_DIR / "sample_ecg.png"
SKIN_SAMPLE_PATH = SAMPLE_DIR / "sample_skin.png"
BLOOD_SAMPLE_PATH = SAMPLE_DIR / "sample_blood_report.png"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert len(data["modalities"]) >= 3
    assert data["disclaimer"] == MEDICAL_DISCLAIMER


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["modules"]["cardiac"]["classesCount"] == len(CARDIAC_CLASSES)
    assert data["modules"]["skin"]["classesCount"] == len(SKIN_CLASSES)
    assert data["modules"]["blood"]["parametersCount"] == len(REFERENCE_RANGES)
    assert data["disclaimer"] == MEDICAL_DISCLAIMER


def test_module_auto_detection():
    # 1. Test ECG detection
    with open(ECG_SAMPLE_PATH, "rb") as f:
        response = client.post("/api/detect-module", files={"file": ("sample_ecg.png", f, "image/png")})
    assert response.status_code == 200
    assert response.json()["detectedModule"] == "cardiac"

    # 2. Test Skin detection
    with open(SKIN_SAMPLE_PATH, "rb") as f:
        response = client.post("/api/detect-module", files={"file": ("sample_skin.png", f, "image/png")})
    assert response.status_code == 200
    assert response.json()["detectedModule"] == "skin"

    # 3. Test Blood Report detection
    with open(BLOOD_SAMPLE_PATH, "rb") as f:
        response = client.post("/api/detect-module", files={"file": ("sample_blood_report.png", f, "image/png")})
    assert response.status_code == 200
    assert response.json()["detectedModule"] == "blood"


def test_cardiac_prediction_pipeline():
    with open(ECG_SAMPLE_PATH, "rb") as f:
        response = client.post("/api/predict/cardiac", files={"file": ("sample_ecg.png", f, "image/png")})
    
    assert response.status_code == 200
    data = response.json()

    assert data["module"] == "cardiac"
    assert "predictions" in data and len(data["predictions"]) > 0
    assert "topCondition" in data
    assert 0.0 <= data["topConfidence"] <= 1.0
    assert len(data["ecgSignal"]) == 1000

    metrics = data["metrics"]
    assert "heartRate" in metrics
    assert "rrInterval" in metrics
    assert "qtInterval" in metrics
    assert "hrv" in metrics
    assert "qrsDuration" in metrics

    assert data["heatmapUrl"].startswith("data:image/png;base64,")
    assert data["disclaimer"] == MEDICAL_DISCLAIMER


def test_skin_prediction_pipeline():
    with open(SKIN_SAMPLE_PATH, "rb") as f:
        response = client.post("/api/predict/skin", files={"file": ("sample_skin.png", f, "image/png")})

    assert response.status_code == 200
    data = response.json()

    assert data["module"] == "skin"
    assert "predictions" in data and len(data["predictions"]) > 0
    assert "topCondition" in data
    assert 0.0 <= data["topConfidence"] <= 1.0

    seg = data["segmentationMetrics"]
    assert "asymmetryIndex" in seg
    assert "borderIrregularity" in seg
    assert "estimatedDiameterPx" in seg

    assert data["heatmapUrl"].startswith("data:image/jpeg;base64,")
    assert data["disclaimer"] == MEDICAL_DISCLAIMER


def test_blood_prediction_pipeline():
    with open(BLOOD_SAMPLE_PATH, "rb") as f:
        response = client.post("/api/predict/blood", files={"file": ("sample_blood_report.png", f, "image/png")})

    assert response.status_code == 200
    data = response.json()

    assert data["module"] == "blood"
    assert "parameters" in data and len(data["parameters"]) > 0
    assert "conditions" in data
    assert "summary" in data

    summary = data["summary"]
    assert "healthScore" in summary
    assert "abnormalCount" in summary
    assert "doctorConsultationRecommended" in summary
    assert 0 <= summary["healthScore"] <= 100

    # Verify parameters have clinical evaluations
    first_param = data["parameters"][0]
    assert "canonicalName" in first_param
    assert "status" in first_param
    assert first_param["status"] in ["NORMAL", "LOW", "HIGH", "CRITICAL_LOW", "CRITICAL_HIGH", "UNASSESSED"]

    # Verify AI Clinical Explanation is attached
    assert "aiExplanation" in data
    ai_exp = data["aiExplanation"]
    assert "headline" in ai_exp
    assert "executiveSummary" in ai_exp
    assert "organSystems" in ai_exp
    assert len(ai_exp["organSystems"]) > 0
    assert "lifestylePrescription" in ai_exp
    assert "doctorChecklist" in ai_exp

    assert data["disclaimer"] == MEDICAL_DISCLAIMER


def test_blood_reference_ranges():
    response = client.get("/api/blood/reference-ranges")
    assert response.status_code == 200
    data = response.json()
    assert "panels" in data
    assert "referenceRanges" in data
    assert len(data["referenceRanges"]) >= 25
    assert data["disclaimer"] == MEDICAL_DISCLAIMER


def test_ai_explain_report_endpoint():
    payload = {
        "reportData": {
            "parameters": [
                {"canonicalName": "Hemoglobin", "value": 10.4, "unit": "g/dL", "status": "LOW", "panel": "Complete Blood Count (CBC)"},
                {"canonicalName": "Total Cholesterol", "value": 224, "unit": "mg/dL", "status": "HIGH", "panel": "Lipid Profile"}
            ],
            "conditions": [
                {"condition": "Microcytic Anemia"}
            ],
            "summary": {
                "healthScore": 68,
                "abnormalCount": 2,
                "criticalCount": 0,
                "normalCount": 10
            }
        },
        "module": "blood",
        "readingLevel": "standard"
    }
    response = client.post("/api/ai/explain-report", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    exp = data["explanation"]
    assert "headline" in exp
    assert "executiveSummary" in exp
    assert len(exp["organSystems"]) >= 1
    assert "lifestylePrescription" in exp
    assert "doctorChecklist" in exp
    assert len(exp["doctorChecklist"]["questions"]) > 0
    assert data["disclaimer"] == MEDICAL_DISCLAIMER


def test_ai_chat_report_endpoint():
    payload = {
        "reportData": {
            "parameters": [
                {"canonicalName": "Hemoglobin", "value": 10.4, "unit": "g/dL", "status": "LOW", "panel": "Complete Blood Count (CBC)"},
                {"canonicalName": "Total Cholesterol", "value": 224, "unit": "mg/dL", "status": "HIGH", "panel": "Lipid Profile"}
            ],
            "conditions": [
                {"condition": "Microcytic Anemia"}
            ],
            "summary": {
                "healthScore": 68,
                "abnormalCount": 2
            }
        },
        "message": "What foods should I eat to improve my low hemoglobin?",
        "module": "blood"
    }
    response = client.post("/api/ai/chat-report", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 20
    assert "followUpSuggestions" in data
    assert len(data["followUpSuggestions"]) > 0


if __name__ == "__main__":
    pytest.main(["-v", __file__])
