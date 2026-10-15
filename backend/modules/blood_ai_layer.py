"""
Spandan AI - Blood Test Report AI Layer
Provides end-to-end clinical laboratory report analysis using Generative Multimodal AI
(Google Gemini / OpenAI / Groq) instead of custom model training.
Extracts real lab parameters from images and PDFs, benchmarks reference ranges,
evaluates organ system pathophysiology, and powers real conversational patient Q&A.
"""

import io
import re
import json
import time
from typing import Dict, Any, List, Optional, Tuple

from modules.ai_client import (
    get_available_ai_key,
    execute_ai_query,
    clean_json_markdown,
)
from modules.blood_reference_ranges import REFERENCE_RANGES, lookup_reference_range
from modules.blood_interpreter import evaluate_parameter, analyze_blood_patterns
from modules.blood_safety import evaluate_safety

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    import pypdfium2
    HAS_PYPDFIUM2 = True
except ImportError:
    HAS_PYPDFIUM2 = False


CLINICAL_ANALYSIS_SYSTEM_PROMPT = """You are a board-certified Clinical Pathologist and Diagnostic Laboratory AI Specialist.
Your mission is to perform a meticulous, evidence-based clinical analysis of an uploaded patient blood test report.

DO NOT hallucinate or alter laboratory numbers. Extract the exact numbers, test names, units, and reference ranges printed on the document.

You must respond ONLY with a valid JSON object matching the following structure:
{
  "parameters": [
    {
      "name": "Exact test parameter name as printed on report",
      "canonicalName": "Standardized clinical name (e.g. Hemoglobin, Fasting Blood Glucose, ALT (SGPT), Total Cholesterol, TSH, Serum Creatinine, etc.)",
      "value": 12.4,
      "unit": "g/dL",
      "refLow": 12.0,
      "refHigh": 17.5,
      "refText": "12.0 - 17.5",
      "status": "NORMAL" | "LOW" | "HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH",
      "panel": "Complete Blood Count (CBC)" | "Lipid Profile" | "Blood Sugar & Glycemic" | "Liver Function Test (LFT)" | "Kidney Function Test (KFT)" | "Thyroid Panel" | "Electrolytes" | "Vitamins & Minerals" | "Inflammation Markers" | "Other",
      "clinicalSignificance": "Brief 1-sentence explanation of biological role and what this test value signifies",
      "deviationPercent": 0.0
    }
  ],
  "conditions": [
    {
      "condition": "Clinical condition or syndrome (e.g. Microcytic Anemia, Impaired Fasting Glucose, Dyslipidemia, Hepatic Transaminitis, etc.)",
      "severity": "Mild" | "Moderate" | "High" | "Critical",
      "confidence": 0.92,
      "evidence": ["Hemoglobin 10.4 g/dL is below 13.0 reference bound", "MCV 74 fL indicates microcytosis"],
      "clinicalSignificance": "Clear explanation of pathophysiology and potential clinical implications",
      "recommendedActions": ["Check serum ferritin and iron saturation", "Nutritional iron optimization"]
    }
  ],
  "summary": {
    "healthScore": 78,
    "acuityLevel": "Optimal" | "Moderate" | "High" | "Critical Alert",
    "totalEvaluated": 15,
    "abnormalCount": 3,
    "criticalCount": 0,
    "normalCount": 12,
    "overallStatus": "Actionable Findings Identified",
    "doctorConsultationRecommended": true
  },
  "executiveSummary": "A reassuring, clinically rigorous 3-4 sentence plain-language synthesis of this patient's blood report.",
  "organSystems": [
    {
      "id": "hematology" | "cardiovascular" | "metabolic" | "hepatic" | "renal" | "micronutrients",
      "name": "System Name",
      "status": "OPTIMAL" | "ATTENTION_NEEDED" | "CRITICAL_ALERT",
      "summary": "1-2 sentences on how this organ system is functioning based on the report parameters.",
      "relevantMarkers": ["Marker 1: Value", "Marker 2: Value"],
      "physiologicalMechanism": "Why these parameters behave this way biologically."
    }
  ],
  "lifestylePrescription": {
    "nutrition": ["Concrete food and dietary advice targeting the abnormal parameters"],
    "exercise": ["Safe physical movement recommendation"],
    "supplements": ["Evidence-based supplement inquiry to discuss with doctor"],
    "habits": ["Hydration and lifestyle routine guidance"]
  },
  "doctorChecklist": {
    "questions": ["Specific, high-yield questions for the patient's next clinical visit"],
    "recommendedSpecialists": ["General Physician", "Gastroenterologist", etc.],
    "followUpTimeline": "Within 2-4 weeks"
  },
  "redFlags": ["Emergency symptoms to watch out for requiring immediate medical attention"],
  "followUpRecommendations": [
    {
      "test": "Specific recommended follow-up test (e.g. Serum Ferritin, Free T4, Repeat Fasting Glucose)",
      "reason": "Why this test is indicated based on findings",
      "supportingFinding": "Specific abnormal parameter or pattern",
      "question": "Diagnostic question this follow-up answers",
      "priority": "Recommended" | "Consider discussing with physician" | "Routine"
    }
  ]
}
"""


def _pdf_to_images(file_bytes: bytes, max_pages: int = 2) -> List[bytes]:
    """Renders PDF pages to PNG byte images for vision LLM analysis."""
    rendered_images: List[bytes] = []
    if not HAS_PYPDFIUM2 or not file_bytes:
        return rendered_images

    try:
        pdf = pypdfium2.PdfDocument(file_bytes)
        for i in range(min(len(pdf), max_pages)):
            page = pdf[i]
            pil_image = page.render(scale=2.0).to_pil()
            buf = io.BytesIO()
            pil_image.save(buf, format="PNG")
            rendered_images.append(buf.getvalue())
    except Exception as e:
        print(f"[BloodAILayer] PDF rendering error: {e}")

    return rendered_images


def analyze_blood_report_with_ai(
    file_bytes: bytes,
    filename: str = "report.png",
    raw_text: str = "",
    manual_data: Optional[Dict[str, float]] = None,
    api_key: Optional[str] = None,
    provider: Optional[str] = None,
    patient_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Analyzes a blood test report using the Generative AI Layer.
    If an AI key is available, passes multimodal image or raw text to Gemini / OpenAI.
    If no key or on failure, falls back gracefully to the deterministic clinical pipeline.
    """
    start_time = time.time()
    active_key, active_provider = get_available_ai_key(api_key, provider)

    is_pdf = filename.lower().endswith(".pdf") or (file_bytes and file_bytes[:4] == b"%PDF")

    # ─────────────────────────────────────────────────────────────
    # STEP 1: If AI Key is Available, run Multimodal AI Extraction
    # ─────────────────────────────────────────────────────────────
    if active_key and active_provider in ["gemini", "openai", "groq"]:
        try:
            image_to_send = None
            mime_type = "image/png"

            if is_pdf:
                rendered = _pdf_to_images(file_bytes, max_pages=1)
                if rendered:
                    image_to_send = rendered[0]
                    mime_type = "image/png"
            elif file_bytes and len(file_bytes) > 100:
                image_to_send = file_bytes
                if filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
                    mime_type = "image/jpeg"
                elif filename.lower().endswith(".webp"):
                    mime_type = "image/webp"

            # Construct prompt
            user_prompt = "Please analyze this blood test report document thoroughly."
            
            # Format patient context if provided
            if patient_context:
                ctx_items = []
                if patient_context.get("age"): ctx_items.append(f"Age: {patient_context['age']}")
                if patient_context.get("sex"): ctx_items.append(f"Biological Sex: {patient_context['sex']}")
                if patient_context.get("fasting"): ctx_items.append(f"Fasting Status: {patient_context['fasting']}")
                if patient_context.get("pregnancy"): ctx_items.append(f"Pregnancy Status: {patient_context['pregnancy']}")
                if patient_context.get("symptoms"): ctx_items.append(f"Symptoms: {patient_context['symptoms']}")
                if patient_context.get("medications"): ctx_items.append(f"Medications: {patient_context['medications']}")
                if ctx_items:
                    user_prompt += "\n\nPATIENT CLINICAL CONTEXT (FACTOR INTO REFERENCE RANGES & INTERPRETATION):\n" + "\n".join(f"- {c}" for c in ctx_items)

            if raw_text and len(raw_text) > 30:
                user_prompt += f"\n\nHere is OCR-extracted text from the document for reference:\n```\n{raw_text[:3000]}\n```"
            if manual_data:
                user_prompt += f"\n\nAlso include and cross-correlate these user-verified parameter values:\n{json.dumps(manual_data, indent=2)}"

            user_prompt += "\n\nExtract EVERY test parameter present on this report, evaluate reference ranges, detect disease patterns, suggest follow-up investigations, and return purely valid JSON."

            # Multimodal Vision call (if image available) or Text LLM call
            ai_resp_text, prov_used, model_used = execute_ai_query(
                prompt=user_prompt,
                system_instruction=CLINICAL_ANALYSIS_SYSTEM_PROMPT,
                image_bytes=image_to_send,
                mime_type=mime_type,
                api_key=active_key,
                provider=active_provider,
                response_json=True,
            )

            cleaned_json = clean_json_markdown(ai_resp_text)
            parsed_result = json.loads(cleaned_json)

            # Ensure all required fields exist
            parameters = parsed_result.get("parameters", [])
            conditions = parsed_result.get("conditions", [])
            summary = parsed_result.get("summary", {})

            # Merge any manual data overrides if present
            if manual_data:
                param_names_in_ai = {p.get("canonicalName", p.get("name")): p for p in parameters}
                for m_name, m_val in manual_data.items():
                    c_name, ref = lookup_reference_range(m_name)
                    c_name = c_name or m_name
                    if c_name in param_names_in_ai:
                        param_names_in_ai[c_name]["value"] = m_val
                    else:
                        eval_p = evaluate_parameter(c_name, m_val)
                        parameters.append(eval_p)

            # Normalize parameter flags & deviations
            for p in parameters:
                if "isAbnormal" not in p:
                    p["isAbnormal"] = p.get("status") != "NORMAL"
                if "isCritical" not in p:
                    p["isCritical"] = "CRITICAL" in str(p.get("status", ""))
                if "canonicalName" not in p:
                    p["canonicalName"] = p.get("name", "Unknown Test")

            # Sort parameters: abnormal first
            parameters.sort(key=lambda x: (not x.get("isAbnormal", False), x.get("panel", ""), x.get("canonicalName", "")))

            # Deterministic safety evaluation independent of LLM
            safety_results = evaluate_safety(parameters, patient_context=patient_context)

            # Combine deterministic rule follow-up recommendations with AI recommendations
            pattern_res = analyze_blood_patterns(parameters)
            rule_follow_ups = pattern_res.get("followUpRecommendations", [])
            ai_follow_ups = parsed_result.get("followUpRecommendations", [])

            combined_follow_ups = list(ai_follow_ups) if isinstance(ai_follow_ups, list) else []
            seen_tests = {f.get("test", "").lower() for f in combined_follow_ups if isinstance(f, dict)}
            for rf in rule_follow_ups:
                if rf.get("test", "").lower() not in seen_tests:
                    combined_follow_ups.append(rf)
                    seen_tests.add(rf.get("test", "").lower())

            elapsed = round(time.time() - start_time, 2)

            return {
                "module": "blood",
                "parameters": parameters,
                "conditions": conditions,
                "followUpRecommendations": combined_follow_ups,
                "safety": safety_results,
                "patientContext": patient_context,
                "summary": {
                    "totalEvaluated": summary.get("totalEvaluated", len(parameters)),
                    "abnormalCount": summary.get("abnormalCount", sum(1 for p in parameters if p.get("isAbnormal"))),
                    "criticalCount": summary.get("criticalCount", sum(1 for p in parameters if p.get("isCritical"))),
                    "normalCount": summary.get("normalCount", sum(1 for p in parameters if not p.get("isAbnormal"))),
                    "healthScore": summary.get("healthScore", 75),
                    "acuityLevel": summary.get("acuityLevel", "Moderate"),
                    "overallStatus": summary.get("overallStatus", "Analysis Complete"),
                    "doctorConsultationRecommended": summary.get("doctorConsultationRecommended", True) or safety_results.get("hasCriticalFindings", False),
                },
                "aiExplanation": {
                    "module": "blood",
                    "headline": parsed_result.get("summary", {}).get("overallStatus", "Clinical Laboratory Analysis"),
                    "healthScore": summary.get("healthScore", 75),
                    "acuityLevel": summary.get("acuityLevel", "Moderate"),
                    "executiveSummary": parsed_result.get("executiveSummary", ""),
                    "organSystems": parsed_result.get("organSystems", []),
                    "lifestylePrescription": parsed_result.get("lifestylePrescription", {}),
                    "doctorChecklist": parsed_result.get("doctorChecklist", {}),
                    "redFlags": parsed_result.get("redFlags", []),
                    "readingLevel": "standard",
                    "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S")
                },
                "rawTextExtracted": raw_text[:800] if raw_text else "Processed with Multimodal AI Vision.",
                "aiMetadata": {
                    "isRealAi": True,
                    "provider": prov_used,
                    "model": model_used,
                    "engineName": f"{prov_used.capitalize()} ({model_used}) Live AI",
                    "extractionMode": "Multimodal Vision AI" if image_to_send else "Generative LLM Extraction",
                },
                "processingTime": f"{elapsed}s"
            }

        except Exception as e:
            print(f"[BloodAILayer] Live AI call failed or timed out: {e}. Falling back to clinical engine.")

    # ─────────────────────────────────────────────────────────────
    # STEP 2: Fallback to Resilient Clinical Engine (Offline Mode)
    # ─────────────────────────────────────────────────────────────
    from modules.blood_processor import parse_report_text, get_smart_fallback_parameters
    from modules.ai_explainer import generate_blood_report_explanation

    parsed_params = parse_report_text(raw_text)

    if manual_data:
        for k, v in manual_data.items():
            canon_name, data = lookup_reference_range(k)
            if canon_name:
                try:
                    val_num = float(v)
                    parsed_params[canon_name] = val_num
                except (ValueError, TypeError):
                    pass

    if len(parsed_params) == 0:
        parsed_params = get_smart_fallback_parameters(raw_text, filename)

    evaluated_list = [evaluate_parameter(p_name, p_val) for p_name, p_val in parsed_params.items()]
    evaluated_list.sort(key=lambda x: (not x.get("isAbnormal", False), x.get("panel", ""), x["canonicalName"]))

    pattern_results = analyze_blood_patterns(evaluated_list)
    safety_results = evaluate_safety(evaluated_list, patient_context=patient_context)
    elapsed = round(time.time() - start_time, 2)

    fallback_payload = {
        "module": "blood",
        "parameters": evaluated_list,
        "conditions": pattern_results["conditions"],
        "followUpRecommendations": pattern_results.get("followUpRecommendations", []),
        "safety": safety_results,
        "patientContext": patient_context,
        "summary": {
            "totalEvaluated": pattern_results["totalEvaluated"],
            "abnormalCount": pattern_results["abnormalCount"],
            "criticalCount": pattern_results["criticalCount"],
            "normalCount": pattern_results["normalCount"],
            "healthScore": pattern_results["healthScore"],
            "overallStatus": pattern_results["overallStatus"],
            "doctorConsultationRecommended": pattern_results["doctorConsultationRecommended"] or safety_results.get("hasCriticalFindings", False)
        },
        "rawTextExtracted": raw_text[:800] if raw_text else "Processed via local laboratory parser.",
        "aiMetadata": {
            "isRealAi": False,
            "provider": "local",
            "model": "spandan-clinical-engine",
            "engineName": "Spandan Clinical AI Engine (Offline Mode)",
            "extractionMode": "Deterministic Clinical Reasoning",
            "notice": "Connect your free Google Gemini API Key in AI Settings for live cloud vision intelligence."
        },
        "processingTime": f"{elapsed}s"
    }

    fallback_payload["aiExplanation"] = generate_blood_report_explanation(fallback_payload, reading_level="standard")
    return fallback_payload


def chat_with_blood_ai_layer(
    report_data: Dict[str, Any],
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    api_key: Optional[str] = None,
    provider: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Answers patient questions interactively with direct awareness of their exact blood report.
    Uses real Generative AI (Gemini / OpenAI / Groq) if key is available,
    or contextual clinical rule reasoning as offline fallback.
    """
    active_key, active_provider = get_available_ai_key(api_key, provider)
    parameters = report_data.get("parameters", [])
    conditions = report_data.get("conditions", [])
    summary = report_data.get("summary", {})
    safety = report_data.get("safety", {})
    patient_context = report_data.get("patientContext", {})

    # Ground-truth context of the patient's report
    report_context = {
        "healthScore": summary.get("healthScore"),
        "acuityLevel": summary.get("acuityLevel", "Moderate"),
        "abnormalCount": summary.get("abnormalCount"),
        "patientContext": patient_context,
        "safetyAlerts": [a.get("message") for a in safety.get("criticalAlerts", [])] + [c.get("warning") for c in safety.get("combinationAlerts", [])],
        "parameters": [
            {
                "test": p.get("canonicalName", p.get("name")),
                "value": p.get("value"),
                "unit": p.get("unit"),
                "status": p.get("status"),
                "referenceRange": f"{p.get('min')} - {p.get('max')} {p.get('unit')}" if p.get('min') is not None else p.get('refText', 'N/A'),
                "panel": p.get("panel")
            }
            for p in parameters
        ],
        "detectedConditions": [c.get("condition") for c in conditions],
    }

    if active_key and active_provider in ["gemini", "openai", "groq"]:
        system_prompt = f"""You are Spandan AI Medical Assistant, a compassionate, highly knowledgeable clinical AI doctor.
You are having an interactive consultation with a patient about their specific blood test report.

PATIENT'S ACTUAL BLOOD TEST REPORT DATA:
{json.dumps(report_context, indent=2)}

CONSULTATION GUIDELINES:
1. Ground your answers DIRECTLY in the patient's actual laboratory numbers above. Refer to their specific test results (e.g. "Your Hemoglobin is 10.4 g/dL, which is below the normal 13.0 g/dL...").
2. Answer the patient's question clearly, warmly, and accurately.
3. If they ask about food or diet, give concrete, actionable foods to eat and avoid based on their exact abnormal parameters.
4. If they ask if something is dangerous or life-threatening, accurately triage whether it is an emergency or an outpatient chronic finding.
5. Provide 3 relevant follow-up questions the patient can click next.
6. Return your answer in a clean JSON object:
{{
  "reply": "Your clear, empathetic, clinically rigorous response using markdown formatting...",
  "followUpSuggestions": [
    "Follow-up question 1?",
    "Follow-up question 2?",
    "Follow-up question 3?"
  ]
}}
"""

        history_context = ""
        if chat_history:
            history_context = "CONVERSATION HISTORY:\n"
            for m in chat_history[-6:]:
                sender = m.get("sender", "user")
                text = m.get("text", "")
                history_context += f"- {sender.upper()}: {text}\n"

        prompt = f"{history_context}\nPATIENT QUESTION: {user_message}\n\nPlease provide your clinical response."

        try:
            ai_text, prov_used, model_used = execute_ai_query(
                prompt=prompt,
                system_instruction=system_prompt,
                api_key=active_key,
                provider=active_provider,
                response_json=True
            )
            cleaned = clean_json_markdown(ai_text)
            parsed = json.loads(cleaned)
            return {
                "reply": parsed.get("reply", ai_text),
                "followUpSuggestions": parsed.get("followUpSuggestions", [
                    "What diet changes will help my numbers?",
                    "What should I ask my doctor?",
                    "Are any of my values dangerous?"
                ]),
                "aiEngine": f"{prov_used.capitalize()} ({model_used}) Live AI",
                "isRealAi": True
            }
        except Exception as e:
            print(f"[BloodAILayer] Chat LLM failed: {e}. Falling back to local responder.")

    # Local fallback responder
    from modules.ai_explainer import chat_with_report_ai
    local_resp = chat_with_report_ai(report_data, user_message=user_message, chat_history=chat_history or [], module="_local_blood")
    local_resp["isRealAi"] = False
    local_resp["aiEngine"] = "Spandan Clinical Assistant (Offline Mode)"
    return local_resp
