# Spandan AI: Standardized Digital ECG Report Reconstruction

## 1. Overview & Purpose
Electrocardiograms (ECGs) recorded in outpatient clinics, rural health centers, and emergency triage are frequently printed onto thermo-sensitive pink grid paper. In physical form, these recordings suffer from:
- **Baseline wander & tilt** caused by phone cameras held at uneven angles.
- **Shadows, glare, and low contrast** from inconsistent room lighting.
- **Physical degradation** (creases, stains, thermal fading over time).

The **ECG Report Reconstruction** feature in Spandan AI converts physical 12-lead ECG report photos or scans into a clean, standardized, 300 DPI digital ECG report sheet that is medically faithful to the original recording.

---

## 2. Non-Negotiable Medical Correctness Rules
Reconstructing physiological electrical signals from scanned paper images carries significant clinical responsibility. This system strictly enforces the following rules:

1. **Deterministic Signal Extraction (No Generative AI):**
   Generative AI, diffusion models, GANs, and super-resolution models are strictly prohibited from generating, repairing, or predicting waveform curves. The visual waveforms are rendered strictly from numerical time-series signals extracted directly from trace pixel coordinates. RapidOCR is used solely to locate lead labels and calibration text.

2. **Zero Signal Fabrication:**
   If a trace segment cannot be located (e.g. obscured by glare, smudge, or tear), the reconstructor leaves a visible gap (`NaN`). Interpolation is strictly confined to short gaps $\le 40\text{ ms}$ ($\approx 1\text{ mm}$ at $25\text{ mm/s}$). Under no circumstances are synthetic sine waves or heuristic waveforms inserted.

3. **Absolute Amplitude & Timing Preservation:**
   Signals are never normalized to $\text{max} = 1.0$. True voltage (in millivolts, $\text{mV}$) and time (in seconds, $\text{s}$) are established using physical grid calibration ($1\text{ mm}$ minor box, $5\text{ mm}$ major box). If grid detection fails due to severe image blur or photocopy fading, standard clinical defaults ($25\text{ mm/s}$ and $10\text{ mm/mV}$) are applied and explicitly flagged with `calibrationSource: "assumed"` in the API response, user interface, and PDF export.

4. **Steep QRS Complex & R/S Peak Preservation:**
   Steep ventricular depolarizations span a continuous vertical ink column in 1–2 horizontal pixels. Simple median-y or threshold tracking severely truncates R-peak and S-wave amplitudes. The reconstructor evaluates the full vertical extent of connected ink in each column to preserve physiological amplitude.

5. **Conservative Diagnostic Filtering:**
   Signal processing adheres to diagnostic standards (IEC 60601-2-51):
   - **Baseline Wander Removal:** Zero-phase forward-backward high-pass filter with cutoff $\le 0.05\text{ Hz}$ (using $0.5\text{ Hz}$ high-pass filters would severely distort ST-segment elevation/depression).
   - **High-Frequency Denoising:** Conservative zero-phase low-pass filtering at $100\text{ Hz}$ to remove sensor quantization jitter without attenuating pacemaker spikes or QRS notches.
   - **Fidelity Assertion Guards:** After filtering, the pipeline asserts that R-peak amplitudes shift by $< 3\%$ and ST-segment levels shift by $< 0.02\text{ mV}$.

6. **Rhythm, Interval, and Morphology Invariance:**
   Beats, P-waves, QRS complexes, and T-waves are never added, relabeled, or omitted. Heart rate, R-R intervals, PR intervals, and QT intervals remain identical to the patient's recorded trace. Header heart rate is derived strictly from the reconstructed Lead II rhythm strip R-R intervals.

7. **Mandatory Regulatory Disclaimer:**
   Every reconstructed image, comparison graphic, user interface viewer, and exported PDF contains the visible medical notice:
   > *"Digitally reconstructed from a scanned image. Not the original recording. For reference only, not for diagnosis."*

---

## 3. Hardened Pipeline Architecture

```
Physical Scan / Photo
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 1: Ingestion & Geometric Rect.   │
│ EXIF orientation, flat-scan protection │
│ (deskew-only if area >= 75%), lighting │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 2: Multi-Method Calibration      │
│ Continuous autocorrelation (1mm & 5mm),│
│ active 10s span check, cal-pulse check │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 3: Trace Isolation & Masking     │
│ HSV saturation/hue grid suppression,   │
│ dark ink protection, RapidOCR masking  │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 4: Layout & Cal-Pulse Detection  │
│ Row-level right/left cal-pulse search, │
│ active trace span fitting, lead order  │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 5: Wide-Corridor DP Tracking     │
│ Corridors +/- 0.85 row pitch,          │
│ vertical extremum preservation, 1D-x   │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 6: Contiguous Row Filtering      │
│ "Faithful" (median-of-3) vs "Clean"    │
│ (40Hz LP + PR baseline knots), split   │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 7: Cardiology Self-Checks        │
│ Einthoven, Goldberger, Rhythm strip r, │
│ aVR net negativity, R-peak alignment   │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 8: Standard Sheet Re-rendering   │
│ 300 DPI Matplotlib canvas, pink grid,  │
│ exact 1mm/5mm scale, lead labels, HR   │
└────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│ Stage 9: Fidelity QC & Reprojection    │
│ Sub-pixel reprojection within corridor,│
│ overall quality categorization         │
└────────────────────────────────────────┘
```

### Stage 1: Ingestion & Geometric Rectification
- Handles EXIF orientation tags from smartphone cameras.
- **Flat-Scan Protection:** Computes paper quadrilateral. If the detected quadrilateral encompasses $\ge 75\%$ of the image area with corners within $15\%$ of image bounds, the image is recognized as an un-tilted flat scan. It bypasses `cv2.warpPerspective` and applies only small-angle deskew rotation ($< 0.1^\circ$), preventing grid shear, Moiré aliasing, and spatial distortion.
- Normalizes uneven lighting gradients across the paper sheet using bilateral filtering and local contrast equalization.

### Stage 2: Multi-Method Calibration Consensus
Physical ECG paper has $1\text{ mm}$ minor squares and $5\text{ mm}$ major squares. The system evaluates 4 independent measurement vectors:
1. **Minor Grid Periodicity ($1\text{ mm}$):** Continuous 1D spatial autocorrelation across pink grid color channels with parabolic peak interpolation.
2. **Major Grid Periodicity ($5\text{ mm}$):** Autocorrelation lag divided by 5.
3. **Active 10-Second Span Check:** Evaluates the active horizontal trace column width divided by $250\text{ mm}$ ($10\text{ s} \times 25\text{ mm/s}$).
4. **Calibration Pulse Geometry:** Measures width ($5\text{ mm} = 0.2\text{ s}$) and height ($10\text{ mm} = 1.0\text{ mV}$) of detected calibration pulses.

The consensus calibration resolves `px_per_mm` (e.g. $5.76\text{ px/mm}$ on reference scans). If discrepancies exceed $3\%$, the consensus weighted median is adopted and a warning is logged. OCR text is also extracted to read specific limb and chest gain settings (e.g. `"Limb 10 mm/mV, Chest 10 mm/mV"`) and filter bandwidth (e.g. `"0.15-150 Hz"`).

### Stage 3: Trace Isolation & OCR Masking
- Isolates dark trace ink from pink/red grid lines via HSV saturation and hue filtering.
- **Dark Ink Protection:** Pixels with normalized gray $< 135$ are strictly protected from suppression, ensuring faint red tints on dark QRS strokes are never erased.
- Runs RapidOCR across the image to locate printed headers, patient identification, and lead labels.
- Masks out detected OCR text boxes with a 2-pixel margin so letters and numbers are not erroneously tracked as electrical waveforms.

### Stage 4: Layout Detection & Calibration Pulse Localization
- Scans left and right margins across individual rows to locate calibration pulses. Clinical machines frequently position calibration pulses at the far right end of each row or the far left end. Row-level stroke density checks correctly classify left vs. right pulse sheets.
- Establishes the active 10-second trace span ($x_{\text{start}}$ to $x_{\text{end}}$) excluding calibration pulses and margin borders.
- Segments the sheet into 4 rows and 4 time columns ($2.5\text{ s}$ each for columns 0–3; full $10\text{ s}$ rhythm strip for row 4).
- Maps to standard Cabrera or standard 12-lead layout:
  - **Row 1:** I, aVR, V1, V4
  - **Row 2:** II, aVL, V2, V5
  - **Row 3:** III, aVF, V3, V6
  - **Row 4:** Rhythm Lead II ($10\text{ s}$)

### Stage 5: Wide-Corridor Dynamic Programming Trace Tracking
- Tall R-waves (e.g. V4–V6 up to $+2.74\text{ mV}$) and deep S-waves (e.g. V1–V2 down to $-2.08\text{ mV}$) cross into adjacent row spaces.
- Tracing operates in a wide vertical corridor of $\pm 0.85 \times \text{row\_pitch}$ around each row center.
- Uses continuity-cost dynamic programming with quadratic vertical penalties.
- Preserves 1-to-1 temporal column mapping ($1$ sample per $x$ column) while choosing the extreme deflection for steep vertical strokes ($\ge 4\text{ px}$), ensuring R and S wave peaks are never clipped or median-smoothed.

### Stage 6: Contiguous Row Filtering
- Filtering is applied to the contiguous 10-second row before splitting into columns, eliminating boundary filter transients.
- **Render Modes:**
  - **"Faithful" (Default):** Median-of-3 pixel jitter filter with zero-phase baseline leveling, preserving true physiological EMG tremor and notch morphology.
  - **"Clean" (Monitor-Style):** Zero-phase 40 Hz low-pass filter with baseline drift compensation via isoelectric PR-segment knots (capped at $0.1\text{ mV}$).
- After row filtering, signals are sliced into their respective $2.5\text{ s}$ columns and calibrated using the lead-specific limb or chest gains.

### Stage 7: Cardiology Self-Checks
The reconstructor runs 5 automated clinical verification checks on every 12-lead sheet:
1. **Einthoven's Law:** $\text{RMS}(II - (I + III)) \le 0.12\text{ mV}$
2. **Goldberger's Law:** $\text{RMS}(aVR + aVL + aVF) \le 0.15\text{ mV}$
3. **Rhythm Strip Lead II Consistency:** Pearson correlation $r \ge 0.88$ between short column Lead II and row 4 rhythm strip.
4. **Lead aVR Net-Negativity:** In sinus rhythm, aVR is predominantly negative ($\min < -\max$).
5. **Cross-Row R-Peak Time Alignment:** Simultaneous R-peak time difference across rows $\le 25\text{ ms}$.

### Stage 8: Standard Clinical Sheet Re-rendering
- Uses Matplotlib to render a publication-grade $300\text{ DPI}$ digital ECG sheet.
- Exact scale:
  - $1\text{ mm}$ minor grid squares (light pink `#FFCCCC`).
  - $5\text{ mm}$ major grid squares (darker pink `#FF8080`).
- Features:
  - Black anti-aliased waveform lines ($1.0\text{ pt}$ stroke width).
  - $1.0\text{ mV}$ standard calibration pulse at the start of each row.
  - Standard lead labels and header metrics ($25\text{ mm/s}$, $10\text{ mm/mV}$, limb/chest gains, filter text, and Lead II derived Heart Rate).
  - Mandatory regulatory disclaimer in the sheet footer.
- Generates side-by-side comparison images with the rectified original scan aligned with the reconstruction.

### Stage 9: Reprojection & Quality Categorization
- Evaluates reprojection accuracy within each row corridor $\pm 0.85 \times \text{row\_pitch}$, guaranteeing mean error $\le 0.5\text{ px}$ and $\ge 98\%$ of points within $1\text{ px}$.
- Composite quality categorization:
  - `high`: Coverage $\ge 88\%$, reprojection error $\le 3.5\text{ px}$, valid calibration detected, heart rate in $[30, 220]$, and $\le 1$ failed cardiology check.
  - `medium`: Coverage $\ge 70\%$, reprojection error $\le 5.0\text{ px}$, and no severe physiological check violations.
  - `low`: Blank paper, severe noise, or multiple physiological check failures.

---

## 4. API Endpoints

### 1. `POST /api/ecg/reconstruct`
Standalone reconstruction endpoint.
- **Query Parameter:** `render_mode: str = "faithful"` (options: `"faithful"`, `"clean"`)
- **Request:** `multipart/form-data` with `file: UploadFile`.
- **Response:**
  ```json
  {
    "reconstructedImageUrl": "data:image/png;base64,...",
    "comparisonImageUrl": "data:image/png;base64,...",
    "leads": {
      "I": { "fs": 500, "durationSec": 2.5, "coverage": 1.0, "gapCount": 0, "mV": [...] },
      "II": { "fs": 500, "durationSec": 2.5, "coverage": 1.0, "gapCount": 0, "mV": [...] },
      "II (Rhythm)": { "fs": 500, "durationSec": 10.0, "coverage": 1.0, "gapCount": 0, "mV": [...] }
    },
    "layout": "12_lead_3x4_1",
    "numLeadsDetected": 13,
    "calibration": {
      "pxPerMm": 5.76,
      "speedMmPerS": 25.0,
      "gainMmPerMv": 10.0,
      "limbGainMmPerMv": 10.0,
      "chestGainMmPerMv": 10.0,
      "filterText": "0.15-150 Hz",
      "calibrationSource": "grid_detected",
      "crossChecks": [
        { "method": "grid_minor_autocorr", "pxPerMm": 5.75, "description": "1 mm minor grid periodicity" },
        { "method": "grid_major_autocorr", "pxPerMm": 5.80, "description": "5 mm major grid periodicity (divided by 5)" },
        { "method": "active_span_10s", "pxPerMm": 5.76, "description": "10-second active horizontal trace span" },
        { "method": "cal_pulse_dimensions", "pxPerMm": 6.5, "description": "Calibration pulse dimensions (width / height)" }
      ]
    },
    "quality": {
      "reconstructionQuality": "high",
      "meanCoverage": 0.992,
      "reprojectionErrorPx": 0.22,
      "within1PxPct": 100.0,
      "beyond2PxPct": 0.0,
      "heartRateBpm": 70,
      "totalGaps": 0,
      "checks": [
        { "check": "einthoven_law", "passed": true, "value": 0.0844, "unit": "mV RMS", "threshold": "<= 0.12 mV", "description": "Einthoven's Law: Lead II = Lead I + Lead III" },
        { "check": "goldberger_law", "passed": true, "value": 0.0726, "unit": "mV RMS", "threshold": "<= 0.15 mV", "description": "Goldberger's Law: aVR + aVL + aVF = 0" },
        { "check": "rhythm_lead_ii_consistency", "passed": true, "value": 0.9801, "unit": "Pearson r", "threshold": ">= 0.88", "description": "Morphological consistency between short Lead II and Rhythm strip" },
        { "check": "avr_net_negative", "passed": true, "value": "min=-1.19mV, max=0.26mV", "unit": "mV", "threshold": "min < -max", "description": "Lead aVR net negative QRS in sinus rhythm" },
        { "check": "r_peak_time_alignment", "passed": true, "value": 18.0, "unit": "ms", "threshold": "<= 25 ms", "description": "Simultaneous R-peak time alignment across rows" }
      ]
    },
    "renderMode": "faithful",
    "warnings": [],
    "disclaimer": "Digitally reconstructed from a scanned image. Not the original recording. For reference only, not for diagnosis."
  }
  ```

### 2. Integration with `POST /api/predict/cardiac`
- Automatically invokes `reconstruct_ecg_report(contents)` within an isolated `try/except` block.
- A reconstruction error or low-quality scan will **never** fail the primary arrhythmia prediction endpoint.
- When a 12-lead layout is detected, the Lead II rhythm strip is resampled to $250\text{ Hz}$ ($1000$ samples, $4\text{ s}$ window) and fed into the 1D-CNN + BiLSTM model instead of a generic median image trace, significantly improving classification accuracy.
- Appends `reconstruction` to the JSON response while preserving all legacy fields.

---

## 5. Frontend User Interface

- **View Selector:** Switch between **Comparison** (side-by-side rectified scan vs reconstruction), **Reconstructed** (full 300 DPI digital sheet), and **Original** (uploaded user photo).
- **Render Mode Toggle:** Switch seamlessly between **Faithful (Default)** (preserving physiological tremor and fine QRS notches) and **Clean (40 Hz LP)** (monitor-grade baseline leveled view).
- **Interactive Pan & Zoom:** Viewport supporting $75\% - 350\%$ zoom with smooth drag-to-pan across waveforms.
- **Cardiology Self-Checks Panel:** Displays all 5 clinical consistency laws (Einthoven, Goldberger, Rhythm Lead II correlation, aVR polarity, and R-peak row alignment) with pass/fail badges, observed values, and diagnostic thresholds.
- **Calibration & Machine Parameters:** Displays detected physical parameters ($25\text{ mm/s}$, limb/chest gains, filter text, pixel-to-mm ratio, and calibration method consensus).
- **Reprojection Accuracy:** Displays sub-pixel mean error and percentage of points within $\le 1\text{ px}$.
- **Fidelity Quality Badges:** Visual indicator (`High Fidelity`, `Moderate Quality`, or `Low Fidelity (Caution)`).
- **PNG Download:** One-click download of the 300 DPI reconstructed PNG image.
- **Comprehensive PDF Export:** Embedded 300 DPI digital ECG report in the clinical PDF generated via `exportCardiacReportPDF`.

---

## 6. Known Limitations
1. **Severe Creases & Physical Tears:** If the paper is torn through a waveform, the reconstructor leaves a visible gap. It will not fabricate missing complexes.
2. **Extreme Glare / Flash Overexposure:** If flash reflection completely washes out grid and ink lines, the region cannot be extracted and triggers a `low` fidelity warning.
3. **Black-and-White Photocopiers:** On low-contrast black-and-white photocopies where grid lines and traces share the exact same gray level, grid autocorrelation is used, but trace separation relies on stroke connectivity; some faint grid dots may remain.
