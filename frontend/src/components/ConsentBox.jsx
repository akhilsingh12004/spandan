import { useLanguage } from '../LanguageContext'

export default function ConsentBox({ agreed, onChange, id = 'consent-checkbox' }) {
  const { t } = useLanguage()

  return (
    <div className="consent-card" id="privacy-consent-card">
      <p className="consent-text">
        {t('consentIntro')}
      </p>
      <label className="consent-label" htmlFor={id}>
        <input
          type="checkbox"
          id={id}
          checked={agreed}
          onChange={(e) => onChange(e.target.checked)}
          className="consent-checkbox"
        />
        <span>{t('consentCheckbox')}</span>
      </label>
    </div>
  )
}
