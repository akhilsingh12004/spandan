import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  HelpCircle, 
  HeartPulse, 
  ScanEye, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Sparkles, 
  Stethoscope, 
  Info, 
  BookOpen,
  Camera,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

const GLOSSARY_TERMS = [
  {
    term: 'ECG / EKG',
    category: 'Heart',
    simple: 'Electrocardiogram — a test that records the electrical signals of your heart to check your heartbeat rhythm and pattern.',
    example: 'Shows whether your heart beats too fast, too slow, or irregularly.'
  },
  {
    term: 'Sinus Rhythm',
    category: 'Heart',
    simple: 'A normal, healthy heart rhythm originating from the heart’s natural pacemaker (sinus node).',
    example: 'Normal resting rate for adults is usually 60 to 100 beats per minute.'
  },
  {
    term: 'Bradycardia / Tachycardia',
    category: 'Heart',
    simple: 'Bradycardia means a resting heart rate slower than 60 bpm. Tachycardia means faster than 100 bpm.',
    example: 'Tachycardia can be caused by simple things like coffee, stress, or exercise.'
  },
  {
    term: 'Grad-CAM Heatmap',
    category: 'AI & Imaging',
    simple: 'A visual highlight (yellow & red glow) showing the exact spots on your photo or rhythm strip that the AI looked at to make its decision.',
    example: 'Think of it like a digital magnifying glass highlighting areas of interest.'
  },
  {
    term: 'Lesion',
    category: 'Skin',
    simple: 'Any unusual mark, bump, rash, or mole on the skin that looks different from the surrounding healthy skin.',
    example: 'Can include benign freckles, acne bumps, or spots that require a doctor’s check.'
  },
  {
    term: 'Melanoma vs Nevus',
    category: 'Skin',
    simple: 'A nevus is a common, harmless mole. Melanoma is a skin condition that requires prompt doctor evaluation.',
    example: 'Doctors check the ABCDs: Asymmetry, Border, Color, and Diameter.'
  },
  {
    term: 'CBC (Complete Blood Count)',
    category: 'Blood',
    simple: 'A standard blood test counting your red blood cells (energy & oxygen), white blood cells (immune defense), and platelets (clotting).',
    example: 'Shows if you have anemia (low iron/red cells) or an infection.'
  },
  {
    term: 'Hemoglobin (Hb)',
    category: 'Blood',
    simple: 'The iron-rich protein in your red blood cells that carries oxygen from your lungs to the rest of your body.',
    example: 'Low hemoglobin can make you feel tired or lightheaded.'
  },
  {
    term: 'HbA1c',
    category: 'Blood',
    simple: 'A 3-month blood test that measures your average blood sugar levels over time.',
    example: 'Used to check for prediabetes or evaluate how well diabetes is managed.'
  },
  {
    term: 'Lipid Profile (Cholesterol)',
    category: 'Blood',
    simple: 'A test measuring fats in your blood, including LDL ("bad" cholesterol), HDL ("good" cholesterol), and Triglycerides.',
    example: 'High levels can be improved with diet, exercise, and hydration.'
  },
  {
    term: 'Reference Range',
    category: 'Blood',
    simple: 'The normal expected range of numbers found in healthy adults for a specific test.',
    example: 'If your result is slightly outside the range, it does not always mean an illness — diet, hydration, and time of day can affect it.'
  },
  {
    term: 'Confidence Score',
    category: 'AI & Imaging',
    simple: 'A percentage (e.g. 85%) showing how closely your uploaded sample matches thousands of verified medical cases in the AI system.',
    example: 'Higher scores mean stronger resemblance to typical clinical patterns.'
  }
]

export default function BeginnerHelpModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('which-test')
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const filteredGlossary = GLOSSARY_TERMS.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AnimatePresence>
      <div 
        className="beginner-modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 12, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          className="glass-card-static beginner-modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            maxWidth: '780px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Beginner Guide & Simple Glossary
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Clear, jargon-free help so anyone can use Spandan AI with confidence
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(15, 19, 24, 0.4)',
            padding: '0 16px',
            gap: '8px',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setActiveTab('which-test')}
              style={{
                padding: '12px 14px',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'which-test' ? 600 : 400,
                color: activeTab === 'which-test' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'which-test' ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <HelpCircle size={15} />
              Which Test Do I Need?
            </button>
            <button
              onClick={() => setActiveTab('photo-tips')}
              style={{
                padding: '12px 14px',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'photo-tips' ? 600 : 400,
                color: activeTab === 'photo-tips' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'photo-tips' ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Camera size={15} />
              How to Take Photos
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              style={{
                padding: '12px 14px',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'glossary' ? 600 : 400,
                color: activeTab === 'glossary' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'glossary' ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={15} />
              Medical Jargon Buster
            </button>
          </div>

          {/* Modal Body */}
          <div style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}>
            {/* Tab 1: Which Test Do I Need? */}
            {activeTab === 'which-test' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Spandan AI provides three simple diagnostic tools. Match what you have in hand to the right check:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Card 1: Heart */}
                  <div style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(244, 63, 94, 0.1)',
                      color: 'var(--status-critical)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <HeartPulse size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>1. Heart & ECG Rhythm Check</h4>
                        <Link 
                          to="/cardiac" 
                          onClick={onClose}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Open Check <ArrowRight size={12} />
                        </Link>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                        <strong>Use this if:</strong> You received an ECG/EKG paper strip or chart from a clinic, smartwatch, or hospital, and want to know if the heart rhythm looks regular or irregular.
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        📎 Accepts: Photo of ECG paper or digital rhythm image (PNG, JPG).
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Skin */}
                  <div style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(6, 214, 160, 0.1)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ScanEye size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>2. Skin Lesion & Rash Check</h4>
                        <Link 
                          to="/skin" 
                          onClick={onClose}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Open Check <ArrowRight size={12} />
                        </Link>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                        <strong>Use this if:</strong> You noticed a mole, rash, dry patch, or spot on your skin and want to see what common conditions it looks like before visiting your dermatologist.
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        📎 Accepts: Clear, focused smartphone photo of the skin spot.
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Blood */}
                  <div style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>3. Routine Blood Test Analyzer</h4>
                        <Link 
                          to="/blood" 
                          onClick={onClose}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Open Check <ArrowRight size={12} />
                        </Link>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                        <strong>Use this if:</strong> You have a standard lab blood test report (CBC, Cholesterol, Sugar, Thyroid, Liver, Kidney, Vitamins) and want an immediate explanation in everyday words.
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        📎 Accepts: PDF document or camera photo of your lab test pages.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: How to Take Photos */}
            {activeTab === 'photo-tips' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Clear images help our AI provide the most accurate evaluation. Follow these simple tips:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(45, 212, 191, 0.05)',
                    border: '1px solid rgba(45, 212, 191, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 600, marginBottom: '12px' }}>
                      <CheckCircle2 size={18} />
                      Good Photo Practices
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      <li>☀️ <strong>Bright, Natural Light:</strong> Avoid dark rooms or harsh flash glares.</li>
                      <li>📐 <strong>Flat & Centered:</strong> Hold camera parallel to the paper or skin.</li>
                      <li>🎯 <strong>Sharp Focus:</strong> Tap your phone screen to ensure text or skin edges are crisp.</li>
                      <li>📄 <strong>Full Page Visible:</strong> Ensure test numbers and units aren't cut off.</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(232, 93, 117, 0.05)',
                    border: '1px solid rgba(232, 93, 117, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-critical)', fontWeight: 600, marginBottom: '12px' }}>
                      <XCircle size={18} />
                      What to Avoid
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      <li>🚫 <strong>Blurry / Motion Blur:</strong> Rest your elbows or phone on a table if shaky.</li>
                      <li>🚫 <strong>Severe Shadows:</strong> Don't let your hand or phone cast a dark shadow over words.</li>
                      <li>🚫 <strong>Creased or Folded Paper:</strong> Smooth out folds before snapping.</li>
                      <li>🚫 <strong>Distant Shots:</strong> Don't stand across the room; fill the camera frame.</li>
                    </ul>
                  </div>
                </div>

                <div style={{
                  marginTop: '20px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Sparkles size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                    <strong>Pro Tip:</strong> Don't have your personal medical papers handy? Every module includes a <strong>"Try with Sample"</strong> button so you can explore the features right away!
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Glossary */}
            {activeTab === 'glossary' && (
              <div>
                <div style={{
                  position: 'relative',
                  marginBottom: '16px'
                }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search any medical term (e.g. ECG, Hemoglobin, Lesion)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredGlossary.map((item) => (
                    <div 
                      key={item.term}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                          {item.term}
                        </span>
                        <span style={{
                          fontSize: '0.6875rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-muted)'
                        }}>
                          {item.category}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {item.simple}
                      </p>
                      {item.example && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>
                          💡 <em>{item.example}</em>
                        </p>
                      )}
                    </div>
                  ))}

                  {filteredGlossary.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No terms found matching "{searchTerm}". Try another search!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(15, 19, 24, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope size={14} /> Always discuss results with a certified healthcare professional
            </span>
            <button
              onClick={onClose}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 16px' }}
            >
              Got It
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
