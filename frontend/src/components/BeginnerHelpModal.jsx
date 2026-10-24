import { useState } from 'react'
import { X, HeartPulse, FileText, Search } from 'lucide-react'
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
    simple: 'A normal, healthy heart rhythm originating from the heart\'s natural pacemaker (sinus node).',
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
    category: 'AI',
    simple: 'A visual highlight showing the exact spots on your photo that the AI looked at to make its decision.',
    example: 'Think of it like a digital magnifying glass highlighting areas of interest.'
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
    category: 'AI',
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

  const tabStyle = (tab) => ({
    padding: '10px 14px',
    fontSize: '0.875rem',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'none',
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: activeTab === tab ? 'var(--accent)' : 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    whiteSpace: 'nowrap',
  })

  return (
    <div 
      className="help-modal-overlay"
      onClick={onClose}
    >
      <div
        className="help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="help-modal-header">
          <h2>Quick guide</h2>
          <button onClick={onClose} className="help-modal-close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '20px',
          gap: '4px',
          overflowX: 'auto',
        }}>
          <button onClick={() => setActiveTab('which-test')} style={tabStyle('which-test')}>
            Which test?
          </button>
          <button onClick={() => setActiveTab('photo-tips')} style={tabStyle('photo-tips')}>
            Photo tips
          </button>
          <button onClick={() => setActiveTab('glossary')} style={tabStyle('glossary')}>
            Glossary
          </button>
        </div>

        {/* Tab 1: Which Test Do I Need? */}
        {activeTab === 'which-test' && (
          <div>
            <p className="text-caption" style={{ marginBottom: '16px' }}>
              Choose based on what you have in hand:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <HeartPulse size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>ECG / Heart check</h3>
                    <p className="text-caption">
                      Use this if you have an ECG paper strip or rhythm chart from a clinic or smartwatch.
                    </p>
                    <Link 
                      to="/cardiac" 
                      onClick={onClose}
                      style={{ fontSize: '0.875rem', marginTop: '8px', display: 'inline-block' }}
                    >
                      Go to ECG check →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>Blood test check</h3>
                    <p className="text-caption">
                      Use this if you have a lab blood test report (CBC, cholesterol, sugar, thyroid, liver, etc.).
                    </p>
                    <Link 
                      to="/blood" 
                      onClick={onClose}
                      style={{ fontSize: '0.875rem', marginTop: '8px', display: 'inline-block' }}
                    >
                      Go to blood test check →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Photo Tips */}
        {activeTab === 'photo-tips' && (
          <div>
            <div className="help-section">
              <h3>Good photo practices</h3>
              <ul>
                <li>Use bright, natural light. Avoid dark rooms or harsh flash.</li>
                <li>Lay the paper flat and hold your camera parallel to it.</li>
                <li>Tap your phone screen to focus. Make sure text is sharp.</li>
                <li>Include the full page — don't cut off numbers or units.</li>
              </ul>
            </div>

            <div className="help-section">
              <h3>What to avoid</h3>
              <ul>
                <li>Blurry or shaky photos — rest your phone on a table.</li>
                <li>Shadows over the text from your hand or phone.</li>
                <li>Creased or folded paper — smooth it out first.</li>
                <li>Photos taken from far away — fill the camera frame.</li>
              </ul>
            </div>

            <p className="text-caption" style={{ marginTop: '12px' }}>
              Don't have your papers handy? Each check has a "Try with sample" option so you can explore first.
            </p>
          </div>
        )}

        {/* Tab 3: Glossary */}
        {activeTab === 'glossary' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search a term (e.g. ECG, Hemoglobin)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredGlossary.map((item) => (
                <div key={item.term} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9375rem' }}>{item.term}</strong>
                    <span className="tag">{item.category}</span>
                  </div>
                  <p className="text-caption">{item.simple}</p>
                  {item.example && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--accent)', marginTop: '6px', fontStyle: 'italic' }}>
                      {item.example}
                    </p>
                  )}
                </div>
              ))}

              {filteredGlossary.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.9375rem' }}>
                  No terms found matching "{searchTerm}".
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <span className="text-caption">Always discuss results with your doctor.</span>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
