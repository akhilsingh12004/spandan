import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HeartPulse, 
  ScanEye, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Check, 
  ArrowRight,
  Shield, 
  Zap, 
  HelpCircle,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  BookOpen,
  ChevronDown
} from 'lucide-react'
import Disclaimer from '../components/Disclaimer'
import BeginnerHelpModal from '../components/BeginnerHelpModal'

export default function HomePage() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState(null)

  const faqs = [
    {
      q: 'Do I need medical knowledge to understand the results?',
      a: 'Not at all! Spandan AI is built specifically so anyone can understand their reports. We translate medical codes (like CBC, MCV, or Arrhythmia) into simple everyday words with clear Normal, Low, and High gauges.'
    },
    {
      q: 'What if I do not have an ECG strip or blood report with me right now?',
      a: 'Every module has a "Try with Sample" button! You can click it to instantly load a real clinical sample and explore how the analysis works in 1 click without needing your own files.'
    },
    {
      q: 'How does the AI explain where it looked?',
      a: 'We use visual heatmaps (called Grad-CAM). Just like a doctor circles an area on an X-ray, the AI shows a soft glowing colored highlight over the exact part of your photo or waveform that influenced its assessment.'
    },
    {
      q: 'Can this replace a doctor or medical diagnosis?',
      a: 'No. Spandan AI is an educational assistant designed to help you understand your reports and prepare better questions for your physician. Always consult a licensed healthcare professional for clinical decisions.'
    }
  ]

  return (
    <>
      <BeginnerHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* ── Hero Section ── */}
      <section className="hero" id="hero-section">
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ cursor: 'pointer' }}
            onClick={() => setIsHelpOpen(true)}
          >
            <span className="pulse-dot" />
            <span>Simple AI Health Checks • Tap for Beginner Guide</span>
          </motion.div>

          <motion.h1
            className="text-display hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Understand Your Health Reports in Seconds
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ maxWidth: '680px', margin: '0 auto 28px' }}
          >
            Got an ECG paper strip, a skin spot photo, or a blood test report? 
            Upload it to get an instant, plain-English breakdown with clear visual gauges—no medical degree needed.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/cardiac" className="btn btn-primary btn-lg" id="cta-cardiac">
              <HeartPulse size={18} />
              Heart & ECG Check
            </Link>
            <Link to="/skin" className="btn btn-secondary btn-lg" id="cta-skin">
              <ScanEye size={18} />
              Skin Spot Check
            </Link>
            <Link to="/blood" className="btn btn-secondary btn-lg" id="cta-blood">
              <FileText size={18} />
              Blood Test Analyzer
            </Link>
          </motion.div>

          {/* Quick Helper Banner for Beginners */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{
              marginTop: '32px',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              background: 'rgba(45, 212, 191, 0.05)',
              border: '1px solid rgba(45, 212, 191, 0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  New here? Not sure which check to pick?
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Open our interactive 1-minute visual guide or dictionary anytime.
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.8125rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              Open Quick Guide <ArrowRight size={14} />
            </button>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="hero-stat">
              <div className="hero-stat-value">3</div>
              <div className="hero-stat-label">Simple Health Checks</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">Plain English</div>
              <div className="hero-stat-label">Easy-to-Read Reports</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;3s</div>
              <div className="hero-stat-label">Instant Results</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">1-Click</div>
              <div className="hero-stat-label">Free Demo Samples</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ECG Divider ── */}
      <div className="ecg-divider" />

      {/* ── Visual "Pick What You Have" Selector for Beginners ── */}
      <section style={{ padding: '60px 24px 30px' }} id="quick-selector">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{ 
              fontSize: '0.8125rem', 
              fontWeight: 600, 
              color: 'var(--accent)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              background: 'var(--accent-subtle)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)'
            }}>
              Step 1: Pick what you have in hand
            </span>
            <h2 className="text-h1" style={{ marginTop: '14px' }}>
              What would you like to check today?
            </h2>
          </div>

          <div className="modules-grid">
            {/* Cardiac Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="module-card module-card-cardiac" id="module-cardiac">
                <div className="module-icon module-icon-cardiac">
                  <HeartPulse size={26} />
                </div>
                <h3>1. Heart & ECG Rhythm Check</h3>
                <p style={{ color: 'var(--accent-text)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px' }}>
                  Have an ECG paper strip or rhythm chart?
                </p>
                <p>
                  Upload a photo of your ECG printout. The AI reads your heartbeat line, checks if your heart rate is regular, and explains any findings in simple words.
                </p>
                <ul className="module-features">
                  {[
                    'Automatic heartbeat rate (bpm) check',
                    'Flags slow, fast, or irregular rhythms',
                    'Visual highlight showing where the AI focused',
                    'Questions to ask your cardiologist',
                  ].map((feat) => (
                    <li key={feat}>
                      <Check size={14} className="cardiac-check" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <Link to="/cardiac" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    Check ECG Strip <ChevronRight size={14} />
                  </Link>
                  <Link 
                    to="/cardiac" 
                    style={{ 
                      fontSize: '0.78rem', 
                      color: 'var(--text-muted)', 
                      textAlign: 'center', 
                      textDecoration: 'underline' 
                    }}
                  >
                    Don't have a strip? Try sample ECG demo →
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Skin Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="module-card module-card-skin" id="module-skin">
                <div className="module-icon module-icon-skin">
                  <ScanEye size={26} />
                </div>
                <h3>2. Skin Spot & Rash Check</h3>
                <p style={{ color: 'var(--accent-text)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px' }}>
                  Have a mole, spot, or unusual rash?
                </p>
                <p>
                  Upload a focused smartphone photo of a skin spot. The AI highlights regions of interest and matches them against common skin conditions.
                </p>
                <ul className="module-features">
                  {[
                    'Photo tips for best smartphone capture',
                    'Visual heatmaps showing regions of interest',
                    'Clear severity rating: Low, Moderate, or Doctor Review',
                    'Checklist for your skin doctor visit',
                  ].map((feat) => (
                    <li key={feat}>
                      <Check size={14} className="skin-check" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <Link to="/skin" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    Check Skin Spot <ChevronRight size={14} />
                  </Link>
                  <Link 
                    to="/skin" 
                    style={{ 
                      fontSize: '0.78rem', 
                      color: 'var(--text-muted)', 
                      textAlign: 'center', 
                      textDecoration: 'underline' 
                    }}
                  >
                    Don't have a photo? Try sample skin demo →
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Blood Test Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="module-card module-card-blood" id="module-blood">
                <div className="module-icon module-icon-blood">
                  <FileText size={26} />
                </div>
                <h3>3. Blood Lab Report Analyzer</h3>
                <p style={{ color: 'var(--accent-text)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px' }}>
                  Have a routine lab report (PDF or paper photo)?
                </p>
                <p>
                  Upload a photo or PDF of your routine blood work (CBC, Sugar, Lipids, Vitamins). We turn confusing numbers into clear gauges and an overall Health Score.
                </p>
                <ul className="module-features">
                  {[
                    'Plain-English definitions for every test',
                    'Visual Low / Normal / High color gauges',
                    'Overall Health Score (0 to 100)',
                    'Actionable food, water, and lifestyle tips',
                  ].map((feat) => (
                    <li key={feat}>
                      <Check size={14} className="blood-check" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <Link to="/blood" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    Analyze Blood Report <ChevronRight size={14} />
                  </Link>
                  <Link 
                    to="/blood" 
                    style={{ 
                      fontSize: '0.78rem', 
                      color: 'var(--text-muted)', 
                      textAlign: 'center', 
                      textDecoration: 'underline' 
                    }}
                  >
                    Don't have a report? Try sample report demo →
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ECG Divider ── */}
      <div className="ecg-divider" />

      {/* ── How It Works — 3 Simple Steps ── */}
      <section style={{ padding: '80px 24px 90px' }} id="how-it-works">
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '52px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span style={{ 
              fontSize: '0.8125rem', 
              fontWeight: 600, 
              color: 'var(--accent)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              background: 'var(--accent-subtle)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)'
            }}>
              Quick & Painless
            </span>
            <h2 className="text-h1" style={{ marginTop: '14px' }}>How It Works in 3 Simple Steps</h2>
            <p className="text-body" style={{ marginTop: '10px', fontSize: 'var(--text-base)' }}>
              No sign-up, no complex forms, and no confusing medical jargon
            </p>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '20px',
            maxWidth: '1050px',
            margin: '0 auto',
          }}>
            {[
              { 
                step: '1',
                icon: <HelpCircle size={22} />, 
                title: 'Choose Your Check', 
                desc: 'Select Heart & ECG, Skin Spot, or Blood Report based on the paper or photo you have.' 
              },
              { 
                step: '2',
                icon: <Camera size={22} />, 
                title: 'Upload or Try a Sample', 
                desc: 'Snap a clear photo with your phone, upload a PDF, or click "Try with Sample" to test instantly.' 
              },
              { 
                step: '3',
                icon: <Sparkles size={22} />, 
                title: 'Get Everyday Explanations', 
                desc: 'Review clear Normal / Attention tags, plain-English summaries, and smart questions to ask your doctor.' 
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                className="glass-card"
                style={{ textAlign: 'center', position: 'relative', paddingTop: '42px', paddingBottom: '32px' }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--bg-primary)',
                  boxShadow: '0 2px 8px var(--accent-glow)'
                }}>
                  {step.step}
                </div>
                
                <div style={{
                  color: 'var(--accent)',
                  marginBottom: '14px',
                  display: 'inline-flex',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-subtle)'
                }}>
                  {step.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.0625rem', 
                  fontWeight: 600, 
                  marginBottom: '10px',
                  color: 'var(--text-primary)',
                }}>
                  {step.title}
                </h3>
                <p className="text-body" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECG Divider ── */}
      <div className="ecg-divider" />

      {/* ── Beginner FAQ Accordion ── */}
      <section style={{ padding: '80px 24px 90px' }}>
        <div className="container-narrow">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '44px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span style={{ 
              fontSize: '0.8125rem', 
              fontWeight: 600, 
              color: 'var(--accent)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              background: 'var(--accent-subtle)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)'
            }}>
              Clear Answers
            </span>
            <h2 className="text-h1" style={{ marginTop: '14px' }}>Frequently Asked Questions</h2>
            <p className="text-body" style={{ marginTop: '8px', fontSize: 'var(--text-base)' }}>
              Everything beginners ask before getting started
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index
              return (
                <div 
                  key={faq.q}
                  className="glass-card-static"
                  style={{ 
                    padding: '18px 20px', 
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                    borderColor: isOpen ? 'var(--border-hover)' : 'var(--border-color)'
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {faq.q}
                    </h4>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: 'var(--accent)', flexShrink: 0 }}
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <BookOpen size={15} />
              Open Complete Beginner Glossary & Photo Guide
            </button>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div className="container-narrow">
          <Disclaimer />
        </div>
      </section>
    </>
  )
}
