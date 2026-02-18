<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
      <div class="text-2xl font-bold text-primary-500 dark:text-blue-400 mb-4">
        Loading available content...
      </div>
      <div class="text-gray-600 dark:text-gray-400">
        Please wait while we load the lesson catalog.
      </div>
    </div>

    <!-- Language selection -->
    <div v-else class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <h2 class="text-3xl font-bold mb-4 text-primary-500 dark:text-blue-400">
        Select Learning Options
      </h2>

      <!-- Learning language selection -->
      <div class="mb-4">
        <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-3">
          I want to learn in:
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="lang in learningLanguages"
            :key="lang"
            @click="selectLearning(lang)"
            :class="[
              'px-5 py-2 border-2 rounded-md font-semibold transition',
              selectedLearning === lang
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white dark:bg-gray-900 text-primary-500 dark:text-gray-200 border-primary-500 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700'
            ]">
            {{ formatLangName(lang) }}
          </button>
        </div>
      </div>

      <!-- Teaching topic selection -->
      <div class="mb-4">
        <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-3">
          What I want to learn:
        </label>
        <div v-if="teachingTopics.length > 0" class="flex flex-wrap gap-2">
          <div
            v-for="topic in teachingTopics"
            :key="topic"
            class="flex items-center gap-0">
            <button
              @click="selectTeaching(topic)"
              :class="[
                'px-5 py-2 border-2 font-semibold transition',
                isRemoteTopic(topic) ? 'rounded-l-md' : 'rounded-md',
                selectedTeaching === topic
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white dark:bg-gray-900 text-primary-500 dark:text-gray-200 border-primary-500 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700'
              ]">
              {{ formatLangName(topic) }}
            </button>
            <button
              v-if="isRemoteTopic(topic)"
              @click.stop="removeSource(topic)"
              class="px-2 py-2 border-2 border-l-0 border-red-400 rounded-r-md text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition text-sm"
              title="Remove external source">
              ✕
            </button>
          </div>
        </div>
        <p v-else class="text-gray-500 dark:text-gray-400">
          Select a learning language first
        </p>
      </div>

      <!-- Load lessons button -->
      <button
        @click="loadLessons"
        :disabled="!canLoadLessons"
        :class="[
          'px-8 py-4 rounded-lg text-lg font-semibold transition mt-2',
          canLoadLessons
            ? 'bg-green-500 text-white hover:bg-green-600 hover:-translate-y-0.5'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        ]">
        Load Lessons
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { formatLangName } from '../utils/formatters'

const router = useRouter()
const { availableContent, isLoading, loadAvailableContent, loadTopicsForLanguage, removeContentSource, isRemoteTopic, getSourceForSlug } = useLessons()

const selectedLearning = ref(null)
const selectedTeaching = ref(null)

const learningLanguages = computed(() => {
  return Object.keys(availableContent.value)
})

const teachingTopics = computed(() => {
  if (!selectedLearning.value) return []
  return Object.keys(availableContent.value[selectedLearning.value] || {})
})

const canLoadLessons = computed(() => {
  return selectedLearning.value && selectedTeaching.value
})

async function selectLearning(lang) {
  selectedLearning.value = lang
  selectedTeaching.value = null
  // Save to localStorage
  localStorage.setItem('lastLearningLanguage', lang)
  localStorage.removeItem('lastTeachingTopic')
  await loadTopicsForLanguage(lang)
}

function selectTeaching(topic) {
  selectedTeaching.value = topic
  // Save to localStorage
  localStorage.setItem('lastTeachingTopic', topic)
}

async function removeSource(topicSlug) {
  const sourceUrl = getSourceForSlug(topicSlug)
  if (sourceUrl) {
    removeContentSource(sourceUrl)
  }
  // Clear selection if removed topic was selected
  if (selectedTeaching.value === topicSlug) {
    selectedTeaching.value = null
    localStorage.removeItem('lastTeachingTopic')
  }
  // Reload content
  await loadAvailableContent()
  if (selectedLearning.value) {
    await loadTopicsForLanguage(selectedLearning.value)
  }
}

function loadLessons() {
  if (canLoadLessons.value) {
    router.push({
      name: 'lessons-overview',
      params: {
        learning: selectedLearning.value,
        teaching: selectedTeaching.value
      }
    })
  }
}

async function restorePreviousSelection() {
  const lastLearning = localStorage.getItem('lastLearningLanguage')
  const lastTeaching = localStorage.getItem('lastTeachingTopic')

  if (lastLearning && learningLanguages.value.includes(lastLearning)) {
    selectedLearning.value = lastLearning
    await loadTopicsForLanguage(lastLearning)

    if (lastTeaching && teachingTopics.value.includes(lastTeaching)) {
      selectedTeaching.value = lastTeaching
    }
  }
}

onMounted(async () => {
  await loadAvailableContent()
  await restorePreviousSelection()
})
</script>
