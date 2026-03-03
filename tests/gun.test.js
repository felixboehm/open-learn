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

  describe('relay URL', () => {
    it('stores relay URL in localStorage', () => {
      gun.setRelayUrl('http://192.168.1.10:8765/gun')
      expect(localStorage.getItem('gunRelayUrl')).toBe('http://192.168.1.10:8765/gun')
      expect(gun.relayUrl.value).toBe('http://192.168.1.10:8765/gun')
    })

    it('clears relay URL from localStorage', () => {
      localStorage.setItem('gunRelayUrl', 'http://old-relay/gun')
      gun.setRelayUrl('')
      expect(localStorage.getItem('gunRelayUrl')).toBeNull()
      expect(gun.relayUrl.value).toBe('')
    })
  })

  describe('connection status', () => {
    it('reports disconnected when no relay URL', () => {
      gun.relayUrl.value = ''
      gun.updateConnectionStatus()
      expect(gun.isConnected.value).toBe(false)
    })
  })

  describe('password storage', () => {
    it('does not store password in localStorage on login', async () => {
      mockAuth.mockImplementation((alias, pass, cb) => {
        cb({ ok: 0 })
      })

      await gun.initGun()
      await gun.login('testuser', 'testpass')

      // Old key should not exist
      expect(localStorage.getItem('gun-session')).toBeNull()
      // Only alias stored, never password
      expect(localStorage.getItem('gun-alias')).toBe('testuser')
    })
  })
})
