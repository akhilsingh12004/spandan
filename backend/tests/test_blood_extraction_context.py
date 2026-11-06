"""Focused tests for report-grounded extraction and chat safety behavior."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from modules.blood_processor import (  # noqa: E402
    extract_patient_and_report_metadata,
    extract_parameters_from_report,
    parse_report_text,
)
from modules.blood_ai_layer import chat_with_blood_ai_layer  # noqa: E402
import modules.blood_ai_layer as blood_ai_layer  # noqa: E402


REPORT = """Laboratory: North Star Diagnostics
Patient Name: Ada Lovelace
Age: 37 years
Sex: Female
Report Date: 2026-10-27
Hemoglobin | 10.4 | g/dL | 12.0 - 17.5
Fasting Blood Glucose | 118 | mg/dL | 70 - 99
"""


def test_extracts_patient_metadata_and_actual_measurements():
    metadata = extract_patient_and_report_metadata(REPORT)
    assert metadata["patient"]["fullName"]["value"] == "Ada Lovelace"
    assert metadata["patient"]["age"]["value"] == "37"
    assert metadata["patient"]["sex"]["value"] == "Female"
    assert metadata["report"]["reportDate"]["value"] == "2026-10-27"
    assert parse_report_text(REPORT)["Hemoglobin"] == 10.4


def test_missing_text_does_not_create_demo_values():
    result = extract_parameters_from_report(b"", "unreadable.png")
    assert result["parameters"] == []
    assert result["limitations"]
    assert result["usedFallback"] is False


def test_emergency_chat_is_deterministic_and_immediate():
    result = chat_with_blood_ai_layer({}, "I have severe chest pain and difficulty breathing")
    assert result["safetyEscalation"] is True
    assert "emergency" in result["reply"].lower()


def test_configured_provider_receives_current_report_context(monkeypatch):
    captured = {}

    monkeypatch.setattr(blood_ai_layer, "get_available_ai_key", lambda *args, **kwargs: ("test-key", "gemini"))

    def fake_query(**kwargs):
        captured["system"] = kwargs["system_instruction"]
        return '{"reply":"Your hemoglobin is low.","followUpSuggestions":[]}', "gemini", "test-model"

    monkeypatch.setattr(blood_ai_layer, "execute_ai_query", fake_query)
    result = chat_with_blood_ai_layer({
        "parameters": [{"canonicalName": "Hemoglobin", "value": 10.4, "unit": "g/dL", "status": "LOW", "min": 12.0, "max": 17.5}],
        "summary": {"abnormalCount": 1},
        "safety": {},
    }, "What does this mean?")

    assert result["isRealAi"] is True
    assert result["reply"] == "Your hemoglobin is low."
    assert "10.4" in captured["system"]
