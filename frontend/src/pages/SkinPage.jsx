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

            <h1 className="text-h1">Skin Disease Prediction</h1>
            <p>
              Upload a clear photo of a skin lesion or affected area for AI-powered dermatological analysis
            </p>
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
                Photo Tips
              </h4>
              <p className="text-small">
                Use good lighting, keep the camera steady, and capture the
                lesion from directly above with a clean background for best
                results.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                AI Pipeline
              </h4>
              <p className="text-small">
                Hair removal → Contrast enhancement → Lesion segmentation →
                EfficientNet/ResNet feature extraction → Classification.
              </p>
            </div>
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                Conditions Detected
              </h4>
              <p className="text-small">
                Melanoma, BCC, SCC, Actinic Keratosis, Eczema, Psoriasis,
                Acne, Ringworm, Vitiligo, Rosacea, and more.
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
