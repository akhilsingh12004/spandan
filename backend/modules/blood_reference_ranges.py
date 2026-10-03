"""
Clinical Reference Range Database for Blood Test Report Analysis
Standard adult reference ranges, synonyms/aliases, units, plausible physiological bounds, and clinical classifications.
"""

import re
from typing import Dict, Any, List, Optional, Tuple

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
        "Total Bilirubin", "Direct Bilirubin", "Indirect Bilirubin",
        "ALT (SGPT)", "AST (SGOT)", "Alkaline Phosphatase (ALP)", 
        "Gamma-Glutamyl Transferase (GGT)", "Albumin", "Total Protein"
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
# min, max, unit, aliases, critical_low, critical_high, low_desc, high_desc, valid_min, valid_max
REFERENCE_RANGES: Dict[str, Dict[str, Any]] = {
    # ── Complete Blood Count (CBC) ──
    "Hemoglobin": {
        "panel": "Complete Blood Count (CBC)",
        "min": 12.0,
        "max": 17.5,
        "unit": "g/dL",
        "aliases": ["hemoglobin", "hb", "hgb", "haemoglobin", "s. hemoglobin"],
        "critical_low": 7.0,
        "critical_high": 20.0,
        "valid_min": 1.0,
        "valid_max": 28.0,
        "low_desc": "Low hemoglobin indicates anemia, blood loss, or nutritional deficiency.",
        "high_desc": "Elevated hemoglobin may indicate polycythemia, chronic hypoxia, or dehydration."
    },
    "WBC Count": {
        "panel": "Complete Blood Count (CBC)",
        "min": 4000,
        "max": 11000,
        "unit": "/mcL",
        "aliases": ["wbc", "wbc count", "total leukocyte count", "tlc", "white blood cell count", "leukocytes", "total wbc"],
        "critical_low": 2000,
        "critical_high": 30000,
        "valid_min": 500,
        "valid_max": 250000,
        "low_desc": "Leukopenia suggests viral infection, bone marrow suppression, or autoimmune conditions.",
        "high_desc": "Leukocytosis typically reflects acute infection, systemic inflammation, or physiological stress."
    },
    "RBC Count": {
        "panel": "Complete Blood Count (CBC)",
        "min": 4.2,
        "max": 5.9,
        "unit": "million/mcL",
        "aliases": ["rbc", "rbc count", "red blood cell count", "total rbc", "erythrocyte count"],
        "critical_low": 2.5,
        "critical_high": 7.5,
        "valid_min": 0.8,
        "valid_max": 10.0,
        "low_desc": "Reduced RBC count is a key marker of anemia.",
        "high_desc": "Elevated RBC count (erythrocytosis) indicates hypoxia, smoking, or polycythemia."
    },
    "Platelet Count": {
        "panel": "Complete Blood Count (CBC)",
        "min": 150000,
        "max": 450000,
        "unit": "/mcL",
        "aliases": ["platelet", "platelet count", "platelets", "plt", "total platelets"],
        "critical_low": 50000,
        "critical_high": 1000000,
        "valid_min": 5000,
        "valid_max": 2500000,
        "low_desc": "Thrombocytopenia increases bruising and spontaneous bleeding risk (e.g. dengue, ITP).",
        "high_desc": "Thrombocytosis indicates reactive inflammation, iron deficiency, or marrow proliferation."
    },
    "Hematocrit (HCT)": {
        "panel": "Complete Blood Count (CBC)",
        "min": 36.0,
        "max": 50.0,
        "unit": "%",
        "aliases": ["hematocrit", "hct", "pcv", "packed cell volume"],
        "critical_low": 20.0,
        "critical_high": 60.0,
        "valid_min": 10.0,
        "valid_max": 75.0,
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
        "valid_min": 45.0,
        "valid_max": 160.0,
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
        "valid_min": 12.0,
        "valid_max": 55.0,
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
        "valid_min": 18.0,
        "valid_max": 48.0,
        "low_desc": "Hypochromia, frequently associated with iron deficiency anemia.",
        "high_desc": "Hereditary spherocytosis or cold agglutinin phenomenon."
    },

    # ── Lipid Profile ──
    "Total Cholesterol": {
        "panel": "Lipid Profile",
        "min": 100.0,
        "max": 200.0,
        "unit": "mg/dL",
        "aliases": ["total cholesterol", "cholesterol", "t. chol", "s. cholesterol", "serum cholesterol"],
        "critical_low": None,
        "critical_high": 300.0,
        "valid_min": 40.0,
        "valid_max": 800.0,
        "low_desc": "Low cholesterol may occur with severe malnutrition or hyperthyroidism.",
        "high_desc": "Hypercholesterolemia increases long-term risk of atherosclerosis and coronary disease."
    },
    "LDL Cholesterol": {
        "panel": "Lipid Profile",
        "min": 0.0,
        "max": 100.0,
        "unit": "mg/dL",
        "aliases": ["ldl", "ldl cholesterol", "bad cholesterol", "ldl-c", "calculated ldl", "serum ldl"],
        "critical_low": None,
        "critical_high": 190.0,
        "valid_min": 10.0,
        "valid_max": 500.0,
        "low_desc": "Normal physiological baseline.",
        "high_desc": "Elevated LDL is a primary atherogenic lipoprotein promoting vascular plaque deposition."
    },
    "HDL Cholesterol": {
        "panel": "Lipid Profile",
        "min": 40.0,
        "max": 60.0,
        "unit": "mg/dL",
        "aliases": ["hdl", "hdl cholesterol", "good cholesterol", "hdl-c", "serum hdl"],
        "critical_low": 25.0,
        "critical_high": None,
        "valid_min": 5.0,
        "valid_max": 180.0,
        "low_desc": "Low HDL reduces reverse cholesterol transport and increases cardiovascular risk.",
        "high_desc": "High HDL is considered cardioprotective."
    },
    "Triglycerides": {
        "panel": "Lipid Profile",
        "min": 0.0,
        "max": 150.0,
        "unit": "mg/dL",
        "aliases": ["triglycerides", "tg", "triglyceride", "s. triglycerides", "serum triglycerides"],
        "critical_low": None,
        "critical_high": 500.0,
        "valid_min": 15.0,
        "valid_max": 2500.0,
        "low_desc": "Normal.",
        "high_desc": "Elevated triglycerides correlate with metabolic syndrome and fatty liver; >500 risks pancreatitis."
    },

    # ── Blood Sugar / Glycemic ──
    "Fasting Blood Glucose": {
        "panel": "Blood Sugar / Glycemic",
        "min": 70.0,
        "max": 99.0,
        "unit": "mg/dL",
        "aliases": ["fasting blood glucose", "fasting glucose", "fbs", "fasting blood sugar", "blood sugar fasting", "glucose fasting", "fbg"],
        "critical_low": 54.0,
        "critical_high": 300.0,
        "valid_min": 20.0,
        "valid_max": 900.0,
        "low_desc": "Hypoglycemia requires immediate carbohydrate intake to prevent neuroglycopenia.",
        "high_desc": "100-125 mg/dL indicates Prediabetes; >=126 mg/dL on repeated testing indicates Diabetes."
    },
    "Postprandial Glucose": {
        "panel": "Blood Sugar / Glycemic",
        "min": 70.0,
        "max": 140.0,
        "unit": "mg/dL",
        "aliases": ["postprandial glucose", "ppbs", "pp glucose", "post meal glucose", "post prandial blood sugar", "glucose pp"],
        "critical_low": 54.0,
        "critical_high": 350.0,
        "valid_min": 25.0,
        "valid_max": 900.0,
        "low_desc": "Reactive hypoglycemia.",
        "high_desc": "140-199 mg/dL indicates Impaired Glucose Tolerance; >=200 mg/dL indicates Diabetes."
    },
    "HbA1c": {
        "panel": "Blood Sugar / Glycemic",
        "min": 4.0,
        "max": 5.6,
        "unit": "%",
        "aliases": ["hba1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c", "hemoglobin a1c"],
        "critical_low": None,
        "critical_high": 10.0,
        "valid_min": 2.5,
        "valid_max": 19.0,
        "low_desc": "Usually normal or associated with hemolytic states.",
        "high_desc": "5.7-6.4% indicates Prediabetes; >=6.5% establishes diagnosis of Diabetes."
    },

    # ── Liver Function Test (LFT) ──
    "Total Bilirubin": {
        "panel": "Liver Function Test (LFT)",
        "min": 0.2,
        "max": 1.2,
        "unit": "mg/dL",
        "aliases": [
            "total bilirubin", "bilirubin total", "bilirubin (total)", "bilirubin - total",
            "bilirubin, total", "t. bilirubin", "s. bilirubin", "serum bilirubin",
            "serum bilirubin (total)", "tbil", "t.bil", "t-bil", "total bil", "s. bil",
            "bilirubin, serum total", "s. bilirubin (total)", "bilirubin", "total serum bilirubin", "tsb"
        ],
        "critical_low": None,
        "critical_high": 4.0,
        "valid_min": 0.05,
        "valid_max": 45.0,
        "low_desc": "Normal physiological baseline.",
        "high_desc": "Elevated bilirubin indicates Hyperbilirubinemia / Jaundice (hepatitis, bile duct obstruction, or hemolysis)."
    },
    "Direct Bilirubin": {
        "panel": "Liver Function Test (LFT)",
        "min": 0.0,
        "max": 0.3,
        "unit": "mg/dL",
        "aliases": [
            "direct bilirubin", "conjugated bilirubin", "bilirubin direct", "bilirubin (direct)",
            "bilirubin - direct", "bilirubin, direct", "d. bilirubin", "s. direct bilirubin",
            "serum direct bilirubin", "s. bilirubin (direct)", "dbil", "d.bil", "d-bil", "direct bil"
        ],
        "critical_low": None,
        "critical_high": 2.5,
        "valid_min": 0.0,
        "valid_max": 35.0,
        "low_desc": "Normal.",
        "high_desc": "Elevated conjugated bilirubin indicates obstructive cholestasis, biliary stasis, or hepatitis."
    },
    "Indirect Bilirubin": {
        "panel": "Liver Function Test (LFT)",
        "min": 0.1,
        "max": 0.9,
        "unit": "mg/dL",
        "aliases": [
            "indirect bilirubin", "unconjugated bilirubin", "bilirubin indirect", "bilirubin (indirect)",
            "bilirubin - indirect", "bilirubin, indirect", "ibil", "i.bil", "i-bil", "indirect bil",
            "s. indirect bilirubin", "serum indirect bilirubin"
        ],
        "critical_low": None,
        "critical_high": 3.0,
        "valid_min": 0.0,
        "valid_max": 35.0,
        "low_desc": "Normal baseline.",
        "high_desc": "Elevated indirect bilirubin points toward hemolysis, hematoma reabsorption, or Gilbert's syndrome."
    },
    "ALT (SGPT)": {
        "panel": "Liver Function Test (LFT)",
        "min": 7.0,
        "max": 56.0,
        "unit": "U/L",
        "aliases": [
            "alt", "sgpt", "alt (sgpt)", "sgpt (alt)", "alt/sgpt", "sgpt/alt",
            "alanine aminotransferase", "alanine transaminase", "s. alt", "s.g.p.t"
        ],
        "critical_low": None,
        "critical_high": 300.0,
        "valid_min": 1.0,
        "valid_max": 5000.0,
        "low_desc": "Generally normal.",
        "high_desc": "Elevated ALT indicates hepatocellular stress or inflammation (fatty liver, hepatitis, medication effect)."
    },
    "AST (SGOT)": {
        "panel": "Liver Function Test (LFT)",
        "min": 10.0,
        "max": 40.0,
        "unit": "U/L",
        "aliases": [
            "ast", "sgot", "ast (sgot)", "sgot (ast)", "ast/sgot", "sgot/ast",
            "aspartate aminotransferase", "aspartate transaminase", "s. ast", "s.g.o.t"
        ],
        "critical_low": None,
        "critical_high": 300.0,
        "valid_min": 1.0,
        "valid_max": 5000.0,
        "low_desc": "Generally normal.",
        "high_desc": "Elevated AST indicates hepatic strain, alcoholic liver irritation (AST>ALT), or intense muscular exertion."
    },
    "Alkaline Phosphatase (ALP)": {
        "panel": "Liver Function Test (LFT)",
        "min": 44.0,
        "max": 147.0,
        "unit": "U/L",
        "aliases": [
            "alkaline phosphatase", "alp", "alk phos", "alp (alkaline phosphatase)",
            "alkaline phosphatase (alp)", "alk. phos", "alk. phosphatase", "s. alkaline phosphatase"
        ],
        "critical_low": None,
        "critical_high": 500.0,
        "valid_min": 5.0,
        "valid_max": 3500.0,
        "low_desc": "May occur with zinc deficiency or hypothyroidism.",
        "high_desc": "Marked elevation indicates biliary outflow obstruction, cholestasis, or active bone turnover."
    },
    "Gamma-Glutamyl Transferase (GGT)": {
        "panel": "Liver Function Test (LFT)",
        "min": 9.0,
        "max": 48.0,
        "unit": "U/L",
        "aliases": ["ggt", "gamma gt", "gamma-glutamyl transferase", "gamma glutamyl transferase", "g-gt", "gamma-gt"],
        "critical_low": None,
        "critical_high": 250.0,
        "valid_min": 1.0,
        "valid_max": 2000.0,
        "low_desc": "Normal.",
        "high_desc": "Elevated GGT confirms hepatobiliary origin of elevated ALP and indicates biliary stasis or alcohol impact."
    },
    "Albumin": {
        "panel": "Liver Function Test (LFT)",
        "min": 3.5,
        "max": 5.5,
        "unit": "g/dL",
        "aliases": ["albumin", "s. albumin", "serum albumin"],
        "critical_low": 2.0,
        "critical_high": None,
        "valid_min": 0.5,
        "valid_max": 8.5,
        "low_desc": "Hypoalbuminemia reflects chronic liver disease, renal protein loss, or malnutrition.",
        "high_desc": "Typically indicates hemoconcentration/dehydration."
    },
    "Total Protein": {
        "panel": "Liver Function Test (LFT)",
        "min": 6.0,
        "max": 8.3,
        "unit": "g/dL",
        "aliases": ["total protein", "protein total", "s. protein", "serum total protein"],
        "critical_low": 4.5,
        "critical_high": 10.0,
        "valid_min": 1.5,
        "valid_max": 16.0,
        "low_desc": "Decreased in advanced liver dysfunction or severe nutritional deficit.",
        "high_desc": "Elevated in chronic systemic inflammation or monoclonal gammopathy."
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
        "valid_min": 0.1,
        "valid_max": 30.0,
        "low_desc": "May reflect low muscle mass or pregnancy.",
        "high_desc": "Primary clinical marker of renal impairment (acute kidney injury or chronic renal strain)."
    },
    "Blood Urea Nitrogen (BUN)": {
        "panel": "Kidney Function Test (KFT)",
        "min": 7.0,
        "max": 20.0,
        "unit": "mg/dL",
        "aliases": ["blood urea nitrogen", "bun", "blood urea", "serum urea", "urea"],
        "critical_low": None,
        "critical_high": 80.0,
        "valid_min": 1.0,
        "valid_max": 250.0,
        "low_desc": "Low BUN is seen in malnutrition or severe liver disease.",
        "high_desc": "Elevated in renal dysfunction, dehydration, GI bleeding, or catabolic states."
    },
    "eGFR": {
        "panel": "Kidney Function Test (KFT)",
        "min": 60.0,
        "max": 130.0,
        "unit": "mL/min/1.73m2",
        "aliases": ["egfr", "estimated gfr", "glomerular filtration rate"],
        "critical_low": 15.0,
        "critical_high": None,
        "valid_min": 1.0,
        "valid_max": 200.0,
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
        "valid_min": 0.5,
        "valid_max": 25.0,
        "low_desc": "Generally asymptomatic, may occur in Wilson's disease or low purine intake.",
        "high_desc": "Hyperuricemia promotes monosodium urate crystal deposition leading to Gout or kidney stones."
    },

    # ── Thyroid Panel ──
    "TSH": {
        "panel": "Thyroid Panel",
        "min": 0.4,
        "max": 4.5,
        "unit": "mIU/L",
        "aliases": ["tsh", "thyroid stimulating hormone", "s. tsh", "serum tsh"],
        "critical_low": 0.05,
        "critical_high": 15.0,
        "valid_min": 0.005,
        "valid_max": 150.0,
        "low_desc": "Suppressed TSH suggests Primary Hyperthyroidism or excessive thyroid hormone replacement.",
        "high_desc": "Elevated TSH indicates Primary Hypothyroidism (Hashimoto's or underactive thyroid)."
    },
    "Total T3": {
        "panel": "Thyroid Panel",
        "min": 80.0,
        "max": 200.0,
        "unit": "ng/dL",
        "aliases": ["total t3", "triiodothyronine", "t3", "s. t3"],
        "critical_low": 40.0,
        "critical_high": 350.0,
        "valid_min": 10.0,
        "valid_max": 800.0,
        "low_desc": "Low T3 occurs in hypothyroidism, non-thyroidal illness, or calorie restriction.",
        "high_desc": "Elevated T3 confirms hyperthyroidism or T3 thyrotoxicosis."
    },
    "Total T4": {
        "panel": "Thyroid Panel",
        "min": 4.5,
        "max": 12.0,
        "unit": "mcg/dL",
        "aliases": ["total t4", "thyroxine", "t4", "s. t4"],
        "critical_low": 2.0,
        "critical_high": 20.0,
        "valid_min": 0.5,
        "valid_max": 40.0,
        "low_desc": "Low T4 indicates hypothyroidism.",
        "high_desc": "Elevated T4 indicates thyrotoxicosis or elevated binding globulin."
    },

    # ── Electrolytes ──
    "Sodium": {
        "panel": "Electrolytes",
        "min": 135.0,
        "max": 145.0,
        "unit": "mEq/L",
        "aliases": ["sodium", "serum sodium", "s. sodium", "sodium (na+)", "na+"],
        "critical_low": 120.0,
        "critical_high": 160.0,
        "valid_min": 90.0,
        "valid_max": 185.0,
        "low_desc": "Hyponatremia may cause lethargy, headaches, or fluid shifts (SIADH, diuretics, fluid overload).",
        "high_desc": "Hypernatremia indicates free water deficit or dehydration."
    },
    "Potassium": {
        "panel": "Electrolytes",
        "min": 3.5,
        "max": 5.0,
        "unit": "mEq/L",
        "aliases": ["potassium", "serum potassium", "s. potassium", "potassium (k+)", "k+"],
        "critical_low": 2.8,
        "critical_high": 6.2,
        "valid_min": 1.5,
        "valid_max": 10.5,
        "low_desc": "Hypokalemia may cause muscle weakness, cramps, or cardiac rhythm irritability.",
        "high_desc": "Hyperkalemia can disrupt myocardial conduction and cellular resting membrane potential."
    },
    "Chloride": {
        "panel": "Electrolytes",
        "min": 96.0,
        "max": 106.0,
        "unit": "mEq/L",
        "aliases": ["chloride", "serum chloride", "s. chloride", "chloride (cl-)", "cl-"],
        "critical_low": 80.0,
        "critical_high": 120.0,
        "valid_min": 60.0,
        "valid_max": 150.0,
        "low_desc": "Hypochloremia seen with prolonged vomiting or metabolic alkalosis.",
        "high_desc": "Hyperchloremia seen with renal tubular acidosis or profound dehydration."
    },

    # ── Vitamins & Minerals ──
    "Vitamin D (25-OH)": {
        "panel": "Vitamins & Minerals",
        "min": 30.0,
        "max": 100.0,
        "unit": "ng/mL",
        "aliases": ["vitamin d", "25-oh vitamin d", "vit d", "vitamin d3", "25-hydroxy vitamin d", "25-oh vit d"],
        "critical_low": 10.0,
        "critical_high": 150.0,
        "valid_min": 2.0,
        "valid_max": 250.0,
        "low_desc": "Deficiency (<20 ng/mL) impairs bone mineralization, immune function, and muscle energy.",
        "high_desc": "Toxicity (>100 ng/mL) may cause hypercalcemia."
    },
    "Vitamin B12": {
        "panel": "Vitamins & Minerals",
        "min": 200.0,
        "max": 900.0,
        "unit": "pg/mL",
        "aliases": ["vitamin b12", "b12", "cobalamin", "vit b12", "s. vitamin b12"],
        "critical_low": 120.0,
        "critical_high": None,
        "valid_min": 25.0,
        "valid_max": 3000.0,
        "low_desc": "Deficiency causes megaloblastic anemia, peripheral neuropathy, and cognitive fatigue.",
        "high_desc": "High B12 may indicate excessive supplementation or metabolic clearance variation."
    },
    "Serum Iron": {
        "panel": "Vitamins & Minerals",
        "min": 60.0,
        "max": 170.0,
        "unit": "mcg/dL",
        "aliases": ["serum iron", "iron", "s. iron", "fe", "serum fe"],
        "critical_low": 30.0,
        "critical_high": 250.0,
        "valid_min": 5.0,
        "valid_max": 600.0,
        "low_desc": "Low iron is a primary indicator of iron deficiency anemia.",
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
        "valid_min": 1.0,
        "valid_max": 6000.0,
        "low_desc": "Depleted ferritin is the most sensitive and specific biomarker of iron deficiency.",
        "high_desc": "Hyperferritinemia occurs in iron overload or as an acute phase reactant in inflammation/liver strain."
    },

    # ── Inflammation Markers ──
    "C-Reactive Protein (CRP)": {
        "panel": "Inflammation Markers",
        "min": 0.0,
        "max": 3.0,
        "unit": "mg/L",
        "aliases": ["c-reactive protein", "crp", "hs-crp", "high sensitivity crp", "s. crp"],
        "critical_low": None,
        "critical_high": 50.0,
        "valid_min": 0.05,
        "valid_max": 400.0,
        "low_desc": "Low systemic inflammation.",
        "high_desc": "Marker of acute bacterial infection, systemic autoimmune inflammation, or heightened cardiovascular risk."
    },
    "ESR": {
        "panel": "Inflammation Markers",
        "min": 0.0,
        "max": 20.0,
        "unit": "mm/hr",
        "aliases": ["erythrocyte sedimentation rate", "esr", "sed rate"],
        "critical_low": None,
        "critical_high": 100.0,
        "valid_min": 0.0,
        "valid_max": 160.0,
        "low_desc": "Normal baseline.",
        "high_desc": "Elevated ESR indicates non-specific systemic inflammation, infection, or tissue response."
    },
}


def lookup_reference_range(param_name: str) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Finds canonical parameter name and reference data by precise alias matching.
    Prevents false substring collisions (e.g. single letters 'k' in 'alkaline').
    """
    if not param_name:
        return None, None
        
    cleaned = param_name.strip().lower()
    cleaned_norm = re.sub(r'[\(\)\[\]\-–_:/,.]+', ' ', cleaned).strip()

    # 1. Exact canonical name match
    for canon_name, data in REFERENCE_RANGES.items():
        if cleaned == canon_name.lower() or cleaned_norm == canon_name.lower():
            return canon_name, data

    # 2. Exact alias match
    for canon_name, data in REFERENCE_RANGES.items():
        for alias in data["aliases"]:
            if cleaned == alias.lower():
                return canon_name, data

    # 3. Normalized alias equality
    for canon_name, data in REFERENCE_RANGES.items():
        for alias in data["aliases"]:
            alias_norm = re.sub(r'[\(\)\[\]\-–_:/,.]+', ' ', alias.lower()).strip()
            if cleaned_norm == alias_norm:
                return canon_name, data

    # 4. Multi-word phrase boundary match (sorted longest first to ensure specific matches precede generic)
    all_candidates: List[Tuple[str, str, Dict[str, Any]]] = []
    for canon_name, data in REFERENCE_RANGES.items():
        for alias in data["aliases"]:
            all_candidates.append((alias, canon_name, data))
            
    # Sort by alias length descending
    all_candidates.sort(key=lambda x: len(x[0]), reverse=True)

    for alias, canon_name, data in all_candidates:
        if len(alias) >= 3:
            pattern = rf"(?i)\b{re.escape(alias)}\b"
            if re.search(pattern, cleaned):
                return canon_name, data

    return None, None
