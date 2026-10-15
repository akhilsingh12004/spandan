"""
Spandan AI - Deterministic Blood Safety Layer
Identifies critical laboratory findings independently from the LLM.
Uses validated clinical thresholds to flag emergencies, dangerous combinations,
and urgency levels that must be surfaced BEFORE the AI explanation.

This module NEVER relies on LLM output for safety determinations.
"""

from typing import Dict, Any, List, Optional


# Validated critical-value thresholds (source: CAP/CLIA critical value guidelines)
CRITICAL_THRESHOLDS = {
    "Hemoglobin":       {"crit_low": 7.0,   "crit_high": 20.0,  "unit": "g/dL"},
    "WBC Count":        {"crit_low": 2000,   "crit_high": 30000, "unit": "/mcL"},
    "Platelet Count":   {"crit_low": 50000,  "crit_high": 1000000, "unit": "/mcL"},
    "Potassium":        {"crit_low": 2.8,    "crit_high": 6.2,   "unit": "mEq/L"},
    "Sodium":           {"crit_low": 120,    "crit_high": 160,    "unit": "mEq/L"},
    "Fasting Blood Glucose": {"crit_low": 40, "crit_high": 450,  "unit": "mg/dL"},
    "Creatinine":       {"crit_low": None,   "crit_high": 10.0,  "unit": "mg/dL"},
    "Total Bilirubin":  {"crit_low": None,   "crit_high": 15.0,  "unit": "mg/dL"},
    "Calcium":          {"crit_low": 6.5,    "crit_high": 13.0,  "unit": "mg/dL"},
    "eGFR":             {"crit_low": 15.0,   "crit_high": None,  "unit": "mL/min/1.73m2"},
    "HbA1c":            {"crit_low": None,   "crit_high": 14.0,  "unit": "%"},
    "TSH":              {"crit_low": 0.05,   "crit_high": 50.0,  "unit": "mIU/L"},
}

# Dangerous parameter combinations that warrant immediate attention
DANGEROUS_COMBINATIONS = [
    {
        "id": "hyperkalemia_renal_failure",
        "name": "Hyperkalemia with Renal Impairment",
        "required": ["Potassium", "Creatinine"],
        "condition": lambda vals: vals.get("Potassium", 0) > 5.5 and vals.get("Creatinine", 0) > 2.0,
        "urgency": "URGENT",
        "warning": "Elevated potassium combined with impaired kidney function may compromise cardiac rhythm. Seek prompt medical evaluation.",
    },
    {
        "id": "severe_anemia_tachycardia_risk",
        "name": "Severe Anemia",
        "required": ["Hemoglobin"],
        "condition": lambda vals: vals.get("Hemoglobin", 15) < 7.0,
        "urgency": "URGENT",
        "warning": "Severely low hemoglobin may cause cardiovascular instability. Immediate medical assessment is recommended.",
    },
    {
        "id": "dka_risk",
        "name": "Possible Diabetic Ketoacidosis Risk",
        "required": ["Fasting Blood Glucose"],
        "condition": lambda vals: vals.get("Fasting Blood Glucose", 90) > 400,
        "urgency": "URGENT",
        "warning": "Very high blood glucose may indicate diabetic emergency. Seek immediate medical attention if accompanied by nausea, vomiting, or confusion.",
    },
    {
        "id": "severe_thrombocytopenia",
        "name": "Severe Thrombocytopenia",
        "required": ["Platelet Count"],
        "condition": lambda vals: vals.get("Platelet Count", 250000) < 20000,
        "urgency": "URGENT",
        "warning": "Very low platelet count significantly increases spontaneous bleeding risk. Seek immediate medical evaluation.",
    },
    {
        "id": "hyponatremia_severe",
        "name": "Severe Hyponatremia",
        "required": ["Sodium"],
        "condition": lambda vals: vals.get("Sodium", 140) < 120,
        "urgency": "URGENT",
        "warning": "Critically low sodium can cause seizures and altered consciousness. Seek immediate medical attention.",
    },
    {
        "id": "pancytopenia",
        "name": "Pancytopenia Pattern",
        "required": ["Hemoglobin", "WBC Count", "Platelet Count"],
        "condition": lambda vals: (
            vals.get("Hemoglobin", 15) < 10
            and vals.get("WBC Count", 7000) < 3500
            and vals.get("Platelet Count", 250000) < 100000
        ),
        "urgency": "PROMPT",
        "warning": "Multiple blood cell lines are reduced. This pattern warrants prompt hematological evaluation.",
    },
    {
        "id": "liver_failure_pattern",
        "name": "Acute Hepatic Distress",
        "required": ["Total Bilirubin", "ALT (SGPT)"],
        "condition": lambda vals: vals.get("Total Bilirubin", 0.8) > 5.0 and vals.get("ALT (SGPT)", 25) > 200,
        "urgency": "URGENT",
        "warning": "Severely elevated bilirubin with markedly elevated liver enzymes suggests acute hepatic injury. Seek urgent medical evaluation.",
    },
]


def evaluate_safety(
    evaluated_params: List[Dict[str, Any]],
    patient_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates all extracted parameters against the deterministic safety layer.
    Returns critical alerts, dangerous combinations, and an overall urgency classification.

    This function does NOT use any LLM. It operates purely on validated clinical thresholds.
    """
    val_map = {}
    for p in evaluated_params:
        name = p.get("canonicalName", p.get("name", ""))
        val = p.get("value")
        if name and val is not None:
            val_map[name] = val

    critical_alerts: List[Dict[str, Any]] = []
    combination_alerts: List[Dict[str, Any]] = []

    # 1. Individual critical-value checks
    for param_name, thresholds in CRITICAL_THRESHOLDS.items():
        value = val_map.get(param_name)
        if value is None:
            continue

        crit_low = thresholds.get("crit_low")
        crit_high = thresholds.get("crit_high")
        unit = thresholds.get("unit", "")

        if crit_low is not None and value < crit_low:
            critical_alerts.append({
                "parameter": param_name,
                "value": value,
                "unit": unit,
                "threshold": crit_low,
                "direction": "CRITICALLY_LOW",
                "message": f"{param_name} is critically low at {value} {unit} (critical threshold: <{crit_low} {unit}). Immediate medical evaluation recommended.",
            })
        elif crit_high is not None and value > crit_high:
            critical_alerts.append({
                "parameter": param_name,
                "value": value,
                "unit": unit,
                "threshold": crit_high,
                "direction": "CRITICALLY_HIGH",
                "message": f"{param_name} is critically high at {value} {unit} (critical threshold: >{crit_high} {unit}). Immediate medical evaluation recommended.",
            })

    # 2. Check for lab-flagged critical values from the evaluated params
    for p in evaluated_params:
        status = p.get("status", "")
        if "CRITICAL" in status and p.get("canonicalName") not in [a["parameter"] for a in critical_alerts]:
            critical_alerts.append({
                "parameter": p.get("canonicalName", p.get("name")),
                "value": p.get("value"),
                "unit": p.get("unit", ""),
                "direction": status,
                "message": f"{p.get('canonicalName', p.get('name'))} is flagged as {status.replace('_', ' ').lower()}.",
            })

    # 3. Dangerous combination checks
    for combo in DANGEROUS_COMBINATIONS:
        has_all_required = all(val_map.get(r) is not None for r in combo["required"])
        if has_all_required:
            try:
                if combo["condition"](val_map):
                    combination_alerts.append({
                        "id": combo["id"],
                        "name": combo["name"],
                        "urgency": combo["urgency"],
                        "warning": combo["warning"],
                        "involvedParameters": combo["required"],
                    })
            except Exception:
                continue

    # 4. Symptom-based urgency escalation (if patient context provided)
    symptom_escalations = []
    if patient_context:
        symptoms = patient_context.get("symptoms", "").lower()
        urgent_symptom_keywords = [
            "chest pain", "difficulty breathing", "confusion", "seizure",
            "fainting", "severe headache", "blood in stool", "vomiting blood",
            "sudden vision loss", "unable to eat", "severe weakness"
        ]
        for keyword in urgent_symptom_keywords:
            if keyword in symptoms:
                symptom_escalations.append({
                    "symptom": keyword,
                    "message": f"Reported symptom '{keyword}' in combination with abnormal lab values may warrant urgent evaluation.",
                })

    # 5. Determine overall urgency
    has_urgent = any(c.get("urgency") == "URGENT" for c in combination_alerts) or len(critical_alerts) > 0
    has_prompt = any(c.get("urgency") == "PROMPT" for c in combination_alerts)
    has_symptom_concern = len(symptom_escalations) > 0

    if has_urgent or has_symptom_concern:
        overall_urgency = "URGENT"
        urgency_message = (
            "One or more findings may require urgent medical evaluation. "
            "This application is NOT an emergency service. If you are experiencing severe symptoms, "
            "contact your local emergency services or visit the nearest emergency department immediately."
        )
    elif has_prompt:
        overall_urgency = "PROMPT"
        urgency_message = (
            "Some findings warrant prompt medical assessment within the next few days. "
            "Please schedule a consultation with your healthcare provider."
        )
    elif any(p.get("isAbnormal") for p in evaluated_params):
        overall_urgency = "ROUTINE"
        urgency_message = "Abnormal findings identified. Discuss with your healthcare provider at your next routine visit."
    else:
        overall_urgency = "NONE"
        urgency_message = "All evaluated parameters fall within expected ranges."

    return {
        "criticalAlerts": critical_alerts,
        "combinationAlerts": combination_alerts,
        "symptomEscalations": symptom_escalations,
        "overallUrgency": overall_urgency,
        "urgencyMessage": urgency_message,
        "hasCriticalFindings": len(critical_alerts) > 0,
        "hasUrgentCombinations": has_urgent,
        "totalAlerts": len(critical_alerts) + len(combination_alerts),
        "disclaimer": (
            "This safety assessment is generated by automated clinical rules and does not replace "
            "professional medical judgment. Always consult a qualified healthcare provider for medical advice."
        ),
    }
