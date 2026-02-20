import { describe, it, expect, beforeEach } from 'vitest'
import { useAssessments } from '../src/composables/useAssessments'

describe('Coach queue removal', () => {
  let assessments

  beforeEach(() => {
    localStorage.clear()
    assessments = useAssessments()
    assessments.assessments.value = {}
  })

  it('does not export coach queue functions', () => {
    expect(assessments.coachQueue).toBeUndefined()
    expect(assessments.queueForCoach).toBeUndefined()
    expect(assessments.flushCoachQueue).toBeUndefined()
    expect(assessments.flushCoachQueueSync).toBeUndefined()
    expect(assessments.clearCoachQueue).toBeUndefined()
    expect(assessments.hasQueuedAnswers).toBeUndefined()
  })

  it('still exports core assessment functions', () => {
    expect(assessments.getAnswer).toBeInstanceOf(Function)
    expect(assessments.saveAnswer).toBeInstanceOf(Function)
    expect(assessments.validateAnswer).toBeInstanceOf(Function)
    expect(assessments.clearAnswers).toBeInstanceOf(Function)
    expect(assessments.getAssessments).toBeInstanceOf(Function)
    expect(assessments.mergeAssessments).toBeInstanceOf(Function)
  })
})
