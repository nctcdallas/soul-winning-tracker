import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DOCUMENT_TITLES, LANGUAGE_COOKIE, translate } from './translate'
import type { ReactNode } from 'react'
import type { Language } from './translate'

interface LanguageContextValue {
  language: Language
  t: (text: string) => string
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function hasLanguageCookie() {
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${LANGUAGE_COOKIE}=`))
}

function writeLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000; samesite=lax`
}

function carryOverStoredLanguage() {
  if (hasLanguageCookie()) {
    return false
  }

  try {
    if (localStorage.getItem(LANGUAGE_COOKIE) !== 'ko') {
      return false
    }
  } catch {
    // Storage can throw when the browser blocks it.
    return false
  }

  writeLanguageCookie('ko')

  return true
}

function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language
  children: ReactNode
}) {
  const [language, setLanguage] = useState(initialLanguage)

  useEffect(() => {
    if (carryOverStoredLanguage()) {
      setLanguage('ko')
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = DOCUMENT_TITLES[language]
  }, [language])

  const t = useCallback((text: string) => translate(text, language), [language])
  const toggleLanguage = useCallback(() => {
    const next = language === 'ko' ? 'en' : 'ko'

    writeLanguageCookie(next)
    setLanguage(next)
  }, [language])
  const value = useMemo(() => ({ language, t, toggleLanguage }), [language, t, toggleLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

function useLanguage() {
  const value = useContext(LanguageContext)

  if (!value) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return value
}

export { LanguageProvider, useLanguage }
