import { useState, useMemo } from 'react'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Check, 
  Copy,
  Info
} from 'lucide-react'
import Disclaimer from './Disclaimer'
import { exportBloodReportPDF } from '../services/pdfExport'
import { useLanguage } from '../LanguageContext'
import { TEST_PLAIN_NAMES } from '../translations'

export default function BloodResultsView({ results, uploadedImage, navigate }) {
  const { t, lang } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const parameters = results?.parameters || []
  const summary = results?.summary || {}
  const safety = results?.safety || {}
  const patientContext = results?.patientContext || null

  // Classify critical and abnormal tests
  const criticalItems = useMemo(() => {
    return parameters.filter(p => p.status === 'CRITICAL_HIGH' || p.status === 'CRITICAL_LOW')
  }, [parameters])

  const abnormalItems = useMemo(() => {
    return parameters.filter(p => p.status === 'HIGH' || p.status === 'LOW')
  }, [parameters])

  const normalItems = useMemo(() => {
    return parameters.filter(p => p.status === 'NORMAL')
  }, [parameters])

  // Sorted list: Critical & abnormal first, then normal
  const sortedParameters = useMemo(() => {
    return [...criticalItems, ...abnormalItems, ...normalItems]
  }, [criticalItems, abnormalItems, normalItems])

  // 2-3 sentence plain language summary
  const summaryText = useMemo(() => {
    const total = parameters.length
    const abnormalTotal = criticalItems.length + abnormalItems.length

    if (lang === 'hi') {
      if (abnormalTotal === 0) {
        return `आपके सभी ${total} टेस्ट सामान्य सीमा (Normal) में हैं। आपके शरीर के मुख्य अंग संतुलित दिख रहे हैं। अपनी स्वस्थ दिनचर्या और अच्छा खान-पान बनाए रखें।`
      }
      if (criticalItems.length > 0) {
        return `आपकी जांच में ${criticalItems.length} टेस्ट बहुत अधिक या कम हैं, जिन पर तुरंत ध्यान देना ज़रूरी है। बाकी ${normalItems.length} टेस्ट सामान्य हैं। कृपया जल्द ही अपने डॉक्टर को यह रिपोर्ट दिखाएं।`
      }
      return `आपकी अधिकांश जांचें (${normalItems.length}) सामान्य हैं। ${abnormalTotal} टेस्ट पर थोड़ा ध्यान देने की आवश्यकता है। जीवनशैली और खान-पान में थोड़े सुधार से इन्हें सामान्य किया जा सकता है।`
    }

    if (abnormalTotal === 0) {
      return `All ${total} of your test numbers look normal. Your body systems appear well balanced. Keep up your healthy daily habits and balanced diet.`
    }
    if (criticalItems.length > 0) {
      return `Your report has ${criticalItems.length} result(s) that are significantly out of range and need prompt medical evaluation. The other ${normalItems.length} test(s) are normal. Please contact your doctor or clinic soon.`
    }
    return `Most of your results look normal (${normalItems.length} tests). ${abnormalTotal} test(s) need attention. These can often be improved with simple dietary adjustments, hydration, and doctor guidance.`
  }, [parameters, criticalItems, abnormalItems, normalItems, lang])

  // Status badge details
  const getStatusDetails = (status) => {
    switch (status) {
      case 'CRITICAL_HIGH':
        return {
          label: lang === 'hi' ? 'बहुत अधिक (Critical High)' : 'Very High',
          badgeClass: 'critical',
          icon: <AlertTriangle size={15} />
        }
      case 'CRITICAL_LOW':
        return {
          label: lang === 'hi' ? 'बहुत कम (Critical Low)' : 'Very Low',
          badgeClass: 'critical',
          icon: <AlertTriangle size={15} />
        }
      case 'HIGH':
        return {
          label: lang === 'hi' ? 'अधिक (High)' : 'High',
          badgeClass: 'high',
          icon: <TrendingUp size={15} />
        }
      case 'LOW':
        return {
          label: lang === 'hi' ? 'कम (Low)' : 'Low',
          badgeClass: 'low',
          icon: <TrendingDown size={15} />
        }
      default:
        return {
          label: lang === 'hi' ? 'सामान्य (Normal)' : 'Normal',
          badgeClass: 'normal',
          icon: <CheckCircle2 size={15} />
        }
    }
  }

  // Practical advice tips
  const whatYouCanDoTips = useMemo(() => {
    if (lang === 'hi') {
      return [
        'दिन भर में पर्याप्त साफ़ पानी पिएं (कम से कम 8-10 गिलास)।',
        'हरी पत्तेदार सब्जियां, दालें और ताज़े मौसमी फल अपनी थाली में शामिल करें।',
        'रोजाना 20 से 30 मिनट हल्की सैर या व्यायाम ज़रूर करें।',
        'तले-भुने भोजन, अधिक नमक और बाज़ार की मिठाइयों का सेवन कम करें।',
        'रात में 7 से 8 घंटे की भरपूर और शांत नींद लें।'
      ]
    }
    return [
      'Drink plenty of clean water throughout the day (at least 8-10 glasses).',
      'Add fresh green vegetables, lentils, and seasonal fruits to your daily meals.',
      'Take a brisk 20-30 minute walk each day to improve blood flow and energy.',
      'Cut down on deep-fried food, excess table salt, and packaged sugary snacks.',
      'Aim for 7 to 8 hours of restful sleep every night to let your body repair.'
    ]
  }, [lang])

  // Questions for doctor
  const doctorQuestions = useMemo(() => {
    if (lang === 'hi') {
      return [
        'क्या इन नंबरों के लिए मुझे कोई दवा शुरू करने या बदलने की ज़रूरत है?',
        'क्या मुझे यह टेस्ट कुछ हफ़्तों या महीनों बाद दोबारा करवाना चाहिए?',
        'क्या मेरी रोज़मर्रा की डाइट या कसरत में कोई खास बदलाव करना फायदेमंद होगा?',
        'क्या मेरे जो लक्षण (जैसे थकान या चक्कर) हैं, वे इन नतीजों से जुड़े हैं?'
      ]
    }
    return [
      'Do any of these out-of-range numbers require medication or a dosage change?',
      'Should I repeat this blood test in a few weeks or months to monitor changes?',
      'Are there specific dietary changes or supplements you recommend for me?',
      'Could my daily symptoms (such as feeling tired or dizzy) be related to these numbers?'
    ]
  }, [lang])

  // PDF Export
  const handleSavePDF = () => {
    setIsExportingPDF(true)
    try {
      exportBloodReportPDF(results, patientContext)
    } catch (e) {
      console.warn('PDF generation failed, falling back to print:', e)
      window.print()
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Share
  const handleShare = async () => {
    const textToShare = `Spandan AI Report Summary:\n${summaryText}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Blood Test Explanation — Spandan AI',
          text: textToShare,
          url: window.location.href,
        })
        return
      } catch (err) {
        // User cancelled or share failed, fallback to copy
      }
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
    <div className="upload-page" id="blood-results-screen">
      <div className="container">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/blood')}
          className="upload-back-link"
          id="back-to-blood-input"
        >
          <ArrowLeft size={16} />
          {t('back')}
        </button>

        <h1 className="upload-page-title" style={{ marginBottom: '8px' }}>
          {t('resultsTitle')}
        </h1>
        <p className="upload-page-desc" style={{ marginBottom: '24px' }}>
          {lang === 'hi' 
            ? 'नीचे आपकी खून की जांच का आसान भाषा में विवरण दिया गया है।'
            : 'Here is a plain-language explanation of what your blood test numbers mean.'}
        </p>

        {/* 1. Clear Red Box at the TOP if any value is dangerously abnormal */}
        {criticalItems.length > 0 && (
          <div className="urgent-doctor-box" id="urgent-doctor-banner">
            <AlertTriangle size={28} className="urgent-doctor-icon" />
            <div className="urgent-doctor-content">
              <h2>{t('pleaseSeeDoctor')}</h2>
              <p>
                {lang === 'hi'
                  ? `आपकी जांच में ${criticalItems.map(c => c.canonicalName || c.name).join(', ')} का स्तर सामान्य से बहुत अलग है। कृपया जल्द से जल्द किसी डॉक्टर या क्लिनिक से मिलकर सलाह लें।`
                  : `Your ${criticalItems.map(c => c.canonicalName || c.name).join(', ')} is significantly outside the safe normal range. Please consult a doctor or healthcare clinic today for professional evaluation.`}
              </p>
            </div>
          </div>
        )}

        {/* 2. Plain Summary Card (2-3 sentences, replacing 0-100 score) */}
        <div className="results-summary-card" id="results-summary-box">
          <h2>
            {lang === 'hi' ? 'नतीजों का संक्षिप्त सार' : 'Summary of your results'}
          </h2>
          <p className="results-summary-text">
            {summaryText}
          </p>
        </div>

        {/* 3. List of cards, one per test (Sorted: Needs attention first, then Normal) */}
        <div className="results-list" id="test-cards-list">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
            {lang === 'hi' ? 'हर जांच का विवरण' : 'Individual test details'}
          </h2>

          {sortedParameters.map((param, index) => {
            const rawName = param.canonicalName || param.name || 'Test'
            const plainLookup = TEST_PLAIN_NAMES[rawName]
            const displayName = lang === 'hi' && plainLookup?.hiName 
              ? plainLookup.hiName 
              : plainLookup?.name || rawName

            const status = getStatusDetails(param.status)
            const isAttention = param.status === 'HIGH' || param.status === 'LOW'
            const isCrit = param.status === 'CRITICAL_HIGH' || param.status === 'CRITICAL_LOW'

            const cardStatusClass = isCrit 
              ? 'status-critical' 
              : isAttention 
              ? 'status-attention' 
              : 'status-normal'

            const rangeText = (param.refLow !== undefined && param.refHigh !== undefined)
              ? `${param.refLow} – ${param.refHigh} ${param.unit || ''}`
              : param.referenceRange || 'Standard lab range'

            const plainMeaning = (lang === 'hi' && plainLookup?.hiDescription)
              ? plainLookup.hiDescription
              : plainLookup?.description || param.clinicalInterpretation || 'Standard clinical marker evaluated in blood work.'

            return (
              <div 
                key={`${rawName}-${index}`} 
                className={`result-card ${cardStatusClass}`}
                id={`card-${rawName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <div className="result-card-header">
                  <h3 className="result-card-title">{displayName}</h3>
                  <span className={`result-status-badge ${status.badgeClass}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <div className="result-card-values">
                  <div className="result-val-item">
                    <span className="result-val-label">{t('valueHeader')}</span>
                    <span className="result-val-number">
                      {param.value} {param.unit || ''}
                    </span>
                  </div>
                  <div className="result-val-item">
                    <span className="result-val-label">{t('normalRangeHeader')}</span>
                    <span className="result-val-number" style={{ fontSize: '1.0625rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {rangeText}
                    </span>
                  </div>
                </div>

                <p className="result-card-explanation">
                  {plainMeaning}
                </p>
              </div>
            )
          })}
        </div>

        {/* 4. Section: "What you can do" (3-5 simple tips) */}
        <div className="results-guidance-card" id="what-you-can-do-section" style={{ marginTop: '24px' }}>
          <h3>
            <Info size={20} style={{ color: 'var(--accent)' }} />
            {t('whatYouCanDo')}
          </h3>
          <ul className="guidance-list">
            {whatYouCanDoTips.map((tip, idx) => (
              <li key={idx} className="guidance-list-item">
                <span className="guidance-bullet">{idx + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 5. Section: "Questions to ask your doctor" */}
        <div className="results-guidance-card" id="doctor-questions-section">
          <h3>
            <HelpCircle size={20} style={{ color: 'var(--accent)' }} />
            {t('questionsForDoctor')}
          </h3>
          <ul className="guidance-list">
            {doctorQuestions.map((q, idx) => (
              <li key={idx} className="guidance-list-item">
                <span className="guidance-bullet">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Buttons: "Save as PDF", "Share", "Check another report" */}
        <div className="results-actions-bar" id="results-action-buttons">
          <button 
            onClick={handleSavePDF}
            className="btn btn-primary"
            id="save-pdf-btn"
            disabled={isExportingPDF}
          >
            <Download size={18} />
            {isExportingPDF ? 'Preparing PDF...' : t('saveAsPdf')}
          </button>

          <button 
            onClick={handleShare}
            className="btn btn-secondary"
            id="share-results-btn"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'Copied to clipboard!' : t('share')}
          </button>

          <button 
            onClick={() => navigate('/blood')}
            className="btn btn-secondary"
            id="check-another-report-btn"
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
