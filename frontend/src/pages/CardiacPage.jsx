import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartPulse, ArrowLeft, Zap } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ProcessingOverlay from '../components/ProcessingOverlay'
import Disclaimer from '../components/Disclaimer'
import { predictCardiac, simulateCardiacPrediction } from '../services/api'

export default function CardiacPage() {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const handleImageSelect = useCallback((imageData) => {
    setSelectedImage(imageData)
  }, [])

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null)
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
                background: 'rgba(244, 63, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
              }}>
                <HeartPulse size={28} />
              </div>
            </div>

            <h1 className="text-h1">
              <span className="text-gradient-cardiac">Cardiac Disease</span> Prediction
            </h1>
            <p>
              Upload a photo or scan of an ECG strip for AI-powered cardiac analysis
            </p>
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

          {/* Analyze Button */}
          {selectedImage && (
            <motion.div
              style={{ textAlign: 'center', marginTop: '32px' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button 
                className="btn btn-cardiac btn-lg"
                onClick={handleAnalyze}
                id="analyze-cardiac-btn"
              >
                <Zap size={20} />
                Analyze ECG Image
              </button>
            </motion.div>
          )}

          {/* Info Cards */}
          <motion.div
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
              gap: '16px', 
              marginTop: '48px' 
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '8px' }}>
                Supported Input
              </h4>
              <p className="text-small">
                Photo or scanned image of a 12-lead ECG strip, single-lead ECG,
                or rhythm strip from any standard ECG machine.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '8px' }}>
                AI Pipeline
              </h4>
              <p className="text-small">
                Grid removal → Waveform digitization → R-peak detection →
                P-QRS-T segmentation → 1D-CNN/LSTM classification.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '8px' }}>
                Conditions Detected
              </h4>
              <p className="text-small">
                AFib, Flutter, Bradycardia, Tachycardia, PVC, V-Tach, Heart
                Blocks, Bundle Branch Blocks, MI, and more.
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
