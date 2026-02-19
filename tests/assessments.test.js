import { describe, it, expect, beforeEach } from 'vitest'
import { useAssessments } from '../src/composables/useAssessments'

describe('useAssessments', () => {
  let assessments

  beforeEach(() => {
    localStorage.clear()
    assessments = useAssessments()
    assessments.assessments.value = {}
  })

  describe('validateAnswer', () => {
    it('returns null for qa type', () => {
      const example = { q: 'test', a: 'answer' }
      expect(assessments.validateAnswer(example, 'answer')).toBeNull()
    })

    it('validates input type with single correct answer', () => {
      const example = { type: 'input', q: 'test', a: 'Correct Answer' }
      expect(assessments.validateAnswer(example, 'correct answer')).toBe(true)
      expect(assessments.validateAnswer(example, 'wrong')).toBe(false)
    })

    it('validates input type with multiple accepted answers', () => {
      const example = { type: 'input', q: 'test', a: ['Answer One', 'Answer Two'] }
      expect(assessments.validateAnswer(example, 'answer one')).toBe(true)
      expect(assessments.validateAnswer(example, 'answer two')).toBe(true)
      expect(assessments.validateAnswer(example, 'wrong')).toBe(false)
    })

    it('returns null for input type without correct answer', () => {
      const example = { type: 'input', q: 'test' }
      expect(assessments.validateAnswer(example, 'anything')).toBeNull()
    })

    it('validates multiple-choice type', () => {
      const example = {
        type: 'multiple-choice',
        q: 'test',
        options: [
          { text: 'A', correct: true },
          { text: 'B' },
          { text: 'C', correct: true }
        ]
      }
      expect(assessments.validateAnswer(example, [0, 2])).toBe(true)
      expect(assessments.validateAnswer(example, [2, 0])).toBe(true) // order doesn't matter
      expect(assessments.validateAnswer(example, [0])).toBe(false)
      expect(assessments.validateAnswer(example, [0, 1])).toBe(false)
    })

    it('returns null for multiple-choice without correct markers', () => {
      const example = {
        type: 'multiple-choice',
        q: 'test',
        options: [{ text: 'A' }, { text: 'B' }]
      }
      expect(assessments.validateAnswer(example, [0])).toBeNull()
    })

    it('validates select type', () => {
      const example = {
        type: 'select',
        q: 'test',
        options: [
          { text: 'A' },
          { text: 'B', correct: true },
          { text: 'C' }
        ]
      }
      expect(assessments.validateAnswer(example, 1)).toBe(true)
      expect(assessments.validateAnswer(example, 0)).toBe(false)
      expect(assessments.validateAnswer(example, 2)).toBe(false)
    })

    it('returns null for null example', () => {
      expect(assessments.validateAnswer(null, 'test')).toBeNull()
    })
  })

  describe('saveAnswer / getAnswer', () => {
    it('saves and retrieves an answer', () => {
      assessments.saveAnswer('de', 'pt', 1, 0, 2, {
        type: 'input',
        answer: 'test answer',
        correct: true
      })

      const saved = assessments.getAnswer('de', 'pt', 1, 0, 2)
      expect(saved.type).toBe('input')
      expect(saved.answer).toBe('test answer')
      expect(saved.correct).toBe(true)
      expect(saved.submittedAt).toBeDefined()
    })

    it('returns null for non-existent answer', () => {
      expect(assessments.getAnswer('de', 'pt', 1, 0, 0)).toBeNull()
    })

    it('persists to localStorage', () => {
      assessments.saveAnswer('de', 'pt', 1, 0, 0, {
        type: 'select',
        answer: 1,
        correct: true
      })

      const stored = JSON.parse(localStorage.getItem('assessments'))
      expect(stored['de:pt:1']['0-0'].type).toBe('select')
    })
  })

  describe('clearAnswers', () => {
    it('clears all answers for a lesson', () => {
      assessments.saveAnswer('de', 'pt', 1, 0, 0, { type: 'input', answer: 'a', correct: null })
      assessments.saveAnswer('de', 'pt', 1, 1, 0, { type: 'input', answer: 'b', correct: null })

      assessments.clearAnswers('de', 'pt', 1)

      expect(assessments.getAnswer('de', 'pt', 1, 0, 0)).toBeNull()
      expect(assessments.getAnswer('de', 'pt', 1, 1, 0)).toBeNull()
    })
  })

  describe('loadAssessments', () => {
    it('loads from localStorage', () => {
      localStorage.setItem('assessments', JSON.stringify({
        'de:pt:1': { '0-0': { type: 'input', answer: 'loaded', submittedAt: '2026-01-01', correct: null } }
      }))

      assessments.loadAssessments()

      const loaded = assessments.getAnswer('de', 'pt', 1, 0, 0)
      expect(loaded.answer).toBe('loaded')
    })

    it('handles invalid JSON gracefully', () => {
      localStorage.setItem('assessments', 'invalid json')
      assessments.loadAssessments()
      expect(assessments.assessments.value).toEqual({})
    })
  })

  describe('backward compatibility', () => {
    it('treats examples without type field as qa', () => {
      const example = { q: 'test', a: 'answer' }
      expect(assessments.validateAnswer(example, 'anything')).toBeNull()
    })
  })
})
