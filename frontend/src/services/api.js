import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for model inference
})

/**
 * Predict cardiac condition from ECG image
 * @param {File} imageFile - The ECG image file
 * @returns {Promise} - Prediction results
 */
export async function predictCardiac(imageFile) {
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await api.post('/api/predict/cardiac', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Predict skin condition from skin photo
 * @param {File} imageFile - The skin photo file
 * @returns {Promise} - Prediction results
 */
export async function predictSkin(imageFile) {
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await api.post('/api/predict/skin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Predict condition and evaluate blood test report (image or PDF or manual inputs)
 * @param {File|null} file - The uploaded PDF or image
 * @param {Object|null} manualData - Optional manual parameters { "Hemoglobin": 11.2, ... }
 * @returns {Promise} - Prediction & interpretation results
 */
export async function predictBloodReport(file = null, manualData = null) {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }
  if (manualData && Object.keys(manualData).length > 0) {
    formData.append('manual_data', JSON.stringify(manualData))
  }

  const response = await api.post('/api/predict/blood', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Fetch master blood test reference ranges and panels
 */
export async function fetchBloodReferenceRanges() {
  const response = await api.get('/api/blood/reference-ranges')
  return response.data
}

/**
 * Automatically detect module from uploaded file
 */
export async function autoDetectModule(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/api/detect-module', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
  const response = await api.get('/api/health')
  return response.data
}

/**
 * Simulate prediction for demo mode (when backend is not available)
 */
export function simulateCardiacPrediction() {
  const diseases = [
    { name: 'Normal Sinus Rhythm', category: 'Rhythm & Arrhythmias', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: false, confidence: 0.05 + Math.random() * 0.15 },
    { name: 'Atrial Fibrillation (AFib)', category: 'Rhythm & Arrhythmias', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: false, confidence: 0.02 + Math.random() * 0.1 },
    { name: 'Sinus Tachycardia', category: 'Rhythm & Arrhythmias', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: false, confidence: 0.02 + Math.random() * 0.08 },
    { name: 'Ventricular Tachycardia', category: 'Rhythm & Arrhythmias', tier: 'Core Tier', supportLevel: 'Moderate (400)', requiresSpecialistReview: true, confidence: 0.01 + Math.random() * 0.06 },
    { name: 'Myocardial Infarction (STEMI)', category: 'Ischemia & Infarction', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: true, confidence: 0.01 + Math.random() * 0.05 },
    { name: 'Wolff-Parkinson-White Syndrome (WPW)', category: 'Conduction & Pre-Excitation', tier: 'Extended Tier', supportLevel: 'Sparse (<300)', requiresSpecialistReview: true, confidence: 0.01 + Math.random() * 0.04 },
    { name: 'Brugada Syndrome', category: 'Channelopathies, Electrolyte & Inflammatory', tier: 'Extended Tier', supportLevel: 'Sparse (<200)', requiresSpecialistReview: true, confidence: 0.005 + Math.random() * 0.03 },
    { name: 'Supraventricular Tachycardia (SVT)', category: 'Rhythm & Arrhythmias', tier: 'Extended Tier', supportLevel: 'Moderate (500)', requiresSpecialistReview: false, confidence: 0.005 + Math.random() * 0.03 },
    { name: 'Hyperkalemia (Electrolyte Imbalance)', category: 'Channelopathies, Electrolyte & Inflammatory', tier: 'Extended Tier', supportLevel: 'Moderate (350)', requiresSpecialistReview: true, confidence: 0.005 + Math.random() * 0.02 },
    { name: 'Pericarditis', category: 'Channelopathies, Electrolyte & Inflammatory', tier: 'Extended Tier', supportLevel: 'Moderate (300)', requiresSpecialistReview: false, confidence: 0.005 + Math.random() * 0.02 },
  ]

  const topIndex = Math.floor(Math.random() * 3)
  diseases[topIndex].confidence = 0.74 + Math.random() * 0.18

  const total = diseases.reduce((sum, d) => sum + d.confidence, 0)
  diseases.forEach(d => d.confidence = d.confidence / total)
  diseases.sort((a, b) => b.confidence - a.confidence)

  const topPred = diseases[0]

  const signalLength = 1000
  const signal = []
  for (let i = 0; i < signalLength; i++) {
    const t = i / signalLength
    const p = 0.15 * Math.exp(-Math.pow((t % 0.8 - 0.1) * 20, 2))
    const q = -0.1 * Math.exp(-Math.pow((t % 0.8 - 0.22) * 40, 2))
    const r = 1.0 * Math.exp(-Math.pow((t % 0.8 - 0.25) * 50, 2))
    const s = -0.2 * Math.exp(-Math.pow((t % 0.8 - 0.28) * 40, 2))
    const tWave = 0.3 * Math.exp(-Math.pow((t % 0.8 - 0.45) * 15, 2))
    const noise = (Math.random() - 0.5) * 0.02
    signal.push(p + q + r + s + tWave + noise)
  }

  return {
    module: 'cardiac',
    predictions: diseases,
    topCondition: topPred.name,
    topConfidence: topPred.confidence,
    topCategory: topPred.category,
    tier: topPred.tier,
    supportLevel: topPred.supportLevel,
    requiresSpecialistReview: topPred.requiresSpecialistReview,
    ecgSignal: signal,
    metrics: {
      heartRate: 60 + Math.floor(Math.random() * 40),
      rrInterval: (700 + Math.floor(Math.random() * 300)) + ' ms',
      qtInterval: (350 + Math.floor(Math.random() * 100)) + ' ms',
      hrv: (20 + Math.floor(Math.random() * 40)) + ' ms',
      prInterval: (120 + Math.floor(Math.random() * 80)) + ' ms',
      qrsDuration: (80 + Math.floor(Math.random() * 40)) + ' ms',
    },
    processingTime: (1.2 + Math.random() * 1.5).toFixed(2) + 's',
  }
}

export function simulateSkinPrediction() {
  const diseases = [
    { name: 'Melanocytic Nevus (Mole)', category: 'Neoplastic & Pre-Malignant', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: false, confidence: 0.05 + Math.random() * 0.15 },
    { name: 'Melanoma', category: 'Neoplastic & Pre-Malignant', tier: 'Core Tier', supportLevel: 'High Risk / Specialist Flag', requiresSpecialistReview: true, confidence: 0.02 + Math.random() * 0.08 },
    { name: 'Basal Cell Carcinoma', category: 'Neoplastic & Pre-Malignant', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: true, confidence: 0.02 + Math.random() * 0.06 },
    { name: 'Herpes Zoster (Shingles)', category: 'Infectious (Viral)', tier: 'Extended Tier', supportLevel: 'Moderate (600)', requiresSpecialistReview: false, confidence: 0.02 + Math.random() * 0.05 },
    { name: 'Lichen Planus', category: 'Inflammatory & Autoimmune', tier: 'Extended Tier', supportLevel: 'Sparse (<300)', requiresSpecialistReview: true, confidence: 0.01 + Math.random() * 0.04 },
    { name: 'Seborrheic Dermatitis', category: 'Inflammatory & Autoimmune', tier: 'Extended Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: false, confidence: 0.01 + Math.random() * 0.04 },
    { name: 'Molluscum Contagiosum', category: 'Infectious (Viral)', tier: 'Extended Tier', supportLevel: 'Sparse (<250)', requiresSpecialistReview: true, confidence: 0.01 + Math.random() * 0.03 },
    { name: 'Cellulitis', category: 'Infectious (Bacterial)', tier: 'Extended Tier', supportLevel: 'Critical / Specialist Flag', requiresSpecialistReview: true, confidence: 0.005 + Math.random() * 0.03 },
    { name: 'Eczema', category: 'Inflammatory & Autoimmune', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: false, confidence: 0.005 + Math.random() * 0.03 },
    { name: 'Psoriasis', category: 'Inflammatory & Autoimmune', tier: 'Core Tier', supportLevel: 'Data-Rich (>1000)', requiresSpecialistReview: false, confidence: 0.005 + Math.random() * 0.02 },
  ]

  const topIndex = Math.floor(Math.random() * 3)
  diseases[topIndex].confidence = 0.72 + Math.random() * 0.2

  const total = diseases.reduce((sum, d) => sum + d.confidence, 0)
  diseases.forEach(d => d.confidence = d.confidence / total)
  diseases.sort((a, b) => b.confidence - a.confidence)

  const topPred = diseases[0]

  return {
    module: 'skin',
    predictions: diseases,
    topCondition: topPred.name,
    topConfidence: topPred.confidence,
    topCategory: topPred.category,
    tier: topPred.tier,
    supportLevel: topPred.supportLevel,
    requiresSpecialistReview: topPred.requiresSpecialistReview,
    segmentationMetrics: {
      asymmetryIndex: 0.18,
      borderIrregularity: 0.22,
      estimatedDiameterPx: 78,
    },
    processingTime: (0.8 + Math.random() * 1.2).toFixed(2) + 's',
  }
}

export function simulateBloodPrediction() {
  const parameters = [
    { canonicalName: 'Hemoglobin', value: 10.4, unit: 'g/dL', refLow: 13.5, refHigh: 17.5, status: 'LOW', panel: 'Complete Blood Count (CBC)', significance: 'Oxygen delivery in blood; low indicates anemia', deviationPercent: -23.0 },
    { canonicalName: 'WBC Count', value: 12400, unit: '/µL', refLow: 4000, refHigh: 11000, status: 'HIGH', panel: 'Complete Blood Count (CBC)', significance: 'Immune defense; high indicates infection or inflammation', deviationPercent: 12.7 },
    { canonicalName: 'RBC Count', value: 3.8, unit: 'M/µL', refLow: 4.5, refHigh: 5.9, status: 'LOW', panel: 'Complete Blood Count (CBC)', significance: 'Total red blood cells circulating', deviationPercent: -15.6 },
    { canonicalName: 'Platelet Count', value: 240000, unit: '/µL', refLow: 150000, refHigh: 450000, status: 'NORMAL', panel: 'Complete Blood Count (CBC)', significance: 'Clotting and hemostasis', deviationPercent: 0 },
    { canonicalName: 'Hematocrit (HCT)', value: 32.5, unit: '%', refLow: 41.0, refHigh: 50.0, status: 'LOW', panel: 'Complete Blood Count (CBC)', significance: 'Percentage volume of red blood cells in blood', deviationPercent: -20.7 },
    { canonicalName: 'MCV', value: 74.0, unit: 'fL', refLow: 80.0, refHigh: 100.0, status: 'LOW', panel: 'Complete Blood Count (CBC)', significance: 'Average red blood cell size; low indicates microcytosis', deviationPercent: -7.5 },
    { canonicalName: 'Total Cholesterol', value: 224, unit: 'mg/dL', refLow: 125, refHigh: 200, status: 'HIGH', panel: 'Lipid Profile', significance: 'Total circulating blood cholesterol', deviationPercent: 12.0 },
    { canonicalName: 'LDL Cholesterol', value: 142, unit: 'mg/dL', refLow: 0, refHigh: 100, status: 'HIGH', panel: 'Lipid Profile', significance: 'Atherogenic lipoprotein ("bad" cholesterol)', deviationPercent: 42.0 },
    { canonicalName: 'HDL Cholesterol', value: 38, unit: 'mg/dL', refLow: 40, refHigh: 60, status: 'LOW', panel: 'Lipid Profile', significance: 'Cardioprotective lipoprotein ("good" cholesterol)', deviationPercent: -5.0 },
    { canonicalName: 'Triglycerides', value: 185, unit: 'mg/dL', refLow: 0, refHigh: 150, status: 'HIGH', panel: 'Lipid Profile', significance: 'Blood lipids stored in fat cells', deviationPercent: 23.3 },
    { canonicalName: 'Fasting Blood Glucose', value: 118, unit: 'mg/dL', refLow: 70, refHigh: 99, status: 'HIGH', panel: 'Blood Sugar & Glycemic', significance: 'Baseline metabolic glucose levels', deviationPercent: 19.2 },
    { canonicalName: 'HbA1c', value: 6.1, unit: '%', refLow: 4.0, refHigh: 5.6, status: 'HIGH', panel: 'Blood Sugar & Glycemic', significance: '3-month average blood glucose control', deviationPercent: 8.9 },
    { canonicalName: 'ALT (SGPT)', value: 64, unit: 'U/L', refLow: 7, refHigh: 56, status: 'HIGH', panel: 'Liver Function Test (LFT)', significance: 'Liver-specific transaminase enzyme', deviationPercent: 14.3 },
    { canonicalName: 'AST (SGOT)', value: 48, unit: 'U/L', refLow: 10, refHigh: 40, status: 'HIGH', panel: 'Liver Function Test (LFT)', significance: 'Transaminase enzyme in liver and heart', deviationPercent: 20.0 },
    { canonicalName: 'Total Bilirubin', value: 0.9, unit: 'mg/dL', refLow: 0.2, refHigh: 1.2, status: 'NORMAL', panel: 'Liver Function Test (LFT)', significance: 'Heme breakdown product', deviationPercent: 0 },
    { canonicalName: 'Creatinine', value: 0.95, unit: 'mg/dL', refLow: 0.7, refHigh: 1.3, status: 'NORMAL', panel: 'Kidney Function Test (KFT)', significance: 'Muscle breakdown byproduct cleared by kidneys', deviationPercent: 0 },
    { canonicalName: 'TSH', value: 3.2, unit: 'mIU/L', refLow: 0.4, refHigh: 4.0, status: 'NORMAL', panel: 'Thyroid Panel', significance: 'Pituitary signal regulating thyroid hormone output', deviationPercent: 0 },
    { canonicalName: 'Vitamin D (25-OH)', value: 18.0, unit: 'ng/mL', refLow: 30.0, refHigh: 100.0, status: 'LOW', panel: 'Vitamins & Minerals', significance: 'Bone density, immunity, and endocrine support', deviationPercent: -40.0 },
    { canonicalName: 'C-Reactive Protein (CRP)', value: 4.8, unit: 'mg/L', refLow: 0, refHigh: 3.0, status: 'HIGH', panel: 'Inflammatory Markers', significance: 'Acute systemic inflammation biomarker', deviationPercent: 60.0 }
  ]

  const conditions = [
    {
      condition: 'Microcytic Anemia Pattern',
      likelihood: 'High',
      severity: 'Moderate',
      rationale: 'Hemoglobin (10.4 g/dL), RBC (3.8 M/µL), and MCV (74.0 fL) are below reference ranges, characteristic of microcytic/iron-deficiency anemia.',
      primaryIndicators: ['Hemoglobin', 'RBC Count', 'Hematocrit (HCT)', 'MCV']
    },
    {
      condition: 'Dyslipidemia & Cardiovascular Risk',
      likelihood: 'High',
      severity: 'Moderate',
      rationale: 'Elevated Total Cholesterol (224 mg/dL), LDL (142 mg/dL), Triglycerides (185 mg/dL), and low HDL (38 mg/dL) demonstrate an atherogenic lipid pattern.',
      primaryIndicators: ['Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides']
    },
    {
      condition: 'Prediabetes / Impaired Fasting Glucose',
      likelihood: 'High',
      severity: 'Mild',
      rationale: 'Fasting Blood Glucose (118 mg/dL) and HbA1c (6.1%) fall into the impaired fasting glycemia/prediabetic diagnostic zone.',
      primaryIndicators: ['Fasting Blood Glucose', 'HbA1c']
    },
    {
      condition: 'Hypovitaminosis D',
      likelihood: 'High',
      severity: 'Mild',
      rationale: '25-OH Vitamin D is 18.0 ng/mL, well below the optimal 30 ng/mL benchmark.',
      primaryIndicators: ['Vitamin D (25-OH)']
    },
    {
      condition: 'Mild Hepatic Strain (Elevated Transaminases)',
      likelihood: 'Moderate',
      severity: 'Mild',
      rationale: 'Concomitant elevation in ALT (64 U/L) and AST (48 U/L) indicates mild hepatocellular stress.',
      primaryIndicators: ['ALT (SGPT)', 'AST (SGOT)']
    },
    {
      condition: 'Systemic Inflammatory Response',
      likelihood: 'High',
      severity: 'Mild',
      rationale: 'Elevated CRP (4.8 mg/L) combined with leukocytosis (WBC 12,400 /µL) reflects active inflammation.',
      primaryIndicators: ['C-Reactive Protein (CRP)', 'WBC Count']
    }
  ]

  return {
    module: 'blood',
    parameters,
    conditions,
    summary: {
      totalEvaluated: parameters.length,
      abnormalCount: 11,
      criticalCount: 0,
      normalCount: 8,
      healthScore: 68,
      overallStatus: 'Abnormalities Detected',
      doctorConsultationRecommended: true
    },
    rawTextExtracted: 'Simulated multi-panel automated laboratory analysis.',
    processingTime: '0.85s',
    disclaimer: 'This tool is for educational and decision-support purposes only and is not a substitute for professional medical diagnosis. Always consult a qualified healthcare provider.'
  }
}

export default api

