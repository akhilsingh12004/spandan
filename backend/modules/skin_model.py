"""
Skin Disease Classification Model
- Loads the trained MLP model and RobustScaler
- Handles inference and hierarchical categorization
"""

import time
import numpy as np
import joblib
from typing import Dict, Any, Tuple
from config import (
    SKIN_CLASSES,
    SKIN_CORE_CLASSES,
    SKIN_EXTENDED_CLASSES,
    SKIN_RARE_CLASSES,
    get_skin_group
)

class SkinInferenceEngine:
    def __init__(self):
        self.classes = SKIN_CLASSES
        self.num_classes = len(self.classes)
        self.model = None
        self.scaler = None
        self._initialize_model()

    def _initialize_model(self):
        try:
            # Load the professional trained MLP model and scaler
            model_path = "C:/medical_ai/models/skin/best_skin_model_MLP.pkl"
            scaler_path = "C:/medical_ai/preprocessing/skin/skin_scaler.pkl"
            
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            print(f"[SkinEngine] Loaded trained MLP model and scaler successfully.")
        except Exception as e:
            print(f"[SkinEngine] Error loading trained model: {e}")
            self.model = None

    def predict(
        self,
        features: np.ndarray,
        segmentation_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Run inference using the MLP model on processed RGB statistical features.
        """
        start_time = time.time()
        
        if self.model is None or self.scaler is None:
            raise RuntimeError("Skin model or scaler not loaded. Check paths.")

        # 1. Scaling (Apply the fitted RobustScaler)
        feat_vector = features.reshape(1, -1)
        scaled_features = self.scaler.transform(feat_vector)

        # 2. Model Inference
        preds = self.model.predict(scaled_features)[0]

        # 3. Calibrate results with clinical ABCD metrics
        asymmetry = segmentation_metrics.get("asymmetryIndex", 0.15)
        border_irr = segmentation_metrics.get("borderIrregularity", 0.2)
        
        calibrated_preds = np.copy(preds)
        if asymmetry > 0.4 and border_irr > 0.4:
            if "Melanoma" in self.classes:
                mel_idx = self.classes.index("Melanoma")
                calibrated_preds[mel_idx] += 0.2
        
        # Softmax normalization
        exp_preds = np.exp(calibrated_preds)
        probs = exp_preds / np.sum(exp_preds)

        sorted_indices = np.argsort(probs)[::-1]
        
        results_list = []
        for i in sorted_indices:
            name = self.classes[i]
            rare_info = SKIN_RARE_CLASSES.get(name, None)
            is_extended = name in SKIN_EXTENDED_CLASSES
            results_list.append({
                "name": name,
                "confidence": round(float(probs[i]), 4),
                "category": get_skin_group(name),
                "isExtended": is_extended,
                "tier": "Extended Tier" if is_extended else "Core Tier",
                "supportLevel": rare_info["supportLevel"] if rare_info else "Data-Rich (>1000)",
                "requiresSpecialistReview": bool(rare_info and rare_info.get("requiresSpecialist", False)),
            })

        top_prediction = results_list[0]
        elapsed = round(time.time() - start_time, 2)

        return {
            "predictions": results_list,
            "topCondition": top_prediction["name"],
            "topConfidence": top_prediction["confidence"],
            "topCategory": top_prediction["category"],
            "requiresSpecialistReview": top_prediction["requiresSpecialistReview"],
            "supportLevel": top_prediction["supportLevel"],
            "tier": top_prediction["tier"],
            "gradcamMap": None, # MLP doesn't support Conv-based Grad-CAM
            "processingTime": f"{elapsed}s",
        }

# Singleton instance
skin_engine = SkinInferenceEngine()
