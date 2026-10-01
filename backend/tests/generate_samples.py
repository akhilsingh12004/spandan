"""
Generate realistic sample ECG strip images and skin lesion photos for testing
"""

import cv2
import numpy as np
from pathlib import Path

SAMPLE_DIR = Path(__file__).resolve().parent / "sample_data"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)


def generate_sample_ecg():
    """Generates a realistic ECG strip image with pink paper grid lines and waveform trace."""
    width, height = 900, 300
    
    # Pink/cream ECG paper background (BGR: ~ (200, 205, 255))
    canvas = np.ones((height, width, 3), dtype=np.uint8)
    canvas[:, :] = (210, 215, 255)

    # Minor grid lines (1mm equivalents ~ every 5 pixels)
    for x in range(0, width, 6):
        cv2.line(canvas, (x, 0), (x, height), (185, 190, 245), 1)
    for y in range(0, height, 6):
        cv2.line(canvas, (0, y), (width, y), (185, 190, 245), 1)

    # Major grid lines (5mm equivalents ~ every 30 pixels)
    for x in range(0, width, 30):
        cv2.line(canvas, (x, 0), (x, height), (150, 160, 235), 1)
    for y in range(0, height, 30):
        cv2.line(canvas, (0, y), (width, y), (150, 160, 235), 1)

    # Draw continuous ECG rhythm trace (P, QRS, T complexes)
    points = []
    baseline = height // 2
    period = 110 # pixels per heartbeat (~ 75 bpm)

    for x in range(width):
        rel_x = x % period
        # P wave
        p = 12 * np.exp(-((rel_x - 25) ** 2) / 30)
        # Q wave
        q = -10 * np.exp(-((rel_x - 48) ** 2) / 6)
        # R wave (tall sharp spike)
        r = 85 * np.exp(-((rel_x - 55) ** 2) / 10)
        # S wave
        s = -22 * np.exp(-((rel_x - 62) ** 2) / 8)
        # T wave
        t = 24 * np.exp(-((rel_x - 85) ** 2) / 65)
        # Subtle noise
        n = np.random.normal(0, 0.8)

        amp = p + q + r + s + t + n
        y = int(baseline - amp)
        points.append((x, y))

    # Draw dark black/blue trace
    for i in range(len(points) - 1):
        cv2.line(canvas, points[i], points[i + 1], (30, 25, 20), 2, cv2.LINE_AA)

    out_path = SAMPLE_DIR / "sample_ecg.png"
    cv2.imwrite(str(out_path), canvas)
    print(f"Generated sample ECG strip: {out_path}")
    return out_path


def generate_sample_skin():
    """Generates a realistic dermatoscopy image of a skin lesion with hairs."""
    size = 400
    canvas = np.ones((size, size, 3), dtype=np.uint8)

    # Caucasian/fair skin background (BGR)
    canvas[:, :] = (180, 200, 235)
    
    # Add subtle skin texture noise
    noise = np.random.normal(0, 4, (size, size, 3)).astype(np.int16)
    canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Draw pigmented lesion (dark brown / variegated)
    center = (size // 2, size // 2)
    # Main body
    cv2.circle(canvas, center, 75, (45, 55, 115), -1, cv2.LINE_AA)
    # Irregular borders
    for angle in np.linspace(0, 2 * np.pi, 20):
        r = 75 + int(np.random.normal(0, 10))
        px = int(center[0] + r * np.cos(angle))
        py = int(center[1] + r * np.sin(angle))
        cv2.circle(canvas, (px, py), 15, (40, 50, 100), -1, cv2.LINE_AA)
    
    # Inner dark core
    cv2.circle(canvas, center, 40, (25, 30, 65), -1, cv2.LINE_AA)

    # Blur lesion edges slightly to simulate real skin diffusion
    blurred = cv2.GaussianBlur(canvas, (7, 7), 0)

    # Add dark hair strands across lesion (to test DullRazor hair removal)
    cv2.line(blurred, (80, 120), (320, 280), (30, 25, 20), 2, cv2.LINE_AA)
    cv2.line(blurred, (140, 70), (270, 340), (25, 20, 15), 2, cv2.LINE_AA)
    cv2.line(blurred, (50, 260), (350, 140), (35, 30, 25), 1, cv2.LINE_AA)

    out_path = SAMPLE_DIR / "sample_skin.png"
    cv2.imwrite(str(out_path), blurred)
    print(f"Generated sample skin photo: {out_path}")
    return out_path


if __name__ == "__main__":
    generate_sample_ecg()
    generate_sample_skin()
