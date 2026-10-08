const NAV_TABS = [
  { label: 'Overview', path: '/', leaderOnly: false },
  { label: 'My journey', path: '/journey', leaderOnly: false },
  { label: 'Prayer list', path: '/prayers', leaderOnly: false },
  { label: 'Record', path: '/record', leaderOnly: false },
  { label: 'Team records', path: '/team', leaderOnly: true },
] as const

type TabPath = (typeof NAV_TABS)[number]['path']

export { NAV_TABS }
export type { TabPath }
