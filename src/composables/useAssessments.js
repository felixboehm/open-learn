import { ref, watch } from 'vue'
import { useGun } from './useGun'

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
  const { isLoggedIn, syncToGun } = useGun()
  if (isLoggedIn.value) {
    syncToGun('assessments', assessments.value)
  }
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
    loadAssessments,
    getAnswer,
    saveAnswer,
    clearAnswers,
    validateAnswer,
    getAssessments,
    mergeAssessments
  }
}
