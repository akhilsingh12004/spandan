import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner">
        <p style={{ marginBottom: '8px' }}>
          Built with <Heart size={14} style={{ display: 'inline', color: '#f43f5e', verticalAlign: 'middle' }} /> by Spandan AI Team
        </p>
        <p>
          © {new Date().getFullYear()} Spandan AI — For educational and research purposes only.
          Not a substitute for professional medical advice.
        </p>
      </div>
    </footer>
  )
}
