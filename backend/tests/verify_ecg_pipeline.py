"""
Comprehensive Verification Script for Core ECG Digitization & Analysis Pipeline
Tests all 7 stages required by the validation plan.
"""

import sys
import os
from pathlib import Path
import numpy as np
import cv2
import matplotlib.pyplot as plt

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from modules.cardiac_processor import (
    remove_grid_lines,
    isolate_waveform_trace,
    digitize_trace_to_signal,
    extract_ecg_features,
    process_ecg_image,
)


def generate_synthetic_ecg_strip(
    heart_rate_bpm: int = 75,
    width: int = 1000,
    height: int = 300,
    rotation_angle: float = 0.0,
    noise_level: float = 0.8,
    add_shadow: bool = False,
    grid_type: str = "pink",
) -> np.ndarray:
    """
    Generates a realistic synthetic ECG strip with known ground-truth HR and intervals.
    """
    # Standard ECG: 25 mm/s paper speed, 10 mm/mV amplitude
    # 1 second = 250 pixels (approx) -> 4 seconds = 1000 pixels
    canvas = np.ones((height, width, 3), dtype=np.uint8)
    
    if grid_type == "pink":
        canvas[:, :] = (210, 215, 255) # Pink paper
        grid_minor = (185, 190, 245)
        grid_major = (150, 160, 235)
    else:
        canvas[:, :] = (240, 240, 240) # Gray grid
        grid_minor = (220, 220, 220)
        grid_major = (190, 190, 190)

    # Minor grid (1mm)
    for x in range(0, width, 6):
        cv2.line(canvas, (x, 0), (x, height), grid_minor, 1)
    for y in range(0, height, 6):
        cv2.line(canvas, (0, y), (width, y), grid_minor, 1)

    # Major grid (5mm)
    for x in range(0, width, 30):
        cv2.line(canvas, (x, 0), (x, height), grid_major, 1)
    for y in range(0, height, 30):
        cv2.line(canvas, (0, y), (width, y), grid_major, 1)

    # Calculate period in pixels for target HR
    # 1000 px = 4 seconds -> 250 px/s
    # Period (seconds) = 60 / HR -> Period (px) = (60 / HR) * 250
    period = (60.0 / heart_rate_bpm) * 250.0
    
    baseline = height // 2
    points = []

    for x in range(width):
        rel_x = (x % period) / (period / 110.0) # normalize to standard beat width
        
        # P wave
        p = 12 * np.exp(-((rel_x - 25) ** 2) / 30)
        # Q wave
        q = -10 * np.exp(-((rel_x - 48) ** 2) / 6)
        # R wave (sharp tall peak)
        r = 85 * np.exp(-((rel_x - 55) ** 2) / 10)
        # S wave
        s = -22 * np.exp(-((rel_x - 62) ** 2) / 8)
        # T wave
        t = 24 * np.exp(-((rel_x - 85) ** 2) / 65)
        # Noise
        n = np.random.normal(0, noise_level) if noise_level > 0 else 0

        amp = p + q + r + s + t + n
        y = int(baseline - amp)
        y = np.clip(y, 10, height - 10)
        points.append((x, y))

    # Draw dark black/blue trace
    for i in range(len(points) - 1):
        cv2.line(canvas, points[i], points[i + 1], (30, 25, 20), 2, cv2.LINE_AA)

    # Optional shadow gradient
    if add_shadow:
        gradient = np.linspace(0.6, 1.0, width)
        for x in range(width):
            canvas[:, x] = np.clip(canvas[:, x] * gradient[x], 0, 255).astype(np.uint8)

    # Optional rotation
    if abs(rotation_angle) > 0.01:
        center = (width // 2, height // 2)
        rot_mat = cv2.getRotationMatrix2D(center, rotation_angle, 1.0)
        canvas = cv2.warpAffine(canvas, rot_mat, (width, height), borderMode=cv2.BORDER_REPLICATE)

    return canvas


def run_pipeline_verification():
    print("=" * 70)
    print("SPANDAN CORE ECG DIGITIZATION & ANALYSIS PIPELINE VERIFICATION")
    print("=" * 70)

    results = {}

    # Test 1: Clean Normal ECG (HR = 75 BPM)
    print("\n--- Test 1: Clean Normal ECG (Target HR: 75 BPM, Target R-R: 800 ms) ---")
    img_normal = generate_synthetic_ecg_strip(heart_rate_bpm=75)
    success, enc = cv2.imencode(".png", img_normal)
    _, sig_norm, feat_norm = process_ecg_image(enc.tobytes())
    print(f"Detected Heart Rate: {feat_norm['heartRate']} BPM (Expected ~75)")
    print(f"Detected R-R Interval: {feat_norm['rrInterval']} (Expected ~800 ms)")
    print(f"R-peaks detected: {len(feat_norm['rPeakIndices'])} peaks")
    print(f"QT Interval: {feat_norm['qtInterval']}, QRS Duration: {feat_norm['qrsDuration']}")
    results["Test 1 (Normal)"] = {
        "pass": abs(feat_norm["heartRate"] - 75) <= 5,
        "hr": feat_norm["heartRate"],
        "rr": feat_norm["rrInterval"],
    }

    # Test 2: Tachycardia / Fast Heart Rate (HR = 135 BPM)
    print("\n--- Test 2: Tachycardia / Fast ECG (Target HR: 135 BPM, Target R-R: 444 ms) ---")
    img_fast = generate_synthetic_ecg_strip(heart_rate_bpm=135)
    _, enc = cv2.imencode(".png", img_fast)
    _, sig_fast, feat_fast = process_ecg_image(enc.tobytes())
    print(f"Detected Heart Rate: {feat_fast['heartRate']} BPM (Expected ~135)")
    print(f"Detected R-R Interval: {feat_fast['rrInterval']} (Expected ~444 ms)")
    print(f"R-peaks detected: {len(feat_fast['rPeakIndices'])} peaks")
    results["Test 2 (Tachycardia)"] = {
        "pass": abs(feat_fast["heartRate"] - 135) <= 10,
        "hr": feat_fast["heartRate"],
        "rr": feat_fast["rrInterval"],
    }

    # Test 3: Bradycardia / Slow Heart Rate (HR = 48 BPM)
    print("\n--- Test 3: Bradycardia / Slow ECG (Target HR: 48 BPM, Target R-R: 1250 ms) ---")
    img_slow = generate_synthetic_ecg_strip(heart_rate_bpm=48)
    _, enc = cv2.imencode(".png", img_slow)
    _, sig_slow, feat_slow = process_ecg_image(enc.tobytes())
    print(f"Detected Heart Rate: {feat_slow['heartRate']} BPM (Expected ~48)")
    print(f"Detected R-R Interval: {feat_slow['rrInterval']} (Expected ~1250 ms)")
    print(f"R-peaks detected: {len(feat_slow['rPeakIndices'])} peaks")
    results["Test 3 (Bradycardia)"] = {
        "pass": abs(feat_slow["heartRate"] - 48) <= 5,
        "hr": feat_slow["heartRate"],
        "rr": feat_slow["rrInterval"],
    }

    # Test 4: Angled/Rotated ECG (+5 degrees)
    print("\n--- Test 4: Angled / Rotated ECG (+5 deg) ---")
    img_rot = generate_synthetic_ecg_strip(heart_rate_bpm=75, rotation_angle=5.0)
    _, enc = cv2.imencode(".png", img_rot)
    _, sig_rot, feat_rot = process_ecg_image(enc.tobytes())
    print(f"Detected Heart Rate: {feat_rot['heartRate']} BPM")
    print(f"Detected R-R Interval: {feat_rot['rrInterval']}")
    results["Test 4 (Rotated)"] = {
        "pass": abs(feat_rot["heartRate"] - 75) <= 10,
        "hr": feat_rot["heartRate"],
        "rr": feat_rot["rrInterval"],
    }

    # Test 5: Shadowed & Noisy ECG
    print("\n--- Test 5: Shadowed & Noisy ECG ---")
    img_shadow = generate_synthetic_ecg_strip(heart_rate_bpm=80, noise_level=2.5, add_shadow=True)
    _, enc = cv2.imencode(".png", img_shadow)
    _, sig_shadow, feat_shadow = process_ecg_image(enc.tobytes())
    print(f"Detected Heart Rate: {feat_shadow['heartRate']} BPM (Expected ~80)")
    print(f"Detected R-R Interval: {feat_shadow['rrInterval']}")
    results["Test 5 (Shadow/Noise)"] = {
        "pass": abs(feat_shadow["heartRate"] - 80) <= 10,
        "hr": feat_shadow["heartRate"],
        "rr": feat_shadow["rrInterval"],
    }

    # Test 6: Gray Grid Strip (JPG format)
    print("\n--- Test 6: Gray Grid ECG Strip (JPG format) ---")
    img_gray = generate_synthetic_ecg_strip(heart_rate_bpm=70, grid_type="gray")
    _, enc = cv2.imencode(".jpg", img_gray, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    _, sig_gray, feat_gray = process_ecg_image(enc.tobytes())
    print(f"Detected Heart Rate: {feat_gray['heartRate']} BPM (Expected ~70)")
    print(f"Detected R-R Interval: {feat_gray['rrInterval']}")
    results["Test 6 (Gray Grid JPG)"] = {
        "pass": abs(feat_gray["heartRate"] - 70) <= 8,
        "hr": feat_gray["heartRate"],
        "rr": feat_gray["rrInterval"],
    }

    # Test 7: Output Plot Generation
    print("\n--- Test 7: Digital Graph Reconstruction (Matplotlib) ---")
    output_dir = backend_dir / "tests" / "sample_data"
    output_dir.mkdir(parents=True, exist_ok=True)
    plot_path = output_dir / "reconstructed_ecg_validation.png"

    fig, axs = plt.subplots(3, 1, figsize=(12, 8), sharex=True)
    time_axis = np.linspace(0, 4.0, len(sig_norm))

    axs[0].plot(time_axis, sig_norm, color="#06d6a0", lw=1.5)
    axs[0].scatter(time_axis[feat_norm["rPeakIndices"]], sig_norm[feat_norm["rPeakIndices"]], color="red", zorder=5, label="R-peaks")
    axs[0].set_title(f"Normal ECG: HR = {feat_norm['heartRate']} BPM, RR = {feat_norm['rrInterval']}")
    axs[0].set_ylabel("mV")
    axs[0].grid(True, alpha=0.3)
    axs[0].legend(loc="upper right")

    axs[1].plot(time_axis, sig_fast, color="#3b82f6", lw=1.5)
    axs[1].scatter(time_axis[feat_fast["rPeakIndices"]], sig_fast[feat_fast["rPeakIndices"]], color="red", zorder=5, label="R-peaks")
    axs[1].set_title(f"Tachycardia ECG: HR = {feat_fast['heartRate']} BPM, RR = {feat_fast['rrInterval']}")
    axs[1].set_ylabel("mV")
    axs[1].grid(True, alpha=0.3)
    axs[1].legend(loc="upper right")

    axs[2].plot(time_axis, sig_slow, color="#8b5cf6", lw=1.5)
    axs[2].scatter(time_axis[feat_slow["rPeakIndices"]], sig_slow[feat_slow["rPeakIndices"]], color="red", zorder=5, label="R-peaks")
    axs[2].set_title(f"Bradycardia ECG: HR = {feat_slow['heartRate']} BPM, RR = {feat_slow['rrInterval']}")
    axs[2].set_xlabel("Time (seconds)")
    axs[2].set_ylabel("mV")
    axs[2].grid(True, alpha=0.3)
    axs[2].legend(loc="upper right")

    plt.tight_layout()
    plt.savefig(str(plot_path), dpi=150)
    plt.close()
    print(f"Saved Reconstructed Digital Plot: {plot_path}")

    print("\n" + "=" * 70)
    print("VERIFICATION SUMMARY:")
    all_passed = True
    for test_name, res in results.items():
        status = "PASSED" if res["pass"] else "FAILED"
        if not res["pass"]:
            all_passed = False
        print(f"  {test_name}: {status} (HR: {res['hr']} BPM, RR: {res['rr']})")
    print("=" * 70)
    return all_passed


if __name__ == "__main__":
    success = run_pipeline_verification()
    sys.exit(0 if success else 1)
