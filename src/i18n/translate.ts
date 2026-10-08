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

function peopleCountLabel(count: number, language: Language) {
  if (language === 'ko') {
    return `${count}명`
  }

  return `${count} ${count === 1 ? 'person' : 'people'}`
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

function recordCountLabel(count: number, language: Language) {
  return language === 'ko' ? `기록 ${count}건` : plural(count, 'record', 'records')
}

function teamMemberCountLabel(count: number, language: Language) {
  return language === 'ko' ? `팀원 ${count}명` : plural(count, 'team member', 'team members')
}

function openPrayerCountLabel(count: number, language: Language) {
  return language === 'ko'
    ? `기도 중인 제목 ${count}건`
    : plural(count, 'open prayer request', 'open prayer requests')
}

function openRequestCountLabel(count: number, language: Language) {
  return language === 'ko'
    ? `기도 중인 제목 ${count}건`
    : plural(count, 'open request', 'open requests')
}

function openCountLabel(count: number, language: Language) {
  return language === 'ko' ? `${count}건 기도 중` : `${count} open`
}

function answeredShortLabel(count: number, language: Language) {
  return language === 'ko' ? `${count}건 응답받음` : `${count} answered`
}

function positionLabel(position: number, total: number, language: Language) {
  return language === 'ko' ? `${total}건 중 ${position}번째` : `${position} of ${total}`
}

function onlyRecorderEditsLabel(name: string, language: Language) {
  return language === 'ko'
    ? `${name}님만 이 기록을 수정할 수 있습니다.`
    : `Only ${name} can edit this record.`
}

function sinceLabel(date: string, language: Language) {
  return language === 'ko' ? `${date}부터` : `Since ${date}`
}

function acrossPeopleLabel(count: number, language: Language) {
  return language === 'ko' ? `${count}명` : `Across ${plural(count, 'person', 'people')}`
}

function ownShareLabel(count: number, language: Language) {
  if (language === 'ko') {
    return `이 중 ${count}건은 내가 기록했습니다.`
  }

  return count === 1
    ? '1 of them is a person you recorded.'
    : `${count} of them are people you recorded.`
}

function lastOfLabel(shown: number, total: number, language: Language) {
  return language === 'ko' ? `전체 ${total}명 중 최근 ${shown}명` : `Last ${shown} of ${total}`
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
  return language === 'ko' ? `${name}님의 복음에 대한 반응` : `Response to the gospel for ${name}`
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
  acrossPeopleLabel,
  activeCountLabel,
  answeredCountLabel,
  answeredShortLabel,
  lastOfLabel,
  localeOf,
  onlyRecorderEditsLabel,
  openCountLabel,
  openPrayerCountLabel,
  ownShareLabel,
  openRequestCountLabel,
  peopleCountLabel,
  positionLabel,
  prayerPlaceholderLabel,
  prayerPromptLabel,
  recordCountLabel,
  sinceLabel,
  statusAriaLabel,
  teamMemberCountLabel,
  translate,
  youtubeUrl,
}
export type { Language }
