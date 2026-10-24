"""
Spandan AI - Full-Stack Multi-Modal Health Diagnostic API
FastAPI Backend serving Cardiac Disease Prediction & Blood Report Analysis Modules
"""

import io
import time
import base64
import cv2
import numpy as np
import json
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import CARDIAC_CLASSES
from modules.cardiac_processor import process_ecg_image
from modules.cardiac_model import cardiac_engine
from modules.explainability import (
    generate_ecg_gradcam_visualization,
)
from modules.blood_processor import process_blood_report, extract_parameters_from_report
from modules.blood_reference_ranges import REFERENCE_RANGES, BLOOD_PANELS, lookup_reference_range
from modules.blood_interpreter import evaluate_parameter, analyze_blood_patterns
from modules.blood_safety import evaluate_safety
from modules.ai_explainer import generate_report_explanation, chat_with_report_ai
from modules.ai_client import (
    get_available_ai_key,
    test_ai_connection,
    save_key_to_env,
)
from modules.blood_ai_layer import (
    analyze_blood_report_with_ai,
    chat_with_blood_ai_layer,
)

MEDICAL_DISCLAIMER = (
    "This tool is for educational and decision-support purposes only and is not a "
    "substitute for professional medical diagnosis. Always consult a qualified "
    "healthcare provider for medical advice, diagnosis, or treatment."
)

app = FastAPI(
    title="Spandan AI - Health Diagnostic Assistant API",
    description="Multi-modal AI platform for Cardiac (ECG) and Routine Blood Test Report diagnostics.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "Spandan AI Diagnostic API",
        "status": "online",
        "modalities": [
            "Module 1: Cardiac Disease Prediction (ECG)",
            "Module 2: Blood Test Report Analysis (Lab Image / PDF)",
            "Module 3: AI Clinical Report Explainer & Conversational Assistant",
        ],
        "endpoints": [
            "/api/health",
            "/api/predict/cardiac",
            "/api/predict/blood",
            "/api/blood/reference-ranges",
            "/api/detect-module",
            "/api/ai/explain-report",
            "/api/ai/chat-report",
            "/api/ai/status",
            "/api/ai/test-key",
            "/api/ai/save-key",
        ],
        "disclaimer": MEDICAL_DISCLAIMER,
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "modules": {
            "cardiac": {
                "loaded": cardiac_engine.model is not None,
                "classesCount": len(CARDIAC_CLASSES),
            },
            "blood": {
                "loaded": True,
                "parametersCount": len(REFERENCE_RANGES),
                "panelsCount": len(BLOOD_PANELS),
            }
        },
        "disclaimer": MEDICAL_DISCLAIMER,
    }


@app.post("/api/predict/cardiac")
async def predict_cardiac_endpoint(file: UploadFile = File(...)):
    """
    Predicts cardiac conditions from an uploaded ECG image:
    1. Removes grid lines & paper noise with OpenCV
    2. Digitizes waveform coordinates into 1D numerical time-series
    3. Detects R-peaks and computes clinical intervals (HR, RR, QT, HRV, PR, QRS)
    4. Evaluates 1D-CNN + BiLSTM model
    5. Computes Grad-CAM 1D wave attribution
    """
    start_total = time.time()
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        # 1. Image preprocessing & signal extraction
        image_bgr, digitized_signal, features = process_ecg_image(contents)

        # 2. Model inference
        inference_result = cardiac_engine.predict(digitized_signal, features)

        # 3. Explainability: generate Grad-CAM visualization
        gradcam_img_url = generate_ecg_gradcam_visualization(
            digitized_signal=digitized_signal,
            predicted_class=inference_result["topCondition"],
            attributions=inference_result.get("attributions"),
        )

        # 4. Generate AI clinical explanation
        ai_exp = generate_report_explanation(
            {
                "topCondition": inference_result["topCondition"],
                "topConfidence": inference_result["topConfidence"],
                "predictions": inference_result["predictions"],
                "metrics": features,
                "requiresSpecialistReview": inference_result.get("requiresSpecialistReview", False),
            },
            module="cardiac",
        )

        total_elapsed = round(time.time() - start_total, 2)

        return JSONResponse(
            content={
                "module": "cardiac",
                "predictions": inference_result["predictions"],
                "topCondition": inference_result["topCondition"],
                "topConfidence": inference_result["topConfidence"],
                "topCategory": inference_result.get("topCategory", "Cardiac Rhythm"),
                "tier": inference_result.get("tier", "Core Tier"),
                "supportLevel": inference_result.get("supportLevel", "Data-Rich (>1000)"),
                "requiresSpecialistReview": inference_result.get("requiresSpecialistReview", False),
                "ecgSignal": digitized_signal.tolist(),
                "metrics": {
                    "heartRate": features["heartRate"],
                    "rrInterval": features["rrInterval"],
                    "qtInterval": features["qtInterval"],
                    "hrv": features["hrv"],
                    "prInterval": features["prInterval"],
                    "qrsDuration": features["qrsDuration"],
                    "rmssd": features.get("rmssd", "28 ms"),
                },
                "heatmapUrl": gradcam_img_url,
                "aiExplanation": ai_exp,
                "processingTime": f"{total_elapsed}s",
                "disclaimer": MEDICAL_DISCLAIMER,
            }
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cardiac processing error: {str(e)}")




@app.get("/api/ai/status")
def get_ai_status():
    """Returns current status of configured AI providers and models."""
    key, provider = get_available_ai_key()
    return {
        "status": "configured" if key else "unconfigured",
        "activeProvider": provider,
        "hasKey": key is not None and len(key) > 4,
        "keySnippet": f"{key[:4]}...{key[-3:]}" if key and len(key) > 7 else None,
        "model": "gemini-2.5-flash" if provider == "gemini" else ("gpt-4o-mini" if provider == "openai" else "llama-3.3-70b"),
        "engineName": "Google Gemini (gemini-2.5-flash)" if provider == "gemini" else ("OpenAI (gpt-4o-mini)" if provider == "openai" else "Spandan Clinical AI Engine"),
        "supportedProviders": [
            {
                "id": "gemini",
                "name": "Google Gemini (Recommended / Free)",
                "model": "gemini-2.5-flash",
                "multimodal": True,
                "freeTier": True,
                "signupUrl": "https://aistudio.google.com/app/apikey"
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "model": "gpt-4o-mini",
                "multimodal": True,
                "freeTier": False,
                "signupUrl": "https://platform.openai.com/api-keys"
            },
            {
                "id": "groq",
                "name": "Groq Cloud",
                "model": "llama-3.3-70b-versatile",
                "multimodal": False,
                "freeTier": True,
                "signupUrl": "https://console.groq.com/keys"
            }
        ]
    }


@app.post("/api/ai/test-key")
async def test_ai_key_endpoint(payload: dict):
    """Validates an API key and provider in real-time."""
    api_key = payload.get("apiKey", "")
    provider = payload.get("provider", "gemini")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required.")
    result = test_ai_connection(api_key, provider=provider)
    return JSONResponse(content=result)


@app.post("/api/ai/save-key")
async def save_ai_key_endpoint(payload: dict):
    """Persists the supplied API key into backend .env file."""
    api_key = payload.get("apiKey", "")
    provider = payload.get("provider", "gemini")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required.")
    save_key_to_env(api_key, provider=provider)
    return JSONResponse(content={
        "success": True,
        "message": f"Successfully persisted {provider.capitalize()} API key.",
        "provider": provider
    })


@app.post("/api/predict/blood")
async def predict_blood_endpoint(
    file: Optional[UploadFile] = File(None),
    manual_data: Optional[str] = Form(None),
    patient_context: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    provider: Optional[str] = Form(None),
    x_ai_api_key: Optional[str] = Header(None),
    x_ai_provider: Optional[str] = Header(None),
):
    """
    Analyzes a blood test report (image or PDF) or manual parameters using the Generative AI Layer:
    1. Multimodal Vision document extraction (Gemini / OpenAI) or OCR fallback
    2. Benchmarks values against clinical reference ranges (Low / Normal / High / Critical)
    3. Evaluates multi-parameter pathological patterns (Anemia, Diabetes, Dyslipidemia, Liver/Kidney strain)
    4. Deterministic critical-finding safety layer evaluation
    5. Returns structured parameters, health score, and contextual AI clinical explanations
    """
    start_total = time.time()
    try:
        contents = b""
        filename = "report.png"
        if file is not None:
            contents = await file.read()
            filename = file.filename or "report.png"

        parsed_manual = None
        if manual_data:
            try:
                parsed_manual = json.loads(manual_data)
            except Exception:
                pass

        parsed_patient_ctx = None
        if patient_context:
            try:
                parsed_patient_ctx = json.loads(patient_context)
            except Exception:
                pass

        resolved_key = api_key or x_ai_api_key
        resolved_prov = provider or x_ai_provider

        result = process_blood_report(
            contents,
            filename=filename,
            manual_data=parsed_manual,
            api_key=resolved_key,
            provider=resolved_prov,
            patient_context=parsed_patient_ctx
        )
        
        total_elapsed = round(time.time() - start_total, 2)
        result["processingTime"] = f"{total_elapsed}s"
        result["disclaimer"] = MEDICAL_DISCLAIMER
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blood report processing error: {str(e)}")


@app.post("/api/blood/extract")
async def extract_blood_parameters_endpoint(
    file: UploadFile = File(...),
):
    """
    Extracts raw text and parsed laboratory parameters from an uploaded report (Image or PDF)
    without generating a full AI explanation.
    Powers the Review & Correction step so users can confirm or edit detected values before analysis.
    """
    try:
        contents = await file.read()
        filename = file.filename or "report.png"
        extraction = extract_parameters_from_report(contents, filename=filename)
        extraction["disclaimer"] = MEDICAL_DISCLAIMER
        return JSONResponse(content=extraction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction error: {str(e)}")


@app.post("/api/blood/analyze-comprehensive")
async def analyze_comprehensive_blood_endpoint(
    payload: dict,
    x_ai_api_key: Optional[str] = Header(None),
    x_ai_provider: Optional[str] = Header(None),
):
    """
    Performs comprehensive analysis on verified blood parameters and patient context:
    - Runs deterministic safety evaluation independently from LLM
    - Evaluates reference ranges and multi-parameter clinical patterns
    - Dynamically generates follow-up investigation recommendations
    - Synthesizes personalized AI explanations or provides local clinical reasoning
    """
    start_total = time.time()
    try:
        raw_params = payload.get("parameters", {})
        patient_context = payload.get("patientContext", {})
        raw_text = payload.get("rawText", "")
        api_key = payload.get("apiKey") or x_ai_api_key
        provider = payload.get("provider") or x_ai_provider

        # Normalize parameters: handle either dict of {name: val} or list of [{canonicalName, value}]
        manual_dict = {}
        if isinstance(raw_params, dict):
            for k, v in raw_params.items():
                try:
                    manual_dict[k] = float(v)
                except (ValueError, TypeError):
                    pass
        elif isinstance(raw_params, list):
            for item in raw_params:
                name = item.get("canonicalName") or item.get("name")
                val = item.get("value")
                if name and val is not None:
                    try:
                        manual_dict[name] = float(val)
                    except (ValueError, TypeError):
                        pass

        result = analyze_blood_report_with_ai(
            file_bytes=b"",
            filename="reviewed_report.json",
            raw_text=raw_text,
            manual_data=manual_dict,
            api_key=api_key,
            provider=provider,
            patient_context=patient_context
        )

        total_elapsed = round(time.time() - start_total, 2)
        result["processingTime"] = f"{total_elapsed}s"
        result["disclaimer"] = MEDICAL_DISCLAIMER
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comprehensive blood analysis error: {str(e)}")


@app.post("/api/blood/safety-check")
async def blood_safety_check_endpoint(payload: dict):
    """
    Deterministic safety evaluation endpoint that flags critical laboratory alerts,
    dangerous parameter combinations, and urgency levels independent of LLM.
    """
    try:
        raw_params = payload.get("parameters", [])
        patient_context = payload.get("patientContext")
        
        if isinstance(raw_params, dict):
            eval_list = [evaluate_parameter(k, float(v)) for k, v in raw_params.items() if v is not None]
        elif isinstance(raw_params, list):
            eval_list = raw_params
        else:
            eval_list = []

        safety_result = evaluate_safety(eval_list, patient_context=patient_context)
        return JSONResponse(content=safety_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Safety check error: {str(e)}")



@app.post("/api/ai/explain-report")
async def explain_report_endpoint(
    payload: dict,
    x_ai_api_key: Optional[str] = Header(None),
    x_ai_provider: Optional[str] = Header(None),
):
    """
    Generates a full AI Clinical Explanation for an analyzed diagnostic report.
    Supports blood reports and cardiac ECGs.
    """
    try:
        report_data = payload.get("reportData", {})
        module = payload.get("module", "blood")
        reading_level = payload.get("readingLevel", "standard")
        api_key = payload.get("apiKey") or x_ai_api_key
        provider = payload.get("provider") or x_ai_provider

        explanation = generate_report_explanation(
            report_data,
            module=module,
            reading_level=reading_level,
            api_key=api_key,
            provider=provider
        )
        return JSONResponse(content={
            "explanation": explanation,
            "disclaimer": MEDICAL_DISCLAIMER
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI report explanation error: {str(e)}")


@app.post("/api/ai/chat-report")
async def chat_report_endpoint(
    payload: dict,
    x_ai_api_key: Optional[str] = Header(None),
    x_ai_provider: Optional[str] = Header(None),
):
    """
    Interactive AI Medical Assistant answering user inquiries regarding their analyzed report.
    Uses real Generative AI grounded in the patient's exact report numbers.
    """
    try:
        report_data = payload.get("reportData", {})
        message = payload.get("message", "")
        chat_history = payload.get("chatHistory", [])
        module = payload.get("module", "blood")
        api_key = payload.get("apiKey") or x_ai_api_key
        provider = payload.get("provider") or x_ai_provider

        response = chat_with_report_ai(
            report_data,
            user_message=message,
            chat_history=chat_history,
            module=module,
            api_key=api_key,
            provider=provider
        )
        response["disclaimer"] = MEDICAL_DISCLAIMER
        return JSONResponse(content=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")


@app.get("/api/blood/reference-ranges")
def get_blood_reference_ranges():
    """Returns the master laboratory reference range database and test panels."""
    return {
        "panels": BLOOD_PANELS,
        "referenceRanges": REFERENCE_RANGES,
        "disclaimer": MEDICAL_DISCLAIMER
    }


@app.post("/api/detect-module")
async def auto_detect_module(file: UploadFile = File(...)):
    """
    Automatically detects whether an uploaded file is an ECG strip or a blood test report.
    Uses aspect ratio, colorimetry (R-B chromatic difference), and edge structure.
    """
    try:
        filename = file.filename.lower() if file.filename else ""
        if filename.endswith(".pdf"):
            return {
                "detectedModule": "blood",
                "confidence": 0.99,
                "reason": "PDF document format standard for laboratory reports"
            }

        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        h, w = img.shape[:2]
        aspect_ratio = w / float(h)
        b_mean = float(np.mean(img[:, :, 0]))
        r_mean = float(np.mean(img[:, :, 2]))
        chroma_rb = r_mean - b_mean

        # 1. ECG strips: very wide aspect ratio (> 1.7)
        if aspect_ratio > 1.7:
            return {
                "detectedModule": "cardiac",
                "confidence": 0.94,
                "aspectRatio": round(aspect_ratio, 2),
                "reason": "Wide aspect ratio characteristic of 12-lead ECG rhythm strip"
            }

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_brightness = float(np.mean(gray))
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float(np.sum(edges > 0) / float(h * w))

        # 2. Document/Report: Portrait aspect ratio (w/h < 0.88), bright paper background (> 200),
        # low chromatic disparity (|R - B| < 25), and horizontal text edge density
        if (aspect_ratio < 0.88 and mean_brightness > 200 and abs(chroma_rb) < 25 and edge_density > 0.02) \
                or ("report" in filename or "blood" in filename or "cbc" in filename or "lab" in filename):
            return {
                "detectedModule": "blood",
                "confidence": 0.95,
                "aspectRatio": round(aspect_ratio, 2),
                "reason": "Portrait document with white background and tabular text content"
            }

        # 3. Default to cardiac
        return {
            "detectedModule": "cardiac",
            "confidence": 0.90,
            "aspectRatio": round(aspect_ratio, 2),
            "reason": "ECG rhythm or waveform image characteristics"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module detection error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
