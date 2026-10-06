import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartPulse, ArrowLeft, Zap, AlertTriangle, FileText } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ProcessingOverlay from '../components/ProcessingOverlay'
import Disclaimer from '../components/Disclaimer'
import { predictCardiac, simulateCardiacPrediction } from '../services/api'

export default function CardiacPage() {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [suspectedModality, setSuspectedModality] = useState(null)

  const handleImageSelect = useCallback((imageData) => {
    setSelectedImage(imageData)
    if (imageData?.file) {
      const fname = (imageData.file.name || '').toLowerCase()
      const isDoc = /(blood|report|lab|cbc|lft|kft|jaundice|urine|test|hemoglobin|bilirubin|pathology|\.pdf)/i.test(fname)
      if (isDoc) {
        setSuspectedModality('blood')
      } else {
        // Test aspect ratio if image element is available
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
    if (!selectedImage) return

    setIsProcessing(true)
    setCurrentStep(0)

    // Simulate step-by-step progress
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

    // Store results and image in sessionStorage
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
              <ArrowLeft size={14} />
              Back to Home
            </button>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '14px', 
              marginBottom: '16px' 
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <HeartPulse size={24} />
              </div>
            </div>

            <h1 className="text-h1">Heart & ECG Rhythm Check</h1>
            <p style={{ maxWidth: '560px', margin: '0 auto' }}>
              Upload a clear photo or scan of your ECG paper strip to check your heart rate and rhythm in simple, everyday language.
            </p>

            {/* Beginner Photo Tip Bar */}
            <div style={{
              margin: '20px auto 0',
              maxWidth: '560px',
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
              <span>💡 <strong>Tip:</strong> Lay the strip flat in bright light. No strip with you? Use the sample button below!</span>
            </div>
          </motion.div>

          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <ImageUploader
              variant="cardiac"
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onRemove={handleRemoveImage}
            />
          </motion.div>

          {/* Misrouted Document Warning Banner */}
          {selectedImage && suspectedModality === 'blood' && (
            <motion.div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                textAlign: 'left'
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px' }}>
                <AlertTriangle size={24} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    This looks like a Laboratory Blood Test Report
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Cardiac Analysis evaluates ECG waveforms only. For blood test reports (e.g. Jaundice, CBC, LFT), use our Blood Report Analysis module for accurate diagnostics.
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/blood')}
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                id="switch-to-blood-btn"
              >
                <FileText size={15} />
                Switch to Blood Report
              </button>
            </motion.div>
          )}

          {/* Analyze Button */}
          {selectedImage && (
            <motion.div
              style={{ textAlign: 'center', marginTop: '28px' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleAnalyze}
                id="analyze-cardiac-btn"
              >
                <Zap size={18} />
                Analyze ECG Image
              </button>
            </motion.div>
          )}

          {/* Beginner Friendly Info Cards */}
          <motion.div
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '14px', 
              marginTop: '48px' 
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                📷 What to Upload
              </h4>
              <p className="text-small">
                Any photo or scan of an ECG paper strip or report from a doctor, clinic, or smartwatch rhythm printout.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                ⚡ How It Works
              </h4>
              <p className="text-small">
                The AI cleans paper grid marks, traces your heartbeat spikes, and checks if beats are steady, fast, slow, or irregular.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                📋 Plain-Language Results
              </h4>
              <p className="text-small">
                You'll receive a clear summary of your heart rate, a visual rhythm chart, and helpful questions to discuss with your doctor.
              </p>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ marginTop: '48px' }}
          >
            <Disclaimer />
          </motion.div>
        </div>
      </div>
    </>
  )
}
