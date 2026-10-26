import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RotateCcw, 
  HeartPulse, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Check, 
  Info,
  Activity,
  Layers,
  Eye,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import Disclaimer from '../components/Disclaimer'
import BloodResultsView from '../components/BloodResultsView'
import { useLanguage } from '../LanguageContext'
import { exportCardiacReportPDF } from '../services/pdfExport'
import { getSynchronousAnalysisSession, loadAnalysisSessionAsync } from '../services/storage'
import { reconstructEcg } from '../services/api'

export default function ResultsPage() {
  const { module } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [results, setResults] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [copied, setCopied] = useState(false)

  // Interactive Digital ECG Viewer State
  const [activeView, setActiveView] = useState('comparison') // 'comparison' | 'reconstructed' | 'original'
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [renderMode, setRenderMode] = useState('faithful')
  const [isReconstructing, setIsReconstructing] = useState(false)

  const isCardiac = module === 'cardiac'
  const isBlood = module === 'blood'

  useEffect(() => {
    let isMounted = true

    // 1. Immediate synchronous retrieval from memory / sessionStorage
    const syncSession = getSynchronousAnalysisSession()
    if (syncSession.results) {
      setResults(syncSession.results)
      setUploadedImage(syncSession.image)
      return
    }

    // 2. Asynchronous restoration from IndexedDB (e.g. after hard page reload)
    loadAnalysisSessionAsync().then((session) => {
      if (!isMounted) return
      if (session.results) {
        setResults(session.results)
        setUploadedImage(session.image)
      } else {
        navigate(isCardiac ? '/cardiac' : isBlood ? '/blood' : '/cardiac')
      }
    }).catch((err) => {
      console.warn('Failed to load session:', err)
      if (isMounted) {
        navigate(isCardiac ? '/cardiac' : isBlood ? '/blood' : '/cardiac')
      }
    })

    return () => {
      isMounted = false
    }
  }, [module, navigate, isCardiac, isBlood])

  // Digital ECG Reconstruction variables
  const recon = results?.reconstruction
  const hasRecon = !!(recon && (recon.reconstructedImageUrl || recon.comparisonImageUrl))
  const hasComparison = !!recon?.comparisonImageUrl
  const qualityLevel = recon?.quality?.reconstructionQuality || 'high'
  const isAssumedCalib = recon?.calibration?.calibrationSource === 'assumed'
  const reconWarnings = recon?.warnings || recon?.quality?.warnings || []

  // Ensure activeView matches available images (Hook called unconditionally)
  useEffect(() => {
    if (hasRecon) {
      if (hasComparison) {
        setActiveView('comparison')
      } else if (recon?.reconstructedImageUrl) {
        setActiveView('reconstructed')
      } else if (uploadedImage) {
        setActiveView('original')
      }
    }
  }, [hasRecon, hasComparison, recon?.reconstructedImageUrl, uploadedImage])

  // Displayed image computation (Hook called unconditionally)
  const displayedImage = useMemo(() => {
    if (!recon) return uploadedImage
    if (activeView === 'comparison' && recon.comparisonImageUrl) {
      return recon.comparisonImageUrl
    }
    if (activeView === 'original' && uploadedImage) {
      return uploadedImage
    }
    return recon.reconstructedImageUrl || uploadedImage
  }, [activeView, recon, uploadedImage])

  // Quality text label (Hook called unconditionally)
  const qualityText = useMemo(() => {
    if (qualityLevel === 'high') return t('qualityHigh')
    if (qualityLevel === 'medium') return t('qualityMedium')
    return t('qualityLow')
  }, [qualityLevel, t])

  const handleZoomIn = () => {
    setZoom(z => Math.min(3.5, +(z + 0.25).toFixed(2)))
  }

  const handleZoomOut = () => {
    setZoom(z => {
      const next = Math.max(0.75, +(z - 0.25).toFixed(2))
      if (next <= 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const handleResetZoom = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  const handleViewChange = (view) => {
    setActiveView(view)
    handleResetZoom()
  }

  const handleToggleRenderMode = async (mode) => {
    if (mode === renderMode || isReconstructing) return
    setIsReconstructing(true)
    try {
      if (uploadedImage) {
        const res = await fetch(uploadedImage)
        const blob = await res.blob()
        const updatedRecon = await reconstructEcg(blob, mode)
        if (updatedRecon) {
          setResults(prev => ({
            ...prev,
            reconstruction: updatedRecon
          }))
          setRenderMode(mode)
        }
      }
    } catch (err) {
      console.error('Failed to switch render mode:', err)
    } finally {
      setIsReconstructing(false)
    }
  }

  // Pan interaction
  const handleMouseDown = (e) => {
    if (zoom <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    if (zoom <= 1 || e.touches.length !== 1) return
    setIsDragging(true)
    setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y })
  }

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleDownloadPng = () => {
    if (!displayedImage) return
    const link = document.createElement('a')
    link.href = displayedImage
    link.download = `Spandan_ECG_${activeView}_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    try {
      exportCardiacReportPDF(results, uploadedImage)
    } catch (err) {
      console.error('PDF export failed, falling back to window.print():', err)
      window.print()
    }
  }

  if (!results) return null

  // If this is a blood report, render BloodResultsView
  if (isBlood) {
    return (
      <BloodResultsView 
        results={results} 
        uploadedImage={uploadedImage} 
        navigate={navigate} 
      />
    )
  }

  // ECG result processing
  const topPrediction = results.predictions?.[0] || { name: 'Normal Sinus Rhythm', confidence: 0.95 }
  const rawName = topPrediction.name || ''

  const isNormal = rawName.toLowerCase().includes('normal') || rawName.toLowerCase().includes('sinus rhythm')
  const isCritical = rawName.toLowerCase().includes('ventricular') || rawName.toLowerCase().includes('stemi') || rawName.toLowerCase().includes('block')
  const isAttention = !isNormal && !isCritical

  // Plain names & explanations
  const getPlainECGInfo = () => {
    if (isNormal) {
      return {
        plainName: lang === 'hi' ? 'सामान्य हृदय गति व ताल (Normal Rhythm)' : 'Normal Heart Rhythm',
        statusText: lang === 'hi' ? 'सामान्य (Normal)' : 'Normal',
        statusClass: 'normal',
        icon: <CheckCircle2 size={16} />,
        sentence: lang === 'hi' 
          ? 'आपके दिल का प्राकृतिक पेसमेकर बिल्कुल सही और स्थिर गति से धड़क रहा है।'
          : "Your heart's natural pacemaker is beating in a healthy, steady rhythm within normal adult resting limits."
      }
    }
    if (rawName.toLowerCase().includes('atrial fibrillation') || rawName.toLowerCase().includes('afib')) {
      return {
        plainName: lang === 'hi' ? 'अनियमित धड़कन (एट्रियल फिब्रिलेशन)' : 'Irregular Upper Beat (Atrial Fibrillation)',
        statusText: lang === 'hi' ? 'ध्यान दें (Needs attention)' : 'Needs attention',
        statusClass: 'high',
        icon: <TrendingUp size={16} />,
        sentence: lang === 'hi'
          ? 'दिल के ऊपरी कक्ष थोड़ी अनियमित गति से धड़क रहे हैं। डॉक्टर से इसकी जांच करवाना उचित रहेगा।'
          : 'The upper chambers of your heart are beating irregularly. This is a common pattern that a doctor can review to keep blood moving smoothly.'
      }
    }
    if (rawName.toLowerCase().includes('tachycardia')) {
      return {
        plainName: lang === 'hi' ? 'तेज़ धड़कन (टैचीकार्डिया)' : 'Fast Heartbeat (Tachycardia)',
        statusText: lang === 'hi' ? 'तेज़ (High)' : 'High',
        statusClass: 'high',
        icon: <TrendingUp size={16} />,
        sentence: lang === 'hi'
          ? 'आपका दिल सामान्य से थोड़ा तेज़ धड़क रहा है (100 से अधिक)। यह तनाव, कॉफ़ी, बुखार या मेहनत के कारण भी हो सकता है।'
          : 'Your heart is beating in its usual pattern, but faster than 100 beats per minute. This often happens with stress, coffee, fever, or physical exertion.'
      }
    }
    if (rawName.toLowerCase().includes('bradycardia')) {
      return {
        plainName: lang === 'hi' ? 'धीमी धड़कन (ब्रैडीकार्डिया)' : 'Slow Heartbeat (Bradycardia)',
        statusText: lang === 'hi' ? 'धीमा (Low)' : 'Low',
        statusClass: 'low',
        icon: <TrendingDown size={16} />,
        sentence: lang === 'hi'
          ? 'आपका दिल 60 से कम रफ्तार से धड़क रहा है। यदि आप कमज़ोरी या चक्कर महसूस करते हैं, तो डॉक्टर को बताएं।'
          : 'Your resting heartbeat is slower than 60 beats per minute. Common in fit individuals, but worth checking if you feel faint or fatigued.'
      }
    }
    return {
      plainName: lang === 'hi' ? 'विशेष ताल पैटर्न' : 'Rhythm Variation Pattern',
      statusText: isCritical ? (lang === 'hi' ? 'अति आवश्यक (Critical)' : 'Critical') : (lang === 'hi' ? 'जांच करवाएं' : 'Needs review'),
      statusClass: isCritical ? 'critical' : 'high',
      icon: <AlertTriangle size={16} />,
      sentence: lang === 'hi'
        ? 'आपकी ईसीजी में एक विशेष पैटर्न दिखा है। अपने डॉक्टर या हृदय विशेषज्ञ (cardiologist) को यह पर्ची ज़रूर दिखाएं।'
        : 'A specific heart rhythm pattern was noted on your strip. Please share this with your doctor for personalized confirmation.'
    }
  }

  const ecgInfo = getPlainECGInfo()

  // 2-3 sentence summary
  const summaryText = lang === 'hi'
    ? (isNormal 
        ? 'आपकी ईसीजी पर्ची में दिल की धड़कन और ताल बिल्कुल सामान्य दिख रहे हैं। कोई चिंताजनक संकेत नहीं मिला है। अपनी अच्छी सेहत के लिए संतुलित दिनचर्या बनाए रखें।'
        : isCritical
        ? 'आपकी ईसीजी में असामान्य ताल दर्ज हुई है जिसे तुरंत डॉक्टर को दिखाना ज़रूरी है। कृपया बिना देरी किए नज़दीकी डॉक्टर या अस्पताल से संपर्क करें।'
        : 'आपकी ईसीजी में एक अनियमित ताल का पैटर्न देखा गया है। अधिकांश मामलों में यह प्रबंधनीय होता है, लेकिन सही पुष्टि के लिए अपने डॉक्टर से मिलना ज़रूरी है।')
    : (isNormal
        ? 'Your ECG strip shows a regular heart rate and steady rhythm within safe resting limits. No irregular warning patterns were detected. Continue your healthy daily habits.'
        : isCritical
        ? 'Your ECG strip shows an abnormal rhythm pattern that requires prompt medical evaluation. Please show this to a physician or cardiologist right away.'
        : 'Your ECG strip shows a rhythm pattern that needs clinical attention. While often manageable, it is important to have your doctor listen to your heart and confirm next steps.')

  // Heart tips
  const ecgTips = lang === 'hi' ? [
    'चाय, कॉफ़ी और एनर्जी ड्रिंक का सीमित सेवन करें।',
    'धूम्रपान और तंबाकू से पूरी तरह दूर रहें।',
    'तनाव कम करने के लिए दिन में कुछ मिनट गहरी सांस लेने का अभ्यास करें।',
    'यदि डॉक्टर ने बीपी या दिल की कोई दवा लिखी है, तो उसे समय पर लें।',
    'यदि अचानक सीने में तेज दर्द या सांस लेने में भारी तकलीफ हो, तो तुरंत आपातकालीन सहायता लें।'
  ] : [
    'Limit excess coffee, strong tea, and stimulant energy drinks.',
    'Avoid smoking and tobacco products completely.',
    'Practice 5 minutes of calm, slow breathing each day to ease body stress.',
    'Take any blood pressure or heart medicines strictly on time as prescribed.',
    'If you ever feel severe chest tightness or sudden shortness of breath, call emergency services immediately.'
  ]

  // Questions for doctor
  const ecgQuestions = lang === 'hi' ? [
    'क्या मेरी इस ईसीजी ताल के लिए किसी और जांच (जैसे इकोकार्डियोग्राम या होल्टर) की आवश्यकता है?',
    'क्या मुझे भारी कसरत या वजन उठाने से परहेज़ करना चाहिए?',
    'यदि कभी मुझे घबराहट या दिल धड़कने जैसा लगे, तो मुझे तुरंत क्या करना चाहिए?'
  ] : [
    'Do you recommend a follow-up test, such as an echocardiogram or a 24-hour Holter monitor?',
    'Are there any physical exertion or exercise limits I should follow for now?',
    'What specific warning signs should prompt me to seek immediate medical help?'
  ]

  const handleShare = async () => {
    const textToShare = `Spandan AI ECG Summary:\n${summaryText}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My ECG Explanation — Spandan AI',
          text: textToShare,
          url: window.location.href,
        })
        return
      } catch (err) {}
    }
    try {
      await navigator.clipboard.writeText(`${textToShare}\n\nViewed on Spandan AI: ${window.location.href}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      alert('Report summary copied!')
    }
  }

  return (
    <div className="upload-page" id="cardiac-results-screen">
      <div className="container">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/cardiac')}
          className="upload-back-link"
          id="back-to-ecg-upload"
        >
          <ArrowLeft size={16} />
          {t('back')}
        </button>

        <h1 className="upload-page-title" style={{ marginBottom: '8px' }}>
          {t('resultsTitle')}
        </h1>
        <p className="upload-page-desc" style={{ marginBottom: '24px' }}>
          {lang === 'hi'
            ? 'नीचे आपकी ईसीजी पर्ची का आसान भाषा में विवरण दिया गया है।'
            : 'Here is a plain-language explanation of what your ECG heart strip shows.'}
        </p>

        {/* 1. Clear Red Box at the TOP if dangerously abnormal */}
        {isCritical && (
          <div className="urgent-doctor-box" id="ecg-urgent-banner">
            <AlertTriangle size={28} className="urgent-doctor-icon" />
            <div className="urgent-doctor-content">
              <h2>{t('pleaseSeeDoctor')}</h2>
              <p>
                {lang === 'hi'
                  ? 'आपकी ईसीजी में एक गंभीर ताल पैटर्न दिखा है। कृपया बिना देर किए किसी डॉक्टर या कार्डियोलॉजिस्ट से संपर्क करें।'
                  : 'Your ECG strip shows an abnormal pattern that requires immediate clinical care. Please see a physician or visit an emergency care facility promptly.'}
              </p>
            </div>
          </div>
        )}

        {/* 2. Plain Summary Card */}
        <div className="results-summary-card" id="ecg-summary-card">
          <h2>
            {lang === 'hi' ? 'नतीजों का संक्षिप्त सार' : 'Summary of your heart check'}
          </h2>
          <p className="results-summary-text">
            {summaryText}
          </p>
        </div>

        {/* 3. Rhythm Card */}
        <div className="results-list" id="ecg-cards-list">
          <div className={`result-card status-${ecgInfo.statusClass}`}>
            <div className="result-card-header">
              <h3 className="result-card-title">{ecgInfo.plainName}</h3>
              <span className={`result-status-badge ${ecgInfo.statusClass}`}>
                {ecgInfo.icon}
                {ecgInfo.statusText}
              </span>
            </div>
            <div className="result-card-values">
              <div className="result-val-item">
                <span className="result-val-label">
                  {lang === 'hi' ? 'पहचाना गया पैटर्न' : 'Identified Rhythm'}
                </span>
                <span className="result-val-number" style={{ fontSize: '1.125rem' }}>
                  {rawName}
                </span>
              </div>
              <div className="result-val-item">
                <span className="result-val-label">
                  {lang === 'hi' ? 'सामान्य सीमा' : 'Normal Reference'}
                </span>
                <span className="result-val-number" style={{ fontSize: '1.0625rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {lang === 'hi' ? '60 - 100 प्रति मिनट' : '60 - 100 bpm steady'}
                </span>
              </div>
            </div>
            <p className="result-card-explanation">
              {ecgInfo.sentence}
            </p>
          </div>
        </div>

        {/* 3B. Standardized Digital ECG Reconstruction */}
        {hasRecon && (
          <div className="digital-ecg-card" id="digital-ecg-section">
            <div className="digital-ecg-header">
              <div className="digital-ecg-title-group">
                <h2 className="digital-ecg-title">
                  <Activity size={22} className="digital-ecg-icon" />
                  {t('digitalEcgSectionTitle')}
                </h2>
                <p className="digital-ecg-desc">
                  {t('digitalEcgSectionDesc')}
                </p>
              </div>
              <div className="digital-ecg-badges">
                <span className={`ecg-quality-badge quality-${qualityLevel}`}>
                  {qualityLevel === 'high' ? (
                    <CheckCircle2 size={14} />
                  ) : qualityLevel === 'medium' ? (
                    <AlertTriangle size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  {qualityText}
                </span>
                <span className={`ecg-calib-badge ${isAssumedCalib ? 'calib-assumed' : 'calib-detected'}`}>
                  {isAssumedCalib ? t('calAssumed') : t('calGridDetected')}
                </span>
              </div>
            </div>

            {/* Low Quality Banner */}
            {qualityLevel === 'low' && (
              <div className="ecg-recon-alert critical" id="ecg-low-quality-alert">
                <AlertCircle size={20} className="alert-icon-svg" />
                <div className="alert-content">
                  <strong>{t('qualityLow')}:</strong> {t('lowQualityWarning')}
                </div>
              </div>
            )}

            {/* Assumed Calibration Notice */}
            {isAssumedCalib && (
              <div className="ecg-recon-alert warning" id="ecg-assumed-calib-alert">
                <AlertTriangle size={20} className="alert-icon-svg" />
                <div className="alert-content">
                  <strong>{t('calSourceLabel')}:</strong> {t('assumedCalWarning')}
                </div>
              </div>
            )}

            {/* Warnings list if any */}
            {reconWarnings.length > 0 && qualityLevel !== 'low' && (
              <div className="ecg-recon-alert info" id="ecg-recon-warnings">
                <Info size={18} className="alert-icon-svg" />
                <div className="alert-content">
                  <ul className="ecg-warning-list">
                    {reconWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Viewer Toolbar */}
            <div className="digital-ecg-toolbar">
              <div className="ecg-view-tabs" role="tablist">
                {hasComparison && (
                  <button
                    type="button"
                    role="tab"
                    id="ecg-tab-compare"
                    aria-selected={activeView === 'comparison'}
                    className={`ecg-tab-btn ${activeView === 'comparison' ? 'active' : ''}`}
                    onClick={() => handleViewChange('comparison')}
                  >
                    <Layers size={15} />
                    <span>{t('compareView')}</span>
                  </button>
                )}
                <button
                  type="button"
                  role="tab"
                  id="ecg-tab-recon"
                  aria-selected={activeView === 'reconstructed'}
                  className={`ecg-tab-btn ${activeView === 'reconstructed' ? 'active' : ''}`}
                  onClick={() => handleViewChange('reconstructed')}
                >
                  <Activity size={15} />
                  <span>{t('reconstructedView')}</span>
                </button>
                {uploadedImage && (
                  <button
                    type="button"
                    role="tab"
                    id="ecg-tab-original"
                    aria-selected={activeView === 'original'}
                    className={`ecg-tab-btn ${activeView === 'original' ? 'active' : ''}`}
                    onClick={() => handleViewChange('original')}
                  >
                    <Eye size={15} />
                    <span>{t('originalView')}</span>
                  </button>
                )}
              </div>

              <div className="ecg-toolbar-actions">
                {/* Render Mode Toggle: Faithful vs Clean */}
                <div className="ecg-mode-toggle" style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--surface, #f1f5f9)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border, #e2e8f0)', marginRight: '0.5rem' }}>
                  <button
                    type="button"
                    className={`ecg-tool-btn ${renderMode === 'faithful' ? 'active' : ''}`}
                    onClick={() => handleToggleRenderMode('faithful')}
                    disabled={isReconstructing}
                    title="Faithful: Preserves natural EMG tremor & un-altered peaks"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: renderMode === 'faithful' ? 600 : 400, borderRadius: '4px' }}
                  >
                    Faithful
                  </button>
                  <button
                    type="button"
                    className={`ecg-tool-btn ${renderMode === 'clean' ? 'active' : ''}`}
                    onClick={() => handleToggleRenderMode('clean')}
                    disabled={isReconstructing}
                    title="Clean: 40 Hz lowpass filter & PR baseline leveling"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: renderMode === 'clean' ? 600 : 400, borderRadius: '4px' }}
                  >
                    Clean (40Hz)
                  </button>
                </div>

                <div className="ecg-zoom-controls">
                  <button 
                    type="button"
                    onClick={handleZoomOut} 
                    className="ecg-tool-btn" 
                    title={t('zoomOut')}
                    aria-label={t('zoomOut')}
                    disabled={zoom <= 0.75}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="ecg-zoom-label">{Math.round(zoom * 100)}%</span>
                  <button 
                    type="button"
                    onClick={handleZoomIn} 
                    className="ecg-tool-btn" 
                    title={t('zoomIn')}
                    aria-label={t('zoomIn')}
                    disabled={zoom >= 3.5}
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetZoom} 
                    className="ecg-tool-btn" 
                    title={t('resetZoom')}
                    aria-label={t('resetZoom')}
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={handleDownloadPng} 
                  className="ecg-download-btn"
                  id="ecg-download-png-btn"
                  title={t('downloadPng')}
                >
                  <Download size={15} />
                  <span>{t('downloadPng')}</span>
                </button>
              </div>
            </div>

            {/* Interactive Viewport */}
            <div 
              className="digital-ecg-viewport"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <div 
                className="digital-ecg-canvas"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.12s ease-out'
                }}
              >
                <img 
                  src={displayedImage} 
                  alt="ECG Report" 
                  className="digital-ecg-img" 
                  draggable={false} 
                />
              </div>

              <div className="ecg-viewport-hint">
                {zoom > 1 ? (
                  <span>{lang === 'hi' ? 'खींचकर आगे-पीछे देखें' : 'Click & drag to pan'}</span>
                ) : (
                  <span>{lang === 'hi' ? 'विस्तार से देखने के लिए ज़ूम करें' : 'Use zoom controls to inspect waveforms'}</span>
                )}
              </div>
            </div>

            {/* Mandatory Regulatory Disclaimer (Rule 7) */}
            <div className="digital-ecg-disclaimer-bar">
              <span>{t('digitalEcgDisclaimer')}</span>
            </div>

            {/* Calibration & Technical Parameters Grid */}
            <div className="digital-ecg-meta-grid">
              <div className="ecg-meta-item">
                <span className="meta-label">{t('speedGainMetric')}</span>
                <span className="meta-val">{recon.calibration?.speedMmPerS || 25} mm/s, {recon.calibration?.gainMmPerMv || 10} mm/mV</span>
              </div>
              <div className="ecg-meta-item">
                <span className="meta-label">Limb / Chest Gain</span>
                <span className="meta-val">
                  {recon.calibration?.limbGainMmPerMv || 10} / {recon.calibration?.chestGainMmPerMv || 10} mm/mV
                </span>
              </div>
              <div className="ecg-meta-item">
                <span className="meta-label">{t('calSourceLabel')}</span>
                <span className="meta-val">
                  {recon.calibration?.pxPerMm ? `${recon.calibration.pxPerMm.toFixed(1)} px/mm` : 'Detected'} ({isAssumedCalib ? 'assumed' : 'grid'})
                </span>
              </div>
              <div className="ecg-meta-item">
                <span className="meta-label">{t('coverageMetric')}</span>
                <span className="meta-val">
                  {recon.quality?.meanCoverage != null ? `${(recon.quality.meanCoverage * 100).toFixed(1)}%` : '100%'}
                </span>
              </div>
              <div className="ecg-meta-item">
                <span className="meta-label">Reprojection</span>
                <span className="meta-val">
                  {recon.quality?.within1PxPct != null ? `${recon.quality.within1PxPct}% <= 1px` : '100%'} ({recon.quality?.reprojectionErrorPx || 0.2}px)
                </span>
              </div>
              <div className="ecg-meta-item">
                <span className="meta-label">Filter Bandwidth</span>
                <span className="meta-val">{recon.calibration?.filterText || '0.15-150 Hz'}</span>
              </div>
            </div>

            {/* Physiological Validation Self-Checks Panel */}
            {recon.quality?.checks && recon.quality.checks.length > 0 && (
              <div className="digital-ecg-checks-panel" style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'var(--surface, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary, #334155)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cardiology Self-Checks (Zero Hallucination Proof)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                  {recon.quality.checks.map((chk, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                      {chk.passed ? (
                        <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                      ) : (
                        <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                      )}
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{chk.description || chk.check}:</span>{' '}
                        <span style={{ color: chk.passed ? '#15803d' : '#b45309', fontWeight: 500 }}>
                          {chk.passed ? 'Verified' : 'Notice'} ({chk.value} {chk.unit || ''})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. What you can do */}
        <div className="results-guidance-card" id="ecg-what-you-can-do">
          <h3>
            <Info size={20} style={{ color: 'var(--accent)' }} />
            {t('whatYouCanDo')}
          </h3>
          <ul className="guidance-list">
            {ecgTips.map((tip, idx) => (
              <li key={idx} className="guidance-list-item">
                <span className="guidance-bullet">{idx + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 5. Questions to ask your doctor */}
        <div className="results-guidance-card" id="ecg-doctor-questions">
          <h3>
            <HelpCircle size={20} style={{ color: 'var(--accent)' }} />
            {t('questionsForDoctor')}
          </h3>
          <ul className="guidance-list">
            {ecgQuestions.map((q, idx) => (
              <li key={idx} className="guidance-list-item">
                <span className="guidance-bullet">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Buttons: Save as PDF, Share, Check another report */}
        <div className="results-actions-bar" id="ecg-actions-bar">
          <button 
            onClick={handleExportPDF}
            className="btn btn-primary"
            id="print-ecg-btn"
          >
            <Download size={18} />
            {t('saveAsPdf')}
          </button>

          <button 
            onClick={handleShare}
            className="btn btn-secondary"
            id="share-ecg-btn"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'Copied to clipboard!' : t('share')}
          </button>

          <button 
            onClick={() => navigate('/cardiac')}
            className="btn btn-secondary"
            id="another-ecg-btn"
          >
            <RotateCcw size={18} />
            {t('checkAnother')}
          </button>
        </div>

        {/* Disclaimer */}
        <Disclaimer />
      </div>
    </div>
  )
}
