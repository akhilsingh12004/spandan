import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Activity, HelpCircle } from 'lucide-react'
import BeginnerHelpModal from './BeginnerHelpModal'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/cardiac', label: 'Heart & ECG' },
    { to: '/skin', label: 'Skin Check' },
    { to: '/blood', label: 'Blood Report' },
    { to: '/about', label: 'About' },
  ]

  return (
    <>
      <BeginnerHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <nav className="navbar" id="main-navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" id="logo-link">
            <div className="navbar-logo-icon">
              <Activity size={18} />
            </div>
            <span>Spandan AI</span>
          </Link>

          <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
            
            <button
              onClick={() => {
                setIsOpen(false)
                setIsHelpOpen(true)
              }}
              className="btn btn-secondary btn-sm"
              style={{
                marginLeft: '8px',
                padding: '6px 12px',
                fontSize: '0.8125rem',
                borderColor: 'rgba(45, 212, 191, 0.3)',
                color: 'var(--accent)'
              }}
              id="nav-beginner-guide"
            >
              <HelpCircle size={14} />
              Beginner Guide
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="btn btn-secondary btn-sm mobile-only-help"
              style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--accent)' }}
              id="mobile-quick-guide-btn"
            >
              <HelpCircle size={14} />
            </button>

            <button
              className="mobile-menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              id="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

