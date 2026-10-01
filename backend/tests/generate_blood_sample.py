"""
Generate realistic sample blood test report images and PDFs for testing and demo.
"""

import cv2
import numpy as np
from pathlib import Path

SAMPLE_DIR = Path(__file__).resolve().parent / "sample_data"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "public"
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)


def generate_sample_blood_report():
    """Generates a realistic clinical laboratory report image."""
    width, height = 800, 1100
    canvas = np.ones((height, width, 3), dtype=np.uint8) * 255

    # Top header bar (Teal medical branding)
    cv2.rectangle(canvas, (0, 0), (width, 85), (65, 55, 35), -1)
    cv2.putText(canvas, "METROPOLIS CLINICAL LABORATORIES", (40, 40), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(canvas, "COMPREHENSIVE HEALTH CHECKUP & METABOLIC PANEL", (40, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (6, 214, 160), 1, cv2.LINE_AA)

    # Patient info box
    cv2.rectangle(canvas, (40, 105), (width - 40, 175), (245, 245, 245), -1)
    cv2.rectangle(canvas, (40, 105), (width - 40, 175), (210, 210, 210), 1)
    
    cv2.putText(canvas, "Patient Name: Rajesh Sharma", (55, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)
    cv2.putText(canvas, "Age / Gender: 46 Yrs / Male", (55, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)
    cv2.putText(canvas, "Ref. Doctor: Dr. A. V. Rao, MD", (450, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)
    cv2.putText(canvas, "Sample Type: Whole Blood / Serum", (450, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)

    # Table Header
    y_start = 210
    cv2.rectangle(canvas, (40, y_start), (width - 40, y_start + 30), (230, 235, 240), -1)
    cv2.putText(canvas, "TEST PARAMETER", (50, y_start + 20), cv2.FONT_HERSHEY_DUPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)
    cv2.putText(canvas, "OBSERVED VALUE", (310, y_start + 20), cv2.FONT_HERSHEY_DUPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)
    cv2.putText(canvas, "UNIT", (480, y_start + 20), cv2.FONT_HERSHEY_DUPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)
    cv2.putText(canvas, "REFERENCE RANGE", (600, y_start + 20), cv2.FONT_HERSHEY_DUPLEX, 0.48, (40, 40, 40), 1, cv2.LINE_AA)

    # Sample rows (mix of normal and abnormal values to demonstrate diagnostic power)
    tests = [
        ("Hemoglobin (Hb)", "10.4", "g/dL", "13.0 - 17.5", True),
        ("WBC Count (TLC)", "12400", "/mcL", "4000 - 11000", True),
        ("RBC Count", "3.8", "mil/mcL", "4.5 - 5.9", True),
        ("Platelet Count", "245000", "/mcL", "150000 - 450000", False),
        ("Hematocrit (HCT)", "32.5", "%", "38.0 - 50.0", True),
        ("MCV", "74.2", "fL", "80.0 - 100.0", True),
        ("Fasting Blood Glucose", "118.0", "mg/dL", "70.0 - 99.0", True),
        ("HbA1c", "6.1", "%", "4.0 - 5.6", True),
        ("Total Cholesterol", "224.0", "mg/dL", "100.0 - 200.0", True),
        ("LDL Cholesterol", "142.0", "mg/dL", "< 100.0", True),
        ("HDL Cholesterol", "38.0", "mg/dL", "> 40.0", True),
        ("Triglycerides", "185.0", "mg/dL", "< 150.0", True),
        ("Serum Creatinine", "0.95", "mg/dL", "0.60 - 1.20", False),
        ("Blood Urea Nitrogen (BUN)", "16.0", "mg/dL", "7.0 - 20.0", False),
        ("ALT (SGPT)", "64.0", "U/L", "7.0 - 56.0", True),
        ("AST (SGOT)", "48.0", "U/L", "10.0 - 40.0", True),
        ("Total Bilirubin", "0.90", "mg/dL", "0.20 - 1.20", False),
        ("TSH", "3.2", "mIU/L", "0.40 - 4.50", False),
        ("Vitamin D (25-OH)", "18.2", "ng/mL", "30.0 - 100.0", True),
        ("Vitamin B12", "310.0", "pg/mL", "200.0 - 900.0", False),
        ("C-Reactive Protein (CRP)", "4.8", "mg/L", "< 3.0", True),
    ]

    curr_y = y_start + 55
    for name, val, unit, ref, is_abnormal in tests:
        # Alternating background row
        if (curr_y // 35) % 2 == 0:
            cv2.rectangle(canvas, (40, curr_y - 20), (width - 40, curr_y + 12), (250, 250, 252), -1)

        cv2.putText(canvas, name, (50, curr_y), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (30, 30, 30), 1, cv2.LINE_AA)
        
        # Color abnormal values in bold red
        val_color = (20, 20, 210) if is_abnormal else (30, 110, 30)
        cv2.putText(canvas, val, (330, curr_y), cv2.FONT_HERSHEY_DUPLEX, 0.46, val_color, 1 if not is_abnormal else 2, cv2.LINE_AA)
        cv2.putText(canvas, unit, (480, curr_y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (100, 100, 100), 1, cv2.LINE_AA)
        cv2.putText(canvas, ref, (600, curr_y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (80, 80, 80), 1, cv2.LINE_AA)

        curr_y += 35

    # Footer note
    cv2.line(canvas, (40, height - 70), (width - 40, height - 70), (200, 200, 200), 1)
    cv2.putText(canvas, "End of Report. Please correlate clinically. Verified by Chief Pathologist.", (50, height - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (120, 120, 120), 1, cv2.LINE_AA)

    out_backend = SAMPLE_DIR / "sample_blood_report.png"
    out_public = PUBLIC_DIR / "sample_blood_report.png"

    cv2.imwrite(str(out_backend), canvas)
    cv2.imwrite(str(out_public), canvas)
    print(f"Generated sample blood report image: {out_backend} and {out_public}")
    return out_backend


if __name__ == "__main__":
    generate_sample_blood_report()
