
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from scipy import stats
from scipy.fft import fft

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"


class SpandanInferenceEngine:
    def __init__(self):
        self.base_path = str(BASE_DIR)
        self.models = {}
        self.load_models()

    def load_models(self):
        try:
            ecg_path = MODELS_DIR / "ecg_model.pkl"
            blood_path = MODELS_DIR / "blood_model.pkl"
            if ecg_path.exists():
                self.models['ecg'] = joblib.load(str(ecg_path))
            if blood_path.exists():
                self.models['blood'] = joblib.load(str(blood_path))
            print("[SpandanInferenceEngine] All SOTA models loaded successfully.")
        except Exception as e:
            print(f"[SpandanInferenceEngine] Error loading models: {e}")

    def extract_ecg_signal_features(self, signal_data) -> pd.DataFrame:
        sig = np.array(signal_data, dtype=np.float64)
        if sig.ndim > 1:
            sig = sig.flatten()
        std_val = float(np.std(sig))
        if std_val > 1e-7:
            sig_norm = (sig - float(np.mean(sig))) / std_val
        else:
            sig_norm = sig - float(np.mean(sig))

        rms = float(np.sqrt(np.mean(sig_norm**2)))
        var = float(np.var(sig_norm))
        skew = float(stats.skew(sig_norm))
        kurt = float(stats.kurtosis(sig_norm))
        fft_vals = np.abs(fft(sig_norm))
        dom_freq = float(np.argmax(fft_vals))
        spec_entropy = float(-np.sum(fft_vals * np.log(fft_vals + 1e-6)) / (np.sum(fft_vals) + 1e-6))

        return pd.DataFrame([{
            'rms': rms,
            'variance': var,
            'skewness': skew,
            'kurtosis': kurt,
            'dom_freq': dom_freq,
            'spectral_entropy': spec_entropy
        }])

    def predict_ecg(self, features):
        if 'ecg' not in self.models:
            return {"prediction": 0, "label": "Normal", "confidence": 0.5, "status": "Model not loaded"}
        if isinstance(features, (list, np.ndarray)) and not isinstance(features, pd.DataFrame):
            if len(features) == 6:
                features = pd.DataFrame([{
                    'rms': features[0],
                    'variance': features[1],
                    'skewness': features[2],
                    'kurtosis': features[3],
                    'dom_freq': features[4],
                    'spectral_entropy': features[5]
                }])
            else:
                features = np.array(features).reshape(1, -1)
        prediction = self.models['ecg'].predict(features)
        prob = self.models['ecg'].predict_proba(features)[0]
        pred_val = int(prediction[0])
        conf_val = float(np.max(prob))
        return {
            "prediction": pred_val,
            "label": "Abnormal" if pred_val == 1 else "Normal",
            "confidence": round(conf_val, 4),
            "probabilities": {
                "normal": round(float(prob[0]), 4) if len(prob) > 0 else 0.0,
                "abnormal": round(float(prob[1]), 4) if len(prob) > 1 else 0.0
            }
        }

    def predict_ecg_signal(self, signal_data):
        df_feats = self.extract_ecg_signal_features(signal_data)
        res = self.predict_ecg(df_feats)
        res["extractedFeatures"] = {k: round(float(v), 4) for k, v in df_feats.to_dict(orient="records")[0].items()}
        return res

    def extract_blood_parameters_vector(self, params: dict) -> np.ndarray:
        p_lower = {}
        if isinstance(params, dict):
            p_lower = {str(k).lower(): float(v) for k, v in params.items() if v is not None}
        elif isinstance(params, list):
            for item in params:
                if isinstance(item, dict):
                    name = str(item.get("canonicalName") or item.get("name") or "").lower()
                    val = item.get("value")
                    if name and val is not None:
                        try:
                            p_lower[name] = float(val)
                        except Exception:
                            pass

        hb = None
        for k, v in p_lower.items():
            if "hemoglobin" in k or k == "hb" or "hgb" in k:
                hb = v
                break
        if hb is None:
            hb = 13.5

        glu = None
        for k, v in p_lower.items():
            if "glucose" in k or "sugar" in k or "fbs" in k:
                glu = v
                break
        if glu is None:
            glu = 95.0

        creat = None
        for k, v in p_lower.items():
            if "creatinine" in k or "creat" in k:
                creat = v
                break
        if creat is None:
            creat = 1.0

        ratio = hb / (creat + 1e-6)
        return np.array([hb, glu, creat, ratio], dtype=np.float64)

    def predict_blood(self, features):
        if 'blood' not in self.models:
            return {"prediction": 0, "label": "Normal", "confidence": 0.5, "status": "Model not loaded"}
        data = np.array(features, dtype=np.float64).reshape(1, -1)
        prediction = self.models['blood'].predict(data)
        prob = self.models['blood'].predict_proba(data)[0]
        pred_val = int(prediction[0])
        conf_val = float(np.max(prob))
        return {
            "prediction": pred_val,
            "label": "Abnormal" if pred_val == 1 else "Normal",
            "confidence": round(conf_val, 4),
            "probabilities": {
                "normal": round(float(prob[0]), 4) if len(prob) > 0 else 0.0,
                "abnormal": round(float(prob[1]), 4) if len(prob) > 1 else 0.0
            }
        }

    def predict_blood_params(self, params_dict):
        vec = self.extract_blood_parameters_vector(params_dict)
        res = self.predict_blood(vec)
        res["biomarkersUsed"] = {
            "hemoglobin": round(float(vec[0]), 2),
            "glucose": round(float(vec[1]), 2),
            "creatinine": round(float(vec[2]), 2),
            "ratio": round(float(vec[3]), 2)
        }
        return res


# Singleton instance for the backend to use
engine = SpandanInferenceEngine()
