
import numpy as np
import pandas as pd
import cv2
from scipy import stats
from scipy.fft import fft

def extract_ecg_features(file_path):
    """Extracts signal features from an ECG CSV/DAT file."""
    try:
        df = pd.read_csv(file_path)
        # Take the first numerical column as the signal
        signal = df.iloc[:, 0].values.astype(float)
        
        # Normalization (Z-score)
        sig = (signal - np.mean(signal)) / (np.std(signal) + 1e-6)
        
        # Time Domain
        rms = np.sqrt(np.mean(sig**2))
        var = np.var(sig)
        skew = stats.skew(sig)
        kurt = stats.kurtosis(sig)
        
        # Frequency Domain
        fft_vals = np.abs(fft(sig))
        dom_freq = np.argmax(fft_vals)
        spec_entropy = -np.sum(fft_vals * np.log(fft_vals + 1e-6)) / (np.sum(fft_vals) + 1e-6)
        
        return np.array([rms, var, skew, kurt, dom_freq, spec_entropy])
    except Exception as e:
        print(f"ECG Extraction Error: {e}")
        return np.zeros(6)


def extract_blood_features(file_path):
    """Extracts clinical features from a blood report CSV."""
    try:
        df = pd.read_csv(file_path)
        # Identify key biomarkers
        biomarkers = ['hemoglobin', 'glucose', 'creatinine']
        vals = []
        for b in biomarkers:
            if b in df.columns:
                vals.append(df[b].iloc[0])
            else:
                vals.append(0.0)
        
        # Add a derived ratio (Example: Hb/Creatinine)
        ratio = vals[0] / (vals[2] + 1e-6)
        vals.append(ratio)
        
        return np.array(vals)
    except Exception as e:
        print(f"Blood Extraction Error: {e}")
        return np.zeros(4)
