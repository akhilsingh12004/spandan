import { Info } from 'lucide-react'

export default function Disclaimer() {
  return (
    <div className="disclaimer" id="medical-disclaimer">
      <Info size={18} className="disclaimer-icon" />
      <p>
        <strong>Important:</strong> This tool is for educational purposes only and does not replace professional medical advice.
        Always consult a qualified healthcare provider for diagnosis or treatment.
      </p>
    </div>
  )
}
