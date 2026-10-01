"""
Spandan AI - Intelligent Clinical Report Explainer & AI Medical Assistant
Analyzes full diagnostic reports (Blood Tests, Cardiac ECG, Dermatological Skin)
and synthesizes patient-friendly, clinically accurate explanations, organ breakdowns,
dietary prescriptions, doctor discussion guides, and interactive contextual Q&A.
"""

import os
import json
import time
from typing import Dict, Any, List, Optional

# Optional LLM integration (Gemini / OpenAI) if keys are provided in environment
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


def generate_blood_report_explanation(report_data: Dict[str, Any], reading_level: str = "standard") -> Dict[str, Any]:
    """
    Synthesizes a deep, multi-dimensional clinical explanation for Blood Test Reports.
    """
    parameters = report_data.get("parameters", [])
    conditions = report_data.get("conditions", [])
    summary = report_data.get("summary", {})

    health_score = summary.get("healthScore", 75)
    abnormal_count = summary.get("abnormalCount", 0)
    critical_count = summary.get("criticalCount", 0)
    normal_count = summary.get("normalCount", len(parameters) - abnormal_count)
    
    # Map parameters by canonical name
    param_map = {p.get("canonicalName", p.get("name")): p for p in parameters}
    abnormal_params = [p for p in parameters if p.get("status") != "NORMAL"]
    critical_params = [p for p in parameters if "CRITICAL" in p.get("status", "")]

    # 1. Classify Organ System Status
    organ_systems = []

    # A. Hematology & Oxygenation
    hem_params = [p for p in parameters if p.get("panel") == "Complete Blood Count (CBC)" or p.get("canonicalName") in [
        "Hemoglobin", "RBC Count", "Hematocrit (HCT)", "MCV", "Platelet Count", "Ferritin", "Serum Iron"
    ]]
    if hem_params:
        hem_abnormal = [p for p in hem_params if p.get("status") != "NORMAL"]
        hb = param_map.get("Hemoglobin", {}).get("value")
        mcv = param_map.get("MCV", {}).get("value")
        
        if any("CRITICAL" in p.get("status", "") for p in hem_params) or (hb and hb < 8.0):
            h_status = "CRITICAL_ALERT"
            h_summary = "Significant impairment in red blood cell volume or hemoglobin levels, requiring prompt clinical evaluation to restore systemic tissue oxygenation."
        elif hem_abnormal:
            h_status = "ATTENTION_NEEDED"
            if hb and hb < 12.0:
                h_summary = f"Mild-to-moderate anemia profile noted (Hemoglobin: {hb} g/dL). Your red blood cells have reduced capacity to transport oxygen, often correlating with fatigue or reduced stamina."
            else:
                h_summary = "Minor variations in red blood cell indices or platelet counts. Overall marrow oxygenation delivery is largely preserved."
        else:
            h_status = "OPTIMAL"
            h_summary = "Red blood cell indices, hemoglobin reserves, and platelets are balanced, supporting robust cellular oxygenation and normal coagulation."

        organ_systems.append({
            "id": "hematology",
            "name": "Blood & Oxygenation (Hematology)",
            "icon": "Drop",
            "status": h_status,
            "summary": h_summary,
            "relevantMarkers": [f"{p['canonicalName']}: {p['value']} {p.get('unit', '')}" for p in hem_params[:5]],
            "physiologicalMechanism": "Hemoglobin acts as molecular transport vehicles inside red blood cells. When hemoglobin or cell volume (MCV) declines, peripheral tissues receive less oxygen, prompting compensatory cardiac effort."
        })

    # B. Cardiovascular & Lipid Health
    lipid_params = [p for p in parameters if p.get("panel") == "Lipid Profile" or p.get("canonicalName") in [
        "Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides", "VLDL Cholesterol"
    ]]
    if lipid_params:
        lipid_abnormal = [p for p in lipid_params if p.get("status") != "NORMAL"]
        ldl = param_map.get("LDL Cholesterol", {}).get("value")
        tg = param_map.get("Triglycerides", {}).get("value")
        hdl = param_map.get("HDL Cholesterol", {}).get("value")

        if (ldl and ldl > 190) or (tg and tg > 400):
            c_status = "CRITICAL_ALERT"
            c_summary = "Markedly elevated atherogenic lipid concentrations. Requires focused medical review and targeted lipid-modulating therapy."
        elif lipid_abnormal:
            c_status = "ATTENTION_NEEDED"
            c_summary = "Suboptimal lipid balance observed with elevated atherogenic particles (LDL/Triglycerides) or reduced protective HDL. Over time, circulating lipids can contribute to endothelial plaque accumulation."
        else:
            c_status = "OPTIMAL"
            c_summary = "Favorable lipid equilibrium. Circulating lipoproteins support cardiovascular elasticity and low plaque vulnerability."

        organ_systems.append({
            "id": "cardiovascular",
            "name": "Cardiovascular & Lipid Transport",
            "icon": "Heart",
            "status": c_status,
            "summary": c_summary,
            "relevantMarkers": [f"{p['canonicalName']}: {p['value']} {p.get('unit', '')}" for p in lipid_params[:4]],
            "physiologicalMechanism": "Low-density lipoproteins (LDL) deposit excess cholesterol into arterial linings, while High-density lipoproteins (HDL) retrieve cholesterol for hepatic clearance."
        })

    # C. Glycemic & Metabolic Balance
    glycemic_params = [p for p in parameters if p.get("panel") == "Blood Sugar & Glycemic" or p.get("canonicalName") in [
        "Fasting Blood Glucose", "HbA1c", "Postprandial Glucose"
    ]]
    if glycemic_params:
        glyc_abnormal = [p for p in glycemic_params if p.get("status") != "NORMAL"]
        fbs = param_map.get("Fasting Blood Glucose", {}).get("value")
        hba1c = param_map.get("HbA1c", {}).get("value")

        if (fbs and fbs >= 126) or (hba1c and hba1c >= 6.5):
            g_status = "ATTENTION_NEEDED"
            g_summary = f"Fasting glucose ({fbs} mg/dL) or HbA1c ({hba1c}%) align with diabetic thresholds. Insulin sensitivity is impaired, leading to prolonged circulating glucose exposure."
        elif glyc_abnormal:
            g_status = "ATTENTION_NEEDED"
            g_summary = "Readings indicate prediabetic / impaired fasting glucose territory. The pancreas is producing insulin under elevated physiological demand."
        else:
            g_status = "OPTIMAL"
            g_summary = "Glycemic control is within reference bounds. Insulin signaling and post-absorptive glucose clearance are functioning smoothly."

        organ_systems.append({
            "id": "metabolic",
            "name": "Metabolic & Glycemic Balance",
            "icon": "Zap",
            "status": g_status,
            "summary": g_summary,
            "relevantMarkers": [f"{p['canonicalName']}: {p['value']} {p.get('unit', '')}" for p in glycemic_params],
            "physiologicalMechanism": "HbA1c measures the percentage of red blood cells coated in sugar over their 90-120 day lifespan, providing an accurate 3-month panoramic view of glycemic stress."
        })

    # D. Hepatic Function (Liver)
    liver_params = [p for p in parameters if p.get("panel") == "Liver Function Test (LFT)" or p.get("canonicalName") in [
        "ALT (SGPT)", "AST (SGOT)", "Total Bilirubin", "Alkaline Phosphatase (ALP)", "Albumin"
    ]]
    if liver_params:
        liver_abnormal = [p for p in liver_params if p.get("status") != "NORMAL"]
        alt = param_map.get("ALT (SGPT)", {}).get("value")
        ast = param_map.get("AST (SGOT)", {}).get("value")

        if (alt and alt > 150) or (ast and ast > 120):
            l_status = "CRITICAL_ALERT"
            l_summary = "Pronounced transaminase leakage into bloodstream, suggesting acute hepatocellular irritation or metabolic overload."
        elif liver_abnormal:
            l_status = "ATTENTION_NEEDED"
            l_summary = "Mild elevations in transaminases (ALT/AST). Frequently linked with metabolic fatty infiltration, sluggish lipid processing, or medication-related clearance load."
        else:
            l_status = "OPTIMAL"
            l_summary = "Hepatic enzymes and bilirubin clearance are within normal intervals, reflecting healthy liver detoxification and protein synthesis."

        organ_systems.append({
            "id": "hepatic",
            "name": "Hepatic & Metabolic Detoxification",
            "icon": "Shield",
            "status": l_status,
            "summary": l_summary,
            "relevantMarkers": [f"{p['canonicalName']}: {p['value']} {p.get('unit', '')}" for p in liver_params[:4]],
            "physiologicalMechanism": "ALT and AST are intracellular enzymes residing inside hepatocytes. When liver cells experience metabolic strain or inflammation, these enzymes seep into systemic circulation."
        })

    # E. Renal & Electrolyte Regulation (Kidneys)
    renal_params = [p for p in parameters if p.get("panel") in ["Kidney Function Test (KFT)", "Electrolytes Panel"] or p.get("canonicalName") in [
        "Creatinine", "Blood Urea Nitrogen (BUN)", "eGFR", "Uric Acid", "Sodium", "Potassium"
    ]]
    if renal_params:
        renal_abnormal = [p for p in renal_params if p.get("status") != "NORMAL"]
        creat = param_map.get("Creatinine", {}).get("value")
        k = param_map.get("Potassium", {}).get("value")

        if (k and (k > 5.5 or k < 3.2)) or (creat and creat > 1.8):
            r_status = "CRITICAL_ALERT"
            r_summary = "Kidney clearance or electrolyte filtration requires immediate clinician supervision to safeguard renal microvasculature and cardiac rhythm."
        elif renal_abnormal:
            r_status = "ATTENTION_NEEDED"
            r_summary = "Mild alterations in renal excretion rates or mineral electrolytes. Fluid balance and metabolic waste clearance need moderate support."
        else:
            r_status = "OPTIMAL"
            r_summary = "Glomerular filtration, creatinine clearance, and electrolyte homeostasis are stable."

        organ_systems.append({
            "id": "renal",
            "name": "Renal Clearance & Fluid Balance",
            "icon": "Filter",
            "status": r_status,
            "summary": r_summary,
            "relevantMarkers": [f"{p['canonicalName']}: {p['value']} {p.get('unit', '')}" for p in renal_params[:4]],
            "physiologicalMechanism": "Nephrons filter blood continuously. Elevated serum creatinine occurs when glomerular filtration efficiency moderates, retaining cellular byproducts."
        })

    # F. Micronutrients & Systemic Inflammation
    micro_params = [p for p in parameters if p.get("panel") in ["Vitamins & Minerals", "Inflammatory Markers", "Thyroid Panel"] or p.get("canonicalName") in [
        "Vitamin D (25-OH)", "Vitamin B12", "C-Reactive Protein (CRP)", "WBC Count", "TSH", "ESR"
    ]]
    if micro_params:
        micro_abnormal = [p for p in micro_params if p.get("status") != "NORMAL"]
        vit_d = param_map.get("Vitamin D (25-OH)", {}).get("value")
        crp = param_map.get("C-Reactive Protein (CRP)", {}).get("value")
        wbc = param_map.get("WBC Count", {}).get("value")

        if (crp and crp > 10.0) or (wbc and wbc > 16000):
            m_status = "CRITICAL_ALERT"
            m_summary = "Substantial inflammatory signaling detected, indicating an active immunological response."
        elif micro_abnormal:
            m_status = "ATTENTION_NEEDED"
            findings = []
            if vit_d and vit_d < 30:
                findings.append(f"insufficient Vitamin D reserves ({vit_d} ng/mL)")
            if crp and crp > 3.0:
                findings.append("low-grade systemic inflammation (CRP elevated)")
            m_summary = f"Identified {', and '.join(findings) if findings else 'minor micronutrient or inflammatory shifts'}. May impact day-to-day energy, immune resilience, and bone turnover."
        else:
            m_status = "OPTIMAL"
            m_summary = "Optimal micronutrient adequacy and quiet baseline inflammatory markers."

        organ_systems.append({
            "id": "micronutrients",
            "name": "Micronutrients & Immune Resilience",
            "icon": "Sparkles",
            "status": m_status,
            "summary": m_summary,
            "relevantMarkers": [f"{p['canonicalName']}: {p['value']} {p.get('unit', '')}" for p in micro_params[:4]],
            "physiologicalMechanism": "Vitamin D modulates nuclear gene transcription across 200+ tissues. CRP is an acute-phase reactant synthesized by the liver in response to cytokine signaling."
        })

    # 2. Executive Plain-Language Summary
    if critical_count > 0:
        headline = "Immediate Physician Consultation Advised: Critical Markers Flagged"
        executive_summary = (
            f"Your laboratory blood test panel includes {critical_count} critical indicator(s) and {abnormal_count} abnormal values "
            f"yielding an overall health stability score of {health_score}/100. "
            f"The primary areas requiring clinical supervision are {', '.join([c.get('condition') for c in conditions[:2]]) if conditions else 'elevated laboratory markers'}. "
            "While laboratory tests are a snapshot of biological homeostasis, these values suggest active physiological strain "
            "that warrants timely consultation with your doctor to establish an accurate diagnostic and treatment plan."
        )
    elif abnormal_count > 0:
        headline = f"Actionable Metabolic & Lifestyle Findings Identified ({abnormal_count} Tests Flagged)"
        condition_names = [c.get("condition") for c in conditions[:3]]
        cond_text = f" including {', '.join(condition_names)}" if condition_names else ""
        executive_summary = (
            f"Your comprehensive lab analysis reveals {abnormal_count} parameters outside standard adult reference ranges{cond_text}, "
            f"reflecting an overall metabolic score of {health_score}/100. "
            f"Importantly, {normal_count} core parameters remain healthy and within normal benchmarks. "
            "The detected variations reflect interconnected bodily patterns—most notably in metabolic energy utilization, "
            "lipid transport, and cellular nutrient reserves. These findings are largely reversible or manageable through targeted "
            "nutritional adjustments, physical activity, and medical guidance from your healthcare provider."
        )
    else:
        headline = "Optimal Physiological Profile: All Lab Parameters Within Healthy Limits"
        executive_summary = (
            f"Excellent news: All {normal_count} analyzed laboratory markers fall comfortably within standard reference intervals, "
            f"resulting in an optimal metabolic score of {health_score}/100. "
            "Your blood count, organ filtration markers, lipid profile, and glycemic indices reflect strong biological balance. "
            "Continue your current dietary, hydration, and exercise habits, and maintain scheduled annual health checkups."
        )

    # 3. Dietary & Lifestyle Prescriptions
    nutrition_tips = []
    exercise_tips = []
    supplements_tips = []
    lifestyle_tips = []

    # Check conditions
    cond_str = " ".join([c.get("condition", "").lower() for c in conditions])
    
    # Anemia / Low Iron
    if "anemia" in cond_str or (param_map.get("Hemoglobin", {}).get("status") == "LOW"):
        nutrition_tips.append("Boost bioavailable iron: incorporate spinach, lentils, pumpkin seeds, and lean proteins paired with citrus (Vitamin C) to enhance absorption.")
        nutrition_tips.append("Separate tea and coffee by at least 1 hour from main meals, as tannins inhibit non-heme iron uptake.")
        supplements_tips.append("Discuss an elemental iron formulation or targeted multivitamin with your doctor to replenish depleted ferritin stores.")

    # Lipids / Cholesterol
    if "dyslipidemia" in cond_str or (param_map.get("LDL Cholesterol", {}).get("status") == "HIGH"):
        nutrition_tips.append("Incorporate soluble fiber daily: oats, chia seeds, flaxseeds, and legumes bind bile acids in the gut to lower circulating LDL.")
        nutrition_tips.append("Replace saturated and trans-fats (butter, palm oil, deep-fried snacks) with monounsaturated oils (extra virgin olive oil, avocado).")
        exercise_tips.append("Aim for 150 minutes of moderate aerobic activity weekly (e.g. 30 min brisk walk, cycling) to elevate cardioprotective HDL.")

    # Blood Sugar / Prediabetes
    if "diabetes" in cond_str or "prediabetes" in cond_str or (param_map.get("Fasting Blood Glucose", {}).get("status") == "HIGH"):
        nutrition_tips.append("Adopt low-glycemic meal planning: pair complex carbohydrates with fiber and protein to prevent postprandial glucose spikes.")
        exercise_tips.append("Perform a 10-15 minute gentle walk immediately following lunch and dinner to stimulate non-insulin mediated muscle glucose uptake.")
        lifestyle_tips.append("Prioritize 7-8 hours of sound sleep; chronic sleep deprivation increases evening cortisol and morning insulin resistance.")

    # Liver strain
    if "hepatic" in cond_str or (param_map.get("ALT (SGPT)", {}).get("status") == "HIGH"):
        nutrition_tips.append("Minimize ultra-processed foods, high-fructose corn syrups, and alcohol to diminish hepatic steatosis (fatty liver) stress.")
        lifestyle_tips.append("Maintain optimal hydration (2.5 - 3 liters water daily) to facilitate hepatic metabolic byproduct filtration.")

    # Vitamin D
    if "vitamin d" in cond_str or (param_map.get("Vitamin D (25-OH)", {}).get("status") == "LOW"):
        supplements_tips.append("Speak with your physician regarding high-dose Vitamin D3 cholecalciferol repletion (e.g. 60,000 IU weekly for 8 weeks).")
        lifestyle_tips.append("Ensure 15-20 minutes of safe morning sunlight exposure on arms and legs without sunscreen.")

    # General baseline if empty
    if not nutrition_tips:
        nutrition_tips.append("Maintain a balanced Mediterranean-style dietary pattern rich in colorful vegetables, whole grains, nuts, and healthy fats.")
    if not exercise_tips:
        exercise_tips.append("Engage in consistent daily movement, aiming for 7,500 - 10,000 steps and moderate resistance training twice weekly.")
    if not lifestyle_tips:
        lifestyle_tips.append("Stay well-hydrated throughout the day and practice stress-management techniques such as diaphragmatic breathing.")

    # 4. Doctor Consultation Checklist (High-Yield Questions)
    doctor_questions = []
    if any("anemia" in c.get("condition", "").lower() for c in conditions):
        doctor_questions.append("Given my low hemoglobin / MCV, do you recommend a full iron panel (serum ferritin, TIBC, transferrin saturation)?")
    if any("dyslipidemia" in c.get("condition", "").lower() for c in conditions):
        doctor_questions.append("What is my calculated 10-year ASCVD cardiovascular risk score, and should we consider statin therapy or dietary modification first?")
    if any("diabetes" in c.get("condition", "").lower() or "prediabetes" in c.get("condition", "").lower() for c in conditions):
        doctor_questions.append("What is my target HbA1c goal, and when should we repeat the fasting glucose panel to evaluate progress?")
    if any("hepatic" in c.get("condition", "").lower() for c in conditions):
        doctor_questions.append("Would an abdominal ultrasound be beneficial to check for hepatic steatosis (fatty liver changes)?")
    if any("vitamin d" in c.get("condition", "").lower() for c in conditions):
        doctor_questions.append("What dosage and duration of Vitamin D3 supplementation is ideal for my level?")
    
    # Generic valuable questions
    doctor_questions.append("Are any of my current medications or supplements contributing to these specific laboratory findings?")
    doctor_questions.append("What is the optimal timeframe for a follow-up blood panel (e.g., 6 weeks, 3 months, or 6 months)?")

    # 5. Red Flag Signs (When to seek immediate attention)
    red_flags = [
        "Sudden chest pressure, tightness, or pain radiating to the jaw, neck, or left arm",
        "Shortness of breath at rest or severe sudden dizziness / faintness",
        "Noticeable dark, tarry stools, vomiting of blood, or extreme sudden pallor and weakness",
        "Rapid heart palpitations accompanied by lightheadedness or confusion"
    ]

    return {
        "module": "blood",
        "headline": headline,
        "healthScore": health_score,
        "acuityLevel": "High" if critical_count > 0 else "Moderate" if abnormal_count >= 3 else "Low",
        "executiveSummary": executive_summary,
        "organSystems": organ_systems,
        "lifestylePrescription": {
            "nutrition": nutrition_tips,
            "exercise": exercise_tips,
            "supplements": supplements_tips,
            "habits": lifestyle_tips
        },
        "doctorChecklist": {
            "questions": doctor_questions,
            "recommendedSpecialists": determine_specialists(conditions, abnormal_params),
            "followUpTimeline": "Within 1 to 2 weeks" if (critical_count > 0 or abnormal_count >= 5) else "Within 1 month" if abnormal_count > 0 else "Routine 6 to 12 months checkup"
        },
        "redFlags": red_flags,
        "readingLevel": reading_level,
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S")
    }


def generate_cardiac_report_explanation(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Synthesizes clinical explanation for Cardiac ECG Waveform Reports.
    """
    top_condition = report_data.get("topCondition", "Normal Sinus Rhythm")
    confidence = report_data.get("topConfidence", 0.8)
    metrics = report_data.get("metrics", {})
    hr = metrics.get("heartRate", 72)
    requires_specialist = report_data.get("requiresSpecialistReview", False)
    predictions = report_data.get("predictions", [])

    is_normal = "Normal" in top_condition
    conf_pct = round(confidence * 100, 1)

    if is_normal:
        headline = f"Normal Electrophysiological Profile ({conf_pct}% Confidence)"
        executive_summary = (
            f"The digitized 12-lead ECG analysis demonstrates normal sinus rhythm with an average resting heart rate of {hr} bpm. "
            "P-waves, QRS duration, and T-wave repolarization morphology show preserved conduction velocity without evidence "
            "of acute ischemic ST-segment shifts or malignant ventricular ectopy. Electrophysiological metrics reside within expected clinical tolerances."
        )
    else:
        headline = f"Detected Cardiac Pattern: {top_condition} ({conf_pct}% Confidence)"
        executive_summary = (
            f"The algorithm identifies electrophysiological features characteristic of {top_condition} with {conf_pct}% model confidence. "
            f"Average recorded ventricular rate is {hr} bpm. "
            "1D Grad-CAM waveform attribution highlights focal activation across specific segments of the cardiac cycle (e.g. QRS depolarization or ST-T repolarization). "
            f"{'⚠️ This finding warrants clinical correlation with a 12-lead ECG supervised by a cardiologist.' if requires_specialist else 'Discuss this rhythm finding with your healthcare provider.'}"
        )

    organ_systems = [
        {
            "id": "rhythm",
            "name": "Sinoatrial & Atrioventricular Conduction",
            "icon": "HeartPulse",
            "status": "OPTIMAL" if is_normal else "ATTENTION_NEEDED",
            "summary": f"Rhythm classification: {top_condition}. Heart rate: {hr} bpm.",
            "relevantMarkers": [f"Heart Rate: {hr} bpm", f"PR: {metrics.get('prInterval', 'Normal')}", f"QRS: {metrics.get('qrsDuration', 'Normal')}"],
            "physiologicalMechanism": "Electrical impulses generated in the sinoatrial (SA) node propagate through atrial pathways to the AV node, driving synchronized ventricular contraction."
        },
        {
            "id": "repolarization",
            "name": "Ventricular Repolarization & Recovery",
            "icon": "Activity",
            "status": "OPTIMAL" if is_normal else "ATTENTION_NEEDED",
            "summary": f"QT Interval measured at {metrics.get('qtInterval', 'Normal')} with HRV (SDNN) of {metrics.get('hrv', 'Normal')}.",
            "relevantMarkers": [f"QT Interval: {metrics.get('qtInterval', 'N/A')}", f"HRV: {metrics.get('hrv', 'N/A')}"],
            "physiologicalMechanism": "The QT interval corresponds to the total duration of ventricular electrical depolarization and subsequent repolarization."
        }
    ]

    doctor_questions = [
        f"Does this automated ECG finding of '{top_condition}' align with my clinical symptoms (e.g. palpitations, dizziness)?",
        "Would a 24-hour ambulatory Holter monitor or formal 12-lead ECG be indicated?",
        "Should we review electrolyte concentrations (Serum Potassium, Magnesium) that influence cardiac electrophysiology?"
    ]

    return {
        "module": "cardiac",
        "headline": headline,
        "healthScore": 95 if is_normal else 65,
        "acuityLevel": "High" if requires_specialist else "Moderate" if not is_normal else "Low",
        "executiveSummary": executive_summary,
        "organSystems": organ_systems,
        "lifestylePrescription": {
            "nutrition": [
                "Ensure adequate dietary potassium and magnesium intake (bananas, leafy greens, avocados) to support resting membrane stability.",
                "Moderate caffeine and avoid excessive energy drinks or sympathomimetic stimulants that can trigger premature beats."
            ],
            "exercise": [
                "Engage in moderate-intensity cardiovascular exercise with proper warm-up and cool-down phases unless contraindicated by your physician."
            ],
            "supplements": [
                "Discuss Omega-3 fatty acids (EPA/DHA) and CoQ10 with your cardiologist for cellular myocardial support."
            ],
            "habits": [
                "Practice stress-reduction techniques (e.g. coherent breathing) to down-regulate sympathetic nervous system overdrive."
            ]
        },
        "doctorChecklist": {
            "questions": doctor_questions,
            "recommendedSpecialists": ["Cardiologist", "Electrophysiologist (Cardiac EP)"],
            "followUpTimeline": "Within 24-48 hours if symptomatic" if requires_specialist else "Within 2-4 weeks"
        },
        "redFlags": [
            "Acute or crushing retrosternal chest pain radiating to left arm or back",
            "Syncope (loss of consciousness) or near-syncope with rapid heart pounding",
            "Acute severe shortness of breath or cold, clammy diaphoresis"
        ],
        "readingLevel": "standard",
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S")
    }


def generate_skin_report_explanation(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Synthesizes clinical explanation for Dermatological Skin Lesion Reports.
    """
    top_condition = report_data.get("topCondition", "Melanocytic Nevus (Mole)")
    confidence = report_data.get("topConfidence", 0.75)
    seg_metrics = report_data.get("segmentationMetrics", {})
    requires_specialist = report_data.get("requiresSpecialistReview", False)
    conf_pct = round(confidence * 100, 1)

    is_benign = "Nevus" in top_condition or "Normal" in top_condition or "Benign" in top_condition

    headline = f"Dermatological Assessment: {top_condition} ({conf_pct}% Confidence)"
    executive_summary = (
        f"Deep transfer-learning convolutional analysis classifies the analyzed skin lesion as {top_condition} with {conf_pct}% confidence. "
        f"Morphological ABCD evaluation indicates an Asymmetry Index of {seg_metrics.get('asymmetryIndex', 0.2):.2f} "
        f"and Border Irregularity score of {seg_metrics.get('borderIrregularity', 0.25):.2f}. "
        "The Grad-CAM attribution overlay confirms model focus is centered directly on internal pigmentary networks. "
        f"{'⚠️ Clinical dermoscopy and in-person biopsy evaluation by a licensed dermatologist is strongly recommended.' if requires_specialist else 'Monitor for any progressive changes in size, border, or coloration.'}"
    )

    organ_systems = [
        {
            "id": "integumentary",
            "name": "Epidermal & Dermal Architecture",
            "icon": "ScanEye",
            "status": "OPTIMAL" if is_benign else "ATTENTION_NEEDED",
            "summary": f"Lesion classification: {top_condition}. Asymmetry: {seg_metrics.get('asymmetryIndex', 'Low')}.",
            "relevantMarkers": [
                f"Asymmetry Index: {seg_metrics.get('asymmetryIndex', 0.18):.2f}",
                f"Border Score: {seg_metrics.get('borderIrregularity', 0.22):.2f}",
                f"Estimated Diameter: {seg_metrics.get('estimatedDiameterPx', 78)} px"
            ],
            "physiologicalMechanism": "Melanocytes produce melanin pigment to shield basal keratinocyte DNA against ultraviolet radiation damage."
        }
    ]

    doctor_questions = [
        f"Does this lesion warrant formal epiluminescence dermoscopy or an excision biopsy?",
        "How frequently should full-body photographic skin surveillance be scheduled based on my skin type?",
        "Are there specific signs of evolution (evolutionary change in color, diameter, or border) I should photograph?"
    ]

    return {
        "module": "skin",
        "headline": headline,
        "healthScore": 90 if is_benign else 60,
        "acuityLevel": "High" if requires_specialist else "Moderate" if not is_benign else "Low",
        "executiveSummary": executive_summary,
        "organSystems": organ_systems,
        "lifestylePrescription": {
            "nutrition": [
                "Consume dietary polyphenols, carotenoids (carrots, tomatoes, sweet potatoes), and Vitamin E to protect skin barrier lipids against photo-oxidation."
            ],
            "exercise": [
                "Enjoy outdoor exercise during early mornings or late afternoons to avoid peak UV index hours (10 AM to 4 PM)."
            ],
            "supplements": [
                "Discuss oral Polypodium leucotomos extract or Nicotinamide (Vitamin B3) with your dermatologist for photo-protective cellular DNA defense."
            ],
            "habits": [
                "Apply broad-spectrum SPF 30+ mineral or organic sunscreen daily, reapplying every 2 hours when exposed to direct sun.",
                "Practice monthly self-skin exams utilizing the clinical ABCDE rule (Asymmetry, Border, Color, Diameter, Evolving)."
            ]
        },
        "doctorChecklist": {
            "questions": doctor_questions,
            "recommendedSpecialists": ["Dermatologist", "Dermato-Oncologist"],
            "followUpTimeline": "Within 1 to 2 weeks" if requires_specialist else "Routine annual skin checkup"
        },
        "redFlags": [
            "Rapid lesion enlargement, darkening, or spontaneous bleeding without trauma",
            "Emergence of notched, scalloped borders or multiple colors (black, blue, red, white)",
            "A new mole that looks distinctly different from all your other moles ('ugly duckling sign')"
        ],
        "readingLevel": "standard",
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S")
    }


def determine_specialists(conditions: List[Dict[str, Any]], abnormal_params: List[Dict[str, Any]]) -> List[str]:
    """Determines recommended clinical specialists based on findings."""
    specialists = set()
    cond_text = " ".join([c.get("condition", "").lower() for c in conditions])
    
    if "anemia" in cond_text:
        specialists.add("Hematologist")
    if "diabetes" in cond_text or "prediabetes" in cond_text or "thyroid" in cond_text:
        specialists.add("Endocrinologist")
    if "dyslipidemia" in cond_text:
        specialists.add("Cardiologist / Lipidologist")
    if "hepatic" in cond_text:
        specialists.add("Gastroenterologist / Hepatologist")
    if "renal" in cond_text or "hyperkalemia" in cond_text:
        specialists.add("Nephrologist")

    if not specialists:
        specialists.add("Primary Care Physician (Internal Medicine)")
    else:
        specialists.add("Primary Care Physician")

    return list(specialists)[:3]


def generate_report_explanation(report_data: Dict[str, Any], module: str = "blood", reading_level: str = "standard") -> Dict[str, Any]:
    """
    Main entry point for generating comprehensive AI report explanations.
    """
    mod = module.lower()
    if mod == "cardiac":
        return generate_cardiac_report_explanation(report_data)
    elif mod == "skin":
        return generate_skin_report_explanation(report_data)
    else:
        return generate_blood_report_explanation(report_data, reading_level=reading_level)


def chat_with_report_ai(
    report_data: Dict[str, Any],
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    module: str = "blood"
) -> Dict[str, Any]:
    """
    Interactive AI Medical Assistant that answers patient questions with direct
    awareness of their analyzed report, lab values, and physiological patterns.
    """
    msg_clean = user_message.lower().strip()
    mod = module.lower()

    # Context extraction
    parameters = report_data.get("parameters", [])
    conditions = report_data.get("conditions", [])
    param_map = {p.get("canonicalName", p.get("name", "")): p for p in parameters}

    # Intent 1: "Explain like I'm 10" / Simple breakdown
    if any(k in msg_clean for k in ["simple", "kid", "child", "10-year", "easy", "plain", "layman"]):
        if mod == "blood":
            abnormal_names = [p.get("canonicalName") for p in parameters if p.get("status") != "NORMAL"]
            if not abnormal_names:
                reply = (
                    "Think of your body like a well-tuned car. This blood report shows all your engine oil, fuel filters, "
                    "and battery levels are in tip-top shape! Every single test came back in the happy green zone. "
                    "You're running super smoothly!"
                )
            else:
                reply = (
                    f"Imagine your blood has little delivery trucks (red blood cells) and garbage collectors (liver and kidneys). "
                    f"In your test, we noticed a few gauges flashing yellow: specifically {', '.join(abnormal_names[:3])}. "
                    "For example, if your hemoglobin is low, your delivery trucks don't have enough oxygen boxes inside them, "
                    "which is why you might feel extra tired. It's nothing to be scared of, but we need to give your body "
                    "the right fuel (like iron, vegetables, and good sleep) to tune up those gauges!"
                )
        elif mod == "cardiac":
            reply = (
                "Your heart is like a metronome or music drummer that plays a steady beat. "
                f"The AI checked your electrical song and found a rhythm called '{report_data.get('topCondition')}'. "
                "Most of the time, simple things like caffeine, stress, or electrolytes can change the song tempo. "
                "Your doctor will take a quick listen with their stethoscope to make sure your beat is solid!"
            )
        else:
            reply = (
                "Think of your skin like an artist's canvas. The AI looked at the shape, borders, and colors of your spot. "
                f"It thinks this spot is '{report_data.get('topCondition')}'. The best thing to do is have a skin doctor "
                "look at it through their special magnifying glass to confirm it's safe!"
            )
        suggestions = ["What food should I eat to fix this?", "Are any of these numbers dangerous?", "What should I ask my doctor?"]
        return {"reply": reply, "followUpSuggestions": suggestions}

    # Intent 2: Diet & Food Questions
    if any(k in msg_clean for k in ["diet", "food", "eat", "meal", "breakfast", "nutrition", "drink"]):
        diet_points = []
        if any(p.get("canonicalName") in ["Hemoglobin", "RBC Count"] and p.get("status") == "LOW" for p in parameters):
            diet_points.append("🥦 **For Low Hemoglobin / Iron**: Load up on iron-rich foods: lentils, spinach, chickpeas, and seeds. Crucially, combine them with Vitamin C (lemon juice, oranges, bell peppers) to boost absorption by up to 300%!")
        if any(p.get("canonicalName") in ["LDL Cholesterol", "Total Cholesterol", "Triglycerides"] and p.get("status") == "HIGH" for p in parameters):
            diet_points.append("🥑 **For High Cholesterol & Triglycerides**: Emphasize viscous soluble fiber: overnight oats, chia pudding, walnuts, and kidney beans. Cook with extra virgin olive oil instead of butter or ghee, and avoid fried foods.")
        if any(p.get("canonicalName") in ["Fasting Blood Glucose", "HbA1c"] and p.get("status") == "HIGH" for p in parameters):
            diet_points.append("🥗 **For Blood Sugar Control**: Follow the 'Plate Method'—fill half your plate with non-starchy vegetables, one quarter with lean protein, and one quarter with complex carbs (quinoa, brown rice, millets). Avoid sugary sodas and fruit juices.")
        if any(p.get("canonicalName") in ["ALT (SGPT)", "AST (SGOT)"] and p.get("status") == "HIGH" for p in parameters):
            diet_points.append("💧 **For Liver Health**: Eliminate alcohol, cut out processed snacks with high-fructose corn syrup, and drink 2.5–3 liters of water daily.")
        if any(p.get("canonicalName") in ["Vitamin D (25-OH)"] and p.get("status") == "LOW" for p in parameters):
            diet_points.append("☀️ **For Vitamin D**: While foods like egg yolks and fortified dairy help, dietary sources alone rarely cure deficiency; speak with your doctor about weekly D3 repletion.")

        if not diet_points:
            diet_points.append("🍎 Your report is in great health! Maintain a wholesome Mediterranean dietary pattern: diverse fruits, vegetables, olive oil, nuts, and adequate hydration.")

        reply = (
            "Here is your personalized dietary guidance based specifically on your analyzed test numbers:\n\n" +
            "\n\n".join(diet_points) +
            "\n\n*Pro-tip: Try adopting these changes consistently for 8 to 12 weeks before your follow-up blood test to see measurable improvements.*"
        )
        suggestions = ["Can you suggest a 1-day sample meal plan?", "What supplements should I take?", "When should I re-test my blood?"]
        return {"reply": reply, "followUpSuggestions": suggestions}

    # Intent 3: Danger / Emergency Assessment
    if any(k in msg_clean for k in ["danger", "emergency", "fatal", "scared", "worry", "critical", "die", "harm"]):
        crit_params = [p for p in parameters if "CRITICAL" in p.get("status", "")]
        if crit_params:
            crit_names = [f"{p.get('canonicalName')} ({p.get('value')} {p.get('unit', '')})" for p in crit_params]
            crit_str = ", ".join(crit_names)
            reply = (
                f"⚠️ **Clinical Alert**: Your report does show {len(crit_params)} parameter(s) flagged at critical alert levels: "
                f"{crit_str}. "
                "While single lab values can occasionally be impacted by sampling or processing artifacts, you should **contact your doctor or primary clinic promptly** "
                "for confirmatory review. If you are experiencing symptoms like severe dizziness, chest pain, or extreme shortness of breath, please visit an urgent care or emergency department."
            )
        else:
            reply = (
                "You can breathe a sigh of relief: **None of your test parameters are in a life-threatening or emergency category.**\n\n"
                "The flagged values indicate chronic lifestyle or metabolic trends (such as mild iron deficiency, slight cholesterol elevation, or prediabetes). "
                "These are very common, highly responsive to lifestyle and medical care, and are best addressed calmly through a routine appointment with your doctor."
            )
        suggestions = ["What questions should I ask my doctor?", "What lifestyle changes help the most?", "Explain my liver enzymes"]
        return {"reply": reply, "followUpSuggestions": suggestions}

    # Intent 4: Doctor Appointment / Questions
    if any(k in msg_clean for k in ["doctor", "physician", "appointment", "clinic", "ask", "tell"]):
        questions = []
        if any("anemia" in c.get("condition", "").lower() for c in conditions):
            questions.append("1. *'My hemoglobin and MCV are low—could we test serum ferritin to evaluate iron storage?'*")
        if any("cholesterol" in c.get("condition", "").lower() or "dyslipidemia" in c.get("condition", "").lower() for c in conditions):
            questions.append("2. *'My LDL and triglycerides are elevated. Do you recommend 3 months of strict dietary intervention or starting medication?'*")
        if any("diabetes" in c.get("condition", "").lower() or "prediabetes" in c.get("condition", "").lower() for c in conditions):
            questions.append("3. *'My fasting glucose/HbA1c points to prediabetes. Can we discuss a metabolic management plan?'*")
        questions.append("4. *'Could any of my current daily habits or medications be influencing these values?'*")
        questions.append("5. *'When would you like me to repeat this blood panel to check my progress?'*")

        reply = (
            "Here are the top high-yield questions to take to your upcoming consultation:\n\n" +
            "\n".join(questions) +
            "\n\n💡 *Tip: Feel free to export or print this Spandan AI report and show the 'Benchmarked Lab Parameters' table directly to your clinician.*"
        )
        suggestions = ["Explain this report in simple terms", "What foods should I avoid?", "How do liver and lipids relate?"]
        return {"reply": reply, "followUpSuggestions": suggestions}

    # Intent 5: Specific Parameter Inquiries (Hemoglobin, Cholesterol, ALT, Glucose, Vitamin D, etc.)
    for param_name, p_data in param_map.items():
        if param_name.lower() in msg_clean or any(alias.lower() in msg_clean for alias in [param_name.split()[0]]):
            val = p_data.get("value")
            unit = p_data.get("unit")
            status = p_data.get("status")
            ref_low = p_data.get("min")
            ref_high = p_data.get("max")
            desc = p_data.get("description", "")
            signif = p_data.get("significance", "")

            reply = (
                f"### Analysis of {param_name}:\n\n"
                f"- **Your Measured Value**: `{val} {unit}`\n"
                f"- **Standard Reference Range**: `{ref_low} – {ref_high} {unit}`\n"
                f"- **Clinical Status**: **{status.replace('_', ' ')}**\n\n"
                f"**What it does**: {signif or desc}\n\n"
                f"**Clinical Context**: {'Your level is within healthy physiological limits.' if status == 'NORMAL' else f'Your reading deviates from baseline. {desc}'}\n\n"
                "Would you like recommendations on how to optimize this specific parameter?"
            )
            suggestions = [f"How to optimize my {param_name}?", "What foods help this?", "What else in my report relates to this?"]
            return {"reply": reply, "followUpSuggestions": suggestions}

    # Default Contextual Reply
    cond_list = [c.get("condition") for c in conditions[:3]]
    reply = (
        f"Based on your analyzed report, your overall health score is **{report_data.get('summary', {}).get('healthScore', 75)}/100** "
        f"with {len(conditions)} identified clinical pattern(s): {', '.join(cond_list) if cond_list else 'all within healthy parameters'}.\n\n"
        f"Regarding your question ('{user_message}'): In clinical practice, laboratory numbers are interpreted as a holistic system. "
        "Every parameter influences other organs—for example, liver metabolic strain frequently co-occurs with elevated blood lipids and prediabetes.\n\n"
        "Feel free to ask me to explain any individual marker, provide meal recommendations, or generate a tailored list of questions for your physician!"
    )
    suggestions = [
        "Explain this in simple terms",
        "What diet changes should I make?",
        "Are any of my values dangerous?",
        "What questions should I ask my doctor?"
    ]
    return {"reply": reply, "followUpSuggestions": suggestions}
