
import os
import numpy as np
import pandas as pd
from backend.inference import engine

def test_system():
    print("--- Spandan AI System Test ---")
    
    # Simulate a sample ECG input (6 features as engineered)
    # These match the features: rms, variance, skewness, kurtosis, dom_freq, spectral_entropy
    sample_ecg = [0.5, 0.1, 0.02, 0.05, 12, 0.8] 
    
    try:
        result = engine.predict_ecg(sample_ecg)
        print(f"ECG Prediction: {'Abnormal' if result['prediction'] == 1 else 'Normal'}")
        print(f"Confidence: {result['confidence']:.2%}")
    except Exception as e:
        print(f"ECG Test Failed: {e}")

    # Simulate a sample Blood input (4 features)
    sample_blood = [13.5, 95.0, 1.1, 0.5] 
    try:
        result = engine.predict_blood(sample_blood)
        print(f"Blood Prediction: {'Abnormal' if result['prediction'] == 1 else 'Normal'}")
        print(f"Confidence: {result['confidence']:.2%}")
    except Exception as e:
        print(f"Blood Test Failed: {e}")

    print("--- Test Complete ---")

if __name__ == '__main__':
    test_system()
