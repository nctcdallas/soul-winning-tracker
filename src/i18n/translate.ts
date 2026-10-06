import { korean } from './korean'

type Language = 'en' | 'ko'

const LANGUAGE_COOKIE = 'soul-winning-language'
const DOCUMENT_TITLES: Record<Language, string> = {
  en: 'Soul Winning Journey | NCTC',
  ko: 'NCTC 영혼구원 여정',
}

function translate(text: string, language: Language) {
  return language === 'ko' ? korean[text] || text : text
}

function activeCountLabel(count: number, language: Language) {
  return language === 'ko' ? `${count}건 기도 중` : `${count} active`
}

function answeredCountLabel(count: number, language: Language) {
  return language === 'ko'
    ? `${count}건 응답받음`
    : `${count} answered request${count === 1 ? '' : 's'}`
}

function prayerPromptLabel(name: string, saved: boolean, language: Language) {
  if (language === 'ko') {
    return saved
      ? '이 분의 믿음의 여정을 위해 기도하고 후속 만남을 이어 가세요.'
      : '이 분을 위해 기도해 주세요.'
  }

  return saved ? `Pray and follow up with ${name}.` : `Pray for ${name}.`
}

function prayerPlaceholderLabel(name: string, language: Language) {
  return language === 'ko' ? '기도 제목을 입력하세요' : `Prayer request for ${name}`
}

function statusAriaLabel(name: string, language: Language) {
  return language === 'ko'
    ? `${name}님의 복음에 대한 반응`
    : `Response to the gospel for ${name}`
}

function youtubeUrl(language: Language) {
  return language === 'ko'
    ? 'https://www.youtube.com/@nctc2022'
    : 'https://www.youtube.com/@nctcdallas'
}

function localeOf(language: Language) {
  return language === 'ko' ? 'ko-KR' : 'en-US'
}

export {
  DOCUMENT_TITLES,
  LANGUAGE_COOKIE,
  activeCountLabel,
  answeredCountLabel,
  localeOf,
  prayerPlaceholderLabel,
  prayerPromptLabel,
  statusAriaLabel,
  translate,
  youtubeUrl,
}
export type { Language }
