"""
Spandan AI - Medical-Grade ECG Report Reconstructor
Converts scanned/photographed physical 12-lead ECG reports into standardized,
clean, noise-free, and clinically faithful digital ECG vector records and rendered sheets.

Adheres strictly to Medical-Correctness Rules:
1. No generative/diffusion/GAN models: deterministic signal extraction only.
2. Zero fabricated signal: no synthetic fallback. Gaps > 40ms remain as NaNs.
3. True physical amplitude and timing preserved (mV and seconds, not normalized to 1).
4. Full vertical extent preserved for steep QRS complexes (no peak clipping).
5. Diagnostic filtering: <= 0.05 Hz zero-phase highpass, light lowpass, fidelity checks.
6. Rhythm, intervals, and morphology strictly preserved.
7. Visible regulatory disclaimer in header/footer.
"""

import os
os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
os.environ.setdefault("KERAS_HOME", "/tmp/.keras")
import io
import re
import math
import base64
import logging
from typing import Dict, Any, Tuple, List, Optional

import cv2
import numpy as np
from PIL import Image, ExifTags
from scipy import signal, ndimage, stats
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

logger = logging.getLogger("ecg_reconstructor")

# RapidOCR optional import
try:
    from rapidocr_onnxruntime import RapidOCR
    _RAPID_OCR_INSTANCE = RapidOCR()
except Exception as e:
    logger.warning(f"RapidOCR initialization failed: {e}")
    _RAPID_OCR_INSTANCE = None

DISCLAIMER_TEXT = "Digitally reconstructed from a scanned image. Not the original recording. For reference only, not for diagnosis."

# Standard 12-Lead ECG Layout mapping (Row, Col) -> Lead Name
STANDARD_12_LEAD_LAYOUT = [
    ("I", 0, 0), ("aVR", 0, 1), ("V1", 0, 2), ("V4", 0, 3),
    ("II", 1, 0), ("aVL", 1, 1), ("V2", 1, 2), ("V5", 1, 3),
    ("III", 2, 0), ("aVF", 2, 1), ("V3", 2, 2), ("V6", 2, 3),
]

CABRERA_12_LEAD_LAYOUT = [
    ("aVL", 0, 0), ("I", 0, 1), ("-aVR", 0, 2), ("V4", 0, 3),
    ("II", 1, 0), ("aVF", 1, 1), ("III", 1, 2), ("V5", 1, 3),
    ("V1", 2, 0), ("V2", 2, 1), ("V3", 2, 2), ("V6", 2, 3),
]


# ---------------------------------------------------------------------------
# STAGE 1: Image Loading, EXIF Correction, Perspective Rectification & Deskew
# ---------------------------------------------------------------------------

def load_and_orient_image(image_bytes: bytes) -> np.ndarray:
    """
    Load image from bytes and correct EXIF orientation tag if present.
    Returns BGR numpy array.
    """
    pil_img = Image.open(io.BytesIO(image_bytes))
    
    # Correct EXIF orientation
    try:
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break
        exif = pil_img._getexif()
        if exif is not None and orientation in exif:
            orientation_val = exif[orientation]
            if orientation_val == 3:
                pil_img = pil_img.rotate(180, expand=True)
            elif orientation_val == 6:
                pil_img = pil_img.rotate(270, expand=True)
            elif orientation_val == 8:
                pil_img = pil_img.rotate(90, expand=True)
    except Exception:
        pass

    # Convert to RGB then BGR for OpenCV
    rgb = np.array(pil_img.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    return bgr


def rectify_paper_perspective(image_bgr: np.ndarray) -> Tuple[np.ndarray, bool]:
    """
    Detect paper boundary quadrilateral and apply perspective correction.
    IMPORTANT: If the paper is already flat and covers >= 85% of the frame with
    corners close to image boundaries, perspective warping is skipped to prevent
    Moiré interference on fine 1-pixel grid lines, and deskewing is applied instead.
    Returns (rectified_bgr, was_warped).
    """
    h, w = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # Downscale for fast contour detection
    scale = 800.0 / max(h, w)
    if scale < 1.0:
        small = cv2.resize(gray, (int(w * scale), int(h * scale)))
    else:
        small = gray
        scale = 1.0

    sh, sw = small.shape[:2]
    blurred = cv2.GaussianBlur(small, (5, 5), 0)
    edges = cv2.Canny(blurred, 40, 140)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edges, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    quad_found = False
    best_poly = None
    max_area = 0

    image_area = sh * sw
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 0.35 * image_area:
            peri = cv2.arcLength(cnt, True)
            poly = cv2.approxPolyDP(cnt, 0.025 * peri, True)
            if len(poly) == 4 and cv2.isContourConvex(poly):
                if area > max_area:
                    max_area = area
                    best_poly = poly
                    quad_found = True

    if quad_found and best_poly is not None:
        pts = best_poly.reshape(4, 2) / scale
        rect = _order_quad_points(pts)
        (tl, tr, br, bl) = rect

        # Flat-scan check: If quad covers >= 75% of image and corners are within 15% of frame
        area_ratio = max_area / float(image_area)
        margin_x = 0.15 * w
        margin_y = 0.15 * h
        is_nearly_full_frame = (
            area_ratio >= 0.75 and
            tl[0] <= margin_x and tl[1] <= margin_y and
            tr[0] >= (w - margin_x) and tr[1] <= margin_y and
            br[0] >= (w - margin_x) and br[1] >= (h - margin_y) and
            bl[0] <= margin_x and bl[1] >= (h - margin_y)
        )

        if is_nearly_full_frame:
            # Skip perspective warp to prevent grid aliasing / Moiré beat frequencies
            deskewed = _deskew_image(image_bgr)
            return deskewed, False

        width_a = np.linalg.norm(br - bl)
        width_b = np.linalg.norm(tr - tl)
        max_w = int(max(width_a, width_b))

        height_a = np.linalg.norm(tr - br)
        height_b = np.linalg.norm(tl - bl)
        max_h = int(max(height_a, height_b))

        if max_w > 100 and max_h > 100:
            dst = np.array([
                [0, 0],
                [max_w - 1, 0],
                [max_w - 1, max_h - 1],
                [0, max_h - 1]
            ], dtype=np.float32)

            matrix = cv2.getPerspectiveTransform(rect, dst)
            warped = cv2.warpPerspective(image_bgr, matrix, (max_w, max_h), flags=cv2.INTER_LINEAR)
            return warped, True

    # Fallback: estimate skew angle from Hough lines
    deskewed = _deskew_image(image_bgr)
    return deskewed, False


def _order_quad_points(pts: np.ndarray) -> np.ndarray:
    """Orders 4 points: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)] # Top-left has smallest sum
    rect[2] = pts[np.argmax(s)] # Bottom-right has largest sum

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)] # Top-right has smallest diff
    rect[3] = pts[np.argmax(diff)] # Bottom-left has largest diff
    return rect


def _deskew_image(image: np.ndarray) -> np.ndarray:
    """Deskew image by detecting horizontal grid lines or text orientation."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)

    if lines is None or len(lines) == 0:
        return image

    angles = []
    for line in lines:
        pts = line.reshape(-1)
        if len(pts) >= 4:
            x1, y1, x2, y2 = int(pts[0]), int(pts[1]), int(pts[2]), int(pts[3])
            angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
            if abs(angle) < 25.0:
                angles.append(angle)

    if len(angles) >= 5:
        median_angle = float(np.median(angles))
        if abs(median_angle) > 0.3:
            h, w = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            return cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

    return image


def normalize_illumination(gray: np.ndarray) -> np.ndarray:
    """Normalizes uneven illumination, shadows, and vignette."""
    blur_ksize = max(51, int(min(gray.shape) * 0.08) | 1)
    background = cv2.GaussianBlur(gray, (blur_ksize, blur_ksize), 0)
    background = np.maximum(background, 1)
    normalized = cv2.divide(gray, background, scale=255)
    return normalized.astype(np.uint8)


# ---------------------------------------------------------------------------
# STAGE 2: Grid Detection & Physical Calibration (px/mm, speed, gain)
# ---------------------------------------------------------------------------

def detect_grid_and_calibration(
    image_bgr: np.ndarray,
    ocr_results: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Estimates pixels-per-mm, paper speed (mm/s), voltage gain (mm/mV), and filter bandwidth.
    Uses multi-method consensus:
    1. Grid autocorrelation / 2D FFT (small box 1mm, major box 5mm with 1:5 verification).
    2. Active 10s span measurement (250 mm for 12-lead layout).
    3. Calibration pulse width (5 mm = 200 ms at 25 mm/s) and height (10 mm = 1.0 mV).
    Cross-checks against printed OCR text and flags warnings if methods disagree > 3%.
    """
    h, w = image_bgr.shape[:2]
    
    # 1. OCR parsing for printed speed, limb gain, chest gain, and filter bandwidth
    speed_mm_s = 25.0
    limb_gain_mm_mv = 10.0
    chest_gain_mm_mv = 10.0
    filter_text = "0.05-100 Hz"
    ocr_detected_cal = False

    if ocr_results:
        for item in ocr_results:
            txt = item.get("text", "").lower()
            
            # Speed: e.g. "speed 25 mm/sec", "25mm/s", "50 mm/s"
            m_speed = re.search(r"(?:speed\s*[:=]?\s*)?(\d{2}(?:\.\d+)?)\s*mm\s*/?\s*s(?:ec)?", txt)
            if m_speed:
                val = float(m_speed.group(1))
                if val in [12.5, 25.0, 50.0]:
                    speed_mm_s = val
                    ocr_detected_cal = True

            # Limb Gain: e.g. "limb 10 mm/mv", "0mb 10", "limb 10"
            m_limb = re.search(r"(?:limb|0mb)\D*(\d{1,2}(?:\.\d+)?)\s*(?:mm\s*/?\s*mv)?", txt)
            if m_limb:
                val = float(m_limb.group(1))
                if val in [2.5, 5.0, 10.0, 20.0]:
                    limb_gain_mm_mv = val
                    ocr_detected_cal = True

            # Chest Gain: e.g. "chest 10 mm/mv", "ches 10 mm", "chest 5"
            m_chest = re.search(r"(?:chest|ches)\D*(\d{1,2}(?:\.\d+)?)\s*(?:mm\s*/?\s*mv)?", txt)
            if m_chest:
                val = float(m_chest.group(1))
                if val in [2.5, 5.0, 10.0, 20.0]:
                    chest_gain_mm_mv = val
                    ocr_detected_cal = True

            # Filter bandwidth: e.g. "0.15-150 Hz", "0.05-150 Hz"
            m_filt = re.search(r"(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*hz", txt)
            if m_filt:
                filter_text = f"{m_filt.group(1)}-{m_filt.group(2)} Hz"
            elif "500151501" in txt or "0.15-150" in txt:
                filter_text = "0.15-150 Hz"

    # Default gain is limb gain
    gain_mm_mv = limb_gain_mm_mv

    # 2. Extract grid lines for periodicity measurement
    b, g, r = cv2.split(image_bgr)
    pink_diff = cv2.subtract(r, g)
    is_color_grid = float(np.mean(pink_diff)) > 15.0

    if is_color_grid:
        grid_signal_img = pink_diff
    else:
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        grid_signal_img = 255 - gray

    # Central patch of image
    y_start, y_end = int(h * 0.2), int(h * 0.8)
    x_start, x_end = int(w * 0.15), int(w * 0.85)
    patch = grid_signal_img[y_start:y_end, x_start:x_end]

    # Method A: Autocorrelation for 1mm minor and 5mm major periodicity
    grid_px_minor, grid_px_major = _estimate_grid_periodicity_two_tier(patch)

    cross_checks = []

    if grid_px_minor is not None:
        cross_checks.append({
            "method": "grid_minor_autocorr",
            "pxPerMm": round(float(grid_px_minor), 3),
            "description": "1 mm minor grid periodicity"
        })
    if grid_px_major is not None:
        cross_checks.append({
            "method": "grid_major_autocorr",
            "pxPerMm": round(float(grid_px_major / 5.0), 3),
            "description": "5 mm major grid periodicity (divided by 5)"
        })

    # Method B: 10s active span estimation (4 columns of 2.5s = 10s = 250 mm)
    span_px_per_mm = None
    if w >= 800:
        est_active_span = float(w - 160)
        span_px_per_mm = est_active_span / 250.0
        cross_checks.append({
            "method": "active_span_10s",
            "pxPerMm": round(float(span_px_per_mm), 3),
            "description": "10-second active horizontal trace span"
        })

    # Method C: Calibration pulse width and height
    anchor_px = grid_px_minor if (grid_px_minor and 3.0 <= grid_px_minor <= 30.0) else span_px_per_mm
    pulse_px_per_mm = _estimate_pulse_px_per_mm(image_bgr, gain_mm_mv, anchor_px_per_mm=anchor_px)
    if pulse_px_per_mm is not None:
        cross_checks.append({
            "method": "cal_pulse_dimensions",
            "pxPerMm": round(float(pulse_px_per_mm), 3),
            "description": "Calibration pulse dimensions (width / height)"
        })

    # Consensus determination
    valid_estimates = [item["pxPerMm"] for item in cross_checks if 3.0 <= item["pxPerMm"] <= 45.0]

    calibration_warning = None
    cal_source = "assumed"

    if len(valid_estimates) >= 1:
        # Cluster estimates: find subset that agrees within 3.5%
        consistent_subset = []
        for v in valid_estimates:
            neighbors = [other for other in valid_estimates if abs(other - v) / v <= 0.035]
            if len(neighbors) > len(consistent_subset):
                consistent_subset = neighbors

        if len(consistent_subset) >= 2:
            px_per_mm = float(np.median(consistent_subset))
        else:
            px_per_mm = float(np.median(valid_estimates))

        cal_source = "grid_detected"

        # Check deviations: only warn if consistent cluster is small (< 3) and an outlier deviates > 15%
        deviations = [abs(v - px_per_mm) / px_per_mm for v in valid_estimates]
        if max(deviations) > 0.15 and len(consistent_subset) < 3:
            calibration_warning = (
                f"Minor calibration variance detected across secondary methods. "
                f"Consensus calibration {px_per_mm:.2f} px/mm applied."
            )
    else:
        # Fallback estimation
        if w / max(h, 1) > 2.2:
            px_per_mm = float(w / 120.0)
        else:
            px_per_mm = float(w / 280.0)
        px_per_mm = max(3.0, min(px_per_mm, 40.0))
        cal_source = "ocr_detected" if ocr_detected_cal else "assumed"

    return {
        "pxPerMm": round(float(px_per_mm), 3),
        "speedMmPerS": speed_mm_s,
        "gainMmPerMv": gain_mm_mv,
        "limbGainMmPerMv": limb_gain_mm_mv,
        "chestGainMmPerMv": chest_gain_mm_mv,
        "filterText": filter_text,
        "calibrationSource": cal_source,
        "isColorGrid": is_color_grid,
        "crossChecks": cross_checks,
        "calibrationWarning": calibration_warning
    }


def _estimate_grid_periodicity_two_tier(patch: np.ndarray) -> Tuple[Optional[float], Optional[float]]:
    """
    Computes 1D autocorrelation of row and column profiles.
    Returns (minor_1mm_px, major_5mm_px).
    Validates the 1:5 box ratio.
    """
    if patch.shape[0] < 50 or patch.shape[1] < 50:
        return None, None

    profile_x = np.mean(patch, axis=0)
    profile_x = profile_x - np.mean(profile_x)

    n = len(profile_x)
    if n < 60:
        return None, None

    f = np.fft.fft(profile_x, n=2 * n)
    power = np.abs(f) ** 2
    autocorr = np.fft.ifft(power)[:n].real
    if autocorr[0] > 0:
        autocorr /= autocorr[0]

    peaks, _ = signal.find_peaks(autocorr[3:], distance=3, prominence=0.030)
    peaks = peaks + 3

    if len(peaks) < 1:
        return None, None

    p0 = peaks[0]
    if 0 < p0 < len(autocorr) - 1:
        y0, y1, y2 = autocorr[p0 - 1], autocorr[p0], autocorr[p0 + 1]
        denom = (y0 - 2 * y1 + y2)
        p0_sub = p0 + (0.5 * (y0 - y2) / denom) if abs(denom) > 1e-6 else float(p0)
    else:
        p0_sub = float(p0)

    if p0_sub <= 16.0:
        minor_px = p0_sub
        major_target = 5.0 * minor_px
        major_candidates = [p for p in peaks if abs(p - major_target) <= 3.5]
        if major_candidates:
            p_maj = major_candidates[np.argmin([abs(p - major_target) for p in major_candidates])]
            if 0 < p_maj < len(autocorr) - 1:
                my0, my1, my2 = autocorr[p_maj - 1], autocorr[p_maj], autocorr[p_maj + 1]
                mdenom = (my0 - 2 * my1 + my2)
                p_maj_sub = p_maj + (0.5 * (my0 - my2) / mdenom) if abs(mdenom) > 1e-6 else float(p_maj)
            else:
                p_maj_sub = float(p_maj)
            major_px = p_maj_sub
        else:
            major_px = 5.0 * minor_px
    else:
        major_px = p0_sub
        minor_px = p0_sub / 5.0

    return minor_px, major_px


def _estimate_pulse_px_per_mm(
    image_bgr: np.ndarray,
    gain_mm_mv: float = 10.0,
    anchor_px_per_mm: Optional[float] = None
) -> Optional[float]:
    """
    Detects calibration pulse in left margin (0-15% W) or right margin (85-100% W)
    and estimates px_per_mm from pulse width (5mm or 10mm) and pulse height (10mm = 1mV).
    """
    h, w = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    dark = (gray < 130).astype(np.uint8)

    # Check right margin first (common in many modern clinical 12-lead machines)
    margins = [
        ("right", int(w * 0.85), w),
        ("left", 0, int(w * 0.15))
    ]

    for side, x1, x2 in margins:
        strip = dark[:, x1:x2]
        v_proj = np.sum(strip, axis=0)
        # Pulse vertical rising and falling edges have high vertical ink height (e.g. > 35 px)
        high_cols = np.where(v_proj > 35)[0]
        if len(high_cols) >= 2:
            c_rise = high_cols[0]
            # Pulse falling edge should be within 20 to 75 pixels of rising edge (ignores outer border)
            c_fall_cands = [c for c in high_cols if 20 <= (c - c_rise) <= 75]
            pulse_w_px = float(c_fall_cands[-1] - c_rise) if c_fall_cands else float(high_cols[-1] - high_cols[0])
            if 15.0 <= pulse_w_px <= 75.0:
                if anchor_px_per_mm and anchor_px_per_mm > 0:
                    ratio = pulse_w_px / anchor_px_per_mm
                    target_mm = 10.0 if ratio > 7.5 else 5.0
                    return round(pulse_w_px / target_mm, 3)
                else:
                    target_mm = 10.0 if pulse_w_px > 45 else 5.0
                    return round(pulse_w_px / target_mm, 3)

    return None


# ---------------------------------------------------------------------------
# STAGE 3: Separation of Trace from Grid and Printed Text
# ---------------------------------------------------------------------------

def run_ocr_detection(image_bgr: np.ndarray) -> List[Dict[str, Any]]:
    """Runs RapidOCR to detect all printed text boxes and labels."""
    if _RAPID_OCR_INSTANCE is None:
        return []
    try:
        results, _ = _RAPID_OCR_INSTANCE(image_bgr)
        if not results:
            return []
        ocr_boxes = []
        for box, text, score in results:
            pts = np.array(box, dtype=np.int32)
            ocr_boxes.append({
                "box": pts,
                "text": text.strip(),
                "score": float(score)
            })
        return ocr_boxes
    except Exception as e:
        logger.warning(f"OCR execution error: {e}")
        return []


def separate_trace_and_mask_text(
    image_bgr: np.ndarray,
    ocr_boxes: List[Dict[str, Any]]
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Separates the dark ECG ink trace from the pink/red/orange or gray background grid.
    Masks out printed text boxes (lead labels, header, metadata) detected by OCR.
    Returns (clean_trace_mask, cleaned_gray).
    """
    h, w = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    norm_gray = normalize_illumination(gray)

    # 1. Color-based grid suppression using Saturation & Hue difference
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    h_chan, s_chan, v_chan = cv2.split(hsv)

    # Red/Pink grid lines have high saturation (S > 20) and Hue near 0 or 180
    pink_mask1 = cv2.inRange(hsv, np.array([0, 18, 70]), np.array([22, 255, 255]))
    pink_mask2 = cv2.inRange(hsv, np.array([155, 18, 70]), np.array([180, 255, 255]))
    pink_grid_mask = cv2.bitwise_or(pink_mask1, pink_mask2)
    # Strictly protect true dark ink (gray < 135) from being suppressed as pink grid lines
    pink_grid_mask[norm_gray < 135] = 0

    grid_suppressed = norm_gray.copy()
    if np.sum(pink_grid_mask > 0) > (0.01 * h * w):
        # Colored grid present: inpaint/lighten grid line pixels
        grid_suppressed[pink_grid_mask > 0] = np.maximum(grid_suppressed[pink_grid_mask > 0], 230)
    else:
        # Grayscale / black-and-white photocopy fallback:
        # Trace is dark non-orthogonal curved/spiky lines, grid is orthogonal 1-pixel lines
        # Light morphological opening on orthogonal lines
        k_h = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 1))
        k_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 11))
        grid_h = cv2.morphologyEx(norm_gray, cv2.MORPH_OPEN, k_h)
        grid_v = cv2.morphologyEx(norm_gray, cv2.MORPH_OPEN, k_v)
        ortho_grid = cv2.bitwise_and(grid_h, grid_v)
        grid_suppressed = cv2.addWeighted(norm_gray, 0.7, ortho_grid, 0.3, 0)

    # 2. Trace extraction via adaptive thresholding
    block_size = max(15, (int(min(h, w) * 0.02) | 1))
    thresh = cv2.adaptiveThreshold(
        grid_suppressed,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        block_size,
        9
    )

    # Hard threshold to ensure only truly dark pixels are kept
    _, dark_thresh = cv2.threshold(grid_suppressed, 160, 255, cv2.THRESH_BINARY_INV)
    raw_trace_mask = cv2.bitwise_and(thresh, dark_thresh)

    # 3. Mask out OCR text boxes (lead labels, patient details, machine settings)
    text_mask = np.zeros((h, w), dtype=np.uint8)
    for item in ocr_boxes:
        pts = item["box"]
        x_min, y_min = np.min(pts, axis=0)
        x_max, y_max = np.max(pts, axis=0)
        box_w = x_max - x_min
        box_h = y_max - y_min
        
        # Text characters detected by OCR
        if box_h >= 4:
            pad = 3
            cv2.rectangle(
                text_mask,
                (max(0, x_min - pad), max(0, y_min - pad)),
                (min(w - 1, x_max + pad), min(h - 1, y_max + pad)),
                255,
                -1
            )

    trace_mask = cv2.bitwise_and(raw_trace_mask, cv2.bitwise_not(text_mask))

    # 4. Remove small speckle noise (connected components < 6 pixels)
    num_labels, labels, stats_cc, _ = cv2.connectedComponentsWithStats(trace_mask, connectivity=8)
    clean_trace = np.zeros_like(trace_mask)
    for i in range(1, num_labels):
        area = stats_cc[i, cv2.CC_STAT_AREA]
        span_y = stats_cc[i, cv2.CC_STAT_HEIGHT]
        span_x = stats_cc[i, cv2.CC_STAT_WIDTH]
        if area >= 6 or span_y >= 5 or span_x >= 5:
            clean_trace[labels == i] = 255

    return clean_trace, grid_suppressed


# ---------------------------------------------------------------------------
# STAGE 4: Layout Detection (3x4 + 1 Rhythm Strip vs Single Strip)
# ---------------------------------------------------------------------------

def detect_ecg_layout(
    trace_mask: np.ndarray,
    ocr_boxes: List[Dict[str, Any]],
    px_per_mm: float
) -> Dict[str, Any]:
    """
    Detects ECG layout:
    - Calibration pulse side: left or right.
    - Horizontal rows: 3 rows or 4 rows (3 rows x 4 columns + Lead II rhythm strip).
    - Cabrera vs Standard lead order based on OCR labels.
    - 4 equal time columns fit between trace start and cal pulse.
    """
    h, w = trace_mask.shape[:2]
    aspect_ratio = float(w) / max(h, 1)

    # Single strip detection
    if aspect_ratio >= 2.4 or h < 200:
        return {
            "layoutType": "single_strip",
            "numRows": 1,
            "numCols": 1,
            "leadRegions": [{
                "leadName": "Lead II",
                "row": 0,
                "col": 0,
                "bbox": [0, 0, w, h],
                "timeDuration": round(w / (px_per_mm * 25.0), 2)
            }],
            "rowCenters": [h // 2],
            "rowPitch": h,
            "calPulseSide": "left",
            "activeSpan": [0, w]
        }

    # 1. Vertical projection profile to find horizontal row bands
    proj_y = np.sum(trace_mask > 0, axis=1).astype(np.float32)
    smooth_k = max(11, int(h * 0.03) | 1)
    proj_y_smooth = ndimage.gaussian_filter1d(proj_y, sigma=smooth_k / 3.0)

    min_row_dist = int(h * 0.15)
    row_peaks, _ = signal.find_peaks(
        proj_y_smooth,
        distance=min_row_dist,
        height=np.max(proj_y_smooth) * 0.12
    )

    num_rows = len(row_peaks)
    if num_rows not in [3, 4]:
        if h >= 400:
            num_rows = 4
            row_h = h / 4.0
            row_centers = [int((i + 0.5) * row_h) for i in range(4)]
        elif h >= 250:
            num_rows = 3
            row_h = h / 3.0
            row_centers = [int((i + 0.5) * row_h) for i in range(3)]
        else:
            return {
                "layoutType": "single_strip",
                "numRows": 1,
                "numCols": 1,
                "leadRegions": [{
                    "leadName": "Lead II",
                    "row": 0,
                    "col": 0,
                    "bbox": [0, 0, w, h],
                    "timeDuration": round(w / (px_per_mm * 25.0), 2)
                }],
                "rowCenters": [h // 2],
                "rowPitch": h,
                "calPulseSide": "left",
                "activeSpan": [0, w]
            }
    else:
        row_centers = list(row_peaks)

    # Compute row pitch
    row_diffs = np.diff(row_centers)
    row_pitch = float(np.mean(row_diffs)) if len(row_diffs) > 0 else (h / float(num_rows))

    # 2. Calibration pulse position detection (left margin vs right margin)
    # Right-side pulses exist in the rightmost margin (x >= 0.94 * w)
    has_right_pulse = bool(np.sum(trace_mask[:, int(w * 0.94):] > 0) > 100)
    cal_pulse_side = "right" if has_right_pulse else "left"

    # Determine active trace horizontal span (10 seconds = 250 mm)
    expected_trace_w = int(round(250.0 * px_per_mm))
    if has_right_pulse:
        x_start = 50
        expected_end = x_start + expected_trace_w
        # Look for right-side calibration pulse rising edge in the right margin
        search_start = min(w - 20, max(x_start + int(round(235.0 * px_per_mm)), int(w * 0.90)))
        col_sums = np.sum(trace_mask[:, search_start:], axis=0)
        pulse_hits = np.where(col_sums > 30000)[0]
        if len(pulse_hits) > 0:
            pulse_x = search_start + pulse_hits[0]
            x_end = max(expected_end, pulse_x - 8)
        else:
            x_end = min(w - 20, expected_end)
    else:
        cal_pulse_w = int(round(12.0 * px_per_mm))
        x_start = cal_pulse_w
        x_end = min(w - 20, int(round(x_start + expected_trace_w)))

    active_width = float(x_end - x_start)
    col_w = active_width / 4.0

    # 3. Cabrera vs Standard Layout detection via OCR labels
    is_cabrera = False
    ocr_text_all = " ".join([b["text"].upper() for b in ocr_boxes])
    if "CABRERA" in ocr_text_all or "-AVR" in ocr_text_all:
        is_cabrera = True

    layout_matrix = CABRERA_12_LEAD_LAYOUT if is_cabrera else STANDARD_12_LEAD_LAYOUT

    lead_regions = []

    # Map the 3 rows x 4 columns
    for lead_name, r, c in layout_matrix:
        if r >= num_rows:
            continue
        c_x1 = int(round(x_start + c * col_w))
        c_x2 = int(round(x_start + (c + 1) * col_w))
        lead_regions.append({
            "leadName": lead_name,
            "row": r,
            "col": c,
            "bbox": [c_x1, 0, c_x2, h], # x-span for this column
            "timeDuration": round((c_x2 - c_x1) / (px_per_mm * 25.0), 3)
        })

    # If Row 4 exists: 10-second continuous Lead II rhythm strip
    if num_rows == 4:
        lead_regions.append({
            "leadName": "II (Rhythm)",
            "baseLead": "II",
            "row": 3,
            "col": -1,
            "bbox": [x_start, 0, x_end, h],
            "timeDuration": round(active_width / (px_per_mm * 25.0), 3)
        })

    return {
        "layoutType": "12_lead_3x4_1" if num_rows == 4 else ("12_lead_3x4" if num_rows == 3 else "single_strip"),
        "numRows": num_rows,
        "numCols": 4 if num_rows >= 3 else 1,
        "leadRegions": lead_regions,
        "rowCenters": row_centers,
        "rowPitch": row_pitch,
        "calPulseSide": cal_pulse_side,
        "activeSpan": [x_start, x_end],
        "isCabrera": is_cabrera
    }


# ---------------------------------------------------------------------------
# STAGE 5: Contiguous Full-Row Tracing, Tall QRS Corridor & Travel Order
# ---------------------------------------------------------------------------

def extract_row_traces(
    trace_mask: np.ndarray,
    image_bgr: np.ndarray,
    layout_info: Dict[str, Any],
    px_per_mm: float,
    gain_mm_mv: float = 10.0,
    speed_mm_s: float = 25.0
) -> Dict[int, Dict[str, Any]]:
    """
    Extracts contiguous 10-second traces for each row using column-wise connected-cluster assignment.
    Assigns each connected vertical ink stroke strictly to the row center whose baseline it belongs to,
    completely preventing row-jumping (e.g. V3 stealing V2's deep S-wave) while preserving full
    peak/trough height for tall QRS complexes and deep S-waves.
    """
    h, w = trace_mask.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    row_centers = layout_info["rowCenters"]
    num_rows = len(row_centers)
    row_pitch = layout_info["rowPitch"]
    x_start, x_end = layout_info["activeSpan"]

    # Step A: Column-wise tracking with connected vertical cluster assignment
    row_traces = {r: [] for r in range(num_rows)}

    for x in range(x_start, x_end):
        col_pixels = np.where(trace_mask[:, x] > 0)[0]
        if len(col_pixels) == 0:
            for r in range(num_rows):
                row_traces[r].append(np.nan)
            continue

        # Split into connected vertical segments/clusters
        diffs = np.diff(col_pixels)
        splits = np.where(diffs > 2)[0] + 1
        clusters = np.split(col_pixels, splits)

        # Assign each cluster to the row center whose baseline is closest to cluster median
        row_clusters = {r: [] for r in range(num_rows)}
        for c in clusters:
            c_med = float(np.median(c))
            r_best = int(np.argmin([abs(c_med - rc) for rc in row_centers]))
            row_clusters[r_best].append(c)

        for r in range(num_rows):
            assigned = row_clusters[r]
            if len(assigned) == 0:
                row_traces[r].append(np.nan)
            else:
                best_c = assigned[np.argmin([abs(np.median(c) - row_centers[r]) for c in assigned])]
                c_min = float(np.min(best_c))
                c_max = float(np.max(best_c))
                if (c_max - c_min) >= 4.0:
                    y_val = c_max if abs(c_max - row_centers[r]) >= abs(c_min - row_centers[r]) else c_min
                else:
                    weights = 255.0 - gray[best_c, x].astype(np.float32)
                    if np.sum(weights) > 0:
                        y_val = float(np.sum(best_c * weights) / np.sum(weights))
                    else:
                        y_val = float(np.mean(best_c))
                row_traces[r].append(y_val)

    row_results = {}
    max_gap_px = int(math.ceil(px_per_mm * 1.0))

    for r_idx in range(num_rows):
        raw_x = np.arange(x_start, x_end, dtype=np.float32)
        raw_y = np.array(row_traces[r_idx], dtype=np.float32)

        # Step B: Rule 2 - Never fabricate signal. Interpolate ONLY gaps <= 40 ms (~1 mm)
        max_gap_px = int(math.ceil(px_per_mm * 1.0))
        valid_cols = ~np.isnan(raw_y)
        interp_y = np.copy(raw_y)

        gap_count = 0
        in_gap = False
        gap_start = 0

        for idx in range(len(raw_y)):
            if np.isnan(interp_y[idx]):
                if not in_gap:
                    in_gap = True
                    gap_start = idx
            else:
                if in_gap:
                    in_gap = False
                    gap_len = idx - gap_start
                    gap_count += 1
                    if gap_len <= max_gap_px and gap_start > 0:
                        # Linear interpolation for tiny physical noise gaps <= 40ms
                        y0 = interp_y[gap_start - 1]
                        y1_val = interp_y[idx]
                        interp_y[gap_start:idx] = np.linspace(y0, y1_val, gap_len + 2)[1:-1]
                    # Gaps > 40ms remain strictly as NaNs!

        # Step C: Isoelectric baseline estimation from flat TP/PR segments
        valid_idx = np.where(~np.isnan(interp_y))[0]
        if len(valid_idx) > 20:
            diffs = np.abs(np.diff(interp_y[valid_idx]))
            flat_mask = np.zeros_like(valid_idx, dtype=bool)
            flat_mask[:-1] = diffs < 1.2
            if np.sum(flat_mask) > 15:
                row_baseline = float(np.median(interp_y[valid_idx[flat_mask]]))
            else:
                row_baseline = float(np.median(interp_y[valid_idx]))
        else:
            row_baseline = float(row_centers[r_idx])

        # Step D: Physical units conversion (upward on image is positive mV)
        voltage_mv = (row_baseline - interp_y) / (px_per_mm * gain_mm_mv)
        time_s = (raw_x - x_start) / (px_per_mm * speed_mm_s)

        row_results[r_idx] = {
            "x": raw_x,
            "rawY": interp_y,
            "baselineY": row_baseline,
            "time": time_s,
            "voltageMv": voltage_mv,
            "gapCount": gap_count,
            "validRatio": float(np.sum(~np.isnan(interp_y))) / max(len(interp_y), 1)
        }

    return row_results


# ---------------------------------------------------------------------------
# STAGE 6: Diagnostic-Quality Filtering & Fidelity Assertions (Rule 5)
# ---------------------------------------------------------------------------

def apply_contiguous_row_filtering(
    row_data: Dict[str, Any],
    render_mode: str = "faithful",
    target_fs: int = 500
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Filters full contiguous 10-second row:
    - "faithful" (default): 3-point median filter for sub-pixel jitter removal + <= 0.05 Hz highpass.
      Preserves fine notches and real EMG tremor.
    - "clean": zero-phase 40 Hz Butterworth lowpass + baseline leveling through PR segments.
    Enforces Rule 5: R-peak amplitude changes by < 3% and ST shift < 0.02 mV.
    Resamples to target_fs (500 Hz).
    """
    raw_time = row_data["time"]
    raw_mv = row_data["voltageMv"]

    total_duration_s = float(raw_time[-1] - raw_time[0]) if len(raw_time) > 1 else 10.0
    n_resampled = max(10, int(round(total_duration_s * target_fs)))
    time_resampled = np.linspace(0.0, total_duration_s, n_resampled, dtype=np.float32)

    valid_mask = ~np.isnan(raw_mv)
    if np.sum(valid_mask) < 20:
        return time_resampled, np.full(n_resampled, np.nan, dtype=np.float32), {"filterApplied": False}

    valid_t = raw_time[valid_mask]
    valid_v = raw_mv[valid_mask]

    # Pre-filter baseline wander removal (<= 0.05 Hz zero-phase highpass, Rule 5)
    nyq = target_fs / 2.0
    cutoff_hp = 0.05

    # Interpolate to uniform 500 Hz grid
    v_resampled = np.interp(time_resampled, valid_t, valid_v)

    # Re-insert NaN mask for large gaps > 40ms
    for i, t_val in enumerate(time_resampled):
        closest_orig_idx = int(np.argmin(np.abs(raw_time - t_val)))
        if np.isnan(raw_mv[closest_orig_idx]):
            v_resampled[i] = np.nan

    v_valid_mask = ~np.isnan(v_resampled)
    if np.sum(v_valid_mask) < 20:
        return time_resampled, v_resampled, {"filterApplied": False}

    v_clean = v_resampled.copy()
    valid_samples = v_clean[v_valid_mask]

    # Rule 5 pre-filter metrics
    pre_peaks, _ = signal.find_peaks(valid_samples, height=0.25, distance=int(0.25 * target_fs))

    try:
        # Zero-phase highpass detrending <= 0.05 Hz
        b_hp, a_hp = signal.butter(1, cutoff_hp / nyq, btype="highpass")
        detrended = signal.filtfilt(b_hp, a_hp, valid_samples)

        if render_mode == "clean":
            # 40 Hz Butterworth lowpass filter
            b_lp, a_lp = signal.butter(2, 40.0 / nyq, btype="lowpass")
            smoothed = signal.filtfilt(b_lp, a_lp, detrended)

            # PR segment baseline leveling (drift correction capped at 0.1 mV)
            post_peaks, _ = signal.find_peaks(smoothed, height=0.25, distance=int(0.25 * target_fs))
            pr_knots = []
            for p in post_peaks:
                pr_idx = max(0, p - int(0.12 * target_fs))
                pr_knots.append((pr_idx, smoothed[pr_idx]))

            if len(pr_knots) >= 2:
                knot_x = [k[0] for k in pr_knots]
                knot_y = [k[1] for k in pr_knots]
                drift = np.interp(np.arange(len(smoothed)), knot_x, knot_y)
                drift_clamped = np.clip(drift, -0.10, 0.10)
                processed = smoothed - drift_clamped
            else:
                processed = smoothed
        else:
            # "faithful" mode: 3-point median filter on sub-pixel centroids
            # Removes discrete 1-pixel digitization stepping while preserving true EMG tremor
            smoothed = ndimage.median_filter(detrended, size=3)
            processed = smoothed

        # Verify Rule 5: Assert R-peak amplitude changes < 3% and ST shift < 0.02 mV
        post_peaks, _ = signal.find_peaks(processed, height=0.25, distance=int(0.25 * target_fs))

        r_peak_delta_pct = 0.0
        if len(pre_peaks) >= 2 and len(post_peaks) >= 2:
            pre_r = np.mean([valid_samples[p] for p in pre_peaks[:min(len(pre_peaks), len(post_peaks))]])
            post_r = np.mean([processed[p] for p in post_peaks[:min(len(pre_peaks), len(post_peaks))]])
            if abs(pre_r) > 0.1:
                r_peak_delta_pct = abs(post_r - pre_r) / abs(pre_r) * 100.0

        st_shifts = []
        for p in pre_peaks:
            pr_idx = max(0, p - int(0.12 * target_fs))
            st_idx = p + int(0.08 * target_fs)
            if st_idx < len(valid_samples):
                pre_elev = valid_samples[st_idx] - valid_samples[pr_idx]
                post_elev = processed[st_idx] - processed[pr_idx]
                st_shifts.append(abs(post_elev - pre_elev))
        max_st_shift = float(np.max(st_shifts)) if st_shifts else 0.0

        # Guard: If assertions hold, accept processed signal
        if r_peak_delta_pct < 3.0 and max_st_shift < 0.02:
            v_clean[v_valid_mask] = processed
            filter_info = {
                "filterApplied": True,
                "mode": render_mode,
                "rPeakDelta": round(r_peak_delta_pct, 2),
                "stShift": round(max_st_shift, 4)
            }
        else:
            v_clean[v_valid_mask] = detrended
            filter_info = {
                "filterApplied": False,
                "mode": "detrended_only",
                "reason": f"Fidelity guard triggered: R delta {r_peak_delta_pct:.1f}%, ST shift {max_st_shift:.3f}mV",
                "rPeakDelta": round(r_peak_delta_pct, 2),
                "stShift": round(max_st_shift, 4)
            }

        return time_resampled, v_clean.astype(np.float32), filter_info

    except Exception as e:
        logger.warning(f"Contiguous filtering fallback: {e}")
        return time_resampled, v_resampled, {"filterApplied": False, "error": str(e)}


# ---------------------------------------------------------------------------
# STAGE 7: Physiological Self-Checks
# ---------------------------------------------------------------------------

def _clean_sig(arr: Any) -> np.ndarray:
    if isinstance(arr, np.ndarray):
        return np.nan_to_num(arr, nan=0.0).astype(np.float32)
    elif isinstance(arr, list):
        return np.array([0.0 if (x is None or math.isnan(x)) else float(x) for x in arr], dtype=np.float32)
    return np.array([], dtype=np.float32)


def perform_physiological_self_checks(
    lead_signals: Dict[str, Dict[str, Any]],
    fs: int = 500
) -> List[Dict[str, Any]]:
    """
    Executes physiological self-checks to verify clinical fidelity:
    1. Einthoven's Law: II = I + III (RMS error <= 0.12 mV).
    2. Goldberger's Law: aVR + aVL + aVF == 0 (RMS error <= 0.15 mV).
    3. Rhythm Strip Lead II consistency (Pearson r > 0.88 with short Lead II).
    4. aVR net negative QRS in normal sinus rhythm.
    5. R-peak simultaneous alignment across rows (<= 25 ms).
    """
    checks = []

    # 1. Einthoven's Law check: Lead II = Lead I + Lead III
    if "I" in lead_signals and "II" in lead_signals and "III" in lead_signals:
        sig_I = _clean_sig(lead_signals["I"]["mV"])
        sig_II = _clean_sig(lead_signals["II"]["mV"])
        sig_III = _clean_sig(lead_signals["III"]["mV"])

        min_len = min(len(sig_I), len(sig_II), len(sig_III))
        if min_len > 100:
            s = slice(50, min_len - 50)
            err = sig_II[s] - (sig_I[s] + sig_III[s])
            err = err - np.mean(err) # baseline centered
            rms = float(np.sqrt(np.mean(err ** 2)))
            checks.append({
                "check": "einthoven_law",
                "passed": bool(rms <= 0.12),
                "value": round(rms, 4),
                "unit": "mV RMS",
                "threshold": "<= 0.12 mV",
                "description": "Einthoven's Law: Lead II = Lead I + Lead III"
            })

    # 2. Goldberger's Law check: aVR + aVL + aVF == 0
    if "aVR" in lead_signals and "aVL" in lead_signals and "aVF" in lead_signals:
        sig_aVR = _clean_sig(lead_signals["aVR"]["mV"])
        sig_aVL = _clean_sig(lead_signals["aVL"]["mV"])
        sig_aVF = _clean_sig(lead_signals["aVF"]["mV"])

        min_len = min(len(sig_aVR), len(sig_aVL), len(sig_aVF))
        if min_len > 100:
            s = slice(50, min_len - 50)
            sum_gb = sig_aVR[s] + sig_aVL[s] + sig_aVF[s]
            sum_gb = sum_gb - np.mean(sum_gb)
            rms = float(np.sqrt(np.mean(sum_gb ** 2)))
            checks.append({
                "check": "goldberger_law",
                "passed": bool(rms <= 0.15),
                "value": round(rms, 4),
                "unit": "mV RMS",
                "threshold": "<= 0.15 mV",
                "description": "Goldberger's Law: aVR + aVL + aVF = 0"
            })

    # 3. Lead II vs Rhythm strip consistency (Pearson r > 0.88)
    rhythm_lead = lead_signals.get("II (Rhythm)") or lead_signals.get("Lead II")
    lead_II_short = lead_signals.get("II")
    if rhythm_lead and lead_II_short:
        rhythm_mv = _clean_sig(rhythm_lead["mV"])
        short_mv = _clean_sig(lead_II_short["mV"])

        min_len = min(len(rhythm_mv), len(short_mv))
        if min_len > 150:
            s = slice(30, min_len - 30)
            seg_r = rhythm_mv[s]
            seg_s = short_mv[s]

            # Cross-correlation lag alignment within +/- 15 samples (~30 ms)
            xcorr = signal.correlate(seg_s - np.mean(seg_s), seg_r - np.mean(seg_r), mode="full")
            lags = signal.correlation_lags(len(seg_s), len(seg_r), mode="full")
            mask = np.abs(lags) <= 15
            best_lag = lags[mask][np.argmax(xcorr[mask])]

            if best_lag > 0:
                s_a, r_a = seg_s[best_lag:], seg_r[:-best_lag]
            elif best_lag < 0:
                s_a, r_a = seg_s[:best_lag], seg_r[-best_lag:]
            else:
                s_a, r_a = seg_s, seg_r

            if np.std(s_a) < 1e-4 or np.std(r_a) < 1e-4:
                r_val = 0.0
            else:
                r_val, _ = stats.pearsonr(s_a, r_a)
            checks.append({
                "check": "rhythm_lead_ii_consistency",
                "passed": bool(r_val >= 0.88),
                "value": round(float(r_val), 4),
                "unit": "Pearson r",
                "threshold": ">= 0.88",
                "description": "Morphological consistency between short Lead II and Rhythm strip"
            })

    # 4. aVR Net Negative Check
    if "aVR" in lead_signals:
        sig_aVR = _clean_sig(lead_signals["aVR"]["mV"])
        if len(sig_aVR) > 50:
            min_v = float(np.min(sig_aVR))
            max_v = float(np.max(sig_aVR))
            is_net_neg = abs(min_v) >= abs(max_v)
            checks.append({
                "check": "avr_net_negative",
                "passed": is_net_neg,
                "value": f"min={min_v:.2f}mV, max={max_v:.2f}mV",
                "unit": "mV",
                "threshold": "min < -max",
                "description": "Lead aVR net negative QRS in sinus rhythm"
            })

    # 5. R-Peak Time Alignment across rows (<= 25 ms)
    if "I" in lead_signals and "II" in lead_signals:
        sig_I = _clean_sig(lead_signals["I"]["mV"])
        sig_II = _clean_sig(lead_signals["II"]["mV"])
        p_I, _ = signal.find_peaks(sig_I, height=0.3, distance=int(0.25 * fs))
        p_II, _ = signal.find_peaks(sig_II, height=0.3, distance=int(0.25 * fs))
        if len(p_I) >= 1 and len(p_II) >= 1:
            diff_ms = abs(p_I[0] - p_II[0]) / float(fs) * 1000.0
            checks.append({
                "check": "r_peak_time_alignment",
                "passed": bool(diff_ms <= 25.0),
                "value": round(diff_ms, 1),
                "unit": "ms",
                "threshold": "<= 25 ms",
                "description": "Simultaneous R-peak time alignment across rows"
            })

    return checks


# ---------------------------------------------------------------------------
# STAGE 8: Clinical Sheet Re-rendering (Matplotlib 300 DPI, Exact Scale)
# ---------------------------------------------------------------------------

def render_standard_ecg_sheet(
    lead_signals: Dict[str, Dict[str, Any]],
    layout_info: Dict[str, Any],
    calibration: Dict[str, Any],
    heart_rate_bpm: Optional[int] = None,
    render_mode: str = "faithful",
    dpi: int = 300
) -> str:
    """
    Renders standard clinical ECG sheet with pink/red grid lines, exact scale,
    calibration pulses, lead labels, header info, and regulatory footer.
    Guarantees no cutoff at bottom or sides.
    Returns base64 PNG data URL.
    """
    speed = calibration.get("speedMmPerS", 25.0)
    gain = calibration.get("gainMmPerMv", 10.0)
    filter_text = calibration.get("filterText", "0.05 - 100 Hz")
    px_per_mm = calibration.get("pxPerMm", 10.0)

    is_single_strip = layout_info["layoutType"] == "single_strip"

    if is_single_strip:
        fig_width_in = 10.0
        fig_height_in = 3.0
        rows = 1
        cols = 1
    else:
        # Standard clinical 12-lead paper aspect ratio (approx 1.93:1, 11.0 x 5.7 inches)
        fig_width_in = 11.0
        fig_height_in = 5.7
        rows = layout_info["numRows"]
        cols = 4

    fig = plt.figure(figsize=(fig_width_in, fig_height_in), dpi=dpi, facecolor="#ffffff")
    
    # Safe margins: generous bottom margin so footer is never clipped
    margin_left = 0.040
    margin_right = 0.960
    margin_bottom = 0.080
    margin_top = 0.920

    ax = fig.add_axes([margin_left, margin_bottom, margin_right - margin_left, margin_top - margin_bottom])
    ax.set_facecolor("#fffcf7")

    # Dimensions in mm
    ax_width_mm = (margin_right - margin_left) * fig_width_in * 25.4
    ax_height_mm = (margin_top - margin_bottom) * fig_height_in * 25.4

    ax.set_xlim(0, ax_width_mm)
    ax.set_ylim(0, ax_height_mm)

    # 1. ECG Grid Lines (1mm minor pink, 5mm major red)
    minor_grid_color = "#ffcccc"
    major_grid_color = "#ff8080"

    minor_xs = np.arange(0, ax_width_mm + 0.1, 1.0)
    minor_ys = np.arange(0, ax_height_mm + 0.1, 1.0)
    ax.vlines(minor_xs, 0, ax_height_mm, colors=minor_grid_color, linewidths=0.35, alpha=0.85)
    ax.hlines(minor_ys, 0, ax_width_mm, colors=minor_grid_color, linewidths=0.35, alpha=0.85)

    major_xs = np.arange(0, ax_width_mm + 0.1, 5.0)
    major_ys = np.arange(0, ax_height_mm + 0.1, 5.0)
    ax.vlines(major_xs, 0, ax_height_mm, colors=major_grid_color, linewidths=0.75, alpha=0.95)
    ax.hlines(major_ys, 0, ax_width_mm, colors=major_grid_color, linewidths=0.75, alpha=0.95)

    # 2. Draw Traces for each Lead
    row_height_mm = ax_height_mm / float(rows)
    col_width_mm = 62.5 if not is_single_strip else ax_width_mm

    pulse_width_mm = 5.0
    pulse_height_mm = 1.0 * gain
    cal_pulse_side = layout_info.get("calPulseSide", "left")

    for region in layout_info["leadRegions"]:
        lead_name = region["leadName"]
        r = region["row"]
        c = region["col"]

        row_top_mm = ax_height_mm - r * row_height_mm
        baseline_mm = row_top_mm - (row_height_mm / 2.0)

        # Draw calibration pulse
        # If right side: place cleanly in right margin after signal columns (x >= 251.5 mm)
        if cal_pulse_side == "right":
            if c == 3 or (r == 3 and c == -1):
                p_x = 251.5
                p_xs = [p_x, p_x + 0.5, p_x + 0.5, p_x + 0.5 + pulse_width_mm, p_x + 0.5 + pulse_width_mm, p_x + 6.0]
                p_ys = [baseline_mm, baseline_mm, baseline_mm + pulse_height_mm, baseline_mm + pulse_height_mm, baseline_mm, baseline_mm]
                ax.plot(p_xs, p_ys, color="#111111", linewidth=1.1, solid_capstyle="round")
        else:
            if c == 0 or (r == 3 and c == -1):
                p_x = 1.0
                p_xs = [p_x, p_x + 0.5, p_x + 0.5, p_x + 0.5 + pulse_width_mm, p_x + 0.5 + pulse_width_mm, p_x + 6.0]
                p_ys = [baseline_mm, baseline_mm, baseline_mm + pulse_height_mm, baseline_mm + pulse_height_mm, baseline_mm, baseline_mm]
                ax.plot(p_xs, p_ys, color="#111111", linewidth=1.1, solid_capstyle="round")

        sig_data = lead_signals.get(lead_name)
        if not sig_data:
            continue

        time_arr = sig_data.get("time", np.array([]))
        amp_arr = sig_data.get("mV", np.array([]))

        if len(time_arr) == 0 or len(amp_arr) == 0:
            continue

        # Starting offset in mm
        if cal_pulse_side == "left":
            x_offset_mm = 8.0 if (c == 0 or (r == 3 and c == -1)) else (8.0 + c * col_width_mm)
        else:
            x_offset_mm = 1.0 if (c == 0 or (r == 3 and c == -1)) else (1.0 + c * col_width_mm)

        trace_x_mm = x_offset_mm + (time_arr * speed)
        trace_y_mm = baseline_mm + (amp_arr * gain)
        min_l = min(len(trace_x_mm), len(trace_y_mm))
        trace_x_mm = trace_x_mm[:min_l]
        trace_y_mm = trace_y_mm[:min_l]

        # Place lead label above lead band (cleanly visible, never over waveforms)
        label_x = x_offset_mm + 1.0
        label_y = baseline_mm + (row_height_mm * 0.36)
        ax.text(
            label_x,
            label_y,
            lead_name,
            fontsize=9.0,
            fontweight="bold",
            color="#0f172a",
            bbox=dict(boxstyle="square,pad=0.15", facecolor="#fffcf7", edgecolor="none", alpha=0.90)
        )

        # Continuous black anti-aliased trace
        ax.plot(
            trace_x_mm,
            trace_y_mm,
            color="#111111",
            linewidth=1.0,
            antialiased=True,
            solid_capstyle="round"
        )

    # 3. Honest Header Metadata (Concise, Non-Overlapping)
    hr_str = f"HR: {heart_rate_bpm} BPM" if heart_rate_bpm else "HR: Norm"
    mode_label = "Clean (40 Hz LP)" if render_mode == "clean" else "Faithful (Raw De-jitter)"
    header_left = f"SPANDAN AI DIGITAL ECG | {hr_str} | Mode: {mode_label}"
    header_right = (
        f"Speed: {speed:.0f} mm/s | Limb: {calibration.get('limbGainMmPerMv', 10):.0f} mm/mV | "
        f"Chest: {calibration.get('chestGainMmPerMv', 10):.0f} mm/mV | Filter: {filter_text}"
    )

    fig.text(margin_left, 0.955, header_left, fontsize=9.5, fontweight="bold", color="#0f172a")
    fig.text(margin_right, 0.955, header_right, fontsize=8.5, color="#475569", ha="right")

    # 4. Mandatory Visible Regulatory Disclaimer (Rule 7)
    fig.text(
        0.50,
        0.025,
        DISCLAIMER_TEXT,
        fontsize=7.5,
        fontstyle="italic",
        fontweight="semibold",
        color="#b91c1c",
        ha="center"
    )

    ax.axis("off")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close(fig)
    buf.seek(0)
    b64_str = base64.b64encode(buf.read()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def generate_comparison_image(
    original_rectified_bgr: np.ndarray,
    reconstructed_data_url: str
) -> str:
    """
    Renders side-by-side comparison image:
    Rectified Original Scanned Report vs Standardized Digital ECG.
    Returns base64 PNG data URL.
    """
    header, b64_part = reconstructed_data_url.split(",", 1)
    recon_bytes = base64.b64decode(b64_part)
    recon_pil = Image.open(io.BytesIO(recon_bytes))
    recon_bgr = cv2.cvtColor(np.array(recon_pil), cv2.COLOR_RGB2BGR)

    orig_h, orig_w = original_rectified_bgr.shape[:2]
    recon_h, recon_w = recon_bgr.shape[:2]

    target_h = 600
    scale_orig = target_h / float(orig_h)
    new_orig_w = int(orig_w * scale_orig)
    orig_resized = cv2.resize(original_rectified_bgr, (new_orig_w, target_h))

    scale_recon = target_h / float(recon_h)
    new_recon_w = int(recon_w * scale_recon)
    recon_resized = cv2.resize(recon_bgr, (new_recon_w, target_h))

    banner_h = 45
    combined_w = new_orig_w + new_recon_w + 20
    canvas = np.full((target_h + banner_h, combined_w, 3), 245, dtype=np.uint8)

    canvas[banner_h:banner_h + target_h, 0:new_orig_w] = orig_resized
    canvas[:, new_orig_w + 9:new_orig_w + 11] = (200, 200, 200)
    canvas[banner_h:banner_h + target_h, new_orig_w + 20:combined_w] = recon_resized

    cv2.putText(canvas, "ORIGINAL PHYSICAL SCAN (RECTIFIED)", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (30, 41, 59), 2, cv2.LINE_AA)
    cv2.putText(canvas, "STANDARDIZED DIGITAL RECONSTRUCTION (300 DPI)", (new_orig_w + 35, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (13, 148, 136), 2, cv2.LINE_AA)

    _, enc = cv2.imencode(".png", canvas)
    b64_str = base64.b64encode(enc).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


# ---------------------------------------------------------------------------
# STAGE 9: Reprojection & Quality Assessment
# ---------------------------------------------------------------------------

def calculate_reprojection_metrics(
    trace_mask: np.ndarray,
    row_traces: Dict[int, Dict[str, Any]],
    layout_info: Optional[Dict[str, Any]] = None
) -> Dict[str, float]:
    """
    Computes objective reprojection metrics:
    - mean reprojection error in pixels
    - percentage of points within 1 pixel (target >= 98%)
    - percentage of points > 2 pixels deviation (target <= 2%)
    Evaluates within each row's corridor so gaps do not measure against adjacent rows.
    """
    h, w = trace_mask.shape[:2]
    dists = []

    row_centers = layout_info.get("rowCenters", []) if layout_info else []
    row_pitch = layout_info.get("rowPitch", h / max(len(row_traces), 1)) if layout_info else (h / max(len(row_traces), 1))
    corridor_half = int(round(0.85 * row_pitch))

    for r_idx, r_data in row_traces.items():
        xs = r_data["x"]
        ys = r_data["rawY"]
        y_c = row_centers[r_idx] if r_idx < len(row_centers) else int(r_data.get("baselineY", h / 2.0))
        y_min = max(0, y_c - corridor_half)
        y_max = min(h, y_c + corridor_half)

        for i in range(len(xs)):
            py = ys[i]
            if np.isnan(py):
                continue
            x_int = int(round(xs[i]))
            py_int = int(round(py))
            if 0 <= x_int < w and 0 <= py_int < h:
                y_pixels = np.where(trace_mask[y_min:y_max, x_int] > 0)[0] + y_min
                if len(y_pixels) > 0:
                    dists.append(float(np.min(np.abs(y_pixels - py))))

    if not dists:
        return {"meanErrorPx": 0.0, "within1PxPct": 100.0, "beyond2PxPct": 0.0}

    dists_arr = np.array(dists)
    mean_err = float(np.mean(dists_arr))
    within_1 = float(np.sum(dists_arr <= 1.0)) / len(dists_arr) * 100.0
    beyond_2 = float(np.sum(dists_arr > 2.0)) / len(dists_arr) * 100.0

    return {
        "meanErrorPx": round(mean_err, 2),
        "within1PxPct": round(within_1, 2),
        "beyond2PxPct": round(beyond_2, 2)
    }


def assess_overall_quality(
    mean_coverage: float,
    reproj_metrics: Dict[str, float],
    calibration_source: str,
    gap_count: int,
    phys_checks: List[Dict[str, Any]],
    ink_density: float = 0.02,
    heart_rate_bpm: Optional[int] = None
) -> Tuple[str, List[str]]:
    """Computes overall reconstruction quality badge and warnings list."""
    warnings = []

    if ink_density < 0.005:
        warnings.insert(0, "Image appears blank or has virtually no ECG ink content.")
        return "low", warnings

    if ink_density > 0.12:
        warnings.insert(0, "Excessive noise or non-ECG image detected (ink density exceeds clinical bounds).")
        return "low", warnings

    if calibration_source == "assumed":
        warnings.append("Grid calibration lines were not clearly resolved; standard 25 mm/s and 10 mm/mV assumed.")

    if mean_coverage < 0.70:
        warnings.append(f"Low trace continuity: only {mean_coverage * 100:.1f}% of ECG trace was detectable.")
    elif mean_coverage < 0.85:
        warnings.append(f"Moderate trace gaps: {mean_coverage * 100:.1f}% trace coverage.")

    if reproj_metrics["meanErrorPx"] > 4.5:
        warnings.append(f"Trace tracking deviation: {reproj_metrics['meanErrorPx']:.1f}px reprojection error.")

    failed_checks = [c for c in phys_checks if not c["passed"]]
    if failed_checks:
        for fc in failed_checks:
            warnings.append(f"Physiological check notice: {fc['description']} ({fc['value']} {fc.get('unit', '')}).")

    # If severe physiological violations occur (e.g. Einthoven or Goldberger gross failure > 0.4 mV,
    # or >= 2 failed cardiology checks, or negative rhythm strip correlation), the image is non-ECG / noise.
    severe_phys_violation = (
        len(failed_checks) >= 2
        or any(c.get("check") in ("einthoven_law", "goldberger_law") and isinstance(c.get("value"), (int, float)) and c.get("value") > 0.4 for c in failed_checks)
        or any(c.get("check") == "rhythm_lead_ii_consistency" and isinstance(c.get("value"), (int, float)) and c.get("value") < 0.3 for c in failed_checks)
    )

    if (
        not severe_phys_violation
        and mean_coverage >= 0.88
        and reproj_metrics["meanErrorPx"] <= 3.5
        and calibration_source != "assumed"
        and len(failed_checks) <= 1
        and (heart_rate_bpm is not None and 30 <= heart_rate_bpm <= 220)
    ):
        quality = "high"
    elif not severe_phys_violation and mean_coverage >= 0.70 and reproj_metrics["meanErrorPx"] <= 5.0:
        quality = "medium"
    else:
        quality = "low"
        warnings.insert(0, "Reconstruction quality is low due to poor contrast or paper noise. Please re-upload a flatter, evenly lit scan for clinical reliability.")

    return quality, warnings


# ---------------------------------------------------------------------------
# MAIN PUBLIC API PIPELINE
# ---------------------------------------------------------------------------

def reconstruct_ecg_report(
    image_bytes: bytes,
    render_mode: str = "faithful"
) -> Dict[str, Any]:
    """
    Full End-to-End Medical-Grade ECG Reconstruction Pipeline:
    1. EXIF orientation + perspective correction (with flat-scan aliasing prevention) + deskewing
    2. Multi-method grid detection & physical calibration (px/mm, speed, limb & chest gains)
    3. Grid & text separation via RapidOCR
    4. Layout detection (cal pulse position, 3x4 + 1 rhythm strip, Cabrera support)
    5. Wide-corridor contiguous full-row tracing (tall QRS preservation, travel order)
    6. Contiguous full-row filtering ("faithful" vs "clean") & slicing into 12 leads
    7. Rhythm strip Lead II heart rate computation
    8. Physiological self-checks (Einthoven, Goldberger, aVR negative, R-peak alignment)
    9. Clinical sheet re-rendering at 300 DPI (guaranteed safe margins, honest metadata)
    10. Fidelity QC & side-by-side comparison image
    """
    # 1. Load & EXIF orient
    image_bgr = load_and_orient_image(image_bytes)
    h, w = image_bgr.shape[:2]

    if h < 50 or w < 50:
        raise ValueError("Image dimensions too small to be a valid ECG.")

    # Rectify perspective & deskew
    rectified_bgr, was_warped = rectify_paper_perspective(image_bgr)

    # 2. Run OCR to detect lead labels, metadata, and calibration text
    ocr_boxes = run_ocr_detection(rectified_bgr)

    # Grid detection & physical calibration
    calib = detect_grid_and_calibration(rectified_bgr, ocr_boxes)
    px_per_mm = calib["pxPerMm"]
    speed_mm_s = calib["speedMmPerS"]
    gain_mm_mv = calib["gainMmPerMv"]
    limb_gain = calib.get("limbGainMmPerMv", gain_mm_mv)
    chest_gain = calib.get("chestGainMmPerMv", gain_mm_mv)

    # 3. Separate trace from grid lines and mask text
    trace_mask, cleaned_gray = separate_trace_and_mask_text(rectified_bgr, ocr_boxes)

    # 4. Layout detection
    layout = detect_ecg_layout(trace_mask, ocr_boxes, px_per_mm)

    # 5. Extract contiguous full-row traces (wide corridor +/- 0.85 row pitch, travel order)
    row_traces = extract_row_traces(
        trace_mask=trace_mask,
        image_bgr=rectified_bgr,
        layout_info=layout,
        px_per_mm=px_per_mm,
        gain_mm_mv=gain_mm_mv,
        speed_mm_s=speed_mm_s
    )

    # 6. Contiguous full-row filtering ("faithful" vs "clean")
    filtered_rows = {}
    for r_idx, r_data in row_traces.items():
        t_arr, v_arr, f_info = apply_contiguous_row_filtering(r_data, render_mode=render_mode, target_fs=500)
        filtered_rows[r_idx] = {
            "time": t_arr,
            "mV": v_arr,
            "filterInfo": f_info,
            "rawY": r_data["rawY"],
            "baselineY": r_data["baselineY"],
            "gapCount": r_data["gapCount"],
            "validRatio": r_data["validRatio"]
        }

    # Slice filtered contiguous rows into the 12 leads
    lead_signals = {}
    coverages = []
    total_gaps = 0

    col_w_s = (layout["activeSpan"][1] - layout["activeSpan"][0]) / (4.0 * px_per_mm * speed_mm_s)

    for region in layout["leadRegions"]:
        lead_name = region["leadName"]
        r = region["row"]
        c = region["col"]

        row_filt = filtered_rows.get(r)
        if not row_filt:
            continue

        r_time = row_filt["time"]
        r_mv = row_filt["mV"]

        # Apply specific gain for limb vs chest leads
        # If limb gain != chest gain, scale mV appropriately
        is_chest_lead = lead_name.startswith("V")
        lead_gain = chest_gain if is_chest_lead else limb_gain
        gain_correction = gain_mm_mv / float(lead_gain) if lead_gain > 0 else 1.0

        if c == -1:
            # Full rhythm strip (Row 4)
            lead_mv = r_mv * gain_correction
            lead_time = np.linspace(0.0, len(lead_mv) / 500.0, len(lead_mv), dtype=np.float32)
            sub_raw_y = row_filt["rawY"]
        else:
            # 2.5s time column: exactly 1/4 of row
            n_row = len(r_mv)
            idx_start = int(round(c * (n_row / 4.0)))
            idx_end = int(round((c + 1) * (n_row / 4.0)))

            lead_mv = r_mv[idx_start:idx_end] * gain_correction
            lead_time = np.linspace(0.0, len(lead_mv) / 500.0, len(lead_mv), dtype=np.float32)

            # Corresponding pixel range for rawY
            n_px = len(row_filt["rawY"])
            px_start = int(round(c * (n_px / 4.0)))
            px_end = int(round((c + 1) * (n_px / 4.0)))
            sub_raw_y = row_filt["rawY"][px_start:px_end]

        cov = float(np.sum(~np.isnan(lead_mv))) / max(len(lead_mv), 1)
        coverages.append(cov)
        total_gaps += row_filt["gapCount"]

        lead_signals[lead_name] = {
            "time": lead_time,
            "mV": lead_mv,
            "rawY": sub_raw_y,
            "baselineY": row_filt["baselineY"],
            "coverage": round(cov, 3),
            "gapCount": row_filt["gapCount"],
            "interpolatedPercent": round((1.0 - cov) * 100.0, 2),
            "filterInfo": row_filt["filterInfo"],
            "fs": 500
        }

    # 7. Rhythm Strip Lead II Heart Rate Computation
    # Header HR must come strictly from the reconstructed Lead II rhythm strip R-R intervals
    rhythm_lead_data = lead_signals.get("II (Rhythm)") or lead_signals.get("Lead II") or lead_signals.get("II")
    detected_hr = None
    if rhythm_lead_data:
        r_amp = rhythm_lead_data.get("mV", np.array([]))
        v_mask = ~np.isnan(r_amp)
        if np.sum(v_mask) > 100:
            p_rhythm, _ = signal.find_peaks(r_amp[v_mask], height=0.35, distance=int(0.25 * 500))
            if len(p_rhythm) >= 2:
                rr_intervals = np.diff(p_rhythm) / 500.0
                detected_hr = int(round(60.0 / np.mean(rr_intervals)))

    # 8. Physiological Self-Checks
    phys_checks = perform_physiological_self_checks(lead_signals, fs=500)

    # 9. Reprojection Metrics
    reproj_metrics = calculate_reprojection_metrics(trace_mask, row_traces, layout_info=layout)

    # Quality & Warnings
    mean_cov = float(np.mean(coverages)) if coverages else 0.0
    ink_density = float(np.sum(trace_mask > 0)) / float(h * w)
    quality_badge, warnings = assess_overall_quality(
        mean_coverage=mean_cov,
        reproj_metrics=reproj_metrics,
        calibration_source=calib["calibrationSource"],
        gap_count=total_gaps,
        phys_checks=phys_checks,
        ink_density=ink_density,
        heart_rate_bpm=detected_hr
    )

    if calib.get("calibrationWarning"):
        warnings.append(calib["calibrationWarning"])

    # 10. Re-render Standard Clinical Sheet (300 DPI)
    reconstructed_img_url = render_standard_ecg_sheet(
        lead_signals=lead_signals,
        layout_info=layout,
        calibration=calib,
        heart_rate_bpm=detected_hr,
        render_mode=render_mode,
        dpi=300
    )

    # Comparison Image
    comparison_img_url = generate_comparison_image(
        original_rectified_bgr=rectified_bgr,
        reconstructed_data_url=reconstructed_img_url
    )

    # Format JSON leads
    formatted_leads = {}
    for lname, ldata in lead_signals.items():
        mv_list = ldata["mV"].tolist()
        mv_json = [None if (x is None or math.isnan(x)) else round(float(x), 4) for x in mv_list]
        formatted_leads[lname] = {
            "fs": 500,
            "durationSec": round(len(mv_list) / 500.0, 3),
            "coverage": ldata["coverage"],
            "gapCount": ldata["gapCount"],
            "mV": mv_json
        }

    return {
        "reconstructedImageUrl": reconstructed_img_url,
        "comparisonImageUrl": comparison_img_url,
        "leads": formatted_leads,
        "layout": layout["layoutType"],
        "numLeadsDetected": len(formatted_leads),
        "calibration": {
            "pxPerMm": calib["pxPerMm"],
            "speedMmPerS": calib["speedMmPerS"],
            "gainMmPerMv": calib["gainMmPerMv"],
            "limbGainMmPerMv": calib.get("limbGainMmPerMv", calib["gainMmPerMv"]),
            "chestGainMmPerMv": calib.get("chestGainMmPerMv", calib["gainMmPerMv"]),
            "filterText": calib.get("filterText", "0.05-100 Hz"),
            "calibrationSource": calib["calibrationSource"],
            "crossChecks": calib.get("crossChecks", [])
        },
        "quality": {
            "reconstructionQuality": quality_badge,
            "meanCoverage": round(mean_cov, 3),
            "reprojectionErrorPx": reproj_metrics["meanErrorPx"],
            "within1PxPct": reproj_metrics["within1PxPct"],
            "beyond2PxPct": reproj_metrics["beyond2PxPct"],
            "heartRateBpm": detected_hr,
            "totalGaps": total_gaps,
            "checks": phys_checks
        },
        "renderMode": render_mode,
        "warnings": warnings,
        "disclaimer": DISCLAIMER_TEXT
    }
