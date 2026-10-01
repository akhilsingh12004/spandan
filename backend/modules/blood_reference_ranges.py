"""
Clinical Reference Range Database for Blood Test Report Analysis
Standard adult reference ranges, synonyms/aliases, units, and clinical classifications.
"""

from typing import Dict, Any, List

BLOOD_PANELS = {
    "Complete Blood Count (CBC)": [
        "Hemoglobin", "WBC Count", "RBC Count", "Platelet Count", 
        "Hematocrit (HCT)", "MCV", "MCH", "MCHC"
    ],
    "Lipid Profile": [
        "Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides"
    ],
    "Blood Sugar / Glycemic": [
        "Fasting Blood Glucose", "Postprandial Glucose", "HbA1c"
    ],
    "Liver Function Test (LFT)": [
        "ALT (SGPT)", "AST (SGOT)", "Total Bilirubin", "Direct Bilirubin", 
        "Alkaline Phosphatase (ALP)", "Albumin", "Total Protein"
    ],
    "Kidney Function Test (KFT)": [
        "Creatinine", "Blood Urea Nitrogen (BUN)", "eGFR", "Uric Acid"
    ],
    "Thyroid Panel": [
        "TSH", "Total T3", "Total T4"
    ],
    "Electrolytes": [
        "Sodium", "Potassium", "Chloride"
    ],
    "Vitamins & Minerals": [
        "Vitamin D (25-OH)", "Vitamin B12", "Serum Iron", "Ferritin"
    ],
    "Inflammation Markers": [
        "C-Reactive Protein (CRP)", "ESR"
    ]
}

# Master Reference Range Dictionary
# min_val, max_val, unit, aliases, critical_low, critical_high, low_desc, high_desc
REFERENCE_RANGES: Dict[str, Dict[str, Any]] = {
    # ── Complete Blood Count (CBC) ──
    "Hemoglobin": {
        "panel": "Complete Blood Count (CBC)",
        "min": 12.0,
        "max": 17.5,
        "unit": "g/dL",
        "aliases": ["hemoglobin", "hb", "hgb", "haemoglobin"],
        "critical_low": 7.0,
        "critical_high": 20.0,
        "low_desc": "Low hemoglobin indicates anemia, blood loss, or nutritional deficiency.",
        "high_desc": "Elevated hemoglobin may indicate polycythemia, chronic hypoxia, or severe dehydration."
    },
    "WBC Count": {
        "panel": "Complete Blood Count (CBC)",
        "min": 4000,
        "max": 11000,
        "unit": "/mcL",
        "aliases": ["wbc", "wbc count", "total leukocyte count", "tlc", "white blood cell count", "leukocytes"],
        "critical_low": 2000,
        "critical_high": 30000,
        "low_desc": "Leukopenia suggests viral infection, bone marrow suppression, or autoimmune conditions.",
        "high_desc": "Leukocytosis typically reflects acute bacterial infection, inflammation, or hematologic stress."
    },
    "RBC Count": {
        "panel": "Complete Blood Count (CBC)",
        "min": 4.2,
        "max": 5.9,
        "unit": "million/mcL",
        "aliases": ["rbc", "rbc count", "red blood cell count", "total rbc"],
        "critical_low": 2.5,
        "critical_high": 7.5,
        "low_desc": "Reduced RBC count is a key marker of anemia.",
        "high_desc": "Elevated RBC count (erythrocytosis) indicates hypoxia, smoking, or polycythemia."
    },
    "Platelet Count": {
        "panel": "Complete Blood Count (CBC)",
        "min": 150000,
        "max": 450000,
        "unit": "/mcL",
        "aliases": ["platelet", "platelet count", "platelets", "plt"],
        "critical_low": 50000,
        "critical_high": 1000000,
        "low_desc": "Thrombocytopenia increases bruising and spontaneous bleeding risk (e.g. dengue, ITP).",
        "high_desc": "Thrombocytosis indicates reactive inflammation, iron deficiency, or myeloproliferative disorder."
    },
    "Hematocrit (HCT)": {
        "panel": "Complete Blood Count (CBC)",
        "min": 36.0,
        "max": 50.0,
        "unit": "%",
        "aliases": ["hematocrit", "hct", "pcv", "packed cell volume"],
        "critical_low": 20.0,
        "critical_high": 60.0,
        "low_desc": "Low hematocrit correlates with anemia and blood loss.",
        "high_desc": "High hematocrit indicates hemoconcentration, dehydration, or polycythemia."
    },
    "MCV": {
        "panel": "Complete Blood Count (CBC)",
        "min": 80.0,
        "max": 100.0,
        "unit": "fL",
        "aliases": ["mcv", "mean corpuscular volume"],
        "critical_low": 65.0,
        "critical_high": 120.0,
        "low_desc": "Microcytic cells (typical in Iron Deficiency Anemia or Thalassemia).",
        "high_desc": "Macrocytic cells (typical in Vitamin B12 or Folate deficiency)."
    },
    "MCH": {
        "panel": "Complete Blood Count (CBC)",
        "min": 27.0,
        "max": 33.0,
        "unit": "pg",
        "aliases": ["mch", "mean corpuscular hemoglobin"],
        "critical_low": 20.0,
        "critical_high": 40.0,
        "low_desc": "Hypochromic red cells often seen in iron deficiency.",
        "high_desc": "Macrocytic anemias or hyperlipidemia artifact."
    },
    "MCHC": {
        "panel": "Complete Blood Count (CBC)",
        "min": 32.0,
        "max": 36.0,
        "unit": "g/dL",
        "aliases": ["mchc", "mean corpuscular hemoglobin concentration"],
        "critical_low": 28.0,
        "critical_high": 38.0,
        "low_desc": "Hypochromia, frequently associated with iron deficiency anemia.",
        "high_desc": "Hereditary spherocytosis or cold agglutinin disease."
    },

    # ── Lipid Profile ──
    "Total Cholesterol": {
        "panel": "Lipid Profile",
        "min": 100.0,
        "max": 200.0,
        "unit": "mg/dL",
        "aliases": ["total cholesterol", "cholesterol", "t. chol", "s. cholesterol"],
        "critical_low": None,
        "critical_high": 300.0,
        "low_desc": "Low cholesterol may occur with severe malnutrition or hyperthyroidism.",
        "high_desc": "Hypercholesterolemia increases risk of atherosclerosis and coronary artery disease."
    },
    "LDL Cholesterol": {
        "panel": "Lipid Profile",
        "min": 0.0,
        "max": 100.0,
        "unit": "mg/dL",
        "aliases": ["ldl", "ldl cholesterol", "bad cholesterol", "ldl-c", "calculated ldl"],
        "critical_low": None,
        "critical_high": 190.0,
        "low_desc": "Low LDL is generally optimal for cardiovascular health.",
        "high_desc": "Elevated LDL ('bad cholesterol') is an established atherogenic risk factor."
    },
    "HDL Cholesterol": {
        "panel": "Lipid Profile",
        "min": 40.0,
        "max": 80.0,
        "unit": "mg/dL",
        "aliases": ["hdl", "hdl cholesterol", "good cholesterol", "hdl-c"],
        "critical_low": 25.0,
        "critical_high": None,
        "low_desc": "Low HDL ('good cholesterol') is an independent cardiovascular risk marker.",
        "high_desc": "High HDL is cardioprotective."
    },
    "Triglycerides": {
        "panel": "Lipid Profile",
        "min": 0.0,
        "max": 150.0,
        "unit": "mg/dL",
        "aliases": ["triglycerides", "tg", "triglyceride", "s. triglycerides"],
        "critical_low": None,
        "critical_high": 500.0,
        "low_desc": "Low triglycerides are rarely clinically significant.",
        "high_desc": "Hypertriglyceridemia increases risk of cardiovascular disease and acute pancreatitis (>500 mg/dL)."
    },

    # ── Blood Sugar / Glycemic ──
    "Fasting Blood Glucose": {
        "panel": "Blood Sugar / Glycemic",
        "min": 70.0,
        "max": 99.0,
        "unit": "mg/dL",
        "aliases": ["fasting blood glucose", "fasting blood sugar", "fbs", "fasting glucose", "glucose fasting"],
        "critical_low": 54.0,
        "critical_high": 250.0,
        "low_desc": "Hypoglycemia requires immediate carbohydrate intake.",
        "high_desc": "100-125 mg/dL indicates Prediabetes; >=126 mg/dL indicates Diabetes Mellitus."
    },
    "Postprandial Glucose": {
        "panel": "Blood Sugar / Glycemic",
        "min": 70.0,
        "max": 140.0,
        "unit": "mg/dL",
        "aliases": ["postprandial glucose", "ppbs", "pp glucose", "2 hr postprandial blood sugar", "post prandial blood sugar"],
        "critical_low": 54.0,
        "critical_high": 300.0,
        "low_desc": "Postprandial hypoglycemia.",
        "high_desc": "140-199 mg/dL indicates Impaired Glucose Tolerance; >=200 mg/dL indicates Diabetes."
    },
    "HbA1c": {
        "panel": "Blood Sugar / Glycemic",
        "min": 4.0,
        "max": 5.6,
        "unit": "%",
        "aliases": ["hba1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c"],
        "critical_low": None,
        "critical_high": 10.0,
        "low_desc": "Usually normal or associated with hemolytic anemia.",
        "high_desc": "5.7-6.4% indicates Prediabetes; >=6.5% establishes diagnosis of Diabetes."
    },

    # ── Liver Function Test (LFT) ──
    "ALT (SGPT)": {
        "panel": "Liver Function Test (LFT)",
        "min": 7.0,
        "max": 56.0,
        "unit": "U/L",
        "aliases": ["alt", "sgpt", "alanine aminotransferase", "alanine transaminase"],
        "critical_low": None,
        "critical_high": 300.0,
        "low_desc": "Generally normal.",
        "high_desc": "Elevated ALT indicates hepatocellular injury (fatty liver, hepatitis, medication toxicity)."
    },
    "AST (SGOT)": {
        "panel": "Liver Function Test (LFT)",
        "min": 10.0,
        "max": 40.0,
        "unit": "U/L",
        "aliases": ["ast", "sgot", "aspartate aminotransferase", "aspartate transaminase"],
        "critical_low": None,
        "critical_high": 300.0,
        "low_desc": "Generally normal.",
        "high_desc": "Elevated AST indicates hepatic strain, alcoholic liver injury (AST>ALT), or cardiac/muscle injury."
    },
    "Total Bilirubin": {
        "panel": "Liver Function Test (LFT)",
        "min": 0.2,
        "max": 1.2,
        "unit": "mg/dL",
        "aliases": ["total bilirubin", "t. bilirubin", "bilirubin total", "s. bilirubin"],
        "critical_low": None,
        "critical_high": 5.0,
        "low_desc": "Normal physiological variance.",
        "high_desc": "Hyperbilirubinemia causes clinical jaundice; reflects biliary obstruction, hepatitis, or hemolysis."
    },
    "Direct Bilirubin": {
        "panel": "Liver Function Test (LFT)",
        "min": 0.0,
        "max": 0.3,
        "unit": "mg/dL",
        "aliases": ["direct bilirubin", "conjugated bilirubin"],
        "critical_low": None,
        "critical_high": 3.0,
        "low_desc": "Normal.",
        "high_desc": "Elevated conjugated bilirubin points toward cholestasis or biliary outflow obstruction."
    },
    "Alkaline Phosphatase (ALP)": {
        "panel": "Liver Function Test (LFT)",
        "min": 44.0,
        "max": 147.0,
        "unit": "U/L",
        "aliases": ["alp", "alkaline phosphatase", "alk phos"],
        "critical_low": None,
        "critical_high": 500.0,
        "low_desc": "May occur with zinc deficiency or hypothyroidism.",
        "high_desc": "Indicates biliary tract obstruction or active bone remodeling."
    },
    "Albumin": {
        "panel": "Liver Function Test (LFT)",
        "min": 3.5,
        "max": 5.5,
        "unit": "g/dL",
        "aliases": ["albumin", "s. albumin"],
        "critical_low": 2.0,
        "critical_high": None,
        "low_desc": "Hypoalbuminemia reflects chronic liver disease, nephrotic syndrome, or systemic malnutrition.",
        "high_desc": "Typically indicates dehydration."
    },
    "Total Protein": {
        "panel": "Liver Function Test (LFT)",
        "min": 6.0,
        "max": 8.3,
        "unit": "g/dL",
        "aliases": ["total protein", "protein total", "s. protein"],
        "critical_low": 4.5,
        "critical_high": 10.0,
        "low_desc": "Decreased in hepatic insufficiency or severe malnutrition.",
        "high_desc": "Elevated in chronic inflammation or plasma cell disorders (e.g. Multiple Myeloma)."
    },

    # ── Kidney Function Test (KFT) ──
    "Creatinine": {
        "panel": "Kidney Function Test (KFT)",
        "min": 0.6,
        "max": 1.2,
        "unit": "mg/dL",
        "aliases": ["creatinine", "serum creatinine", "s. creatinine", "creat"],
        "critical_low": None,
        "critical_high": 4.0,
        "low_desc": "May reflect low muscle mass or pregnancy.",
        "high_desc": "Primary marker of acute kidney injury (AKI) or chronic kidney disease (CKD)."
    },
    "Blood Urea Nitrogen (BUN)": {
        "panel": "Kidney Function Test (KFT)",
        "min": 7.0,
        "max": 20.0,
        "unit": "mg/dL",
        "aliases": ["bun", "blood urea nitrogen", "urea", "blood urea", "serum urea"],
        "critical_low": None,
        "critical_high": 80.0,
        "low_desc": "Low BUN is seen in malnutrition or severe liver disease.",
        "high_desc": "Elevated in renal dysfunction, dehydration, GI bleeding, or high protein catabolism."
    },
    "eGFR": {
        "panel": "Kidney Function Test (KFT)",
        "min": 60.0,
        "max": 130.0,
        "unit": "mL/min/1.73m2",
        "aliases": ["egfr", "estimated gfr", "glomerular filtration rate"],
        "critical_low": 15.0,
        "critical_high": None,
        "low_desc": "<60 mL/min indicates impaired renal function; <15 indicates kidney failure.",
        "high_desc": "Normal filtration."
    },
    "Uric Acid": {
        "panel": "Kidney Function Test (KFT)",
        "min": 3.5,
        "max": 7.2,
        "unit": "mg/dL",
        "aliases": ["uric acid", "serum uric acid", "s. uric acid"],
        "critical_low": None,
        "critical_high": 12.0,
        "low_desc": "Generally asymptomatic, may occur in Wilson's disease or Fanconi syndrome.",
        "high_desc": "Hyperuricemia promotes monosodium urate crystal deposition leading to Gout or renal calculi."
    },

    # ── Thyroid Panel ──
    "TSH": {
        "panel": "Thyroid Panel",
        "min": 0.4,
        "max": 4.5,
        "unit": "mIU/L",
        "aliases": ["tsh", "thyroid stimulating hormone", "s. tsh"],
        "critical_low": 0.05,
        "critical_high": 15.0,
        "low_desc": "Suppressed TSH suggests Primary Hyperthyroidism or excessive levothyroxine therapy.",
        "high_desc": "Elevated TSH indicates Primary Hypothyroidism (Hashimoto's thyroiditis)."
    },
    "Total T3": {
        "panel": "Thyroid Panel",
        "min": 80.0,
        "max": 200.0,
        "unit": "ng/dL",
        "aliases": ["total t3", "t3", "triiodothyronine"],
        "critical_low": 40.0,
        "critical_high": 400.0,
        "low_desc": "Low T3 can occur in euthyroid sick syndrome or severe hypothyroidism.",
        "high_desc": "Elevated in T3 toxicosis and overt hyperthyroidism."
    },
    "Total T4": {
        "panel": "Thyroid Panel",
        "min": 5.0,
        "max": 12.0,
        "unit": "mcg/dL",
        "aliases": ["total t4", "t4", "thyroxine"],
        "critical_low": 2.0,
        "critical_high": 20.0,
        "low_desc": "Low T4 indicates hypothyroidism.",
        "high_desc": "High T4 confirms hyperthyroidism or elevated thyroid-binding globulin."
    },

    # ── Electrolytes ──
    "Sodium": {
        "panel": "Electrolytes",
        "min": 135.0,
        "max": 145.0,
        "unit": "mEq/L",
        "aliases": ["sodium", "na", "s. sodium", "serum sodium"],
        "critical_low": 120.0,
        "critical_high": 160.0,
        "low_desc": "Hyponatremia may cause confusion, seizures, or lethargy (SIADH, diuretics, heart failure).",
        "high_desc": "Hypernatremia indicates pure water loss, diabetes insipidus, or dehydration."
    },
    "Potassium": {
        "panel": "Electrolytes",
        "min": 3.5,
        "max": 5.0,
        "unit": "mEq/L",
        "aliases": ["potassium", "k", "s. potassium", "serum potassium"],
        "critical_low": 2.8,
        "critical_high": 6.2,
        "low_desc": "Hypokalemia causes muscle cramps and dangerous ventricular arrhythmias.",
        "high_desc": "Hyperkalemia creates acute risk of peaked T-waves, heart blocks, and cardiac arrest."
    },
    "Chloride": {
        "panel": "Electrolytes",
        "min": 96.0,
        "max": 106.0,
        "unit": "mEq/L",
        "aliases": ["chloride", "cl", "s. chloride"],
        "critical_low": 80.0,
        "critical_high": 120.0,
        "low_desc": "Hypochloremia seen with prolonged vomiting or metabolic alkalosis.",
        "high_desc": "Hyperchloremia seen with renal tubular acidosis or profound dehydration."
    },

    # ── Vitamins & Minerals ──
    "Vitamin D (25-OH)": {
        "panel": "Vitamins & Minerals",
        "min": 30.0,
        "max": 100.0,
        "unit": "ng/mL",
        "aliases": ["vitamin d", "25-oh vitamin d", "vit d", "vitamin d3", "25-hydroxy vitamin d"],
        "critical_low": 10.0,
        "critical_high": 150.0,
        "low_desc": "Deficiency (<20 ng/mL) causes osteomalacia, osteoporosis, bone pain, and fatigue.",
        "high_desc": "Toxicity (>100 ng/mL) may cause hypercalcemia."
    },
    "Vitamin B12": {
        "panel": "Vitamins & Minerals",
        "min": 200.0,
        "max": 900.0,
        "unit": "pg/mL",
        "aliases": ["vitamin b12", "b12", "cobalamin", "vit b12"],
        "critical_low": 120.0,
        "critical_high": None,
        "low_desc": "Deficiency causes megaloblastic anemia, peripheral neuropathy, and cognitive changes.",
        "high_desc": "High B12 may indicate excessive supplementation or myeloproliferative disease."
    },
    "Serum Iron": {
        "panel": "Vitamins & Minerals",
        "min": 60.0,
        "max": 170.0,
        "unit": "mcg/dL",
        "aliases": ["iron", "serum iron", "fe", "s. iron"],
        "critical_low": 30.0,
        "critical_high": 250.0,
        "low_desc": "Low iron is the primary hallmark of iron deficiency anemia.",
        "high_desc": "Elevated iron indicates hemochromatosis or acute iron toxicity."
    },
    "Ferritin": {
        "panel": "Vitamins & Minerals",
        "min": 15.0,
        "max": 200.0,
        "unit": "ng/mL",
        "aliases": ["ferritin", "serum ferritin", "s. ferritin"],
        "critical_low": 10.0,
        "critical_high": 1000.0,
        "low_desc": "Depleted ferritin is the most specific indicator of iron deficiency.",
        "high_desc": "Hyperferritinemia occurs in iron overload or as an acute phase reactant in inflammation."
    },

    # ── Inflammation Markers ──
    "C-Reactive Protein (CRP)": {
        "panel": "Inflammation Markers",
        "min": 0.0,
        "max": 3.0,
        "unit": "mg/L",
        "aliases": ["crp", "c-reactive protein", "hs-crp", "high sensitivity crp"],
        "critical_low": None,
        "critical_high": 50.0,
        "low_desc": "Low systemic inflammation.",
        "high_desc": "Marker of acute bacterial infection, systemic autoimmune inflammation, or elevated cardiovascular risk."
    },
    "ESR": {
        "panel": "Inflammation Markers",
        "min": 0.0,
        "max": 20.0,
        "unit": "mm/hr",
        "aliases": ["esr", "erythrocyte sedimentation rate", "sed rate"],
        "critical_low": None,
        "critical_high": 100.0,
        "low_desc": "Normal baseline.",
        "high_desc": "Elevated ESR indicates non-specific chronic or acute inflammation, infection, or collagen vascular disease."
    },
}


def lookup_reference_range(param_name: str) -> Dict[str, Any]:
    """Finds canonical parameter name and reference data by fuzzy alias matching."""
    cleaned = param_name.strip().lower()
    
    # Exact name match
    for canon_name, data in REFERENCE_RANGES.items():
        if cleaned == canon_name.lower():
            return canon_name, data

    # Alias match
    for canon_name, data in REFERENCE_RANGES.items():
        for alias in data["aliases"]:
            if alias in cleaned or cleaned in alias:
                return canon_name, data

    return None, None
