import { describe, it, expect, vi } from 'vitest'

// Mock useGun before importing useSettings
vi.mock('../src/composables/useGun', () => ({
  useGun: () => ({
    isLoggedIn: { value: false },
    syncToGun: vi.fn()
  })
}))

const { useSettings } = await import('../src/composables/useSettings')

describe('mergeSettings', () => {
  it('merges remote settings into local state', () => {
    const { settings, mergeSettings } = useSettings()

    settings.value.darkMode = false
    settings.value.audioSpeed = 1.0

    mergeSettings({ darkMode: true, audioSpeed: 0.8 })

    expect(settings.value.darkMode).toBe(true)
    expect(settings.value.audioSpeed).toBe(0.8)
  })

  it('ignores unknown keys', () => {
    const { settings, mergeSettings } = useSettings()

    const keysBefore = Object.keys(settings.value)
    mergeSettings({ unknownKey: 'test' })
    expect(Object.keys(settings.value)).toEqual(keysBefore)
  })

  it('handles null/undefined gracefully', () => {
    const { mergeSettings } = useSettings()

    expect(() => mergeSettings(null)).not.toThrow()
    expect(() => mergeSettings(undefined)).not.toThrow()
    expect(() => mergeSettings('string')).not.toThrow()
  })
})
