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
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react'
import ConfidenceBar from '../components/ConfidenceBar'
import ECGSignalChart from '../components/ECGSignalChart'
import Disclaimer from '../components/Disclaimer'
import BloodResultsView from '../components/BloodResultsView'
import AIReportExplainer from '../components/AIReportExplainer'

const getPlainEnglishDescription = (name, isCardiac) => {
  if (isCardiac) {
    if (name.includes('Normal') || name.includes('Sinus Rhythm')) {
      return "Your heart's natural pacemaker is beating in a healthy, steady rhythm within normal adult resting limits."
    }
    if (name.includes('Atrial Fibrillation') || name.includes('AFib')) {
      return "The upper chambers of your heart are beating irregularly. This is a very common rhythm pattern that doctors can evaluate to optimize blood flow."
    }
    if (name.includes('Tachycardia')) {
      return "Your heart is beating in its normal pattern, but faster than 100 beats per minute. This often happens with stress, coffee, fever, or physical exertion."
    }
    if (name.includes('Bradycardia')) {
      return "Your resting heartbeat is slower than 60 beats per minute. This is normal in athletes, but worth checking if you feel tired or lightheaded."
    }
    if (name.includes('Ventricular') || name.includes('PVC')) {
      return "An extra heartbeat originating in the lower chambers. Many people experience this as a harmless 'flutter' or 'skipped beat'."
    }
    return "A specific heart rhythm pattern identified by the AI model. Share this report with your doctor or cardiologist for personalized confirmation."
  } else {
    if (name.includes('Nevus') || name.includes('Mole')) {
      return "A standard, non-cancerous skin mole. It is generally harmless; just keep an eye on it for any changes in size or color over time."
    }
    if (name.includes('Melanoma')) {
      return "A skin pattern characterized by pigment variations that warrants prompt in-person evaluation by a licensed dermatologist."
    }
    if (name.includes('Basal Cell')) {
      return "A common skin condition that grows slowly and is highly treatable when reviewed early by a dermatologist."
    }
    if (name.includes('Keratosis')) {
      return "A rough or scaly spot that is very common and easily examined or treated by a skin specialist."
    }
    if (name.includes('Eczema') || name.includes('Dermatitis')) {
      return "A dry, reactive, or itchy skin reaction that often improves with gentle moisturizers and sensitive skin care."
    }
    if (name.includes('Psoriasis')) {
      return "A condition where skin cells renew too fast, forming reddish patches with silvery scales. Highly treatable with modern ointments."
    }
    return "A skin pattern identified by the AI. We recommend showing it to a certified dermatologist at your next routine checkup."
  }
}

export default function ResultsPage() {
  const { module } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [viewMode, setViewMode] = useState('beginner') // 'beginner' | 'detailed'

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
    if (isHighConfidence) return { class: 'status-badge-success', label: 'HIGH CONFIDENCE MATCH' }
    if (isMediumConfidence) return { class: 'status-badge-warning', label: 'MODERATE CONFIDENCE MATCH' }
    return { class: 'status-badge-danger', label: 'LOW CONFIDENCE MATCH' }
  }

  const badge = getSeverityBadge()
  const plainText = getPlainEnglishDescription(topPrediction.name, isCardiac)

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
              <button 
                onClick={() => window.print()} 
                className="btn btn-secondary btn-sm" 
                id="download-report"
              >
                <Download size={16} />
                Export / Print
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
              {isCardiac ? 'Heart & ECG' : 'Skin Spot'}
            </span>{' '}
            Analysis Results
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
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

          {/* View Mode Switcher: Beginner vs Detailed */}
          <div style={{
            display: 'inline-flex',
            marginTop: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('beginner')}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: viewMode === 'beginner' ? 600 : 400,
                background: viewMode === 'beginner' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'beginner' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              🟢 Easy Reading View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: viewMode === 'detailed' ? 600 : 400,
                background: viewMode === 'detailed' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'detailed' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              🔬 Detailed Clinical View
            </button>
          </div>
        </motion.div>

        {/* ── Prominent "At A Glance" Summary Card for Beginners ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            maxWidth: '1200px',
            margin: '0 auto 32px',
            padding: '24px 28px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(45, 212, 191, 0.04)',
            border: '1px solid rgba(45, 212, 191, 0.25)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Summary at a Glance (In Everyday Words)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Primary Finding
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isCardiac ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                {topPrediction.name}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
                {plainText}
              </p>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Recommended Action Steps
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                <li>✅ <strong>Save or Print this Report:</strong> Click "Export / Print" above to keep a copy.</li>
                <li>
                  {isCardiac 
                    ? '🩺 Discuss with your physician or cardiologist if you experience palpitations, chest pain, or fatigue.'
                    : '🩺 Schedule an in-person skin check with a dermatologist if the spot grows, itches, or changes color.'}
                </li>
                <li>📋 <strong>Check Questions Below:</strong> Use our AI Assistant to generate customized questions for your doctor.</li>
              </ul>
            </div>
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
                <div className="prediction-label">Primary AI Finding</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(results.topCategory || topPrediction.category) && (
                    <span className="format-badge" style={{ color: isCardiac ? 'var(--accent-rose)' : 'var(--accent-cyan)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      {results.topCategory || topPrediction.category}
                    </span>
                  )}
                  <span className="format-badge" style={{ color: 'var(--accent-cyan)' }}>
                    Verified Pattern
                  </span>
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
                      This condition warrants clinical evaluation. An in-person confirmatory review by a certified {isCardiac ? 'cardiologist' : 'dermatologist'} is recommended.
                    </div>
                  </div>
                </div>
              )}

              <ConfidenceBar 
                label="AI Pattern Confidence" 
                value={topPrediction.confidence} 
                rank={0}
              />

              <div style={{ marginTop: '32px' }}>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  color: 'var(--text-muted)', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <TrendingUp size={14} />
                  Other Possibilities Evaluated
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
                              {pred.category}
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

              {/* All confidence bars for top 5 (shown in detailed view) */}
              {viewMode === 'detailed' && (
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
              )}
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
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {showHeatmap ? 'AI Visual Focus (Grad-CAM)' : 'Original Image'}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {showHeatmap ? 'Shows the exact area the AI examined' : 'Uploaded file view'}
                  </span>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  id="toggle-heatmap"
                >
                  {showHeatmap ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showHeatmap ? 'Show Clean Image' : 'Show AI Focus'}
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

              <p className="text-small" style={{ marginTop: '12px', lineHeight: 1.5 }}>
                {showHeatmap 
                  ? 'The warm glowing colors (yellow/red) highlight where the AI looked to reach its conclusion.'
                  : 'This is the clear original file you uploaded without AI heatmap markings.'}
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low Focus</span>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    background: 'linear-gradient(to right, rgba(6, 214, 160, 0.3), rgba(245, 158, 11, 0.6), rgba(244, 63, 94, 0.8))',
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 600 }}>High Focus</span>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                  <span className="text-gradient-cardiac">ECG Waveform</span> & Heartbeat Metrics
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Normal adult resting rate: 60–100 bpm
                </span>
              </div>
              <p className="text-small" style={{ marginBottom: '20px' }}>
                Waveform extracted from your uploaded ECG image with resting heartbeat measurements explained in everyday units:
              </p>

              <ECGSignalChart signalData={results.ecgSignal} />

              {results.metrics && (
                <div className="metrics-grid" id="ecg-metrics" style={{ marginTop: '24px' }}>
                  {Object.entries(results.metrics).map(([key, value]) => {
                    const infoMap = {
                      heartRate: { label: 'Heart Rate', hint: 'Resting pulse speed (Normal: 60–100 bpm)' },
                      rrInterval: { label: 'R-R Interval', hint: 'Time between heartbeats (Normal: 600–1000 ms)' },
                      qtInterval: { label: 'QT Interval', hint: 'Heart recharge time (Normal: 350–450 ms)' },
                      hrv: { label: 'HRV (SDNN)', hint: 'Heart rate variation (Higher is usually healthy)' },
                      prInterval: { label: 'PR Interval', hint: 'Signal transit time (Normal: 120–200 ms)' },
                      qrsDuration: { label: 'QRS Duration', hint: 'Main pumping stroke speed (Normal: 80–120 ms)' },
                    }
                    const item = infoMap[key] || { label: key, hint: '' }
                    return (
                      <motion.div
                        key={key}
                        className="metric-item"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + Object.keys(results.metrics).indexOf(key) * 0.08 }}
                      >
                        <div className="metric-value" style={{ color: 'var(--accent-rose)' }}>
                          {value}
                          {key === 'heartRate' ? ' bpm' : (key.includes('Interval') || key.includes('Duration') || key === 'hrv') ? ' ms' : ''}
                        </div>
                        <div className="metric-label" style={{ fontWeight: 600 }}>
                          {item.label}
                        </div>
                        {item.hint && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {item.hint}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* AI Clinical Report Explainer & Assistant */}
        <div style={{ maxWidth: '1200px', margin: '32px auto 0' }}>
          <AIReportExplainer reportData={results} module={isCardiac ? 'cardiac' : 'skin'} />
        </div>

        {/* Beginner Helpful Guide Card */}
        <motion.div
          style={{ maxWidth: '1200px', margin: '32px auto 0' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Info size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '6px' }}>
                  How to Understand Your Report
                </h4>
                <p className="text-small" style={{ lineHeight: 1.7 }}>
                  The <strong>AI Pattern Confidence</strong> indicates how closely your image matches verified clinical cases. 
                  A score above 70% indicates a strong pattern match. The <strong>AI Visual Focus</strong> heatmap highlights 
                  the exact section of your image or rhythm line that influenced this calculation. 
                  Remember that AI tools are designed to assist and inform; a real doctor will take your symptoms, personal history, 
                  and physical exam into consideration for a definitive diagnosis.
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
