import { ref, watch } from 'vue'

// Shared assessment state (singleton pattern)
// Structure: { "learning:teaching:lessonNumber": { "sectionIdx-exampleIdx": { type, answer, submittedAt, correct } } }
const assessments = ref({})

// Coach queue: answers waiting to be sent as a batch
const coachQueue = ref([])

// Lesson context for the current queue (set when queueing)
let queueLessonContext = null

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

// --- Coach Queue (batch mode) ---

// Add an answer to the queue for later batch sending
function queueForCoach(lessonContext, answerEntry) {
  queueLessonContext = lessonContext
  coachQueue.value.push(answerEntry)
}

// Check if there are unsent answers in the queue
function hasQueuedAnswers() {
  return coachQueue.value.length > 0
}

// Flush the queue: send all queued answers as one batch request
// Returns { ok: true } on success, { ok: false, enrollUrl? } on 401, or null on error/skip
async function flushCoachQueue(coachConfig, settings) {
  if (!coachConfig?.api) return null
  if (!settings.coachConsent) return null
  if (coachQueue.value.length === 0) return null

  const payload = {
    lesson: queueLessonContext,
    answers: [...coachQueue.value],
    timestamp: new Date().toISOString()
  }

  if (settings.coachIdentifier) {
    payload.user = settings.coachIdentifier
  }

  // Clear queue before sending (prevent double-send)
  const sentCount = coachQueue.value.length
  coachQueue.value = []

  try {
    const response = await fetch(coachConfig.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) return { ok: true, count: sentCount }

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

// Flush using sendBeacon (for page/tab close — fire-and-forget, no async)
function flushCoachQueueSync(coachConfig, settings) {
  if (!coachConfig?.api) return
  if (!settings.coachConsent) return
  if (coachQueue.value.length === 0) return

  const payload = {
    lesson: queueLessonContext,
    answers: [...coachQueue.value],
    timestamp: new Date().toISOString()
  }

  if (settings.coachIdentifier) {
    payload.user = settings.coachIdentifier
  }

  coachQueue.value = []

  try {
    navigator.sendBeacon(
      coachConfig.api,
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    )
  } catch (e) {
    console.warn('sendBeacon failed:', e)
  }
}

function clearCoachQueue() {
  coachQueue.value = []
  queueLessonContext = null
}

function initializeWatchers() {
  if (isInitialized) return
  isInitialized = true

  watch(assessments, () => {
    saveAssessments()
  }, { deep: true })
}

// Return raw assessments object
function getAssessments() {
  return assessments.value
}

// Merge imported assessments into existing (additive)
function mergeAssessments(imported) {
  for (const [lessonKey, answers] of Object.entries(imported)) {
    if (!assessments.value[lessonKey]) {
      assessments.value[lessonKey] = {}
    }
    Object.assign(assessments.value[lessonKey], answers)
  }
  saveAssessments()
}

export function useAssessments() {
  initializeWatchers()

  return {
    assessments,
    coachQueue,
    loadAssessments,
    getAnswer,
    saveAnswer,
    clearAnswers,
    validateAnswer,
    queueForCoach,
    hasQueuedAnswers,
    flushCoachQueue,
    flushCoachQueueSync,
    clearCoachQueue,
    getAssessments,
    mergeAssessments
  }
}
