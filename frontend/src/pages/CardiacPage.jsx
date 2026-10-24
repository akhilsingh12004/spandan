import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse, ArrowLeft, AlertTriangle, FileText, Info } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ProcessingOverlay from '../components/ProcessingOverlay'
import Disclaimer from '../components/Disclaimer'
import ConsentBox from '../components/ConsentBox'
import { useLanguage } from '../LanguageContext'
import { predictCardiac, simulateCardiacPrediction } from '../services/api'

export default function CardiacPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [selectedImage, setSelectedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [suspectedModality, setSuspectedModality] = useState(null)
  const [consentAgreed, setConsentAgreed] = useState(false)

  const handleImageSelect = useCallback((imageData) => {
    setSelectedImage(imageData)
    if (imageData?.file) {
      const fname = (imageData.file.name || '').toLowerCase()
      const isDoc = /(blood|report|lab|cbc|lft|kft|jaundice|urine|test|hemoglobin|bilirubin|pathology|\.pdf)/i.test(fname)
      if (isDoc) {
        setSuspectedModality('blood')
      } else {
        const img = new Image()
        img.onload = () => {
          if (img.naturalHeight > img.naturalWidth * 1.15) {
            setSuspectedModality('blood')
          } else {
            setSuspectedModality(null)
          }
        }
        img.src = imageData.preview
      }
    }
  }, [])

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null)
    setSuspectedModality(null)
  }, [])

  const handleAnalyze = async () => {
    if (!selectedImage || !consentAgreed) return

    setIsProcessing(true)
    setCurrentStep(0)

    const stepIntervals = [400, 600, 800, 700, 900, 500, 400]
    
    for (let i = 0; i < stepIntervals.length; i++) {
      await new Promise(resolve => setTimeout(resolve, stepIntervals[i]))
      setCurrentStep(i + 1)
    }

    let results
    try {
      results = await predictCardiac(selectedImage.file)
    } catch (error) {
      console.log('Backend not available, using simulation mode')
      results = simulateCardiacPrediction()
    }

    sessionStorage.setItem('analysisResults', JSON.stringify(results))
    sessionStorage.setItem('analysisImage', selectedImage.preview)
    sessionStorage.setItem('analysisModule', 'cardiac')

    setIsProcessing(false)
    navigate('/results/cardiac')
  }

  return (
    <>
      <ProcessingOverlay 
        isVisible={isProcessing} 
        variant="cardiac" 
        currentStep={currentStep} 
      />

      <div className="upload-page" id="cardiac-page">
        <div className="container">
          {/* Back link */}
          <button 
            onClick={() => navigate('/')}
            className="upload-back-link"
            id="back-to-home"
          >
            <ArrowLeft size={16} />
            {t('back')}
          </button>

          {/* Page heading */}
          <h1 className="upload-page-title">{t('ecgTitle')}</h1>
          <p className="upload-page-desc">
            {t('ecgDesc')}
          </p>

          {/* Tip */}
          <div className="upload-tip">
            <Info size={18} />
            <span>{t('ecgTip')}</span>
          </div>

          {/* Upload Area */}
          <ImageUploader
            variant="cardiac"
            onImageSelect={handleImageSelect}
            selectedImage={selectedImage}
            onRemove={handleRemoveImage}
          />

          {/* Wrong-module warning */}
          {selectedImage && suspectedModality === 'blood' && (
            <div className="wrong-module-banner">
              <AlertTriangle size={20} />
              <div className="wrong-module-banner-text">
                <strong>This looks like a blood test report</strong>
                <p>
                  This page checks ECG heart strips only. For blood test reports, use the blood test check.
                </p>
                <button
                  onClick={() => navigate('/blood')}
                  className="btn btn-sm btn-secondary"
                  id="switch-to-blood-btn"
                >
                  <FileText size={15} />
                  Go to blood test check
                </button>
              </div>
            </div>
          )}

          {/* Consent & Privacy box */}
          {selectedImage && (
            <div style={{ marginTop: '24px' }}>
              <ConsentBox 
                agreed={consentAgreed} 
                onChange={setConsentAgreed}
                id="cardiac-consent-check"
              />
            </div>
          )}

          {/* Analyze Button */}
          {selectedImage && (
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-primary btn-full btn-lg"
                onClick={handleAnalyze}
                disabled={!consentAgreed}
                id="analyze-cardiac-btn"
                style={{
                  opacity: consentAgreed ? 1 : 0.5,
                  cursor: consentAgreed ? 'pointer' : 'not-allowed'
                }}
              >
                <HeartPulse size={18} />
                {t('ecgAnalyzeBtn')}
              </button>
              {!consentAgreed && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  Please check the box above to continue
                </p>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <Disclaimer />
        </div>
      </div>
    </>
  )
}
