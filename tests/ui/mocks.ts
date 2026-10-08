import { vi } from 'vitest'

const server = {
  addPrayerFn: vi.fn(),
  createJourneyFn: vi.fn(),
  deleteJourneyFn: vi.fn(),
  deletePrayerFn: vi.fn(),
  editJourneyFn: vi.fn(),
  editPrayerFn: vi.fn(),
  getPublicTotals: vi.fn(),
  getSessionHint: vi.fn(),
  getSnapshot: vi.fn(),
  setPrayerStatusFn: vi.fn(),
  setSalvationStatusFn: vi.fn(),
}

const identity = {
  getUser: vi.fn(),
  handleAuthCallback: vi.fn(),
  logout: vi.fn(),
  oauthLogin: vi.fn(),
}

export { identity, server }
