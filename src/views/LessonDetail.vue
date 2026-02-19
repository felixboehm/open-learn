<template>
  <div>
    <div v-if="lesson">
      <!-- Lesson title and description -->
      <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
        {{ lesson.title }}
      </h2>
      <p v-if="lesson.description" class="text-gray-600 dark:text-gray-400 mb-5 text-lg">
        {{ lesson.description }}
      </p>

      <!-- Sections -->
      <div
        v-for="(section, idx) in filteredSections"
        :key="idx"
        class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-5 bg-white dark:bg-gray-800">
        <div class="text-2xl text-primary-500 dark:text-blue-400 font-bold mb-4">
          {{ section.title }}
        </div>

        <!-- Video -->
        <div v-if="section.video" class="mb-4">
          <iframe
            :src="normalizeVideoUrl(section.video)"
            class="w-full aspect-video rounded"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>

        <!-- Explanation -->
        <div
          v-if="section.explanation"
          class="bg-gray-100 dark:bg-gray-900 p-4 rounded mb-4 prose prose-sm dark:prose-invert max-w-none"
          v-html="marked(section.explanation)">
        </div>

        <!-- Examples -->
        <div
          v-for="(example, exIdx) in section.examples"
          :key="exIdx"
          :id="`example-${example._originalSectionIdx}-${example._originalExampleIdx}`"
          @click="handleExampleClick(example)"
          :class="[
            'p-4 mb-3 rounded transition',
            isAssessmentType(example) ? '' : 'cursor-pointer',
            isCurrentlyReading(example) && isPlaying
              ? 'ring-4 ring-yellow-400 dark:ring-yellow-600'
              : '',
            isCurrentlyReading(example) && isPaused
              ? 'ring-4 ring-orange-400 dark:ring-orange-600'
              : '',
            example.labels
              ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border-l-4 border-blue-500'
              : 'bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 border-l-4 border-orange-500'
          ]">
          <!-- Question -->
          <div class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {{ example.q }}
          </div>

          <!-- Type: qa (default) -->
          <template v-if="!example.type || example.type === 'qa'">
            <div
              v-show="settings.showAnswers"
              class="text-gray-600 dark:text-gray-400 italic mb-3">
              {{ displayAnswer(example.a) }}
            </div>
          </template>

          <!-- Type: input -->
          <template v-else-if="example.type === 'input'">
            <div class="mt-2" @click.stop>
              <input
                type="text"
                :value="getDraft(example)"
                @input="setDraft(example, $event.target.value)"
                @keyup.enter="submitAnswer(example)"
                :disabled="!!getSubmission(example)"
                class="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-60"
                placeholder="Type your answer..." />
              <button
                v-if="!getSubmission(example)"
                @click="submitAnswer(example)"
                :disabled="!getDraft(example)"
                class="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition disabled:opacity-50">
                Submit
              </button>
              <button
                v-else
                @click="resetAnswer(example)"
                class="mt-2 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                Reset
              </button>
            </div>
            <div v-if="getSubmission(example)" class="mt-2 text-sm font-semibold">
              <span v-if="getSubmission(example).correct === true" class="text-green-600 dark:text-green-400">Correct</span>
              <span v-else-if="getSubmission(example).correct === false" class="text-red-600 dark:text-red-400">
                Incorrect — {{ displayAnswer(example.a) }}
              </span>
              <span v-else class="text-gray-500 dark:text-gray-400">Submitted</span>
            </div>
          </template>

          <!-- Type: multiple-choice -->
          <template v-else-if="example.type === 'multiple-choice'">
            <div class="mt-2 space-y-2" @click.stop>
              <label
                v-for="(option, optIdx) in example.options"
                :key="optIdx"
                :class="[
                  'flex items-center gap-2 p-2 rounded border cursor-pointer transition',
                  getSubmission(example) && option.correct
                    ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                ]">
                <input
                  type="checkbox"
                  :checked="isDraftOptionSelected(example, optIdx)"
                  @change="toggleDraftOption(example, optIdx)"
                  :disabled="!!getSubmission(example)"
                  class="w-4 h-4 accent-primary-500" />
                <span class="text-gray-800 dark:text-gray-200">{{ option.text }}</span>
              </label>
              <button
                v-if="!getSubmission(example)"
                @click="submitAnswer(example)"
                :disabled="!hasDraftOptions(example)"
                class="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition disabled:opacity-50">
                Submit
              </button>
              <button
                v-else
                @click="resetAnswer(example)"
                class="mt-2 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                Reset
              </button>
            </div>
            <div v-if="getSubmission(example)" class="mt-2 text-sm font-semibold">
              <span v-if="getSubmission(example).correct === true" class="text-green-600 dark:text-green-400">Correct</span>
              <span v-else-if="getSubmission(example).correct === false" class="text-red-600 dark:text-red-400">Incorrect</span>
              <span v-else class="text-gray-500 dark:text-gray-400">Submitted</span>
            </div>
          </template>

          <!-- Type: select -->
          <template v-else-if="example.type === 'select'">
            <div class="mt-2 space-y-2" @click.stop>
              <label
                v-for="(option, optIdx) in example.options"
                :key="optIdx"
                :class="[
                  'flex items-center gap-2 p-2 rounded border cursor-pointer transition',
                  getSubmission(example) && option.correct
                    ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                ]">
                <input
                  type="radio"
                  :name="`select-${example._originalSectionIdx}-${example._originalExampleIdx}`"
                  :checked="getDraftSelect(example) === optIdx"
                  @change="setDraftSelect(example, optIdx)"
                  :disabled="!!getSubmission(example)"
                  class="w-4 h-4 accent-primary-500" />
                <span class="text-gray-800 dark:text-gray-200">{{ option.text }}</span>
              </label>
              <button
                v-if="!getSubmission(example)"
                @click="submitAnswer(example)"
                :disabled="getDraftSelect(example) === null"
                class="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition disabled:opacity-50">
                Submit
              </button>
              <button
                v-else
                @click="resetAnswer(example)"
                class="mt-2 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                Reset
              </button>
            </div>
            <div v-if="getSubmission(example)" class="mt-2 text-sm font-semibold">
              <span v-if="getSubmission(example).correct === true" class="text-green-600 dark:text-green-400">Correct</span>
              <span v-else-if="getSubmission(example).correct === false" class="text-red-600 dark:text-red-400">Incorrect</span>
              <span v-else class="text-gray-500 dark:text-gray-400">Submitted</span>
            </div>
          </template>

          <!-- Coach rejection notice -->
          <div v-if="coachStatus[draftKey(example)]?.rejected" class="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
            <span>{{ coachStatus[draftKey(example)].coachName || 'Coach' }} did not accept your submission. You may need to enroll in this workshop.</span>
            <a
              v-if="coachStatus[draftKey(example)].enrollUrl"
              :href="coachStatus[draftKey(example)].enrollUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ml-1 underline text-primary-500 dark:text-blue-400">
              Enroll here
            </a>
          </div>

          <!-- Related items -->
          <div v-if="settings.showLearningItems && example.rel && example.rel.length > 0" class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="(item, relIdx) in example.rel"
              :key="relIdx"
              @click.stop="handleItemClick(item[0])"
              :class="[
                'px-2 py-1 rounded text-sm transition cursor-pointer border',
                isItemLearned(learning, teaching, item[0])
                  ? 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 line-through opacity-60'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600'
              ]">
              <span class="font-semibold text-primary-500 dark:text-blue-400">
                {{ item[0] }}
              </span>
              <span class="text-gray-800 dark:text-gray-200">
                • {{ item.slice(1).join(' • ') }}
              </span>
              <span v-if="isItemLearned(learning, teaching, item[0])" class="ml-1">✓</span>
            </button>
          </div>

          <!-- Labels -->
          <div v-if="settings.showLabels && example.labels" class="flex gap-1">
            <span
              v-for="label in example.labels"
              :key="label"
              class="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
              {{ label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else class="text-center py-8">
      <div class="text-2xl font-bold text-primary-500 dark:text-blue-400 mb-4">
        Loading lesson...
      </div>
    </div>

    <!-- Debug overlay (for iOS debugging) -->
    <div v-if="lesson && settings.showDebugOverlay" class="fixed top-24 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-40 font-mono max-w-xs">
      <div>Playing: {{ isPlaying ? 'YES' : 'NO' }}</div>
      <div>Paused: {{ isPaused ? 'YES' : 'NO' }}</div>
      <div>Index: {{ currentItem ? currentItem.sectionIdx + '-' + currentItem.exampleIdx : 'none' }}</div>
      <div v-if="currentItem" class="truncate">{{ currentItem.text.substring(0, 30) }}...</div>
    </div>

    <!-- Floating play/pause button for mobile -->
    <button
      v-if="lesson"
      @click="togglePlayPause"
      class="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center text-3xl z-50"
      :title="isPlaying ? 'Pause' : 'Play'">
      {{ isPlaying ? '⏸' : '▶️' }}
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useSettings } from '../composables/useSettings'
import { useProgress } from '../composables/useProgress'
import { useAudio } from '../composables/useAudio'
import { useAssessments } from '../composables/useAssessments'
import { marked } from 'marked'

const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForTopic } = useLessons()
const { settings } = useSettings()
const { isItemLearned, toggleItemLearned, areAllItemsLearned, progress } = useProgress()
const { isPlaying, isPaused, currentItem, initializeAudio, jumpToExample, cleanup, play, pause } = useAudio()
const { getAnswer, saveAnswer, validateAnswer, forwardToCoach } = useAssessments()

// Coach forwarding status per example (transient, not persisted)
const coachStatus = reactive({})

const lesson = ref(null)

// Draft state for in-progress assessment answers (not persisted until submit)
const drafts = reactive({})

// Convert YouTube watch/short URLs to embed URLs
function normalizeVideoUrl(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  return url
}

// Check if example is an assessment type (not plain qa)
function isAssessmentType(example) {
  return example.type && example.type !== 'qa'
}

// Display answer - handles both string and array formats
function displayAnswer(a) {
  if (Array.isArray(a)) return a[0]
  return a
}

// --- Draft management ---

function draftKey(example) {
  return `${example._originalSectionIdx}-${example._originalExampleIdx}`
}

function getDraft(example) {
  return drafts[draftKey(example)] || ''
}

function setDraft(example, value) {
  drafts[draftKey(example)] = value
}

function getDraftSelect(example) {
  const val = drafts[draftKey(example)]
  return val !== undefined ? val : null
}

function setDraftSelect(example, optIdx) {
  drafts[draftKey(example)] = optIdx
}

function isDraftOptionSelected(example, optIdx) {
  const selected = drafts[draftKey(example)]
  return Array.isArray(selected) && selected.includes(optIdx)
}

function toggleDraftOption(example, optIdx) {
  const key = draftKey(example)
  if (!Array.isArray(drafts[key])) {
    drafts[key] = []
  }
  const idx = drafts[key].indexOf(optIdx)
  if (idx === -1) {
    drafts[key].push(optIdx)
  } else {
    drafts[key].splice(idx, 1)
  }
}

function hasDraftOptions(example) {
  const selected = drafts[draftKey(example)]
  return Array.isArray(selected) && selected.length > 0
}

// --- Submission ---

function getSubmission(example) {
  return getAnswer(
    learning.value, teaching.value, lessonNumber.value,
    example._originalSectionIdx, example._originalExampleIdx
  )
}

function submitAnswer(example) {
  const type = example.type || 'qa'
  let userAnswer

  if (type === 'input') {
    userAnswer = getDraft(example)
    if (!userAnswer) return
  } else if (type === 'multiple-choice') {
    userAnswer = drafts[draftKey(example)]
    if (!Array.isArray(userAnswer) || userAnswer.length === 0) return
  } else if (type === 'select') {
    userAnswer = getDraftSelect(example)
    if (userAnswer === null) return
  } else {
    return
  }

  const correct = validateAnswer(example, userAnswer)

  saveAnswer(
    learning.value, teaching.value, lessonNumber.value,
    example._originalSectionIdx, example._originalExampleIdx,
    { type, answer: userAnswer, correct }
  )

  // Forward to coach if configured
  if (lesson.value?.coach) {
    const section = lesson.value.sections[example._originalSectionIdx]
    const payload = {
      lesson: {
        learning: learning.value,
        teaching: teaching.value,
        number: lessonNumber.value,
        title: lesson.value.title
      },
      section: {
        index: example._originalSectionIdx,
        title: section?.title
      },
      example: {
        index: example._originalExampleIdx,
        type,
        question: example.q
      },
      answer: {
        value: userAnswer,
        correct
      }
    }

    const key = draftKey(example)
    forwardToCoach(lesson.value.coach, payload, settings.value).then(result => {
      if (result && !result.ok) {
        coachStatus[key] = { rejected: true, enrollUrl: result.enrollUrl, coachName: lesson.value.coach.name }
      }
    })
  }
}

function resetAnswer(example) {
  // Clear the persisted answer by saving null-like entry, then remove
  const key = `${learning.value}:${teaching.value}:${lessonNumber.value}`
  const itemKey = draftKey(example)

  // Remove from assessments storage
  const { assessments } = useAssessments()
  if (assessments.value[key]) {
    delete assessments.value[key][itemKey]
    localStorage.setItem('assessments', JSON.stringify(assessments.value))
  }

  // Clear draft
  delete drafts[itemKey]
}

// --- Restore drafts from saved answers on mount ---

function restoreDraftsFromSaved() {
  if (!lesson.value) return
  lesson.value.sections.forEach((section, sIdx) => {
    section.examples.forEach((example, eIdx) => {
      const saved = getAnswer(learning.value, teaching.value, lessonNumber.value, sIdx, eIdx)
      if (saved) {
        drafts[`${sIdx}-${eIdx}`] = saved.answer
      }
    })
  })
}

const learning = computed(() => route.params.learning)
const teaching = computed(() => route.params.teaching)
const lessonNumber = computed(() => parseInt(route.params.number))

// Filter sections to show only examples that have unlearned items (if setting is enabled)
const filteredSections = computed(() => {
  if (!lesson.value || !lesson.value.sections) {
    return []
  }

  return lesson.value.sections.map((section, originalSectionIdx) => {
    const filteredExamples = section.examples
      .map((example, originalExampleIdx) => ({
        ...example,
        _originalSectionIdx: originalSectionIdx,
        _originalExampleIdx: originalExampleIdx
      }))
      .filter(example => {
        // If hideLearnedExamples is disabled, show all examples
        if (!settings.value.hideLearnedExamples) {
          return true
        }

        // If example has no related items, always show it
        if (!example.rel || example.rel.length === 0) {
          return true
        }
        // Hide example only if ALL items are learned
        return !areAllItemsLearned(learning.value, teaching.value, example.rel)
      })

    return {
      ...section,
      examples: filteredExamples,
      _originalSectionIdx: originalSectionIdx
    }
  }).filter(section => section.examples.length > 0) // Only show sections with visible examples
})

// Handle item click to toggle learned status
function handleItemClick(itemId) {
  toggleItemLearned(learning.value, teaching.value, itemId)
}

// Handle example click for audio playback (only for non-assessment types)
function handleExampleClick(example) {
  if (isAssessmentType(example)) return

  const originalSectionIdx = example._originalSectionIdx
  const originalExampleIdx = example._originalExampleIdx

  if (isPlaying.value) {
    jumpToExample(originalSectionIdx, originalExampleIdx, settings.value)
  } else {
    jumpToExample(originalSectionIdx, originalExampleIdx, settings.value)
  }
}

// Check if an example is currently being read
function isCurrentlyReading(example) {
  if (!currentItem.value) return false
  return currentItem.value.sectionIdx === example._originalSectionIdx &&
         currentItem.value.exampleIdx === example._originalExampleIdx
}

// Toggle play/pause
function togglePlayPause() {
  if (isPlaying.value) {
    pause()
  } else {
    play(settings.value)
  }
}

// Auto-scroll to currently reading item
watch(currentItem, async (newItem) => {
  if (!newItem) return

  await nextTick()

  const elementId = `example-${newItem.sectionIdx}-${newItem.exampleIdx}`
  const element = document.getElementById(elementId)

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

// Rebuild audio queue when hideLearnedExamples or readAnswers setting changes
watch(
  () => [settings.value.hideLearnedExamples, settings.value.readAnswers],
  async () => {
    if (lesson.value) {
      console.log('🔄 Settings changed, rebuilding audio queue')
      await initializeAudio(lesson.value, learning.value, teaching.value, settings.value)
    }
  },
  { deep: true }
)

// Rebuild audio queue when progress changes (items marked as learned/unlearned)
watch(
  progress,
  async () => {
    if (lesson.value && settings.value.hideLearnedExamples) {
      console.log('🔄 Progress changed, rebuilding audio queue')
      await initializeAudio(lesson.value, learning.value, teaching.value, settings.value)
    }
  },
  { deep: true }
)

onMounted(async () => {
  const currentLearning = route.params.learning
  const currentTeaching = route.params.teaching
  const currentLessonNumber = parseInt(route.params.number)

  // Load all lessons to find the correct file
  const lessons = await loadAllLessonsForTopic(currentLearning, currentTeaching)

  // Find the lesson with the matching number
  lesson.value = lessons.find(l => l.number === currentLessonNumber)

  if (lesson.value) {
    emit('update-title', `Lesson ${lesson.value.number}`)

    // Initialize audio for this lesson (load voices once)
    await initializeAudio(lesson.value, currentLearning, currentTeaching, settings.value)

    // Restore drafts from previously saved assessment answers
    restoreDraftsFromSaved()
  }
})

onUnmounted(() => {
  // Cleanup audio when leaving the page
  cleanup()
})
</script>
