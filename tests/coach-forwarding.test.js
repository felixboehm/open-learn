import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAssessments } from '../src/composables/useAssessments'

describe('Coach Answer Forwarding', () => {
  let assessments

  beforeEach(() => {
    localStorage.clear()
    assessments = useAssessments()
    assessments.assessments.value = {}
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not forward when consent is disabled', async () => {
    const result = await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { answer: { value: 'test' } },
      { coachConsent: false, coachIdentifier: '' }
    )
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not forward when no coach API is configured', async () => {
    const result = await assessments.forwardToCoach(
      null,
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: '' }
    )
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not forward when coach config has no api', async () => {
    const result = await assessments.forwardToCoach(
      { name: 'Coach' },
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: '' }
    )
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('forwards answer when consent is enabled', async () => {
    fetch.mockResolvedValue({ ok: true })

    const result = await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { lesson: { number: 1 }, answer: { value: 'test', correct: true } },
      { coachConsent: true, coachIdentifier: '' }
    )

    expect(result).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith(
      'https://coach.example.com/api',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('includes user identifier when provided', async () => {
    fetch.mockResolvedValue({ ok: true })

    await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: 'user@test.com' }
    )

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.user).toBe('user@test.com')
  })

  it('omits user field when identifier is empty', async () => {
    fetch.mockResolvedValue({ ok: true })

    await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: '' }
    )

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.user).toBeUndefined()
  })

  it('returns enrollUrl on 401 response', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ enrollUrl: 'https://workshop.example.com/enroll' })
    })

    const result = await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: '' }
    )

    expect(result).toEqual({ ok: false, enrollUrl: 'https://workshop.example.com/enroll' })
  })

  it('handles 401 without enrollUrl', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({})
    })

    const result = await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: '' }
    )

    expect(result).toEqual({ ok: false, enrollUrl: null })
  })

  it('returns null on network error', async () => {
    fetch.mockRejectedValue(new Error('Network error'))

    const result = await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: '' }
    )

    expect(result).toBeNull()
  })

  it('includes timestamp in payload', async () => {
    fetch.mockResolvedValue({ ok: true })

    await assessments.forwardToCoach(
      { api: 'https://coach.example.com/api' },
      { answer: { value: 'test' } },
      { coachConsent: true, coachIdentifier: '' }
    )

    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.timestamp).toBeDefined()
    expect(new Date(body.timestamp).getTime()).not.toBeNaN()
  })
})
