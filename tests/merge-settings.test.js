import { describe, it, expect, vi } from 'vitest'

// Mock useGun before importing useSettings
vi.mock('../src/composables/useGun', () => ({
  useGun: () => ({
    isLoggedIn: { value: false },
    syncToGun: vi.fn()
  })
}))

const { useSettings } = await import('../src/composables/useSettings')

describe('useSettings', () => {
  it('loads settings from localStorage', () => {
    const { settings, loadSettings } = useSettings()
    loadSettings()
    expect(settings.value).toBeDefined()
    expect(typeof settings.value.darkMode).toBe('boolean')
  })

  it('saves and loads settings round-trip', () => {
    const { settings, saveSettings, loadSettings } = useSettings()

    settings.value.darkMode = true
    settings.value.audioSpeed = 0.8
    saveSettings()

    // Verify localStorage has the data
    const stored = JSON.parse(localStorage.getItem('settings'))
    expect(stored.darkMode).toBe(true)
    expect(stored.audioSpeed).toBe(0.8)
  })
})
