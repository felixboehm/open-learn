<template>
  <div>
    <div v-if="!isLoading && lessons.length > 0">
      <!-- Lesson filter -->
      <div v-if="lessons.length > 1" class="flex flex-wrap gap-2 mb-5">
        <button
          @click="selectedLesson = null"
          :class="[
            'px-3 py-1.5 rounded font-semibold transition text-sm',
            selectedLesson === null
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          ]">
          All Lessons
        </button>
        <button
          v-for="lesson in lessons"
          :key="lesson.number"
          @click="selectedLesson = lesson.number"
          :class="[
            'px-3 py-1.5 rounded font-semibold transition text-sm',
            selectedLesson === lesson.number
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          ]">
          {{ lesson.number }}
        </button>
      </div>

      <!-- Summary header -->
      <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 mb-6">
        <div class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {{ totalAnswered }} of {{ totalAssessments }} assessments answered
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ totalCorrect }} correct, {{ totalWrong }} incorrect, {{ totalUnanswered }} missing
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ totalLearnedItems }} learning items marked as learned
        </div>
      </div>

      <!-- Per-lesson cards -->
      <div v-for="entry in filteredEntries" :key="entry.lesson.number" class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-5 bg-white dark:bg-gray-800">
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
          Lesson {{ entry.lesson.number }}: {{ entry.lesson.title }}
        </h3>

        <!-- Learning items stats -->
        <div v-if="entry.totalItems > 0" class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {{ entry.learnedItems }}/{{ entry.totalItems }} learning items learned
        </div>

        <!-- Assessment answers per section -->
        <div v-for="section in entry.sections" :key="section.index" class="mb-4">
          <div class="font-semibold text-primary-500 dark:text-blue-400 mb-2">{{ section.title }}</div>

          <div v-for="ex in section.examples" :key="ex.key" class="ml-4 mb-1 text-sm">
            <template v-if="ex.answered">
              <span v-if="ex.correct === true" class="text-green-600 dark:text-green-400 font-mono">[ok]</span>
              <span v-else-if="ex.correct === false" class="text-red-600 dark:text-red-400 font-mono">[!!]</span>
              <span v-else class="text-gray-500 font-mono">[--]</span>
              <span class="text-gray-800 dark:text-gray-200 ml-1">{{ ex.question }}</span>
              <span class="text-gray-500 mx-1">&rarr;</span>
              <span class="text-gray-700 dark:text-gray-300 italic">{{ ex.displayAnswer }}</span>
              <span v-if="ex.correct === false && ex.expected" class="text-red-500 dark:text-red-400 ml-1">(expected: {{ ex.expected }})</span>
            </template>
            <template v-else>
              <span class="text-gray-400 font-mono">[  ]</span>
              <span class="text-gray-500 ml-1">{{ ex.question }}</span>
              <span class="text-gray-400 ml-1">(not answered)</span>
            </template>
          </div>
        </div>

        <!-- No assessments in this lesson -->
        <div v-if="entry.assessmentCount === 0" class="text-sm text-gray-400 italic">
          No assessments in this lesson
        </div>
      </div>

      <!-- Send to coach button -->
      <div v-if="coachEmail" class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-5 bg-white dark:bg-gray-800">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Send your results to <strong class="text-gray-800 dark:text-gray-200">{{ coachName || coachEmail }}</strong> via email.
        </div>
        <a
          :href="mailtoLink"
          class="inline-block px-5 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
          Send Results via Email
        </a>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="text-center py-8">
      <div class="text-2xl font-bold text-primary-500 dark:text-blue-400 mb-4">
        Loading results...
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <div class="text-xl text-gray-600 dark:text-gray-400">
        No lessons found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useAssessments } from '../composables/useAssessments'
import { useProgress } from '../composables/useProgress'
import { formatLangName } from '../utils/formatters'

const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForTopic, getTopicMeta } = useLessons()
const { getAnswer } = useAssessments()
const { isItemLearned } = useProgress()

const lessons = ref([])
const isLoading = ref(true)
const selectedLesson = ref(null)

const learning = computed(() => route.params.learning)
const teaching = computed(() => route.params.teaching)

// Coach info from topic metadata
const coachEmail = computed(() => {
  const meta = getTopicMeta(learning.value, teaching.value)
  return meta.coach?.email || null
})

const coachName = computed(() => {
  const meta = getTopicMeta(learning.value, teaching.value)
  return meta.coach?.name || null
})

// Build structured data for each lesson
const allEntries = computed(() => {
  return lessons.value.map(lesson => {
    const sections = []
    let assessmentCount = 0
    let totalItems = 0
    let learnedItems = 0
    const itemsSeen = new Set()

    lesson.sections.forEach((section, sIdx) => {
      const examples = []

      section.examples.forEach((example, eIdx) => {
        // Count learning items
        if (example.rel) {
          example.rel.forEach(item => {
            const id = item[0]
            if (!itemsSeen.has(id)) {
              itemsSeen.add(id)
              totalItems++
              if (isItemLearned(learning.value, teaching.value, id)) {
                learnedItems++
              }
            }
          })
        }

        // Only show assessment-type examples
        const type = example.type || 'qa'
        if (type === 'qa') return

        assessmentCount++
        const saved = getAnswer(learning.value, teaching.value, lesson.number, sIdx, eIdx)

        examples.push({
          key: `${sIdx}-${eIdx}`,
          question: example.q,
          type,
          answered: !!saved,
          correct: saved?.correct ?? null,
          displayAnswer: formatSavedAnswer(saved, example),
          expected: saved?.correct === false ? formatExpectedAnswer(example) : null
        })
      })

      if (examples.length > 0) {
        sections.push({
          index: sIdx,
          title: section.title,
          examples
        })
      }
    })

    return {
      lesson,
      sections,
      assessmentCount,
      totalItems,
      learnedItems
    }
  })
})

// Filter by selected lesson
const filteredEntries = computed(() => {
  if (selectedLesson.value === null) return allEntries.value
  return allEntries.value.filter(e => e.lesson.number === selectedLesson.value)
})

// Aggregate totals (based on filtered view)
const totalAssessments = computed(() => filteredEntries.value.reduce((sum, e) => sum + e.assessmentCount, 0))
const totalAnswered = computed(() => filteredEntries.value.reduce((sum, e) =>
  sum + e.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.answered).length, 0), 0))
const totalCorrect = computed(() => filteredEntries.value.reduce((sum, e) =>
  sum + e.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.correct === true).length, 0), 0))
const totalWrong = computed(() => filteredEntries.value.reduce((sum, e) =>
  sum + e.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.correct === false).length, 0), 0))
const totalUnanswered = computed(() => totalAssessments.value - totalAnswered.value)
const totalLearnedItems = computed(() => filteredEntries.value.reduce((sum, e) => sum + e.learnedItems, 0))

// Generate plain-text report (uses filtered view)
function generateReport() {
  const lines = []
  const topicName = formatLangName(teaching.value)
  const date = new Date().toISOString().slice(0, 10)

  lines.push(`Open Learn - Assessment Results`)
  lines.push(`Topic: ${topicName}`)
  lines.push(`Date: ${date}`)
  lines.push('')

  for (const entry of filteredEntries.value) {
    lines.push(`Lesson ${entry.lesson.number}: ${entry.lesson.title}`)
    if (entry.totalItems > 0) {
      lines.push(`  Learned items: ${entry.learnedItems}/${entry.totalItems}`)
    }

    if (entry.assessmentCount === 0) {
      lines.push('  No assessments')
    } else {
      const answered = entry.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.answered).length, 0)
      const correct = entry.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.correct === true).length, 0)
      lines.push(`  Assessments: ${answered}/${entry.assessmentCount} answered, ${correct} correct`)
    }

    for (const section of entry.sections) {
      lines.push(`  Section: ${section.title}`)
      for (const ex of section.examples) {
        if (ex.answered) {
          const mark = ex.correct === true ? 'ok' : ex.correct === false ? '!!' : '--'
          let line = `    [${mark}] ${ex.question} -> ${ex.displayAnswer}`
          if (ex.expected) line += ` (expected: ${ex.expected})`
          lines.push(line)
        } else {
          lines.push(`    [  ] ${ex.question} -> (not answered)`)
        }
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

// Build mailto: link
const mailtoLink = computed(() => {
  if (!coachEmail.value) return '#'
  const topicName = formatLangName(teaching.value)
  const subject = `Assessment Results - ${topicName}`
  const body = generateReport()
  return `mailto:${encodeURIComponent(coachEmail.value)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})

// Format a saved answer for display
function formatSavedAnswer(saved, example) {
  if (!saved) return ''
  const type = saved.type || example.type || 'qa'

  if (type === 'input') {
    return saved.answer
  }
  if (type === 'select' && example.options) {
    return example.options[saved.answer]?.text || String(saved.answer)
  }
  if (type === 'multiple-choice' && example.options && Array.isArray(saved.answer)) {
    return saved.answer.map(i => example.options[i]?.text || String(i)).join(', ')
  }
  return String(saved.answer)
}

// Format expected answer for display (on incorrect)
function formatExpectedAnswer(example) {
  const type = example.type || 'qa'
  if (type === 'input') {
    return Array.isArray(example.a) ? example.a[0] : example.a
  }
  if (type === 'select' && example.options) {
    const idx = example.options.findIndex(o => o.correct)
    return idx >= 0 ? example.options[idx].text : null
  }
  if (type === 'multiple-choice' && example.options) {
    return example.options.filter(o => o.correct).map(o => o.text).join(', ')
  }
  return null
}

async function loadData() {
  if (!learning.value || !teaching.value) return
  isLoading.value = true
  lessons.value = await loadAllLessonsForTopic(learning.value, teaching.value)
  isLoading.value = false
  emit('update-title', 'Results')
}

watch([learning, teaching], () => {
  loadData()
}, { immediate: true })
</script>
