# Spandan AI - Run Guide

This document provides step-by-step instructions to run both the FastAPI Backend and the React Frontend for the Spandan AI health diagnostic platform.

---

## Prerequisites

- **Python**: 3.10+ (Verified on Python 3.13)
- **Node.js**: v18+ and `npm`
- **Git**

---

## 1. Configure Environment (`.env`)

Before starting the server, ensure your AI API key is set in `backend/.env`:

1. Open `backend/.env`
2. Set your **xAI Grok** API key:
   ```env
   XAI_API_KEY=xai-your_actual_key_here
   ```
   *(Alternatively, you can provide `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY`)*

---

## 2. Start the Backend (FastAPI)

Open a terminal in the root directory:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Run the FastAPI development server
python main.py
```

*Alternatively, using uvicorn directly:*
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API URL**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **AI Status Health Check**: [http://localhost:8000/api/ai/status](http://localhost:8000/api/ai/status)

---

## 3. Start the Frontend (React + Vite)

Open a second terminal in the project root:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (only needed once)
npm install

# 3. Launch the Vite development server
npm run dev
```

- **Frontend App URL**: [http://localhost:5173](http://localhost:5173)

---

## 4. Running Both with a Single PowerShell Script

From the project root `c:\Users\laptop\spandan`, you can also open two terminal windows or run:

**Terminal 1 (Backend):**
```powershell
cd c:\Users\laptop\spandan\backend
python main.py
```

**Terminal 2 (Frontend):**
```powershell
cd c:\Users\laptop\spandan\frontend
npm run dev
```

---

## 5. Verification Checklist

- [x] Backend responds at `http://localhost:8000/api/ai/status` with active provider `xai` (Grok AI)
- [x] Frontend is accessible at `http://localhost:5173`
- [x] Cardiac ECG rhythm diagnosis uploads process through model inference & xAI explanation
- [x] Routine blood test reports process through OCR, parser & clinical evaluation
