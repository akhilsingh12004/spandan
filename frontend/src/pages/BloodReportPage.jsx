import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  ArrowLeft, 
  Zap, 
  Sparkles, 
  SlidersHorizontal, 
  PlusCircle, 
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ProcessingOverlay from '../components/ProcessingOverlay'
import Disclaimer from '../components/Disclaimer'
import { predictBloodReport, simulateBloodPrediction } from '../services/api'

const LAB_PRESETS = {
  jaundice: {
    label: 'Jaundice / Liver Function (High Bilirubin, High ALT/AST/ALP)',
    values: {
      'Total Bilirubin': 4.5,
      'Direct Bilirubin': 2.2,
      'Indirect Bilirubin': 2.3,
      'ALT (SGPT)': 68.0,
      'AST (SGOT)': 54.0,
      'Alkaline Phosphatase (ALP)': 215.0,
      Albumin: 3.8,
    }
  },
  anemia: {
    label: 'Anemia Pattern (Low Hb, Low RBC, Low MCV)',
    values: {
      Hemoglobin: 9.8,
      'RBC Count': 3.6,
      'Hematocrit (HCT)': 31.0,
      MCV: 72.0,
      Ferritin: 14.0,
      'Vitamin D (25-OH)': 19.0,
    }
  },
  metabolic: {
    label: 'Cardiometabolic Risk (High Glucose, High LDL, High ALT)',
    values: {
      'Fasting Blood Glucose': 126.0,
      HbA1c: 6.4,
      'Total Cholesterol': 238.0,
      'LDL Cholesterol': 156.0,
      'HDL Cholesterol': 36.0,
      Triglycerides: 210.0,
      'ALT (SGPT)': 68.0,
      'AST (SGOT)': 52.0,
      'C-Reactive Protein (CRP)': 4.2,
    }
  },
  healthy: {
    label: 'Optimal Checkup Profile (All Normal)',
    values: {
      Hemoglobin: 14.8,
      'WBC Count': 6800,
      'RBC Count': 5.1,
      'Platelet Count': 260000,
      'Fasting Blood Glucose': 88.0,
      HbA1c: 5.2,
      'Total Cholesterol': 175.0,
      'LDL Cholesterol': 88.0,
      'HDL Cholesterol': 54.0,
      Triglycerides: 110.0,
      Creatinine: 0.9,
      'ALT (SGPT)': 24.0,
      'AST (SGOT)': 22.0,
      TSH: 2.1,
      'Vitamin D (25-OH)': 42.0,
    }
  }
}

export default function BloodReportPage() {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showManualEditor, setShowManualEditor] = useState(false)
  const [manualParams, setManualParams] = useState([
    { name: 'Hemoglobin', value: '10.4' },
    { name: 'Fasting Blood Glucose', value: '118' },
    { name: 'Total Cholesterol', value: '224' },
    { name: 'LDL Cholesterol', value: '142' },
  ])

  const handleImageSelect = useCallback((imageData) => {
    setSelectedImage(imageData)
  }, [])

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const handleAddParam = () => {
    setManualParams([...manualParams, { name: '', value: '' }])
  }

  const handleRemoveParam = (index) => {
    setManualParams(manualParams.filter((_, i) => i !== index))
  }

  const handleParamChange = (index, field, val) => {
    const next = [...manualParams]
    next[index][field] = val
    setManualParams(next)
  }

  const applyPreset = (key) => {
    const preset = LAB_PRESETS[key]
    if (!preset) return
    const formatted = Object.entries(preset.values).map(([name, val]) => ({
      name,
      value: String(val)
    }))
    setManualParams(formatted)
    setShowManualEditor(true)
  }

  const handleAnalyze = async () => {
    if (!selectedImage && manualParams.filter(p => p.name && p.value).length === 0) {
      return
    }

    setIsProcessing(true)
    setCurrentStep(0)

    // Build manual data map if user specified any
    const manualDataMap = {}
    manualParams.forEach(p => {
      if (p.name.trim() && p.value.trim() && !isNaN(Number(p.value))) {
        manualDataMap[p.name.trim()] = parseFloat(p.value.trim())
      }
    })

    // Step-by-step progress simulation
    const stepIntervals = [350, 500, 650, 700, 750, 500, 350]
    for (let i = 0; i < stepIntervals.length; i++) {
      await new Promise(resolve => setTimeout(resolve, stepIntervals[i]))
      setCurrentStep(i + 1)
    }

    let results
    try {
      const fileToUpload = selectedImage ? selectedImage.file : null
      const manualPayload = Object.keys(manualDataMap).length > 0 ? manualDataMap : null
      results = await predictBloodReport(fileToUpload, manualPayload)
    } catch (error) {
      console.log('Backend blood analysis error or offline, fallback to simulation:', error)
      const contextHint = selectedImage?.file?.name || JSON.stringify(manualDataMap)
      results = simulateBloodPrediction(contextHint)
    }

    // Persist to session storage
    sessionStorage.setItem('analysisResults', JSON.stringify(results))
    sessionStorage.setItem(
      'analysisImage', 
      selectedImage?.preview || (selectedImage?.isPdf ? 'pdf-document' : '/sample_blood_report.png')
    )
    sessionStorage.setItem('analysisModule', 'blood')

    setIsProcessing(false)
    navigate('/results/blood')
  }

  return (
    <>
      <ProcessingOverlay 
        isVisible={isProcessing} 
        variant="blood" 
        currentStep={currentStep} 
      />

      <div className="upload-page" id="blood-report-page">
        <div className="container-narrow">
          {/* Header */}
          <motion.div
            className="upload-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button 
              onClick={() => navigate('/')}
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '24px' }}
              id="back-to-home"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '16px', 
              marginBottom: '16px' 
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)',
              }}>
                <FileText size={28} />
              </div>
            </div>

            <h1 className="text-h1">
              <span className="text-gradient-blood">Blood Test Report</span> Analyzer
            </h1>
            <p style={{ maxWidth: '580px', margin: '0 auto' }}>
              Upload a PDF or photo of your lab test report. We translate complex medical numbers into clear gauges, plain explanations, and an overall Health Score.
            </p>

            {/* Beginner Photo Tip Bar */}
            <div style={{
              margin: '20px auto 0',
              maxWidth: '580px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)'
            }}>
              <span>💡 <strong>Tip:</strong> PDFs or clear photos of paper reports work great. No report handy? Try our 1-click presets or sample below!</span>
            </div>
          </motion.div>

          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <ImageUploader
              variant="blood"
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onRemove={handleRemoveImage}
            />
          </motion.div>

          {/* Quick Presets & Manual Adjustments Drawer */}
          <motion.div
            style={{ marginTop: '24px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SlidersHorizontal size={18} style={{ color: 'var(--accent-amber)' }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                  Need to verify or manually input specific lab values?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualEditor(!showManualEditor)}
                className="btn btn-secondary btn-sm"
                id="toggle-manual-editor"
              >
                {showManualEditor ? 'Hide Parameter Editor' : 'Open Parameter Editor'}
              </button>
            </div>

            <AnimatePresence>
              {showManualEditor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Quick Demonstration Presets:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(LAB_PRESETS).map(([key, p]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => applyPreset(key)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.8125rem' }}
                        >
                          <Sparkles size={13} style={{ color: 'var(--accent-amber)' }} />
                          {p.label.split('(')[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {manualParams.map((param, index) => (
                      <div 
                        key={index}
                        style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                      >
                        <input
                          type="text"
                          placeholder="Test Name (e.g. Hemoglobin, Fasting Blood Glucose, LDL)"
                          value={param.name}
                          onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                          style={{
                            flex: 2,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(index)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '8px', color: 'var(--accent-rose)' }}
                          aria-label="Remove parameter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={handleAddParam}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <PlusCircle size={14} /> Add Another Parameter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Analyze Button */}
          {(selectedImage || manualParams.some(p => p.name && p.value)) && (
            <motion.div
              style={{ textAlign: 'center', marginTop: '32px' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button 
                className="btn btn-blood btn-lg"
                onClick={handleAnalyze}
                id="analyze-blood-btn"
                style={{
                  minWidth: '240px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <Zap size={20} />
                Analyze Blood Report
              </button>
            </motion.div>
          )}

          {/* Instruction Card */}
          <motion.div
            className="glass-card"
            style={{ marginTop: '48px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>
              Common Blood Panels Supported
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {[
                { title: 'Complete Blood Count (CBC)', desc: 'Hemoglobin, WBC, RBC, Platelets, Hematocrit, MCV' },
                { title: 'Lipid Profile', desc: 'Total Cholesterol, LDL, HDL, Triglycerides' },
                { title: 'Blood Sugar & Glycemic', desc: 'Fasting Blood Glucose, Postprandial, HbA1c' },
                { title: 'Liver Function (LFT)', desc: 'ALT (SGPT), AST (SGOT), Bilirubin, Albumin' },
                { title: 'Kidney Function (KFT)', desc: 'Creatinine, BUN, eGFR, Uric Acid' },
                { title: 'Thyroid & Vitamins', desc: 'TSH, T3, T4, Vitamin D (25-OH), Vitamin B12' },
                { title: 'Electrolytes & Inflammation', desc: 'Sodium, Potassium, Chloride, CRP, ESR' },
              ].map(panel => (
                <div 
                  key={panel.title}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '4px' }}>
                    {panel.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {panel.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Disclaimer */}
          <div style={{ marginTop: '32px' }}>
            <Disclaimer />
          </div>
        </div>
      </div>
    </>
  )
}
