import { AlertTriangle } from 'lucide-react'

export default function Disclaimer() {
  return (
    <div className="disclaimer" id="medical-disclaimer">
      <AlertTriangle size={20} className="disclaimer-icon" />
      <p>
        <strong>Medical Disclaimer:</strong> This tool is for{' '}
        <strong>educational and decision-support purposes only</strong> and is{' '}
        <strong>not a substitute for professional medical diagnosis</strong>.
        Always consult a qualified healthcare provider for medical advice,
        diagnosis, or treatment. The AI predictions shown here should not be
        used as the sole basis for any clinical decisions.
      </p>
    </div>
  )
}
