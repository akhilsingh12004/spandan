import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Send, 
  Activity, 
  FileText, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Apple, 
  Dumbbell, 
  Droplets, 
  Pill, 
  MessageSquare, 
  Calendar, 
  ArrowRight,
  Shield,
  Zap,
  Heart,
  HelpCircle,
  Clock,
  Layers,
  HeartPulse,
  ScanEye
} from 'lucide-react'
import { fetchReportExplanation, askReportAI } from '../services/api'

export default function AIReportExplainer({ reportData, module = 'blood' }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [readingLevel, setReadingLevel] = useState('simple')
  const [explanation, setExplanation] = useState(reportData?.aiExplanation || null)
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(!reportData?.aiExplanation)
  const [copied, setCopied] = useState(false)

  // Audio Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  // Chat state
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I am your Spandan AI Health Assistant. I have thoroughly evaluated your ${module === 'blood' ? 'blood test report' : module === 'cardiac' ? 'ECG rhythm strip' : 'skin lesion analysis'}. How can I help you understand your results today?`,
      timestamp: 'Just now'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatBottomRef = useRef(null)

  // Fetch or regenerate explanation if needed
  useEffect(() => {
    if (reportData?.aiExplanation && readingLevel === 'standard') {
      setExplanation(reportData.aiExplanation)
      setIsLoadingExplanation(false)
    } else if (reportData) {
      setIsLoadingExplanation(true)
      fetchReportExplanation(reportData, module, readingLevel)
        .then(data => {
          setExplanation(data)
          setIsLoadingExplanation(false)
        })
        .catch(err => {
          console.error('[Spandan AI] Failed to fetch explanation:', err)
          setIsLoadingExplanation(false)
        })
    }
  }, [reportData, module, readingLevel])

  // Check speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true)
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  // Handle Speech Synthesis
  const handleToggleSpeech = () => {
    if (!speechSupported || !explanation) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      window.speechSynthesis.cancel()
      const textToSpeak = `${explanation.headline}. ${explanation.executiveSummary} For your dietary and lifestyle plan: ${explanation.lifestylePrescription?.nutrition?.slice(0, 2).join(' ')} Remember to consult your healthcare provider for clinical confirmation.`
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  // Handle Copy Summary
  const handleCopySummary = () => {
    if (!explanation) return
    const formatted = `🏥 SPANDAN AI CLINICAL REPORT EXPLANATION
Headline: ${explanation.headline}
Metabolic Health Score: ${explanation.healthScore || 'N/A'}/100
Acuity Level: ${explanation.acuityLevel || 'Standard'}

EXECUTIVE SUMMARY:
${explanation.executiveSummary}

KEY LIFESTYLE PRESCRIPTION:
- Nutrition: ${explanation.lifestylePrescription?.nutrition?.join('; ')}
- Exercise: ${explanation.lifestylePrescription?.exercise?.join('; ')}

QUESTIONS FOR YOUR DOCTOR:
${explanation.doctorChecklist?.questions?.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Medical Disclaimer: For educational and decision-support purposes only. Consult a registered physician.`

    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // Handle Chat Submit
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage
    if (!textToSend.trim() || isChatLoading) return

    const userMsg = {
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!customText) setInputMessage('')
    setIsChatLoading(true)

    try {
      const response = await askReportAI(reportData, textToSend, messages, module)
      const aiReply = {
        sender: 'ai',
        text: response.reply,
        suggestions: response.followUpSuggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiReply])
    } catch (err) {
      console.error('[Spandan AI] Chat error:', err)
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I apologize, but I encountered an issue analyzing that question. Based on your report, your primary focus should be discussing the highlighted parameters with your physician.",
          timestamp: 'Just now'
        }
      ])
    } finally {
      setIsChatLoading(false)
    }
  }

  if (isLoadingExplanation || !explanation) {
    return (
      <div className="glass-card-static ai-explainer-card" style={{ padding: '36px', textAlign: 'center', margin: '32px 0' }}>
        <div className="ai-pulse-spinner" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>
          Spandan AI Clinical Synthesis in Progress...
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Evaluating multi-parameter pathological patterns, organ physiological correlations, and plain-language guidance.
        </p>
      </div>
    )
  }

  const promptChips = [
    "Explain this report in very simple words",
    "What everyday foods or drinks should I focus on?",
    "Are any of my abnormal results dangerous?",
    "What specific questions should I ask my doctor at my visit?",
    "Give me 3 easy lifestyle habits to improve my health"
  ]

  const getSystemIcon = (id) => {
    switch (id) {
      case 'cardiovascular': return <Heart size={18} />
      case 'hematology': return <Activity size={18} />
      case 'metabolic': return <Zap size={18} />
      case 'hepatic': return <Shield size={18} />
      case 'renal': return <Droplets size={18} />
      case 'rhythm': return <HeartPulse size={18} />
      case 'integumentary': return <ScanEye size={18} />
      default: return <Sparkles size={18} />
    }
  }

  return (
    <div className="ai-explainer-container" id="ai-report-explainer">
      <div className="ai-explainer-card">
        {/* Top Header & Glow Bar */}
        <div className="ai-explainer-header">
          <div className="ai-assistant-badge">
            <span className="ai-badge-pulse" />
            <Sparkles size={15} style={{ color: 'var(--accent-cyan)' }} />
            <span>Spandan Clinical AI Explainer</span>
          </div>

          <div className="ai-header-controls">
            {/* Reading Level Toggle */}
            <div className="reading-level-toggle">
              <button 
                type="button"
                className={`reading-pill ${readingLevel === 'simple' ? 'active' : ''}`}
                onClick={() => setReadingLevel('simple')}
                title="Simple, everyday plain English"
              >
                🟢 Easy English
              </button>
              <button 
                type="button"
                className={`reading-pill ${readingLevel === 'standard' ? 'active' : ''}`}
                onClick={() => setReadingLevel('standard')}
                title="Comprehensive clinical breakdown"
              >
                🔬 Clinical Specs
              </button>
            </div>

            {/* Audio Reader */}
            {speechSupported && (
              <button 
                type="button"
                onClick={handleToggleSpeech}
                className={`btn btn-secondary btn-sm ai-tool-btn ${isSpeaking ? 'active-audio' : ''}`}
                title={isSpeaking ? "Pause Narration" : "Listen to AI Explanation"}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isSpeaking ? "Stop Voice" : "Listen"}</span>
                {isSpeaking && (
                  <span className="equalizer-waves">
                    <span className="wave-bar bar-1" />
                    <span className="wave-bar bar-2" />
                    <span className="wave-bar bar-3" />
                  </span>
                )}
              </button>
            )}

            {/* Copy Button */}
            <button 
              type="button"
              onClick={handleCopySummary}
              className="btn btn-secondary btn-sm ai-tool-btn"
              title="Copy Report Summary"
            >
              {copied ? <Check size={15} style={{ color: 'var(--accent-cyan)' }} /> : <Copy size={15} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic AI Headline Banner */}
        <div className="ai-headline-banner">
          <div>
            <h2 className="ai-report-headline">
              {explanation.headline}
            </h2>
            <div className="ai-headline-meta">
              <span className={`ai-acuity-tag ${explanation.acuityLevel === 'High' ? 'acuity-high' : explanation.acuityLevel === 'Moderate' ? 'acuity-mod' : 'acuity-low'}`}>
                {explanation.acuityLevel === 'High' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                {explanation.acuityLevel} Priority
              </span>
              <span className="ai-score-tag">
                Metabolic Score: <strong>{explanation.healthScore}/100</strong>
              </span>
              <span className="ai-timestamp-tag">
                <Clock size={12} />
                Analyzed: {explanation.generatedAt || 'Today'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="ai-tabs-nav">
          <button 
            type="button"
            className={`ai-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <FileText size={16} />
            <span>Executive Summary</span>
          </button>

          <button 
            type="button"
            className={`ai-tab-btn ${activeTab === 'organs' ? 'active' : ''}`}
            onClick={() => setActiveTab('organs')}
          >
            <Layers size={16} />
            <span>Organ Breakdown ({explanation.organSystems?.length || 0})</span>
          </button>

          <button 
            type="button"
            className={`ai-tab-btn ${activeTab === 'lifestyle' ? 'active' : ''}`}
            onClick={() => setActiveTab('lifestyle')}
          >
            <Apple size={16} />
            <span>Diet & Lifestyle</span>
          </button>

          <button 
            type="button"
            className={`ai-tab-btn ${activeTab === 'doctor' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctor')}
          >
            <Stethoscope size={16} />
            <span>Doctor Checklist</span>
          </button>

          <button 
            type="button"
            className={`ai-tab-btn ai-tab-chat ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} />
            <span>Ask AI Doctor</span>
            <span className="chat-badge-pulse" />
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="ai-tab-body">
          <AnimatePresence mode="wait">
            {/* TAB 1: EXECUTIVE SUMMARY */}
            {activeTab === 'summary' && (
              <motion.div 
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="ai-pane-summary"
              >
                <div className="ai-summary-box">
                  <h3 className="ai-section-title">
                    <Sparkles size={18} style={{ color: 'var(--accent-amber)' }} />
                    What This Report Means For Your Body
                  </h3>
                  <p className="ai-executive-text">
                    {explanation.executiveSummary}
                  </p>
                </div>

                {/* Key Takeaways Cards */}
                <div className="ai-takeaways-grid">
                  <div className="ai-takeaway-card">
                    <div className="takeaway-icon-wrap icon-cyan">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="takeaway-title">Positive Findings</h4>
                      <p className="takeaway-desc">
                        {module === 'blood' 
                          ? `${reportData?.summary?.normalCount ?? 'Multiple'} parameters reside comfortably within standard adult reference intervals, demonstrating biological resilience.`
                          : 'Underlying baseline physiological markers confirm core functional capacity.'}
                      </p>
                    </div>
                  </div>

                  <div className="ai-takeaway-card">
                    <div className="takeaway-icon-wrap icon-amber">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 className="takeaway-title">Primary Focus Areas</h4>
                      <p className="takeaway-desc">
                        {explanation.organSystems?.filter(o => o.status !== 'OPTIMAL').map(o => o.name.split(' (')[0]).join(', ') || 'Maintain current preventive health habits and routine screening.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Red Flags Alert if present */}
                {explanation.redFlags && explanation.redFlags.length > 0 && (
                  <div className="ai-redflag-banner">
                    <AlertTriangle size={20} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '4px' }}>
                        When to Seek Immediate Medical Evaluation
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        While your test report provides outpatient decision support, please seek urgent medical attention if you experience:
                      </p>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {explanation.redFlags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: ORGAN SYSTEMS BREAKDOWN */}
            {activeTab === 'organs' && (
              <motion.div 
                key="organs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="ai-pane-organs"
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {explanation.organSystems?.map((system) => {
                    const isOptimal = system.status === 'OPTIMAL'
                    const isCritical = system.status === 'CRITICAL_ALERT'

                    return (
                      <div 
                        key={system.id} 
                        className={`ai-organ-card ${isCritical ? 'organ-critical' : !isOptimal ? 'organ-attention' : 'organ-optimal'}`}
                      >
                        <div className="organ-card-top">
                          <div className="organ-name-wrap">
                            <div className="organ-icon-circle">
                              {getSystemIcon(system.id)}
                            </div>
                            <span className="organ-title">{system.name}</span>
                          </div>
                          <span className={`organ-status-chip ${isCritical ? 'chip-critical' : !isOptimal ? 'chip-attention' : 'chip-optimal'}`}>
                            {isCritical ? 'Critical Alert' : !isOptimal ? 'Attention Needed' : 'Healthy / Optimal'}
                          </span>
                        </div>

                        <p className="organ-summary-text">
                          {system.summary}
                        </p>

                        {system.relevantMarkers && system.relevantMarkers.length > 0 && (
                          <div className="organ-markers-list">
                            <span className="organ-markers-label">Evaluated Values:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                              {system.relevantMarkers.map((marker, idx) => (
                                <span key={idx} className="organ-marker-pill">
                                  {marker}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {system.physiologicalMechanism && (
                          <div className="organ-mechanism-box">
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Biological Mechanism: </span>
                            {system.physiologicalMechanism}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB 3: LIFESTYLE & NUTRITION */}
            {activeTab === 'lifestyle' && (
              <motion.div 
                key="lifestyle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="ai-pane-lifestyle"
              >
                <div className="lifestyle-grid">
                  {/* Nutrition Card */}
                  <div className="lifestyle-category-card">
                    <div className="lifestyle-cat-header">
                      <div className="lifestyle-cat-icon icon-nutrition">
                        <Apple size={20} />
                      </div>
                      <h4>Targeted Nutrition & Foods</h4>
                    </div>
                    <ul className="lifestyle-bullet-list">
                      {explanation.lifestylePrescription?.nutrition?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Physical Activity Card */}
                  <div className="lifestyle-category-card">
                    <div className="lifestyle-cat-header">
                      <div className="lifestyle-cat-icon icon-activity">
                        <Dumbbell size={20} />
                      </div>
                      <h4>Movement & Physical Activity</h4>
                    </div>
                    <ul className="lifestyle-bullet-list">
                      {explanation.lifestylePrescription?.exercise?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Supplements Card */}
                  <div className="lifestyle-category-card">
                    <div className="lifestyle-cat-header">
                      <div className="lifestyle-cat-icon icon-supplements">
                        <Pill size={20} />
                      </div>
                      <h4>Supplements to Discuss with Doctor</h4>
                    </div>
                    <ul className="lifestyle-bullet-list">
                      {explanation.lifestylePrescription?.supplements?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Daily Habits & Hydration */}
                  <div className="lifestyle-category-card">
                    <div className="lifestyle-cat-header">
                      <div className="lifestyle-cat-icon icon-habits">
                        <Droplets size={20} />
                      </div>
                      <h4>Daily Hydration & Sleep Rhythm</h4>
                    </div>
                    <ul className="lifestyle-bullet-list">
                      {explanation.lifestylePrescription?.habits?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: DOCTOR CHECKLIST */}
            {activeTab === 'doctor' && (
              <motion.div 
                key="doctor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="ai-pane-doctor"
              >
                <div className="doctor-header-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="doctor-icon-box">
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        Your Personalized Clinical Consultation Guide
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        Take these tailored questions directly to your physician to maximize your appointment.
                      </p>
                    </div>
                  </div>

                  <div className="doctor-meta-pills">
                    <div className="meta-pill">
                      <Calendar size={14} style={{ color: 'var(--accent-amber)' }} />
                      <span>Follow-up: <strong>{explanation.doctorChecklist?.followUpTimeline || 'Within 2-4 weeks'}</strong></span>
                    </div>
                    {explanation.doctorChecklist?.recommendedSpecialists?.length > 0 && (
                      <div className="meta-pill">
                        <Stethoscope size={14} style={{ color: 'var(--accent-cyan)' }} />
                        <span>Specialists: <strong>{explanation.doctorChecklist.recommendedSpecialists.join(', ')}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="doctor-questions-container">
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Questions to Ask at Your Visit:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {explanation.doctorChecklist?.questions?.map((question, idx) => (
                      <div key={idx} className="doctor-question-row">
                        <span className="question-number">{idx + 1}</span>
                        <p className="question-text">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: ASK AI ASSISTANT (INTERACTIVE CHAT) */}
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="ai-pane-chat"
              >
                {/* Prompt Suggestions */}
                <div className="chat-chips-scroll">
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    Quick prompts:
                  </span>
                  {promptChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="chat-prompt-chip"
                      onClick={() => handleSendMessage(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Message Stream */}
                <div className="ai-chat-stream">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble-wrap ${msg.sender === 'user' ? 'wrap-user' : 'wrap-ai'}`}>
                      {msg.sender === 'ai' && (
                        <div className="chat-avatar-ai">
                          <Sparkles size={14} />
                        </div>
                      )}
                      <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                        <div className="bubble-text" style={{ whiteSpace: 'pre-line' }}>
                          {msg.text}
                        </div>
                        <div className="bubble-time">{msg.timestamp}</div>

                        {/* Contextual Suggestions from AI */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="bubble-suggestions">
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Follow-up:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                              {msg.suggestions.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  className="suggestion-pill"
                                  onClick={() => handleSendMessage(sug)}
                                >
                                  {sug}
                                  <ArrowRight size={10} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isChatLoading && (
                    <div className="chat-bubble-wrap wrap-ai">
                      <div className="chat-avatar-ai">
                        <Sparkles size={14} />
                      </div>
                      <div className="chat-bubble bubble-ai bubble-typing">
                        <span className="dot dot-1" />
                        <span className="dot dot-2" />
                        <span className="dot dot-3" />
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="ai-chat-input-bar"
                >
                  <input 
                    type="text" 
                    placeholder="Ask any question about your report (e.g. 'Can I drink coffee with low iron?')..." 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={isChatLoading}
                    className="ai-chat-input"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isChatLoading}
                    className="btn btn-primary ai-chat-send-btn"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
