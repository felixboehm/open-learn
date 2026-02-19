import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAssessments } from '../src/composables/useAssessments'

describe('Coach Answer Forwarding (Batch)', () => {
  let assessments

  beforeEach(() => {
    localStorage.clear()
    assessments = useAssessments()
    assessments.assessments.value = {}
    assessments.coachQueue.value = []
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('queueForCoach', () => {
    it('adds an answer to the queue', () => {
      assessments.queueForCoach(
        { learning: 'en', teaching: 'test', number: 1 },
        { section: { index: 0 }, answer: { value: 'test' } }
      )
      expect(assessments.coachQueue.value).toHaveLength(1)
      expect(assessments.hasQueuedAnswers()).toBe(true)
    })

    it('accumulates multiple answers', () => {
      const ctx = { learning: 'en', teaching: 'test', number: 1 }
      assessments.queueForCoach(ctx, { answer: { value: 'a' } })
      assessments.queueForCoach(ctx, { answer: { value: 'b' } })
      assessments.queueForCoach(ctx, { answer: { value: 'c' } })
      expect(assessments.coachQueue.value).toHaveLength(3)
    })
  })

  describe('flushCoachQueue', () => {
    it('does not flush when consent is disabled', async () => {
      assessments.queueForCoach({ learning: 'en' }, { answer: { value: 'test' } })
      const result = await assessments.flushCoachQueue(
        { api: 'https://coach.example.com/api' },
        { coachConsent: false, coachIdentifier: '' }
      )
      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('does not flush when queue is empty', async () => {
      const result = await assessments.flushCoachQueue(
        { api: 'https://coach.example.com/api' },
        { coachConsent: true, coachIdentifier: '' }
      )
      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('does not flush when no coach API configured', async () => {
      assessments.queueForCoach({ learning: 'en' }, { answer: { value: 'test' } })
      const result = await assessments.flushCoachQueue(
        null,
        { coachConsent: true, coachIdentifier: '' }
      )
      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('sends batched answers and clears queue', async () => {
      fetch.mockResolvedValue({ ok: true })

      const ctx = { learning: 'en', teaching: 'test', number: 1, title: 'Test' }
      assessments.queueForCoach(ctx, { answer: { value: 'a' } })
      assessments.queueForCoach(ctx, { answer: { value: 'b' } })

      const result = await assessments.flushCoachQueue(
        { api: 'https://coach.example.com/api' },
        { coachConsent: true, coachIdentifier: '' }
      )

      expect(result).toEqual({ ok: true, count: 2 })
      expect(assessments.coachQueue.value).toHaveLength(0)

      const body = JSON.parse(fetch.mock.calls[0][1].body)
      expect(body.answers).toHaveLength(2)
      expect(body.lesson).toEqual(ctx)
      expect(body.timestamp).toBeDefined()
    })

    it('includes user identifier when provided', async () => {
      fetch.mockResolvedValue({ ok: true })

      assessments.queueForCoach({ learning: 'en' }, { answer: { value: 'test' } })
      await assessments.flushCoachQueue(
        { api: 'https://coach.example.com/api' },
        { coachConsent: true, coachIdentifier: 'user@test.com' }
      )

      const body = JSON.parse(fetch.mock.calls[0][1].body)
      expect(body.user).toBe('user@test.com')
    })

    it('omits user field when identifier is empty', async () => {
      fetch.mockResolvedValue({ ok: true })

      assessments.queueForCoach({ learning: 'en' }, { answer: { value: 'test' } })
      await assessments.flushCoachQueue(
        { api: 'https://coach.example.com/api' },
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

      assessments.queueForCoach({ learning: 'en' }, { answer: { value: 'test' } })
      const result = await assessments.flushCoachQueue(
        { api: 'https://coach.example.com/api' },
        { coachConsent: true, coachIdentifier: '' }
      )

      expect(result).toEqual({ ok: false, enrollUrl: 'https://workshop.example.com/enroll' })
    })

    it('returns null on network error', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      assessments.queueForCoach({ learning: 'en' }, { answer: { value: 'test' } })
      const result = await assessments.flushCoachQueue(
        { api: 'https://coach.example.com/api' },
        { coachConsent: true, coachIdentifier: '' }
      )

      expect(result).toBeNull()
    })
  })

  describe('clearCoachQueue', () => {
    it('clears the queue', () => {
      assessments.queueForCoach({ learning: 'en' }, { answer: { value: 'test' } })
      expect(assessments.hasQueuedAnswers()).toBe(true)

      assessments.clearCoachQueue()
      expect(assessments.hasQueuedAnswers()).toBe(false)
      expect(assessments.coachQueue.value).toHaveLength(0)
    })
  })
})
