import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock gun/gun, gun/sea, and gun/lib/webrtc before importing useGun
const mockPut = vi.fn()
const mockOnce = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()
const mockGet = vi.fn(() => ({
  get: mockGet,
  put: mockPut,
  once: mockOnce,
  on: mockOn,
  off: mockOff
}))

const mockAuth = vi.fn()
const mockCreate = vi.fn()
const mockLeave = vi.fn()
const mockRecall = vi.fn()
const mockGunOn = vi.fn()

const mockUserIs = null
const mockUser = vi.fn(() => ({
  get: mockGet,
  auth: mockAuth,
  create: mockCreate,
  leave: mockLeave,
  recall: mockRecall,
  is: mockUserIs
}))

const MockGun = vi.fn(() => ({
  user: mockUser,
  on: mockGunOn,
  _: { opt: { peers: {} } }
}))

vi.mock('gun/gun', () => ({ default: MockGun }))
vi.mock('gun/sea', () => ({}))
vi.mock('gun/lib/webrtc', () => ({}))

const { useGun } = await import('../src/composables/useGun')

describe('useGun', () => {
  let gun

  beforeEach(() => {
    gun = useGun()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('syncToGun', () => {
    it('is a no-op when not logged in', async () => {
      await gun.syncToGun('progress', { test: true })
      expect(mockPut).not.toHaveBeenCalled()
    })
  })

  describe('loadFromGun', () => {
    it('returns null when not logged in', async () => {
      const result = await gun.loadFromGun()
      expect(result).toBeNull()
    })
  })

  describe('password storage', () => {
    it('does not store password in localStorage on login', async () => {
      mockAuth.mockImplementation((alias, pass, cb) => {
        cb({ ok: 0 })
      })

      await gun.initGun()
      await gun.login('testuser', 'testpass')

      // Only alias stored under gun-session, never password
      expect(localStorage.getItem('gun-session')).toBe('testuser')
      // Verify no password-related keys exist
      const allKeys = Object.keys(localStorage)
      const hasPasswordKey = allKeys.some(k => k.includes('password') || k.includes('pass'))
      expect(hasPasswordKey).toBe(false)
    })
  })
})
