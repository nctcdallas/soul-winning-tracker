import fixture from './fixture.json' with { type: 'json' }

type Language = 'en' | 'ko'
type Session = 'anon' | 'leader' | 'member' | 'email'
type Records = 'ok' | 'empty' | 'pending' | 'error'
type Tab = 'overview' | 'my-journey' | 'prayer-list' | 'record' | 'team'

interface View {
  name: string
  session: Session
  records?: Records
  tab?: Tab
  open?: 'journey-editor' | 'prayer-editor'
}

interface State extends View {
  language: Language
}

const RECORDS_ERROR = 'Records are temporarily unavailable. Please try again.'

const TAB_PATHS: Record<Tab, string> = {
  overview: '/',
  'my-journey': '/journey',
  'prayer-list': '/prayers',
  record: '/record',
  team: '/team',
}

const views: View[] = [
  { name: 'public', session: 'anon' },
  { name: 'wrong-provider', session: 'email' },
  { name: 'opening', session: 'leader', records: 'pending' },
  { name: 'unavailable', session: 'leader', records: 'error' },
  { name: 'overview', session: 'leader', records: 'ok', tab: 'overview' },
  { name: 'overview-member', session: 'member', records: 'ok', tab: 'overview' },
  { name: 'overview-empty', session: 'member', records: 'empty', tab: 'overview' },
  { name: 'my-journey', session: 'leader', records: 'ok', tab: 'my-journey' },
  {
    name: 'my-journey-editing',
    session: 'leader',
    records: 'ok',
    tab: 'my-journey',
    open: 'journey-editor',
  },
  { name: 'my-journey-empty', session: 'member', records: 'empty', tab: 'my-journey' },
  { name: 'prayer-list', session: 'leader', records: 'ok', tab: 'prayer-list' },
  {
    name: 'prayer-list-editing',
    session: 'leader',
    records: 'ok',
    tab: 'prayer-list',
    open: 'prayer-editor',
  },
  { name: 'prayer-list-empty', session: 'member', records: 'empty', tab: 'prayer-list' },
  { name: 'record', session: 'leader', records: 'ok', tab: 'record' },
  { name: 'team', session: 'leader', records: 'ok', tab: 'team' },
]

const states: State[] = views.flatMap((view) =>
  (['en', 'ko'] as const).map((language) => ({
    ...view,
    name: `${view.name} (${language})`,
    language,
  })),
)

function snapshotFor(session: Session, records: Records | undefined) {
  const isLeader = session === 'leader'
  const viewer = { ...fixture.viewer, isLeader }

  if (records === 'empty') {
    return { totals: fixture.totals, mine: [], prayers: [], viewer }
  }

  return {
    totals: fixture.totals,
    mine: fixture.mine,
    ...(isLeader
      ? { team: [...fixture.mine, ...fixture.others].sort((first, second) => second.id - first.id) }
      : {}),
    prayers: isLeader ? [...fixture.prayers, ...fixture.otherPrayers] : fixture.prayers,
    viewer,
  }
}

export { RECORDS_ERROR, TAB_PATHS, snapshotFor, states }
export type { Language, Records, Session, State, Tab }
