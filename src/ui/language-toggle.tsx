import { useLanguage } from '#/i18n/language'

const SEGMENTS = [
  { language: 'en', label: 'EN', switchLabel: '영어로 보기' },
  { language: 'ko', label: '한국어', switchLabel: '한국어로 보기' },
] as const

function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <div className={`ui-language ui-language-${language}`}>
      {SEGMENTS.map((segment) =>
        segment.language === language ? (
          <button type="button" key={segment.language} lang={segment.language} aria-pressed="true">
            {segment.label}
          </button>
        ) : (
          <button
            type="button"
            key={segment.language}
            lang="ko"
            aria-pressed="false"
            aria-label={segment.switchLabel}
            title={segment.switchLabel}
            onClick={toggleLanguage}
          >
            {segment.label}
          </button>
        ),
      )}
    </div>
  )
}

export { LanguageToggle }
