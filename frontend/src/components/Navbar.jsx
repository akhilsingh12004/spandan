import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, HelpCircle, Globe } from 'lucide-react'
import BeginnerHelpModal from './BeginnerHelpModal'
import { useLanguage } from '../LanguageContext'

export default function Navbar() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const { lang, toggleLanguage, t } = useLanguage()

  return (
    <>
      <BeginnerHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <header className="site-header" id="main-navbar">
        <div className="site-header-inner">
          <Link to="/" className="site-logo" id="logo-link">
            <div className="site-logo-mark">
              <Activity size={16} />
            </div>
            <span className="site-logo-text">{t('appName')}</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleLanguage}
              className="site-header-lang-btn"
              id="lang-toggle-btn"
              title="Change Language"
              aria-label="Change Language"
            >
              <Globe size={16} />
              <span>{t('langToggle')}</span>
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="site-header-link"
              id="nav-help-link"
              aria-label="Open Help"
            >
              <HelpCircle size={18} />
              <span>{t('help')}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
