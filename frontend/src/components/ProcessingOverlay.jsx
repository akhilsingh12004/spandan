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

const SKIN_STEPS = [
  'Preprocessing skin image...',
  'Enhancing contrast & removing artifacts...',
  'Segmenting lesion boundary...',
  'Extracting visual features via CNN...',
  'Running dermatological classification...',
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

export default function ProcessingOverlay({ isVisible, variant = 'skin', currentStep = 0 }) {
  const steps = variant === 'cardiac' ? CARDIAC_STEPS : variant === 'blood' ? BLOOD_STEPS : SKIN_STEPS
  const title = variant === 'cardiac' ? 'ECG' : variant === 'blood' ? 'Blood Test Report' : 'Skin'
  const spinnerClass = variant === 'cardiac' 
    ? 'processing-spinner-cardiac' 
    : variant === 'blood' 
    ? 'processing-spinner-blood' 
    : ''

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="processing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          id="processing-overlay"
        >
          <motion.div
            className="processing-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className={`processing-spinner ${spinnerClass}`} />
            
            <h2 className="text-h2" style={{ marginBottom: '8px' }}>
              Analyzing {title}
            </h2>
            <p className="text-body" style={{ marginBottom: '32px' }}>
              Our AI engine is processing your data. This may take a moment.
            </p>

            <ul className="processing-steps">
              {steps.map((step, index) => {
                let status = 'pending'
                if (index < currentStep) status = 'done'
                else if (index === currentStep) status = 'active'

                return (
                  <motion.li
                    key={index}
                    className={`processing-step ${status}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <span className="processing-step-icon">
                      {status === 'done' ? (
                        <Check size={14} />
                      ) : status === 'active' ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </span>
                    {step}
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
