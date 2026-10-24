import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeft, 
  AlertTriangle, 
  Check, 
  Trash2, 
  Plus, 
  Info,
  HeartPulse
} from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ProcessingOverlay from '../components/ProcessingOverlay'
import Disclaimer from '../components/Disclaimer'
import ConsentBox from '../components/ConsentBox'
import { useLanguage } from '../LanguageContext'
import { 
  extractBloodParameters, 
  analyzeComprehensiveBlood, 
  simulateBloodPrediction 
} from '../services/api'
import { TEST_PLAIN_NAMES } from '../translations'

const COMMON_TEST_OPTIONS = [
  { name: 'Hemoglobin', unit: 'g/dL', normal: '12.0 - 17.5 g/dL' },
  { name: 'Fasting Blood Glucose', unit: 'mg/dL', normal: '70 - 99 mg/dL' },
  { name: 'HbA1c', unit: '%', normal: '4.0 - 5.6 %' },
  { name: 'Total Cholesterol', unit: 'mg/dL', normal: '100 - 200 mg/dL' },
  { name: 'LDL Cholesterol', unit: 'mg/dL', normal: '< 100 mg/dL' },
  { name: 'HDL Cholesterol', unit: 'mg/dL', normal: '> 40 mg/dL' },
  { name: 'Triglycerides', unit: 'mg/dL', normal: '< 150 mg/dL' },
  { name: 'Creatinine', unit: 'mg/dL', normal: '0.6 - 1.3 mg/dL' },
  { name: 'Total Bilirubin', unit: 'mg/dL', normal: '0.2 - 1.2 mg/dL' },
  { name: 'ALT (SGPT)', unit: 'U/L', normal: '7 - 56 U/L' },
  { name: 'AST (SGOT)', unit: 'U/L', normal: '10 - 40 U/L' },
  { name: 'TSH', unit: 'mIU/L', normal: '0.4 - 4.5 mIU/L' },
  { name: 'Platelet Count', unit: '/mcL', normal: '150,000 - 450,000 /mcL' },
  { name: 'WBC Count', unit: '/mcL', normal: '4,000 - 11,000 /mcL' },
  { name: 'Vitamin D (25-OH)', unit: 'ng/mL', normal: '30 - 100 ng/mL' },
  { name: 'Vitamin B12', unit: 'pg/mL', normal: '200 - 900 pg/mL' }
]

export default function BloodReportPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  // Steps: 1 = Add report, 2 = Tell us about you, 3 = Check numbers
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1: Upload state
  const [selectedImage, setSelectedImage] = useState(null)
  const [isManualMode, setIsManualMode] = useState(false)
  const [consentAgreed, setConsentAgreed] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  // Step 2: About you state
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('Female')
  const [fasting, setFasting] = useState('Yes (8+ hours)')
  const [pregnant, setPregnant] = useState('No')
  const [symptoms, setSymptoms] = useState([])
  const [medications, setMedications] = useState('')

  // Step 3: Verified test numbers
  const [testRows, setTestRows] = useState([
    { id: '1', name: 'Hemoglobin', value: '10.4', unit: 'g/dL', normal: '12.0 - 17.5 g/dL' },
    { id: '2', name: 'Fasting Blood Glucose', value: '118', unit: 'mg/dL', normal: '70 - 99 mg/dL' },
    { id: '3', name: 'Total Cholesterol', value: '224', unit: 'mg/dL', normal: '100 - 200 mg/dL' },
    { id: '4', name: 'LDL Cholesterol', value: '142', unit: 'mg/dL', normal: '< 100 mg/dL' }
  ])

  const [showAddMenu, setShowAddMenu] = useState(false)

  // Handle image selection
  const handleImageSelect = useCallback((imageData) => {
    setSelectedImage(imageData)
    setIsManualMode(false)
  }, [])

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null)
  }, [])

  // Toggle symptom checkbox
  const toggleSymptom = (sym) => {
    setSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    )
  }

  // Step 1 -> Step 2 transition
  const handleProceedFromUpload = async () => {
    if (!consentAgreed) return
    if (!selectedImage && !isManualMode) return

    if (selectedImage && selectedImage.file) {
      setIsExtracting(true)
      try {
        const extraction = await extractBloodParameters(selectedImage.file)
        if (extraction && extraction.parameters && extraction.parameters.length > 0) {
          const mapped = extraction.parameters.map((p, idx) => {
            const canonical = p.canonicalName || p.name || 'Test'
            const foundOpt = COMMON_TEST_OPTIONS.find(o => o.name.toLowerCase() === canonical.toLowerCase())
            return {
              id: String(idx + 1),
              name: canonical,
              value: String(p.value),
              unit: p.unit || foundOpt?.unit || '',
              normal: foundOpt?.normal || (p.refLow !== undefined ? `${p.refLow} - ${p.refHigh}` : 'Check report')
            }
          })
          setTestRows(mapped)
        }
      } catch (err) {
        console.warn('Extraction fallback:', err)
      } finally {
        setIsExtracting(false)
      }
    }

    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 2 -> Step 3
  const handleProceedToReview = () => {
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 3 Row operations
  const handleValueChange = (id, newVal) => {
    setTestRows(prev => prev.map(row => row.id === id ? { ...row, value: newVal } : row))
  }

  const handleDeleteRow = (id) => {
    setTestRows(prev => prev.filter(row => row.id !== id))
  }

  const handleAddTest = (option) => {
    if (testRows.some(r => r.name.toLowerCase() === option.name.toLowerCase())) {
      setShowAddMenu(false)
      return
    }
    setTestRows(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: option.name,
        value: '',
        unit: option.unit,
        normal: option.normal
      }
    ])
    setShowAddMenu(false)
  }

  // Final submit to results
  const handleFinalSubmit = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    const stepIntervals = [350, 450, 600, 650, 700, 450, 350]
    for (let i = 0; i < stepIntervals.length; i++) {
      await new Promise(resolve => setTimeout(resolve, stepIntervals[i]))
      setProcessingProgress(i + 1)
    }

    const verifiedMap = {}
    testRows.forEach(row => {
      const val = parseFloat(row.value)
      if (row.name && !isNaN(val)) {
        verifiedMap[row.name] = val
      }
    })

    const patientContextPayload = {
      age: age ? parseInt(age, 10) : undefined,
      sex: sex,
      fasting: fasting,
      pregnancy: sex === 'Female' ? pregnant : 'No',
      symptoms: symptoms.join(', '),
      medications: medications
    }

    let results
    try {
      results = await analyzeComprehensiveBlood(verifiedMap, patientContextPayload)
    } catch (err) {
      console.warn('Backend not available, using simulated results:', err)
      results = simulateBloodPrediction(verifiedMap, patientContextPayload)
    }

    sessionStorage.setItem('analysisResults', JSON.stringify(results))
    if (selectedImage?.preview) {
      sessionStorage.setItem('analysisImage', selectedImage.preview)
    } else {
      sessionStorage.removeItem('analysisImage')
    }
    sessionStorage.setItem('analysisModule', 'blood')
    sessionStorage.setItem('patientContext', JSON.stringify(patientContextPayload))

    setIsProcessing(false)
    navigate('/results/blood')
  }

  return (
    <>
      <ProcessingOverlay 
        isVisible={isProcessing || isExtracting} 
        variant="blood" 
        currentStep={processingProgress} 
      />

      <div className="upload-page" id="blood-report-page">
        <div className="container">
          
          {/* Back button */}
          <button 
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                navigate('/')
              }
            }}
            className="upload-back-link"
            id="blood-back-btn"
          >
            <ArrowLeft size={16} />
            {t('back')}
          </button>

          {/* ══════════════════════════════════════════════════
              STEP 1: Add Blood Test Report
             ══════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div>
              <div className="step-tracker">
                <span className="step-indicator">Step 1 of 3: Add report</span>
              </div>

              <h1 className="upload-page-title">{t('bloodStep1Title')}</h1>
              <p className="upload-page-desc">{t('bloodStep1Desc')}</p>

              {/* Upload area or manual toggle */}
              {!isManualMode ? (
                <div>
                  <ImageUploader
                    variant="blood"
                    onImageSelect={handleImageSelect}
                    selectedImage={selectedImage}
                    onRemove={handleRemoveImage}
                  />

                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setIsManualMode(true)}
                      className="link-button"
                      id="type-numbers-instead-btn"
                    >
                      {t('bloodTypeNumbersLink')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ marginBottom: '8px', fontSize: '1.125rem' }}>Typing numbers mode</h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    You can enter your numbers directly on the next step.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsManualMode(false)}
                    className="link-button"
                    id="switch-back-upload-btn"
                  >
                    {t('bloodUploadReportLink')}
                  </button>
                </div>
              )}

              {/* Consent Box */}
              {(selectedImage || isManualMode) && (
                <div style={{ marginTop: '20px' }}>
                  <ConsentBox
                    agreed={consentAgreed}
                    onChange={setConsentAgreed}
                    id="blood-consent-check"
                  />
                </div>
              )}

              {/* Continue Button */}
              {(selectedImage || isManualMode) && (
                <div style={{ marginTop: '20px' }}>
                  <button
                    className="btn btn-primary btn-full btn-lg"
                    onClick={handleProceedFromUpload}
                    disabled={!consentAgreed}
                    id="blood-step1-continue-btn"
                    style={{
                      opacity: consentAgreed ? 1 : 0.5,
                      cursor: consentAgreed ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {t('continueBtn')}
                  </button>
                  {!consentAgreed && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                      Please check the box above to continue
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              STEP 2: Tell Us A Little About You
             ══════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div>
              <div className="step-tracker">
                <span className="step-indicator">Step 2 of 3: About you</span>
                <button 
                  onClick={handleProceedToReview}
                  className="step-skip-btn"
                  id="skip-about-you-btn"
                >
                  {t('skipStep')}
                </button>
              </div>

              <h1 className="upload-page-title">{t('bloodStep2Title')}</h1>
              <p className="upload-page-desc">{t('bloodStep2Desc')}</p>

              <div style={{ marginTop: '24px' }}>
                {/* 1. Age */}
                <div className="form-group">
                  <label className="form-label" htmlFor="patient-age">
                    {t('ageLabel')}
                  </label>
                  <input
                    type="number"
                    id="patient-age"
                    className="form-input"
                    placeholder={t('agePlaceholder')}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                  />
                </div>

                {/* 2. Male / Female */}
                <div className="form-group">
                  <label className="form-label">
                    {t('sexLabel')}
                  </label>
                  <div className="tap-toggle-group">
                    <button
                      type="button"
                      className={`tap-toggle-btn ${sex === 'Female' ? 'active' : ''}`}
                      onClick={() => setSex('Female')}
                      id="sex-female-btn"
                    >
                      {t('female')}
                    </button>
                    <button
                      type="button"
                      className={`tap-toggle-btn ${sex === 'Male' ? 'active' : ''}`}
                      onClick={() => setSex('Male')}
                      id="sex-male-btn"
                    >
                      {t('male')}
                    </button>
                  </div>
                </div>

                {/* 3. Fasting */}
                <div className="form-group">
                  <label className="form-label">
                    {t('fastingLabel')}
                  </label>
                  <div className="tap-toggle-group">
                    <button
                      type="button"
                      className={`tap-toggle-btn ${fasting === 'Yes (8+ hours)' ? 'active' : ''}`}
                      onClick={() => setFasting('Yes (8+ hours)')}
                      id="fasting-yes-btn"
                    >
                      {t('fastingYes')}
                    </button>
                    <button
                      type="button"
                      className={`tap-toggle-btn ${fasting === 'No (ate food)' ? 'active' : ''}`}
                      onClick={() => setFasting('No (ate food)')}
                      id="fasting-no-btn"
                    >
                      {t('fastingNo')}
                    </button>
                    <button
                      type="button"
                      className={`tap-toggle-btn ${fasting === 'Not sure' ? 'active' : ''}`}
                      onClick={() => setFasting('Not sure')}
                      id="fasting-unsure-btn"
                    >
                      {t('fastingNotSure')}
                    </button>
                  </div>
                </div>

                {/* 4. Pregnant (Shown only if Female) */}
                {sex === 'Female' && (
                  <div className="form-group">
                    <label className="form-label">
                      {t('pregnantLabel')}
                    </label>
                    <div className="tap-toggle-group">
                      <button
                        type="button"
                        className={`tap-toggle-btn ${pregnant === 'No' ? 'active' : ''}`}
                        onClick={() => setPregnant('No')}
                        id="pregnant-no-btn"
                      >
                        {t('no')}
                      </button>
                      <button
                        type="button"
                        className={`tap-toggle-btn ${pregnant === 'Yes' ? 'active' : ''}`}
                        onClick={() => setPregnant('Yes')}
                        id="pregnant-yes-btn"
                      >
                        {t('yes')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Any troubles */}
                <div className="form-group">
                  <label className="form-label">
                    {t('troublesLabel')}
                  </label>
                  <div className="checkbox-list">
                    {[
                      { key: 'tired', text: t('troubleTired') },
                      { key: 'breath', text: t('troubleBreath') },
                      { key: 'chest', text: t('troubleChest') },
                      { key: 'dizzy', text: t('troubleDizzy') },
                      { key: 'thirst', text: t('troubleThirst') },
                      { key: 'swelling', text: t('troubleSwelling') },
                    ].map(item => {
                      const isChecked = symptoms.includes(item.text)
                      return (
                        <label 
                          key={item.key} 
                          className={`checkbox-card ${isChecked ? 'checked' : ''}`}
                          htmlFor={`trouble-${item.key}`}
                        >
                          <input
                            type="checkbox"
                            id={`trouble-${item.key}`}
                            className="checkbox-input"
                            checked={isChecked}
                            onChange={() => toggleSymptom(item.text)}
                          />
                          <span className="checkbox-label-text">{item.text}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* 6. Medicines */}
                <div className="form-group">
                  <label className="form-label" htmlFor="patient-meds">
                    {t('medsLabel')}
                  </label>
                  <input
                    type="text"
                    id="patient-meds"
                    className="form-input"
                    placeholder={t('medsPlaceholder')}
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                  />
                </div>

                {/* Buttons */}
                <div style={{ marginTop: '24px' }}>
                  <button
                    className="btn btn-primary btn-full btn-lg"
                    onClick={handleProceedToReview}
                    id="about-you-continue-btn"
                  >
                    {t('continueBtn')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              STEP 3: Check These Numbers ("Does this match your report?")
             ══════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div>
              <div className="step-tracker">
                <span className="step-indicator">Step 3 of 3: Check numbers</span>
              </div>

              <h1 className="upload-page-title">{t('bloodReviewTitle')}</h1>
              <p className="upload-page-desc">{t('bloodReviewDesc')}</p>

              {/* Review Table */}
              <div className="review-table-container" style={{ marginTop: '20px' }}>
                {testRows.map((row) => {
                  const plainInfo = TEST_PLAIN_NAMES[row.name]
                  const displayName = lang === 'hi' && plainInfo?.hiName 
                    ? plainInfo.hiName 
                    : plainInfo?.name || row.name

                  return (
                    <div key={row.id} className="review-table-row">
                      <div className="review-row-info">
                        <span className="review-row-name">{displayName}</span>
                        <span className="review-row-range">Normal: {row.normal}</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="review-row-input"
                        value={row.value}
                        onChange={(e) => handleValueChange(row.id, e.target.value)}
                        placeholder="0.0"
                        aria-label={`Value for ${displayName}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        className="review-row-delete"
                        title="Delete test"
                        aria-label={`Remove ${displayName}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Add another test */}
              <div style={{ marginBottom: '24px' }}>
                {!showAddMenu ? (
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(true)}
                    className="btn btn-secondary btn-full"
                    id="add-test-button"
                  >
                    <Plus size={16} />
                    {t('addNewTest')}
                  </button>
                ) : (
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '1rem' }}>Select a test to add:</strong>
                      <button 
                        type="button"
                        onClick={() => setShowAddMenu(false)}
                        className="link-button"
                        style={{ fontSize: '0.875rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                      {COMMON_TEST_OPTIONS.filter(opt => !testRows.some(r => r.name.toLowerCase() === opt.name.toLowerCase())).map(opt => {
                        const plainInfo = TEST_PLAIN_NAMES[opt.name]
                        const label = lang === 'hi' && plainInfo?.hiName ? plainInfo.hiName : plainInfo?.name || opt.name
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => handleAddTest(opt)}
                            className="btn btn-secondary btn-sm"
                            style={{ justifyContent: 'space-between', textAlign: 'left', padding: '10px 14px' }}
                          >
                            <span>{label}</span>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{opt.normal}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* See my results Button */}
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleFinalSubmit}
                id="blood-submit-results-btn"
                disabled={testRows.filter(r => r.value.trim() !== '').length === 0}
              >
                {t('seeMyResults')}
              </button>
            </div>
          )}

          {/* Disclaimer at bottom */}
          <Disclaimer />
        </div>
      </div>
    </>
  )
}
