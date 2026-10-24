import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('spandan_lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('spandan_lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = useMemo(() => {
    const dict = translations[lang] || translations.en
    return (key, fallback) => {
      return dict[key] || fallback || key
    }
  }, [lang])

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'))
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: 'en',
      setLang: () => {},
      t: (key, fallback) => translations.en[key] || fallback || key,
      toggleLanguage: () => {}
    }
  }
  return context
}
