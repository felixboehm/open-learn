<template>
  <div>
    <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <!-- Loading state -->
      <div v-if="isValidating" class="text-center">
        <div class="text-2xl font-bold text-primary-500 dark:text-blue-400 mb-4">
          Checking content source...
        </div>
        <div class="text-gray-600 dark:text-gray-400">
          {{ sourceUrl }}
        </div>
      </div>

      <!-- Already added -->
      <div v-else-if="alreadyAdded" class="text-center">
        <div class="text-2xl font-bold text-green-500 mb-4">
          Already Added
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          This content source is already in your library.
        </p>
        <button
          @click="goHome"
          class="px-8 py-4 rounded-lg text-lg font-semibold bg-primary-500 text-white hover:bg-primary-600 transition">
          Go to Home
        </button>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center">
        <div class="text-2xl font-bold text-red-500 mb-4">
          Could not load content source
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-2">{{ sourceUrl }}</p>
        <p class="text-red-400 mb-6">{{ error }}</p>
        <button
          @click="goHome"
          class="px-6 py-3 rounded-lg font-semibold bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition">
          Back to Home
        </button>
      </div>

      <!-- No URL provided -->
      <div v-else-if="!sourceUrl" class="text-center">
        <div class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          No content source URL provided
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Use a share link with <code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">?source=URL</code> to add external content.
        </p>
        <button
          @click="goHome"
          class="px-6 py-3 rounded-lg font-semibold bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition">
          Back to Home
        </button>
      </div>

      <!-- Confirmation -->
      <div v-else>
        <h2 class="text-3xl font-bold mb-4 text-primary-500 dark:text-blue-400">
          Add Content Source
        </h2>

        <div class="bg-white dark:bg-gray-900 p-4 rounded-lg mb-6">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Source URL</div>
          <div class="text-gray-800 dark:text-gray-200 font-mono text-sm break-all">
            {{ sourceUrl }}
          </div>
        </div>

        <!-- Discovered content -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Available Content
          </h3>
          <div v-for="(topics, lang) in discoveredContent" :key="lang" class="mb-3">
            <div class="font-semibold text-primary-500 dark:text-blue-400">
              {{ formatLangName(lang) }}
            </div>
            <div class="flex flex-wrap gap-2 mt-1">
              <span
                v-for="topic in topics"
                :key="topic"
                class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {{ formatTopicName(topic) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            @click="addSource"
            class="px-8 py-4 rounded-lg text-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition">
            Add
          </button>
          <button
            @click="goHome"
            class="px-8 py-4 rounded-lg text-lg font-semibold bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { formatLangName } from '../utils/formatters'
import yaml from 'js-yaml'

const router = useRouter()
const route = useRoute()
const { getContentSources, addContentSource } = useLessons()

const sourceUrl = ref(route.query.source || '')
const isValidating = ref(false)
const alreadyAdded = ref(false)
const error = ref(null)
const discoveredContent = ref({})

function formatTopicName(folderName) {
  return formatLangName(folderName)
}

function goHome() {
  router.push({ name: 'home' })
}

function addSource() {
  addContentSource(sourceUrl.value)
  router.push({ name: 'home' })
}

async function validateSource() {
  const url = sourceUrl.value
  if (!url) return

  // Check if already added
  if (getContentSources().includes(url)) {
    alreadyAdded.value = true
    return
  }

  isValidating.value = true
  error.value = null

  try {
    // Fetch languages.yaml from the source
    const response = await fetch(`${url}/languages.yaml`)
    if (!response.ok) {
      throw new Error(`Could not reach ${url}/languages.yaml (HTTP ${response.status})`)
    }

    const text = await response.text()
    const data = yaml.load(text)

    if (!data || !data.languages || data.languages.length === 0) {
      throw new Error('No languages found in the content source')
    }

    // Discover content structure
    const content = {}
    for (const lang of data.languages) {
      const langKey = typeof lang === 'string' ? lang : (lang.folder || lang.url)
      if (!langKey) continue

      try {
        const topicsResponse = await fetch(`${url}/${langKey}/topics.yaml`)
        if (!topicsResponse.ok) continue

        const topicsText = await topicsResponse.text()
        const topicsData = yaml.load(topicsText)

        if (topicsData && topicsData.topics) {
          content[langKey] = topicsData.topics.map(t =>
            typeof t === 'string' ? t : (t.folder || t.url || '')
          )
        }
      } catch {
        // Skip languages where topics can't be loaded
      }
    }

    if (Object.keys(content).length === 0) {
      throw new Error('No topics found in the content source')
    }

    discoveredContent.value = content
  } catch (e) {
    error.value = e.message
  } finally {
    isValidating.value = false
  }
}

onMounted(() => {
  validateSource()
})
</script>
