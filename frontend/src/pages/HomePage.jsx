import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartPulse, FileText } from 'lucide-react'
import BeginnerHelpModal from '../components/BeginnerHelpModal'
import { useLanguage } from '../LanguageContext'

export default function HomePage() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <>
      <BeginnerHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <div className="home-page" id="hero-section">
        <div className="container">
          {/* Heading */}
          <h1 className="home-heading">{t('homeTitle')}</h1>
          <p className="home-subtitle">{t('homeSubtitle')}</p>

          {/* Two choices, stacked */}
          <div className="home-choices">
            <Link to="/cardiac" className="home-choice-card" id="cta-cardiac">
              <div className="home-choice-icon">
                <HeartPulse size={22} />
              </div>
              <div className="home-choice-text">
                <h3>{t('ecgCardTitle')}</h3>
                <p>{t('ecgCardDesc')}</p>
              </div>
            </Link>

            <Link to="/blood" className="home-choice-card" id="cta-blood">
              <div className="home-choice-icon">
                <FileText size={22} />
              </div>
              <div className="home-choice-text">
                <h3>{t('bloodCardTitle')}</h3>
                <p>{t('bloodCardDesc')}</p>
              </div>
            </Link>
          </div>

          {/* Help link */}
          <p className="home-help-link">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="link-button"
              id="home-quick-guide-btn"
            >
              {t('notSureGuide')}
            </button>
          </p>

          {/* Calm disclaimer line */}
          <p className="home-disclaimer-line">
            {t('homeDisclaimer')}
          </p>
        </div>
      </div>
    </>
  )
}
