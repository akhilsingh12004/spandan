"""
Spandan AI - Backend Configuration & Expanded Disease Taxonomies
Features Hierarchical Taxonomies, Core vs. Extended Class Tiers,
and Clinical Data Support Categories.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# ═══════════════════════════════════════════════════════════════
# CARDIAC TAXONOMY (Core + Extended Classes)
# ═══════════════════════════════════════════════════════════════

CARDIAC_HIERARCHY = {
    "Rhythm & Arrhythmias": [
        "Normal Sinus Rhythm",
        "Atrial Fibrillation (AFib)",
        "Atrial Flutter",
        "Sinus Bradycardia",
        "Sinus Tachycardia",
        "Premature Ventricular Contractions (PVC)",
        "Ventricular Tachycardia",
        "Ventricular Fibrillation (VFib)",
        "Supraventricular Tachycardia (SVT)",
        "Premature Atrial Contractions (PAC)",
        "Sick Sinus Syndrome",
    ],
    "Conduction & Pre-Excitation": [
        "First-degree Heart Block",
        "Second-degree Heart Block",
        "Third-degree Heart Block",
        "Left Bundle Branch Block (LBBB)",
        "Right Bundle Branch Block (RBBB)",
        "Wolff-Parkinson-White Syndrome (WPW)",
    ],
    "Ischemia & Infarction": [
        "Myocardial Infarction (STEMI)",
        "Myocardial Infarction (NSTEMI)",
        "Myocardial Ischemia",
    ],
    "Structural & Hypertrophic": [
        "Left Ventricular Hypertrophy (LVH)",
        "Right Ventricular Hypertrophy (RVH)",
        "Atrial Enlargement",
        "Left Axis Deviation (LAD)",
        "Right Axis Deviation (RAD)",
    ],
    "Channelopathies, Electrolyte & Inflammatory": [
        "Long QT Syndrome",
        "Short QT Syndrome",
        "Brugada Syndrome",
        "Hyperkalemia (Electrolyte Imbalance)",
        "Hypokalemia (Electrolyte Imbalance)",
        "Pericarditis",
    ]
}

# Flat list of all cardiac classes
CARDIAC_CLASSES = [cls for group in CARDIAC_HIERARCHY.values() for cls in group]

# Core vs Extended Tiers
CARDIAC_CORE_CLASSES = [
    "Normal Sinus Rhythm",
    "Atrial Fibrillation (AFib)",
    "Atrial Flutter",
    "Sinus Bradycardia",
    "Sinus Tachycardia",
    "Premature Ventricular Contractions (PVC)",
    "Ventricular Tachycardia",
    "First-degree Heart Block",
    "Second-degree Heart Block",
    "Third-degree Heart Block",
    "Left Bundle Branch Block (LBBB)",
    "Right Bundle Branch Block (RBBB)",
    "Long QT Syndrome",
    "Myocardial Infarction (STEMI)",
    "Myocardial Infarction (NSTEMI)",
    "Myocardial Ischemia",
    "Left Ventricular Hypertrophy (LVH)",
    "Right Ventricular Hypertrophy (RVH)",
    "Atrial Enlargement",
]

CARDIAC_EXTENDED_CLASSES = [
    "Ventricular Fibrillation (VFib)",
    "Supraventricular Tachycardia (SVT)",
    "Wolff-Parkinson-White Syndrome (WPW)",
    "Premature Atrial Contractions (PAC)",
    "Sick Sinus Syndrome",
    "Brugada Syndrome",
    "Short QT Syndrome",
    "Left Axis Deviation (LAD)",
    "Right Axis Deviation (RAD)",
    "Hyperkalemia (Electrolyte Imbalance)",
    "Hypokalemia (Electrolyte Imbalance)",
    "Pericarditis",
]

# Rare condition flags (trigger 'Flag for Specialist Review' UI indicator)
CARDIAC_RARE_CLASSES = {
    "Brugada Syndrome": {"supportLevel": "Sparse (<200)", "requiresSpecialist": True},
    "Wolff-Parkinson-White Syndrome (WPW)": {"supportLevel": "Sparse (<300)", "requiresSpecialist": True},
    "Short QT Syndrome": {"supportLevel": "Very Sparse (<100)", "requiresSpecialist": True},
    "Third-degree Heart Block": {"supportLevel": "Moderate (400)", "requiresSpecialist": True},
    "Ventricular Fibrillation (VFib)": {"supportLevel": "Critical / Emergency", "requiresSpecialist": True},
    "Sick Sinus Syndrome": {"supportLevel": "Moderate (350)", "requiresSpecialist": True},
}


# ═══════════════════════════════════════════════════════════════
# SKIN TAXONOMY (Core + Extended Classes)
# ═══════════════════════════════════════════════════════════════

SKIN_HIERARCHY = {
    "Neoplastic & Pre-Malignant": [
        "Melanoma",
        "Basal Cell Carcinoma",
        "Squamous Cell Carcinoma",
        "Actinic Keratosis",
        "Melanocytic Nevus (Mole)",
        "Benign Keratosis",
        "Dermatofibroma",
        "Vascular Lesion",
    ],
    "Inflammatory & Autoimmune": [
        "Eczema",
        "Psoriasis",
        "Contact Dermatitis",
        "Rosacea",
        "Urticaria (Hives)",
        "Lichen Planus",
        "Seborrheic Dermatitis",
        "Alopecia Areata",
        "Keloid / Hypertrophic Scar",
    ],
    "Infectious (Bacterial, Viral, Fungal, Parasitic)": [
        "Ringworm / Fungal Infection",
        "Herpes Zoster (Shingles)",
        "Impetigo",
        "Scabies",
        "Cellulitis",
        "Warts (HPV-related)",
        "Tinea Versicolor",
        "Molluscum Contagiosum",
        "Chickenpox Rash (Varicella)",
    ],
    "Appendageal, Pigmentary & Baseline": [
        "Normal/Healthy Skin",
        "Acne",
        "Vitiligo",
    ]
}

# Flat list of all skin classes
SKIN_CLASSES = [cls for group in SKIN_HIERARCHY.values() for cls in group]

SKIN_CORE_CLASSES = [
    "Normal/Healthy Skin",
    "Melanoma",
    "Basal Cell Carcinoma",
    "Squamous Cell Carcinoma",
    "Actinic Keratosis",
    "Melanocytic Nevus (Mole)",
    "Benign Keratosis",
    "Dermatofibroma",
    "Vascular Lesion",
    "Eczema",
    "Psoriasis",
    "Acne",
    "Ringworm / Fungal Infection",
    "Contact Dermatitis",
    "Vitiligo",
    "Rosacea",
    "Urticaria (Hives)",
]

SKIN_EXTENDED_CLASSES = [
    "Herpes Zoster (Shingles)",
    "Impetigo",
    "Scabies",
    "Lichen Planus",
    "Seborrheic Dermatitis",
    "Cellulitis",
    "Warts (HPV-related)",
    "Tinea Versicolor",
    "Molluscum Contagiosum",
    "Alopecia Areata",
    "Keloid / Hypertrophic Scar",
    "Chickenpox Rash (Varicella)",
]

# Rare skin condition flags
SKIN_RARE_CLASSES = {
    "Molluscum Contagiosum": {"supportLevel": "Sparse (<250)", "requiresSpecialist": True},
    "Lichen Planus": {"supportLevel": "Sparse (<300)", "requiresSpecialist": True},
    "Scabies": {"supportLevel": "Moderate (400)", "requiresSpecialist": True},
    "Cellulitis": {"supportLevel": "Critical / Acute", "requiresSpecialist": True},
    "Melanoma": {"supportLevel": "High Risk / High Priority", "requiresSpecialist": True},
    "Alopecia Areata": {"supportLevel": "Moderate (350)", "requiresSpecialist": False},
}

# Helper to find broad group
def get_cardiac_group(disease_name: str) -> str:
    for group, items in CARDIAC_HIERARCHY.items():
        if disease_name in items:
            return group
    return "Cardiac Condition"

def get_skin_group(disease_name: str) -> str:
    for group, items in SKIN_HIERARCHY.items():
        if disease_name in items:
            return group
    return "Dermatological Condition"


# Model artifact paths
CARDIAC_MODEL_PATH = MODELS_DIR / "cardiac_model.h5"
SKIN_MODEL_PATH = MODELS_DIR / "skin_model.h5"

# Sampling and Signal configs
ECG_SAMPLING_RATE = 250  # Hz
ECG_SIGNAL_LENGTH = 1000 # samples (4 seconds at 250 Hz)
SKIN_IMAGE_SIZE = (224, 224)
