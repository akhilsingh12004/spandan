# 🏥 Spandan AI: Multi-Modal Health Diagnostic Assistant
### AI-Powered Multi-Modal Platform: Cardiac ECG, Dermatological Skin, & Routine Blood Test Report Analysis

Spandan AI is a production-ready, full-stack medical AI web application unifying three diagnostic modalities under one cohesive health-monitoring platform:

1. **Cardiac Disease Prediction Module**: Upload a photo/scan of an ECG strip. The system removes paper grid lines with OpenCV, digitizes the waveform into a numerical time-series, extracts electrophysiological metrics (Heart Rate, HRV, RR, QT, PR, QRS), and classifies cardiac conditions across 31 classes using a **1D-CNN + BiLSTM hybrid network** with **1D Grad-CAM waveform attribution**.
2. **Skin Disease Prediction Module**: Upload a skin lesion photo. The system removes hairs and artifacts using the clinical **DullRazor** algorithm, enhances contrast via **CIE-LAB CLAHE**, segments the lesion boundary, computes ABCD morphological metrics, and predicts dermatological conditions across 29 classes using a **Transfer Learning CNN** with **2D Grad-CAM heatmap overlays**.
3. **Blood Test Report Analysis Module (Daily-Use Diagnosis)**: Upload a photo or PDF of a routine blood test report (CBC, Lipid Profile, Blood Sugar, LFT, KFT, Thyroid, Electrolytes, Vitamins, Inflammation). The system performs OCR extraction (Tesseract / pdfplumber), parses test parameters and units with regex, benchmarks values against standard adult reference ranges (Low / Normal / High / Critical), evaluates multi-parameter pathological patterns (e.g. Microcytic Anemia, Dyslipidemia, Prediabetes, Hepatic/Renal strain), and generates a plain-language report with holistic health score and physician consultation guidance.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: 18+ (tested on Node.js 20)

### 2. Start the Backend API (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Docs available at: `http://localhost:8000/docs`

### 3. Start the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🔬 Testing & Verification

Run the comprehensive integration test suite (9/9 tests passing):
```bash
cd backend
python -m pytest tests/test_api.py -v
```

Run robustness, latency, and explainability benchmarks:
```bash
cd backend
python ml/robustness_test.py
```

---

## 📁 Repository Structure

```
d:/spandan/
├── frontend/                         # React 19 + Vite Application
│   ├── public/                       # Static assets (sample_ecg.png, sample_skin.png, sample_blood_report.png)
│   ├── src/
│   │   ├── components/               # AIReportExplainer, BloodResultsView, ConfidenceBar, ECGSignalChart,
│   │   │                             # ImageUploader, ProcessingOverlay, Disclaimer, Navbar, Footer
│   │   ├── pages/                    # HomePage, CardiacPage, SkinPage, BloodReportPage, ResultsPage, AboutPage
│   │   ├── services/                 # Axios API service + offline simulation fallbacks
│   │   ├── App.jsx                   # React Router config (/cardiac, /skin, /blood, /results/:module)
│   │   ├── index.css                 # Glassmorphic Dark Design System & theme tokens
│   │   └── main.jsx
│   └── package.json
│
├── backend/                          # FastAPI Python Application
│   ├── modules/
│   │   ├── ai_explainer.py           # Clinical report synthesis, organ breakdown & conversational Q&A
│   │   ├── cardiac_processor.py      # OpenCV grid removal, trace isolation, digitization, peak detection
│   │   ├── cardiac_model.py          # 1D-CNN + BiLSTM architecture & 1D Grad-CAM (31 classes)
│   │   ├── skin_processor.py         # DullRazor hair removal, CLAHE, lesion segmentation
│   │   ├── skin_model.py             # Deep Transfer CNN & 2D Grad-CAM (29 classes)
│   │   ├── blood_processor.py        # PDF/Image ingestion, OCR extraction, lab regex parsing
│   │   ├── blood_reference_ranges.py # Adult clinical reference range database (25+ tests, 9 panels)
│   │   ├── blood_interpreter.py      # Parameter evaluation, multi-parameter disease patterns, health scoring
│   │   └── explainability.py         # Colormap generation & base64 visualization exporters
│   ├── ml/
│   │   ├── train_cardiac.py          # MIT-BIH/PTB-XL patient-ID split, class-weighting, 1D-CNN+LSTM
│   │   ├── train_skin.py             # HAM10000/ISIC transfer learning, data augmentation
│   │   └── robustness_test.py        # Noise, lighting, angle, skin tone, & latency benchmark
│   ├── tests/
│   │   ├── generate_samples.py       # Synthesizes test ECG strip & skin lesion images
│   │   ├── generate_blood_sample.py  # Generates realistic clinical blood report sample
│   │   ├── test_api.py               # Pytest API integration test suite (9/9 tests passing)
│   │   └── sample_data/              # Sample test images
│   ├── config.py                     # Disease taxonomies & constants
│   ├── main.py                       # FastAPI endpoints, CORS, auto-module detection
│   └── requirements.txt
│
├── docs/
│   ├── MODEL_TRAINING_SPECIFICATION.md # Hierarchical taxonomy, rare-class strategy, datasets
│   └── TRAINING_AND_ARCHITECTURE.md    # Detailed technical & training documentation
├── Dockerfile                        # Multi-stage production container
└── README.md
```

---

## ⚕️ Medical Disclaimer
**Spandan AI is intended exclusively for educational, research, and decision-support purposes.** It is not a certified diagnostic device and cannot substitute for professional medical evaluation by a licensed healthcare provider.

