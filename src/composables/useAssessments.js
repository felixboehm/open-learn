import { ref, watch } from 'vue'

// Shared assessment state (singleton pattern)
// Structure: { "learning:teaching:lessonNumber": { "sectionIdx-exampleIdx": { type, answer, submittedAt, correct } } }
const assessments = ref({})

let isInitialized = false

function getKey(learning, teaching, lessonNumber) {
  return `${learning}:${teaching}:${lessonNumber}`
}

function getItemKey(sectionIdx, exampleIdx) {
  return `${sectionIdx}-${exampleIdx}`
}

function saveAssessments() {
  localStorage.setItem('assessments', JSON.stringify(assessments.value))
}

function loadAssessments() {
  const saved = localStorage.getItem('assessments')
  if (saved) {
    try {
      assessments.value = JSON.parse(saved)
    } catch (e) {
      console.error('Error loading assessments:', e)
      assessments.value = {}
    }
  }
}

function getAnswer(learning, teaching, lessonNumber, sectionIdx, exampleIdx) {
  const key = getKey(learning, teaching, lessonNumber)
  const itemKey = getItemKey(sectionIdx, exampleIdx)
  return assessments.value[key]?.[itemKey] || null
}

function saveAnswer(learning, teaching, lessonNumber, sectionIdx, exampleIdx, answerData) {
  const key = getKey(learning, teaching, lessonNumber)
  const itemKey = getItemKey(sectionIdx, exampleIdx)

  if (!assessments.value[key]) {
    assessments.value[key] = {}
  }

  assessments.value[key][itemKey] = {
    ...answerData,
    submittedAt: new Date().toISOString()
  }

  saveAssessments()
}

function clearAnswers(learning, teaching, lessonNumber) {
  const key = getKey(learning, teaching, lessonNumber)
  delete assessments.value[key]
  saveAssessments()
}

// Validate an answer against correct answer(s) from YAML
function validateAnswer(example, userAnswer) {
  if (!example) return null

  const type = example.type || 'qa'

  if (type === 'input') {
    if (!example.a) return null
    const accepted = Array.isArray(example.a) ? example.a : [example.a]
    const normalized = userAnswer.trim().toLowerCase()
    return accepted.some(a => a.trim().toLowerCase() === normalized)
  }

  if (type === 'multiple-choice') {
    if (!example.options || !example.options.some(o => o.correct !== undefined)) return null
    const correctIndices = example.options
      .map((o, i) => o.correct ? i : -1)
      .filter(i => i !== -1)
    const sorted = arr => [...arr].sort((a, b) => a - b)
    return JSON.stringify(sorted(userAnswer)) === JSON.stringify(sorted(correctIndices))
  }

  if (type === 'select') {
    if (!example.options || !example.options.some(o => o.correct !== undefined)) return null
    const correctIndex = example.options.findIndex(o => o.correct)
    return userAnswer === correctIndex
  }

  return null
}

// Forward answer to coach API
// Returns { ok: true } on success, { ok: false, enrollUrl? } on 401, or null on other errors
async function forwardToCoach(coachConfig, answerPayload, settings) {
  if (!coachConfig?.api) return null
  if (!settings.coachConsent) return null

  const payload = {
    ...answerPayload,
    timestamp: new Date().toISOString()
  }

  if (settings.coachIdentifier) {
    payload.user = settings.coachIdentifier
  }

  try {
    const response = await fetch(coachConfig.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) return { ok: true }

    if (response.status === 401) {
      let enrollUrl = null
      try {
        const body = await response.json()
        enrollUrl = body.enrollUrl || null
      } catch { /* ignore parse errors */ }
      return { ok: false, enrollUrl }
    }

    return null
  } catch (e) {
    console.warn('Failed to forward to coach:', e)
    return null
  }
}

function initializeWatchers() {
  if (isInitialized) return
  isInitialized = true

  watch(assessments, () => {
    saveAssessments()
  }, { deep: true })
}

export function useAssessments() {
  initializeWatchers()

  return {
    assessments,
    loadAssessments,
    getAnswer,
    saveAnswer,
    clearAnswers,
    validateAnswer,
    forwardToCoach
  }
}
