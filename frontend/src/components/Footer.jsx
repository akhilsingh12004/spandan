import { Activity } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner">
        <p style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Activity size={12} style={{ color: 'var(--accent)', opacity: 0.6 }} />
          Spandan AI
        </p>
        <p>
          © {new Date().getFullYear()} Spandan AI — For educational and research purposes only.
          Not a substitute for professional medical advice.
        </p>
      </div>
    </footer>
  )
}
