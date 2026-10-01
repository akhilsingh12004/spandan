import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  HeartPulse, 
  ScanEye,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import ConfidenceBar from '../components/ConfidenceBar'
import ECGSignalChart from '../components/ECGSignalChart'
import Disclaimer from '../components/Disclaimer'
import BloodResultsView from '../components/BloodResultsView'

export default function ResultsPage() {
  const { module } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(true)

  const isCardiac = module === 'cardiac'
  const isBlood = module === 'blood'

  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResults')
    const storedImage = sessionStorage.getItem('analysisImage')

    if (!storedResults) {
      navigate(isCardiac ? '/cardiac' : isBlood ? '/blood' : '/skin')
      return
    }

    setResults(JSON.parse(storedResults))
    setUploadedImage(storedImage)
  }, [module, navigate, isCardiac, isBlood])

  if (!results) return null

  // If this is a blood report, render the specialized BloodResultsView dashboard
  if (isBlood) {
    return (
      <BloodResultsView 
        results={results} 
        uploadedImage={uploadedImage} 
        navigate={navigate} 
      />
    )
  }

  const topPrediction = results.predictions[0]
  const isHighConfidence = topPrediction.confidence >= 0.7
  const isMediumConfidence = topPrediction.confidence >= 0.4

  const getSeverityBadge = () => {
    if (isHighConfidence) return { class: 'status-badge-success', label: 'HIGH CONFIDENCE' }
    if (isMediumConfidence) return { class: 'status-badge-warning', label: 'MODERATE CONFIDENCE' }
    return { class: 'status-badge-danger', label: 'LOW CONFIDENCE' }
  }

  const badge = getSeverityBadge()

  return (
    <div className="results-page" id="results-page">
      <div className="container">
        {/* Header */}
        <motion.div
          className="results-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <button 
              onClick={() => navigate(isCardiac ? '/cardiac' : '/skin')}
              className="btn btn-secondary btn-sm"
              id="back-to-upload"
            >
              <ArrowLeft size={16} />
              New Analysis
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" id="download-report">
                <Download size={16} />
                Export Report
              </button>
              <Link 
                to={isCardiac ? '/cardiac' : '/skin'} 
                className="btn btn-secondary btn-sm"
                id="try-again"
              >
                <RotateCcw size={16} />
                Try Another
              </Link>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: isCardiac ? 'rgba(244, 63, 94, 0.1)' : 'rgba(6, 214, 160, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isCardiac ? 'var(--accent-rose)' : 'var(--accent-cyan)',
            }}>
              {isCardiac ? <HeartPulse size={24} /> : <ScanEye size={24} />}
            </div>
          </div>

          <h1 className="text-h1">
            <span className={isCardiac ? 'text-gradient-cardiac' : 'text-gradient-skin'}>
              {isCardiac ? 'Cardiac' : 'Skin'} Analysis
            </span>{' '}
            Results
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            <span className={`status-badge ${badge.class}`}>
              <CheckCircle2 size={12} />
              {badge.label}
            </span>
            {results.processingTime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <Clock size={14} />
                Processed in {results.processingTime}
              </span>
            )}
          </div>
        </motion.div>

        {/* Main Results Grid */}
        <div className="results-grid">
          {/* Left: Prediction Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="glass-card-static prediction-card" id="prediction-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div className="prediction-label">Primary Diagnosis</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(results.topCategory || topPrediction.category) && (
                    <span className="format-badge" style={{ color: isCardiac ? 'var(--accent-rose)' : 'var(--accent-cyan)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      {results.topCategory || topPrediction.category}
                    </span>
                  )}
                  {(results.tier || topPrediction.tier) && (
                    <span className="format-badge">
                      {results.tier || topPrediction.tier}
                    </span>
                  )}
                  {(results.supportLevel || topPrediction.supportLevel) && (
                    <span className="format-badge" style={{ color: 'var(--accent-amber)' }}>
                      Support: {results.supportLevel || topPrediction.supportLevel}
                    </span>
                  )}
                </div>
              </div>

              <h2 className="prediction-name" style={{ 
                color: isCardiac ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                marginBottom: '12px'
              }}>
                {topPrediction.name}
              </h2>

              {/* Specialist Review Warning Banner for rare or high-acuity classes */}
              {(results.requiresSpecialistReview || topPrediction.requiresSpecialistReview) && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}>
                  <AlertCircle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Flagged for Specialist Physician Review
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                      This condition is characterized by higher clinical acuity or lower training dataset frequency. Confirmatory review by a certified cardiologist or dermatologist is recommended.
                    </div>
                  </div>
                </div>
              )}

              <ConfidenceBar 
                label="Model Confidence" 
                value={topPrediction.confidence} 
                rank={0}
              />

              <div style={{ marginTop: '32px' }}>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em', 
                  color: 'var(--text-muted)', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <TrendingUp size={14} />
                  Top Differential Diagnoses
                </h3>

                <ul className="top-predictions" id="top-predictions-list">
                  {results.predictions.slice(0, 5).map((pred, index) => (
                    <motion.li
                      key={pred.name}
                      className="top-prediction-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <span className="top-prediction-rank">{index + 1}</span>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{pred.name}</div>
                          {pred.category && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                              {pred.category} • {pred.tier || 'Core'}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="top-prediction-score" style={{
                        color: pred.confidence >= 0.7 ? 'var(--accent-cyan)' 
                             : pred.confidence >= 0.4 ? 'var(--accent-amber)' 
                             : 'var(--text-muted)',
                        marginLeft: '12px',
                        flexShrink: 0
                      }}>
                        {(pred.confidence * 100).toFixed(1)}%
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* All confidence bars for top 5 */}
              <div style={{ marginTop: '24px' }}>
                {results.predictions.slice(1, 5).map((pred, i) => (
                  <ConfidenceBar 
                    key={pred.name} 
                    label={pred.name} 
                    value={pred.confidence} 
                    rank={i + 1}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Image & Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="glass-card-static heatmap-card" id="heatmap-card">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '16px' 
              }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {showHeatmap ? 'Grad-CAM Heatmap' : 'Original Image'}
                </h3>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  id="toggle-heatmap"
                >
                  {showHeatmap ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showHeatmap ? 'Show Original' : 'Show Heatmap'}
                </button>
              </div>

              <div className="heatmap-container">
                <img 
                  src={showHeatmap && results.heatmapUrl ? results.heatmapUrl : uploadedImage} 
                  alt="Analysis" 
                  className="heatmap-image"
                  style={{ 
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                  }}
                />
                {showHeatmap && !results.heatmapUrl && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(ellipse at 50% 50%, 
                      rgba(244, 63, 94, 0.45) 0%, 
                      rgba(245, 158, 11, 0.3) 30%, 
                      rgba(6, 214, 160, 0.15) 55%, 
                      transparent 75%)`,
                    borderRadius: 'var(--radius-md)',
                    mixBlendMode: 'screen',
                    pointerEvents: 'none',
                    transition: 'opacity 0.3s ease',
                  }} />
                )}
              </div>

              <p className="text-small" style={{ marginTop: '12px' }}>
                {showHeatmap 
                  ? 'The heatmap highlights regions that most influenced the AI prediction. Red/yellow areas indicate high activation.'
                  : 'Toggle the heatmap view to see which regions influenced the prediction.'}
              </p>

              {/* Heatmap Legend */}
              {showHeatmap && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low</span>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    background: 'linear-gradient(to right, rgba(6, 214, 160, 0.3), rgba(245, 158, 11, 0.6), rgba(244, 63, 94, 0.8))',
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ECG-specific: Signal & Metrics */}
        {isCardiac && results.ecgSignal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ maxWidth: '1200px', margin: '32px auto 0' }}
          >
            <div className="glass-card-static" id="ecg-details">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>
                <span className="text-gradient-cardiac">ECG Signal</span> Analysis
              </h3>
              <p className="text-small" style={{ marginBottom: '24px' }}>
                Digitized waveform extracted from the uploaded ECG image with computed cardiac metrics.
              </p>

              <ECGSignalChart signalData={results.ecgSignal} />

              {results.metrics && (
                <div className="metrics-grid" id="ecg-metrics">
                  {Object.entries(results.metrics).map(([key, value]) => {
                    const labels = {
                      heartRate: 'Heart Rate',
                      rrInterval: 'R-R Interval',
                      qtInterval: 'QT Interval',
                      hrv: 'HRV (SDNN)',
                      prInterval: 'PR Interval',
                      qrsDuration: 'QRS Duration',
                    }
                    const units = {
                      heartRate: 'bpm',
                    }
                    return (
                      <motion.div
                        key={key}
                        className="metric-item"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + Object.keys(results.metrics).indexOf(key) * 0.08 }}
                      >
                        <div className="metric-value" style={{ color: 'var(--accent-rose)' }}>
                          {typeof value === 'number' ? value : value}
                        </div>
                        <div className="metric-label">
                          {labels[key] || key}
                          {units[key] ? ` (${units[key]})` : ''}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Additional Info */}
        <motion.div
          style={{ maxWidth: '1200px', margin: '32px auto 0' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle size={20} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '6px' }}>
                  Understanding Your Results
                </h4>
                <p className="text-small" style={{ lineHeight: 1.7 }}>
                  The confidence score represents how certain the AI model is about its prediction. 
                  A score above 70% indicates high confidence. Multiple predictions are shown to give 
                  a fuller picture of possible conditions. The Grad-CAM heatmap shows which parts of 
                  the image most influenced the prediction — warmer colors indicate higher activation. 
                  Always consult a healthcare professional for diagnosis.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <div className="container-narrow" style={{ marginTop: '32px' }}>
          <Disclaimer />
        </div>

        {/* Action Buttons */}
        <motion.div
          style={{ textAlign: 'center', marginTop: '48px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link 
            to={isCardiac ? '/cardiac' : '/skin'} 
            className={`btn ${isCardiac ? 'btn-cardiac' : 'btn-skin'} btn-lg`}
            id="new-analysis-btn"
          >
            <RotateCcw size={18} />
            Start New Analysis
          </Link>
          <Link 
            to="/" 
            className="btn btn-secondary btn-lg" 
            style={{ marginLeft: '12px' }}
            id="go-home-btn"
          >
            Back to Home
            <ChevronRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
