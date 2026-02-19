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
        <div v-if="teachingTopics.length > 0" class="flex flex-col gap-3">
          <div
            v-for="topic in teachingTopics"
            :key="topic"
            @click="selectTeaching(topic)"
            :class="[
              'p-4 rounded-lg border-2 cursor-pointer transition',
              selectedTeaching === topic
                ? 'border-primary-500 bg-blue-50 dark:bg-gray-700'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-gray-500'
            ]">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-grow min-w-0">
                <div class="font-semibold text-gray-800 dark:text-gray-200">
                  {{ getTopicTitle(topic) }}
                </div>
                <div v-if="getTopicDescription(topic)" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ getTopicDescription(topic) }}
                </div>
                <div v-if="isRemoteTopic(topic)" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ getTopicSourceLabel(topic) }}
                </div>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  @click.stop="copyWorkshopLink(topic)"
                  class="p-1.5 rounded text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  title="Copy link to workshop">
                  <span class="text-sm">{{ copiedTopic === topic ? '✓' : '🔗' }}</span>
                </button>
                <button
                  v-if="isRemoteTopic(topic)"
                  @click.stop="removeSource(topic)"
                  class="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition"
                  title="Remove external source">
                  <span class="text-sm">✕</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500 dark:text-gray-400">
          Select a learning language first
        </p>
      </div>

      <!-- Workshop discovery -->
      <div v-if="availableWorkshops.length > 0" class="mb-4">
        <label class="block font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Discover Workshops
        </label>
        <div class="flex flex-col gap-2">
          <div
            v-for="workshop in availableWorkshops"
            :key="workshop.url"
            class="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
            <div>
              <div class="font-semibold text-gray-800 dark:text-gray-200 text-sm">{{ workshop.title }}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500">{{ workshop.host }}</div>
            </div>
            <a
              :href="'#/add?source=' + encodeURIComponent(workshop.url)"
              class="px-3 py-1 rounded text-sm font-semibold text-primary-500 border border-primary-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition">
              Add
            </a>
          </div>
        </div>
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
const { availableContent, isLoading, loadAvailableContent, loadTopicsForLanguage, removeContentSource, isRemoteTopic, getSourceForSlug, getTopicMeta, getContentSources } = useLessons()

const selectedLearning = ref(null)
const selectedTeaching = ref(null)
const copiedTopic = ref(null)

// Known workshops that can be discovered
const knownWorkshops = [
  { url: 'https://felixboehm.github.io/workshop-open-learn/index.yaml', title: 'Open Learn Workshop', host: 'felixboehm.github.io' },
  { url: 'https://felixboehm.github.io/workshop-english/index.yaml', title: 'Englisch lernen', host: 'felixboehm.github.io' }
]

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

// Workshops not yet added by the user
const availableWorkshops = computed(() => {
  const sources = getContentSources()
  return knownWorkshops.filter(w => !sources.includes(w.url))
})

function getTopicTitle(topic) {
  const meta = getTopicMeta(selectedLearning.value, topic)
  return meta.title || formatLangName(topic)
}

function getTopicDescription(topic) {
  const meta = getTopicMeta(selectedLearning.value, topic)
  return meta.description || null
}

function getTopicSourceLabel(topic) {
  const sourceUrl = getSourceForSlug(topic)
  if (!sourceUrl) return ''
  try {
    const url = new URL(sourceUrl)
    const path = url.pathname.replace(/\/index\.yaml$/, '')
    return url.hostname + path
  } catch {
    return sourceUrl
  }
}

async function copyWorkshopLink(topic) {
  const base = window.location.href.replace(/#.*$/, '')
  const url = `${base}#/${selectedLearning.value}/${topic}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copiedTopic.value = topic
    setTimeout(() => { copiedTopic.value = null }, 2000)
  } catch {
    // Clipboard API not available
  }
}

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
