import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ScanEye, ArrowLeft, Zap } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import ProcessingOverlay from '../components/ProcessingOverlay'
import Disclaimer from '../components/Disclaimer'
import { predictSkin, simulateSkinPrediction } from '../services/api'

export default function SkinPage() {
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

    const stepIntervals = [350, 500, 700, 600, 800, 450, 350]

    for (let i = 0; i < stepIntervals.length; i++) {
      await new Promise(resolve => setTimeout(resolve, stepIntervals[i]))
      setCurrentStep(i + 1)
    }

    let results
    try {
      results = await predictSkin(selectedImage.file)
    } catch (error) {
      console.log('Backend not available, using simulation mode')
      results = simulateSkinPrediction()
    }

    sessionStorage.setItem('analysisResults', JSON.stringify(results))
    sessionStorage.setItem('analysisImage', selectedImage.preview)
    sessionStorage.setItem('analysisModule', 'skin')

    setIsProcessing(false)
    navigate('/results/skin')
  }

  return (
    <>
      <ProcessingOverlay 
        isVisible={isProcessing} 
        variant="skin" 
        currentStep={currentStep} 
      />

      <div className="upload-page" id="skin-page">
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
                <ScanEye size={24} />
              </div>
            </div>

            <h1 className="text-h1">Skin Spot & Rash Check</h1>
            <p style={{ maxWidth: '560px', margin: '0 auto' }}>
              Upload a clear photo of a skin spot, mole, or rash for an instant AI-powered dermatological evaluation in plain language.
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
              <span>💡 <strong>Tip:</strong> Take a steady, well-lit close-up. No photo ready? Click 'Try with Sample' below!</span>
            </div>
          </motion.div>

          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <ImageUploader
              variant="skin"
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onRemove={handleRemoveImage}
            />
          </motion.div>

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
                id="analyze-skin-btn"
              >
                <Zap size={18} />
                Analyze Skin Image
              </button>
            </motion.div>
          )}

          {/* Tips */}
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
                📸 Taking a Good Photo
              </h4>
              <p className="text-small">
                Hold phone steady, use daylight or good room lighting, and center the mark directly in the camera view.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                🔍 How the AI Sees It
              </h4>
              <p className="text-small">
                Cleans hair and shadows, outlines the spot, and shows a colored focus map highlighting what it evaluated.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                🩺 What You Get
              </h4>
              <p className="text-small">
                Clear plain-language explanations of likely conditions, whether doctor review is advised, and care tips.
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
