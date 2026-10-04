
import joblib
import numpy as np
import pandas as pd
import os

class SpandanInferenceEngine:
    def __init__(self):
        self.base_path = "C:/spandan/backend"
        self.models = {}
        self.load_models()

    def load_models(self):
        try:
            self.models['ecg'] = joblib.load(os.path.join(self.base_path, "models/ecg_model.pkl"))
            self.models['skin'] = joblib.load(os.path.join(self.base_path, "models/skin_model.pkl"))
            self.models['blood'] = joblib.load(os.path.join(self.base_path, "models/blood_model.pkl"))
            print("All SOTA models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def predict_ecg(self, features):
        # features: list or numpy array
        data = np.array(features).reshape(1, -1)
        prediction = self.models['ecg'].predict(data)
        prob = self.models['ecg'].predict_proba(data)[0]
        return {"prediction": int(prediction[0]), "confidence": float(np.max(prob))}

    def predict_skin(self, features):
        data = np.array(features).reshape(1, -1)
        prediction = self.models['skin'].predict(data)
        prob = self.models['skin'].predict_proba(data)[0]
        return {"prediction": int(prediction[0]), "confidence": float(np.max(prob))}

    def predict_blood(self, features):
        data = np.array(features).reshape(1, -1)
        prediction = self.models['blood'].predict(data)
        prob = self.models['blood'].predict_proba(data)[0]
        return {"prediction": int(prediction[0]), "confidence": float(np.max(prob))}

# Singleton instance for the backend to use
engine = SpandanInferenceEngine()
