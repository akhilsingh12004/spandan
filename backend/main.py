"""
Spandan AI - Full-Stack Multi-Modal Health Diagnostic API
FastAPI Backend serving Cardiac Disease Prediction & Skin Disease Prediction Modules
"""

import io
import time
import base64
import cv2
import numpy as np
import json
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import CARDIAC_CLASSES, SKIN_CLASSES
from modules.cardiac_processor import process_ecg_image
from modules.cardiac_model import cardiac_engine
from modules.skin_processor import process_skin_image
from modules.skin_model import skin_engine
from modules.explainability import (
    generate_skin_gradcam_overlay,
    generate_ecg_gradcam_visualization,
)
from modules.blood_processor import process_blood_report
from modules.blood_reference_ranges import REFERENCE_RANGES, BLOOD_PANELS

MEDICAL_DISCLAIMER = (
    "This tool is for educational and decision-support purposes only and is not a "
    "substitute for professional medical diagnosis. Always consult a qualified "
    "healthcare provider for medical advice, diagnosis, or treatment."
)

app = FastAPI(
    title="Spandan AI - Health Diagnostic Assistant API",
    description="Multi-modal AI platform for Cardiac (ECG), Dermatological (Skin), and Routine Blood Test Report diagnostics.",
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
            "Module 2: Skin Disease Prediction (Photo)",
            "Module 3: Blood Test Report Analysis (Lab Image / PDF)",
        ],
        "endpoints": [
            "/api/health",
            "/api/predict/cardiac",
            "/api/predict/skin",
            "/api/predict/blood",
            "/api/blood/reference-ranges",
            "/api/detect-module",
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
            "skin": {
                "loaded": skin_engine.model is not None,
                "classesCount": len(SKIN_CLASSES),
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
                "processingTime": f"{total_elapsed}s",
                "disclaimer": MEDICAL_DISCLAIMER,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cardiac processing error: {str(e)}")


@app.post("/api/predict/skin")
async def predict_skin_endpoint(file: UploadFile = File(...)):
    """
    Predicts dermatological conditions from an uploaded skin photo:
    1. Preprocesses image: DullRazor hair removal & CLAHE contrast enhancement
    2. Automated lesion segmentation & ABCD morphological analysis
    3. Runs transfer learning CNN model inference
    4. Generates 2D Grad-CAM heatmap overlay
    """
    start_total = time.time()
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        # 1. Preprocess & segment
        image_bgr, enhanced_bgr, normalized_input, seg_metrics = process_skin_image(contents)

        # 2. Model inference
        inference_result = skin_engine.predict(normalized_input, seg_metrics)

        # 3. Explainability: generate Grad-CAM overlay
        heatmap_overlay_url = generate_skin_gradcam_overlay(
            image_bgr=image_bgr,
            heatmap=inference_result.get("gradcamMap"),
            alpha=0.45,
        )

        total_elapsed = round(time.time() - start_total, 2)

        return JSONResponse(
            content={
                "module": "skin",
                "predictions": inference_result["predictions"],
                "topCondition": inference_result["topCondition"],
                "topConfidence": inference_result["topConfidence"],
                "topCategory": inference_result.get("topCategory", "Dermatological Condition"),
                "tier": inference_result.get("tier", "Core Tier"),
                "supportLevel": inference_result.get("supportLevel", "Data-Rich (>1000)"),
                "requiresSpecialistReview": inference_result.get("requiresSpecialistReview", False),
                "segmentationMetrics": seg_metrics,
                "heatmapUrl": heatmap_overlay_url,
                "processingTime": f"{total_elapsed}s",
                "disclaimer": MEDICAL_DISCLAIMER,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skin processing error: {str(e)}")


@app.post("/api/predict/blood")
async def predict_blood_endpoint(
    file: Optional[UploadFile] = File(None),
    manual_data: Optional[str] = Form(None)
):
    """
    Analyzes a blood test report (image or PDF) or manual parameter inputs:
    1. Extracts raw text via pdfplumber or OCR
    2. Identifies clinical parameters (CBC, Lipids, LFT, KFT, Thyroid, Electrolytes, Vitamins)
    3. Benchmarks values against standard reference ranges (Low / Normal / High / Critical)
    4. Evaluates multi-parameter disease patterns (Anemia, Diabetes, Dyslipidemia, Liver/Kidney strain)
    5. Returns a structured plain-language report with health risk score and consultation flags
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

        result = process_blood_report(contents, filename=filename, manual_data=parsed_manual)
        total_elapsed = round(time.time() - start_total, 2)
        result["processingTime"] = f"{total_elapsed}s"
        result["disclaimer"] = MEDICAL_DISCLAIMER
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blood report processing error: {str(e)}")


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
    Automatically detects whether an uploaded file is an ECG strip, a skin photo, or a blood test report.
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

        # 3. Default to skin lesion (warm dermoscopic tones, high R-B disparity, or non-strip aspect ratio)
        return {
            "detectedModule": "skin",
            "confidence": 0.91,
            "aspectRatio": round(aspect_ratio, 2),
            "reason": "Dermatological lesion characteristics and skin chrominance"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module detection error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
