import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

const CARDIAC_STEPS = [
  'Preprocessing ECG image...',
  'Removing grid lines & noise...',
  'Digitizing waveform signal...',
  'Extracting P-QRS-T features...',
  'Running cardiac classification model...',
  'Generating Grad-CAM heatmap...',
  'Compiling diagnostic report...',
]

const BLOOD_STEPS = [
  'Ingesting report document / image...',
  'Extracting text & lab tables via OCR...',
  'Parsing test parameters, values & units...',
  'Benchmarking against adult reference ranges...',
  'Correlating multi-parameter disease patterns...',
  'Computing health score & risk indices...',
  'Compiling plain-language diagnostic report...',
]

export default function ProcessingOverlay({ isVisible, variant = 'cardiac', currentStep = 0 }) {
  const steps = variant === 'blood' ? BLOOD_STEPS : CARDIAC_STEPS
  const title = variant === 'blood' ? 'blood test report' : 'ECG'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="processing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          id="processing-overlay"
        >
          <motion.div
            className="processing-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.2 }}
          >
            <div className="processing-spinner" />
            
            <h2>Analysing your {title}</h2>
            <p>This usually takes a few seconds.</p>

            <ul className="processing-steps">
              {steps.map((step, index) => {
                let status = 'pending'
                if (index < currentStep) status = 'done'
                else if (index === currentStep) status = 'active'

                return (
                  <li
                    key={index}
                    className={`processing-step ${status}`}
                  >
                    <span className="processing-step-icon">
                      {status === 'done' ? (
                        <Check size={12} />
                      ) : status === 'active' ? (
                        <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                      ) : (
                        <span style={{ fontSize: '0.6875rem' }}>{index + 1}</span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.875rem' }}>{step}</span>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
