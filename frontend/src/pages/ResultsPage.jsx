import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RotateCcw, 
  HeartPulse, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Check, 
  Info 
} from 'lucide-react'
import Disclaimer from '../components/Disclaimer'
import BloodResultsView from '../components/BloodResultsView'
import { useLanguage } from '../LanguageContext'

export default function ResultsPage() {
  const { module } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [results, setResults] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [copied, setCopied] = useState(false)

  const isCardiac = module === 'cardiac'
  const isBlood = module === 'blood'

  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResults')
    const storedImage = sessionStorage.getItem('analysisImage')

    if (!storedResults) {
      navigate(isCardiac ? '/cardiac' : isBlood ? '/blood' : '/cardiac')
      return
    }

    try {
      setResults(JSON.parse(storedResults))
      setUploadedImage(storedImage)
    } catch (e) {
      navigate('/')
    }
  }, [module, navigate, isCardiac, isBlood])

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
            onClick={() => window.print()}
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
