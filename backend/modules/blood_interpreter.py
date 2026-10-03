"""
Clinical Interpretation Engine for Blood Test Report Analysis
Maps individual lab values and multi-parameter patterns into actionable clinical diagnoses,
including Jaundice (Hyperbilirubinemia), Liver Function, Anemia, Glycemic, Lipids, and Renal panels.
"""

from typing import Dict, Any, List, Tuple
from modules.blood_reference_ranges import REFERENCE_RANGES, lookup_reference_range


def evaluate_parameter(name: str, value: float) -> Dict[str, Any]:
    """
    Evaluates a single lab test parameter against standard clinical reference ranges.
    """
    canon_name, ref = lookup_reference_range(name)
    if not ref:
        return {
            "name": name,
            "canonicalName": name,
            "value": value,
            "status": "UNASSESSED",
            "unit": "",
            "min": None,
            "max": None,
            "deviation": 0.0,
            "description": "Custom parameter without standard reference range."
        }

    min_val = ref["min"]
    max_val = ref["max"]
    crit_low = ref.get("critical_low")
    crit_high = ref.get("critical_high")

    status = "NORMAL"
    description = f"Normal healthy range ({min_val} - {max_val} {ref['unit']})."

    if crit_low is not None and value < crit_low:
        status = "CRITICAL_LOW"
        description = f"Critically Low: {ref['low_desc']}"
    elif crit_high is not None and value > crit_high:
        status = "CRITICAL_HIGH"
        description = f"Critically Elevated: {ref['high_desc']}"
    elif value < min_val:
        status = "LOW"
        description = ref["low_desc"]
    elif value > max_val:
        status = "HIGH"
        description = ref["high_desc"]

    # Calculate percentage deviation from normal midpoint
    midpoint = (min_val + max_val) / 2.0
    half_range = (max_val - min_val) / 2.0 if max_val != min_val else 1.0
    deviation = round(((value - midpoint) / half_range), 2)

    return {
        "name": canon_name,
        "canonicalName": canon_name,
        "panel": ref["panel"],
        "value": value,
        "unit": ref["unit"],
        "min": min_val,
        "max": max_val,
        "status": status,
        "isAbnormal": status != "NORMAL",
        "isCritical": "CRITICAL" in status,
        "deviation": deviation,
        "description": description
    }


def analyze_blood_patterns(evaluated_params: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates multi-parameter pattern correlations to detect systemic conditions.
    """
    # Create lookup map by canonical name
    val_map = {p["canonicalName"]: p["value"] for p in evaluated_params}
    status_map = {p["canonicalName"]: p["status"] for p in evaluated_params}

    conditions: List[Dict[str, Any]] = []

    # ─────────────────────────────────────────────────────────────
    # 1. Jaundice & Hepatobiliary Pathology (Liver Function)
    # ─────────────────────────────────────────────────────────────
    bili_total = val_map.get("Total Bilirubin")
    bili_direct = val_map.get("Direct Bilirubin")
    bili_indirect = val_map.get("Indirect Bilirubin")
    alt = val_map.get("ALT (SGPT)")
    ast = val_map.get("AST (SGOT)")
    alp = val_map.get("Alkaline Phosphatase (ALP)")
    ggt = val_map.get("Gamma-Glutamyl Transferase (GGT)")

    if bili_total is not None and bili_total > 1.2:
        # Determine Jaundice sub-type based on Direct vs Indirect and ALP / Transaminases
        is_overt_jaundice = bili_total >= 2.0
        jaundice_severity = "High" if bili_total >= 3.0 else ("Moderate" if is_overt_jaundice else "Mild")
        
        evidence_list = [f"Serum Total Bilirubin elevated at {bili_total} mg/dL (Reference: 0.2 - 1.2 mg/dL)"]
        if bili_direct is not None:
            evidence_list.append(f"Direct (Conjugated) Bilirubin: {bili_direct} mg/dL")
        if bili_indirect is not None:
            evidence_list.append(f"Indirect (Unconjugated) Bilirubin: {bili_indirect} mg/dL")

        # A. Cholestatic / Obstructive Pattern (Biliary system involvement)
        if (bili_direct is not None and (bili_direct > 0.4 or (bili_direct / bili_total) > 0.4)) or (alp is not None and alp > 150):
            if alp: evidence_list.append(f"Alkaline Phosphatase elevated ({alp} U/L)")
            conditions.append({
                "condition": "Obstructive / Cholestatic Jaundice (Biliary Outflow Impairment)",
                "category": "Hepatic & Biliary Health",
                "severity": jaundice_severity,
                "confidence": 0.93,
                "evidence": evidence_list,
                "recommendation": "Consult a gastroenterologist or hepatologist for evaluation. An Abdominal Ultrasound (USG) or MRCP is recommended to assess the gallbladder and biliary tree for gallstones (choledocholithiasis), biliary strictures, or outflow obstruction."
            })
        # B. Hepatocellular Jaundice Pattern (Marked enzyme elevation)
        elif (alt is not None and alt > 80) or (ast is not None and ast > 70):
            if alt: evidence_list.append(f"ALT transaminase elevated ({alt} U/L)")
            if ast: evidence_list.append(f"AST transaminase elevated ({ast} U/L)")
            conditions.append({
                "condition": "Hepatocellular Jaundice (Acute Hepatic Inflammation / Hepatitis)",
                "category": "Hepatic & Biliary Health",
                "severity": jaundice_severity,
                "confidence": 0.92,
                "evidence": evidence_list,
                "recommendation": "Urgent medical consultation advised. Recommended screening includes viral hepatitis serologies (HBsAg, Anti-HCV, IgM Anti-HAV, Anti-HEV), review of all medications/supplements for drug-induced liver injury, and strict avoidance of alcohol and hepatotoxic agents."
            })
        # C. Hemolytic / Pre-Hepatic or Gilbert's Syndrome
        elif (bili_indirect is not None and bili_indirect > 1.0) or (bili_direct is not None and (bili_direct / bili_total) < 0.25):
            conditions.append({
                "condition": "Unconjugated Hyperbilirubinemia (Hemolytic / Pre-Hepatic Jaundice or Gilbert's Syndrome)",
                "category": "Hepatic & Biliary Health",
                "severity": "Moderate" if is_overt_jaundice else "Mild",
                "confidence": 0.89,
                "evidence": evidence_list,
                "recommendation": "Evaluate for hemolysis with Complete Blood Count (CBC), Reticulocyte count, Peripheral Blood Smear, and Serum LDH. In the absence of hemolysis, mild unconjugated hyperbilirubinemia often represents benign Gilbert's syndrome."
            })
        # D. General Hyperbilirubinemia
        else:
            conditions.append({
                "condition": "Hyperbilirubinemia / Clinical Jaundice",
                "category": "Hepatic & Biliary Health",
                "severity": jaundice_severity,
                "confidence": 0.91,
                "evidence": evidence_list,
                "recommendation": "Consult a physician for clinical examination of sclera and abdomen, follow-up liver function monitoring, and an abdominal ultrasound to pinpoint the underlying etiology."
            })

    # Liver enzyme elevation without hyperbilirubinemia
    elif (alt is not None and alt > 56) or (ast is not None and ast > 40) or (alp is not None and alp > 147):
        hepatic_signs = []
        if alt and alt > 56: hepatic_signs.append(f"ALT elevated ({alt} U/L)")
        if ast and ast > 40: hepatic_signs.append(f"AST elevated ({ast} U/L)")
        if alp and alp > 147: hepatic_signs.append(f"ALP elevated ({alp} U/L)")
        if ggt and ggt > 48: hepatic_signs.append(f"GGT elevated ({ggt} U/L)")

        is_severe = (alt and alt > 150) or (ast and ast > 120)
        conditions.append({
            "condition": "Hepatic Strain / Elevated Liver Enzymes (Transaminitis)",
            "category": "Hepatic / Liver Health",
            "severity": "High" if is_severe else "Moderate",
            "confidence": 0.90,
            "evidence": hepatic_signs,
            "recommendation": "Perform an abdominal ultrasound to evaluate for hepatic steatosis (fatty liver). Adopt a balanced low-glycemic, low-fat diet, minimize alcohol intake, and review hepatically cleared medications with your clinician."
        })

    # ─────────────────────────────────────────────────────────────
    # 2. Anemia Patterns
    # ─────────────────────────────────────────────────────────────
    hb = val_map.get("Hemoglobin")
    rbc = val_map.get("RBC Count")
    hct = val_map.get("Hematocrit (HCT)")
    mcv = val_map.get("MCV")
    ferritin = val_map.get("Ferritin")
    iron = val_map.get("Serum Iron")

    if hb and hb < 12.0:
        if (mcv and mcv < 80) or (ferritin and ferritin < 20) or (iron and iron < 50):
            conditions.append({
                "condition": "Iron Deficiency Anemia (Microcytic)",
                "category": "Hematology / Red Blood Cells",
                "severity": "High" if hb < 9.0 else "Moderate",
                "confidence": 0.94,
                "evidence": [f"Hemoglobin low at {hb} g/dL", f"MCV microcytic ({mcv} fL)" if mcv else "Iron stores depleted"],
                "recommendation": "Serum iron panel evaluation and iron-rich dietary intake or oral supplementation under clinician advice."
            })
        elif mcv and mcv > 100:
            conditions.append({
                "condition": "Macrocytic Anemia (Vitamin B12 / Folate Deficiency)",
                "category": "Hematology / Red Blood Cells",
                "severity": "Moderate",
                "confidence": 0.88,
                "evidence": [f"Hemoglobin low ({hb} g/dL)", f"Elevated MCV ({mcv} fL)"],
                "recommendation": "Check Serum Vitamin B12 and Folate levels."
            })
        else:
            conditions.append({
                "condition": "Normocytic Anemia",
                "category": "Hematology / Red Blood Cells",
                "severity": "Moderate",
                "confidence": 0.85,
                "evidence": [f"Hemoglobin reduced to {hb} g/dL"],
                "recommendation": "Investigate underlying cause (chronic disease, occult blood loss, or hemolysis)."
            })

    # ─────────────────────────────────────────────────────────────
    # 3. Glycemic / Diabetes Patterns
    # ─────────────────────────────────────────────────────────────
    fbs = val_map.get("Fasting Blood Glucose")
    hba1c = val_map.get("HbA1c")
    ppbs = val_map.get("Postprandial Glucose")

    if (fbs and fbs >= 126) or (hba1c and hba1c >= 6.5) or (ppbs and ppbs >= 200):
        conditions.append({
            "condition": "Type 2 Diabetes Mellitus",
            "category": "Endocrine & Metabolism",
            "severity": "High",
            "confidence": 0.96,
            "evidence": [e for e in [
                f"Fasting glucose {fbs} mg/dL (>=126)" if fbs and fbs >= 126 else None,
                f"HbA1c {hba1c}% (>=6.5%)" if hba1c and hba1c >= 6.5 else None,
                f"Postprandial glucose {ppbs} mg/dL (>=200)" if ppbs and ppbs >= 200 else None
            ] if e],
            "recommendation": "Consult an endocrinologist for glycemic management, medication initiation, and lifestyle/diet modification."
        })
    elif (fbs and 100 <= fbs <= 125) or (hba1c and 5.7 <= hba1c <= 6.4):
        conditions.append({
            "condition": "Prediabetes / Impaired Fasting Glucose",
            "category": "Endocrine & Metabolism",
            "severity": "Moderate",
            "confidence": 0.90,
            "evidence": [e for e in [
                f"Fasting glucose {fbs} mg/dL (100-125)" if fbs and 100 <= fbs <= 125 else None,
                f"HbA1c {hba1c}% (5.7-6.4%)" if hba1c and 5.7 <= hba1c <= 6.4 else None
            ] if e],
            "recommendation": "Adopt a low-glycemic dietary regimen, structured daily exercise, and re-test in 3 to 6 months."
        })

    # ─────────────────────────────────────────────────────────────
    # 4. Dyslipidemia & Lipid Profile
    # ─────────────────────────────────────────────────────────────
    tc = val_map.get("Total Cholesterol")
    ldl = val_map.get("LDL Cholesterol")
    hdl = val_map.get("HDL Cholesterol")
    tg = val_map.get("Triglycerides")

    if (ldl and ldl >= 130) or (tc and tc >= 200) or (tg and tg >= 150) or (hdl and hdl < 40):
        risk_factors = []
        if ldl and ldl >= 130: risk_factors.append(f"Elevated LDL ({ldl} mg/dL)")
        if tc and tc >= 200: risk_factors.append(f"High Total Cholesterol ({tc} mg/dL)")
        if tg and tg >= 150: risk_factors.append(f"Hypertriglyceridemia ({tg} mg/dL)")
        if hdl and hdl < 40: risk_factors.append(f"Suboptimal HDL ({hdl} mg/dL)")

        severity = "High" if (ldl and ldl >= 160) or (tg and tg >= 300) else "Moderate"
        conditions.append({
            "condition": "Dyslipidemia / Lipid Profile Imbalance",
            "category": "Cardiovascular & Lipids",
            "severity": severity,
            "confidence": 0.92,
            "evidence": risk_factors,
            "recommendation": "Reduce dietary saturated fats and trans fats, increase soluble fiber, and discuss lipid-lowering lifestyle adjustments or therapy with your physician."
        })

    # ─────────────────────────────────────────────────────────────
    # 5. Kidney Function / Renal Health
    # ─────────────────────────────────────────────────────────────
    creat = val_map.get("Creatinine")
    bun = val_map.get("Blood Urea Nitrogen (BUN)")
    egfr = val_map.get("eGFR")

    if (creat and creat > 1.2) or (bun and bun > 20) or (egfr and egfr < 60):
        renal_signs = []
        if creat and creat > 1.2: renal_signs.append(f"Serum Creatinine high ({creat} mg/dL)")
        if bun and bun > 20: renal_signs.append(f"BUN elevated ({bun} mg/dL)")
        if egfr and egfr < 60: renal_signs.append(f"eGFR reduced ({egfr} mL/min)")

        conditions.append({
            "condition": "Renal Impairment / Kidney Strain",
            "category": "Renal / Kidney Function",
            "severity": "High" if (creat and creat > 2.0) or (egfr and egfr < 30) else "Moderate",
            "confidence": 0.93,
            "evidence": renal_signs,
            "recommendation": "Consult a nephrologist, maintain proper hydration, and avoid NSAIDs or nephrotoxic agents."
        })

    # ─────────────────────────────────────────────────────────────
    # 6. Electrolyte Imbalances
    # ─────────────────────────────────────────────────────────────
    k = val_map.get("Potassium")
    na = val_map.get("Sodium")

    if k and k > 5.0:
        is_high = k >= 6.0
        conditions.append({
            "condition": "Hyperkalemia (Elevated Potassium)",
            "category": "Electrolytes & Fluid Balance",
            "severity": "High" if is_high else "Moderate",
            "confidence": 0.94,
            "evidence": [f"Potassium elevated to {k} mEq/L"],
            "recommendation": "Prompt clinician consultation recommended. A repeat blood test should be ordered to rule out sample hemolysis (pseudohyperkalemia), alongside review of dietary intake or medications."
        })
    elif k and k < 3.5:
        conditions.append({
            "condition": "Hypokalemia (Low Potassium)",
            "category": "Electrolytes & Fluid Balance",
            "severity": "Moderate" if k >= 3.0 else "High",
            "confidence": 0.92,
            "evidence": [f"Potassium low ({k} mEq/L)"],
            "recommendation": "Dietary potassium repletion (bananas, coconut water) or oral electrolyte therapy under medical advice."
        })

    if na and na < 135:
        conditions.append({
            "condition": "Hyponatremia (Low Sodium)",
            "category": "Electrolytes & Fluid Balance",
            "severity": "Moderate" if na >= 125 else "High",
            "confidence": 0.88,
            "evidence": [f"Sodium low ({na} mEq/L)"],
            "recommendation": "Investigate fluid balance, diuretic use, or hormonal etiologies."
        })

    # ─────────────────────────────────────────────────────────────
    # 7. Systemic Inflammation / Infection
    # ─────────────────────────────────────────────────────────────
    wbc = val_map.get("WBC Count")
    crp = val_map.get("C-Reactive Protein (CRP)")
    esr = val_map.get("ESR")

    if (wbc and wbc > 11000) or (crp and crp > 3.0) or (esr and esr > 20):
        signs = []
        if wbc and wbc > 11000: signs.append(f"Elevated WBC count ({wbc} /mcL)")
        if crp and crp > 3.0: signs.append(f"Elevated CRP ({crp} mg/L)")
        if esr and esr > 20: signs.append(f"Elevated ESR ({esr} mm/hr)")

        conditions.append({
            "condition": "Active Infection / Systemic Inflammation",
            "category": "Immune & Inflammatory Response",
            "severity": "High" if (crp and crp > 20) or (wbc and wbc > 18000) else "Moderate",
            "confidence": 0.91,
            "evidence": signs,
            "recommendation": "Consult a physician to identify the underlying source of bacterial, viral, or autoimmune inflammation."
        })

    # Calculate overall health risk score (0-100)
    abnormal_count = sum(1 for p in evaluated_params if p["isAbnormal"])
    critical_count = sum(1 for p in evaluated_params if p["isCritical"])
    
    total_evaluated = len(evaluated_params)
    if total_evaluated == 0:
        health_score = 100
        overall_status = "NO_DATA"
    else:
        abnormal_ratio = abnormal_count / float(total_evaluated)
        critical_ratio = critical_count / float(total_evaluated)
        deduction = (abnormal_ratio * 40.0) + (critical_ratio * 35.0)
        health_score = int(max(25, round(100.0 - deduction)))
        
        if critical_count > 0 or health_score < 50:
            overall_status = "ATTENTION_REQUIRED"
        elif abnormal_count >= 4 or health_score < 75:
            overall_status = "MODERATE_VARIANCE"
        elif abnormal_count >= 1:
            overall_status = "MILD_VARIANCE"
        else:
            overall_status = "OPTIMAL"

    return {
        "conditions": conditions,
        "totalEvaluated": total_evaluated,
        "abnormalCount": abnormal_count,
        "criticalCount": critical_count,
        "normalCount": total_evaluated - abnormal_count,
        "healthScore": health_score,
        "overallStatus": overall_status,
        "doctorConsultationRecommended": abnormal_count >= 2 or critical_count > 0 or (bili_total is not None and bili_total > 1.2)
    }
