import { motion } from 'framer-motion'

export default function ConfidenceBar({ label, value, rank = 0 }) {
  const percentage = (value * 100).toFixed(1)
  const confidenceClass = value >= 0.7 ? 'confidence-high' : value >= 0.4 ? 'confidence-medium' : 'confidence-low'
  
  return (
    <div className="confidence-bar-container">
      <div className="confidence-bar-label">
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ 
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: value >= 0.7 ? 'var(--accent-cyan)' : value >= 0.4 ? 'var(--accent-amber)' : 'var(--accent-rose)'
        }}>
          {percentage}%
        </span>
      </div>
      <div className="confidence-bar-track">
        <motion.div
          className={`confidence-bar-fill ${confidenceClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: rank * 0.15, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}
