import { describe, it, expect } from 'vitest'
import { formatLangName } from '../src/utils/formatters'

describe('formatLangName', () => {
  it('returns known German language names', () => {
    expect(formatLangName('deutsch')).toBe('Deutsch')
    expect(formatLangName('portugiesisch')).toBe('Portugiesisch')
    expect(formatLangName('spanisch')).toBe('Spanisch')
  })

  it('capitalizes unknown folder names', () => {
    expect(formatLangName('english')).toBe('English')
    expect(formatLangName('french')).toBe('French')
  })

  it('replaces hyphens with spaces for unknown names', () => {
    expect(formatLangName('open-learn-showcase')).toBe('Open-learn-showcase')
  })

  it('extracts last path segment from URLs', () => {
    expect(formatLangName('https://example.com/my-workshop')).toBe('My workshop')
    expect(formatLangName('https://example.com/path/to/content')).toBe('Content')
  })

  it('handles URLs with trailing slash', () => {
    expect(formatLangName('https://example.com/workshop/')).toBe('Workshop')
  })

  it('handles http URLs', () => {
    expect(formatLangName('http://example.com/topic')).toBe('Topic')
  })
})
