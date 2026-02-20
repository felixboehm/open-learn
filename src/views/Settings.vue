<template>
  <div class="space-y-8">
    <!-- Appearance Section -->
    <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-600">
        🎨 Appearance
      </h2>

      <!-- Dark Mode Toggle -->
      <div class="mb-6">
        <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
          Dark Mode
        </label>
        <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
          Dark color scheme for comfortable reading at night
        </div>
        <label class="relative inline-block w-14 h-8 cursor-pointer">
          <input
            type="checkbox"
            v-model="settings.darkMode"
            class="opacity-0 w-0 h-0 peer" />
          <span
            class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 transition rounded-full peer-checked:bg-primary-500 before:content-[''] before:absolute before:h-6 before:w-6 before:left-1 before:bottom-1 before:bg-white before:transition before:rounded-full peer-checked:before:translate-x-6">
          </span>
        </label>
      </div>
    </div>

    <!-- Display Settings Section -->
    <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-600">
        📖 Lesson Display
      </h2>

      <!-- Show Answers Toggle -->
      <div class="mb-6">
      <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
        Show Answers
      </label>
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Show or hide answer translations in lessons
      </div>
      <label class="relative inline-block w-14 h-8 cursor-pointer">
        <input
          type="checkbox"
          v-model="settings.showAnswers"
          class="opacity-0 w-0 h-0 peer" />
        <span
          class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 transition rounded-full peer-checked:bg-primary-500 before:content-[''] before:absolute before:h-6 before:w-6 before:left-1 before:bottom-1 before:bg-white before:transition before:rounded-full peer-checked:before:translate-x-6">
        </span>
      </label>
    </div>

    <!-- Show Learning Items Toggle -->
    <div class="mb-6">
      <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
        Show Learning Items
      </label>
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Show or hide vocabulary and related items
      </div>
      <label class="relative inline-block w-14 h-8 cursor-pointer">
        <input
          type="checkbox"
          v-model="settings.showLearningItems"
          class="opacity-0 w-0 h-0 peer" />
        <span
          class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 transition rounded-full peer-checked:bg-primary-500 before:content-[''] before:absolute before:h-6 before:w-6 before:left-1 before:bottom-1 before:bg-white before:transition before:rounded-full peer-checked:before:translate-x-6">
        </span>
      </label>
    </div>

    <!-- Show Labels Toggle -->
    <div class="mb-6">
      <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
        Show Labels
      </label>
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Show or hide grammar labels (Futur, Gerundium, etc.)
      </div>
      <label class="relative inline-block w-14 h-8 cursor-pointer">
        <input
          type="checkbox"
          v-model="settings.showLabels"
          class="opacity-0 w-0 h-0 peer" />
        <span
          class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 transition rounded-full peer-checked:bg-primary-500 before:content-[''] before:absolute before:h-6 before:w-6 before:left-1 before:bottom-1 before:bg-white before:transition before:rounded-full peer-checked:before:translate-x-6">
        </span>
      </label>
    </div>

    <!-- Hide Learned Examples Toggle -->
    <div class="mb-6">
      <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
        Hide Learned Examples
      </label>
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Automatically hide examples where all vocabulary items are learned
      </div>
      <label class="relative inline-block w-14 h-8 cursor-pointer">
        <input
          type="checkbox"
          v-model="settings.hideLearnedExamples"
          class="opacity-0 w-0 h-0 peer" />
        <span
          class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 transition rounded-full peer-checked:bg-primary-500 before:content-[''] before:absolute before:h-6 before:w-6 before:left-1 before:bottom-1 before:bg-white before:transition before:rounded-full peer-checked:before:translate-x-6">
        </span>
      </label>
    </div>
    </div>

    <!-- Audio Settings Section -->
    <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-600">
        🔊 Audio Settings
      </h2>

      <!-- Audio Speed Selection -->
      <div class="mb-6">
      <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
        Audio Speed
      </label>
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Playback speed for auto-reading audio
      </div>
      <div class="flex gap-3">
        <button
          v-for="speed in [0.6, 0.8, 1.0]"
          :key="speed"
          @click="settings.audioSpeed = speed"
          :class="[
            'px-4 py-2 rounded font-semibold transition',
            settings.audioSpeed === speed
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          ]">
          {{ speed }}×
        </button>
      </div>
    </div>

    <!-- Read Answers Toggle -->
    <div class="mb-6">
      <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
        Read Answers
      </label>
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Include answer translations when auto-reading lessons
      </div>
      <label class="relative inline-block w-14 h-8 cursor-pointer">
        <input
          type="checkbox"
          v-model="settings.readAnswers"
          class="opacity-0 w-0 h-0 peer" />
        <span
          class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 transition rounded-full peer-checked:bg-primary-500 before:content-[''] before:absolute before:h-6 before:w-6 before:left-1 before:bottom-1 before:bg-white before:transition before:rounded-full peer-checked:before:translate-x-6">
        </span>
      </label>
    </div>

    <!-- Debug Overlay Toggle -->
    <div class="mb-6">
      <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
        Show Debug Overlay
      </label>
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Display playback information overlay (for troubleshooting)
      </div>
      <label class="relative inline-block w-14 h-8 cursor-pointer">
        <input
          type="checkbox"
          v-model="settings.showDebugOverlay"
          class="opacity-0 w-0 h-0 peer" />
        <span
          class="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 transition rounded-full peer-checked:bg-primary-500 before:content-[''] before:absolute before:h-6 before:w-6 before:left-1 before:bottom-1 before:bg-white before:transition before:rounded-full peer-checked:before:translate-x-6">
        </span>
      </label>
    </div>
    </div>

    <!-- Data Section -->
    <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-600">
        Data
      </h2>

      <div v-if="availableTopics.length === 0" class="text-gray-600 dark:text-gray-400 text-sm mb-4">
        No data yet. Start learning to track your progress.
      </div>

      <template v-else>
        <!-- Topic selector -->
        <div class="mb-4">
          <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-2 text-lg">
            Topic
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="topic in availableTopics"
              :key="topic.key"
              @click="selectedTopic = topic.key"
              :class="[
                'px-3 py-1.5 rounded font-semibold transition text-sm',
                selectedTopic === topic.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              ]">
              {{ topic.label }}
            </button>
          </div>
        </div>

        <div class="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {{ dataSummary }}
        </div>

        <div class="flex gap-3 flex-wrap">
          <button
            @click="exportData"
            class="px-4 py-2 rounded font-semibold transition bg-primary-500 text-white hover:bg-primary-600">
            Export
          </button>

          <button
            @click="$refs.fileInput.click()"
            class="px-4 py-2 rounded font-semibold transition bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
            Import
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="importData" />
        </div>
      </template>

      <div v-if="importMessage" class="mt-3 text-sm" :class="importMessageError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
        {{ importMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSettings } from '../composables/useSettings'
import { useProgress } from '../composables/useProgress'
import { useAssessments } from '../composables/useAssessments'
import { formatLangName } from '../utils/formatters'

const { settings } = useSettings()
const { progress, getProgress, mergeProgress } = useProgress()
const { assessments, getAssessments, mergeAssessments } = useAssessments()

const importMessage = ref('')
const importMessageError = ref(false)
const selectedTopic = ref('')

// Collect all unique topic keys (learning:teaching) from progress + assessments
const availableTopics = computed(() => {
  const keys = new Set()
  for (const key of Object.keys(progress.value)) {
    keys.add(key) // progress keys are "learning:teaching"
  }
  for (const key of Object.keys(assessments.value)) {
    // assessment keys are "learning:teaching:lessonNumber"
    const parts = key.split(':')
    if (parts.length >= 2) keys.add(`${parts[0]}:${parts[1]}`)
  }
  const sorted = [...keys].sort()
  // Auto-select first topic if none selected
  if (sorted.length > 0 && !sorted.includes(selectedTopic.value)) {
    selectedTopic.value = sorted[0]
  }
  return sorted.map(key => {
    const [learning, teaching] = key.split(':')
    return { key, label: formatLangName(teaching) }
  })
})

// Filter progress/assessments for the selected topic
function getTopicProgress() {
  const all = getProgress()
  return all[selectedTopic.value] ? { [selectedTopic.value]: all[selectedTopic.value] } : {}
}

function getTopicAssessments() {
  const all = getAssessments()
  const prefix = selectedTopic.value + ':'
  const filtered = {}
  for (const [key, val] of Object.entries(all)) {
    if (key.startsWith(prefix)) filtered[key] = val
  }
  return filtered
}

const dataSummary = computed(() => {
  if (!selectedTopic.value) return ''
  const topicProgress = progress.value[selectedTopic.value] || {}
  const itemCount = Object.keys(topicProgress).length
  const prefix = selectedTopic.value + ':'
  let answerCount = 0
  for (const [key, answers] of Object.entries(assessments.value)) {
    if (key.startsWith(prefix)) answerCount += Object.keys(answers).length
  }
  return `${itemCount} item${itemCount !== 1 ? 's' : ''} learned, ${answerCount} answer${answerCount !== 1 ? 's' : ''}`
})

function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    topic: selectedTopic.value,
    progress: getTopicProgress(),
    assessments: getTopicAssessments()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const topicSlug = selectedTopic.value.replace(/:/g, '-')
  const a = document.createElement('a')
  a.href = url
  a.download = `open-learn-${topicSlug}-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (!data.version || (!data.progress && !data.assessments)) {
        importMessage.value = 'Invalid file format.'
        importMessageError.value = true
        return
      }
      if (data.progress) mergeProgress(data.progress)
      if (data.assessments) mergeAssessments(data.assessments)
      importMessage.value = 'Data imported successfully.'
      importMessageError.value = false
    } catch {
      importMessage.value = 'Could not read file.'
      importMessageError.value = true
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}
</script>
