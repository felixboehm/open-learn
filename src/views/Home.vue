<template>
  <div>
    <!-- Loading state -->
    <Card v-if="isLoading" class="p-6 text-center">
      <CardContent class="p-0">
        <div class="text-2xl font-bold text-primary mb-4">
          Loading available content...
        </div>
        <div class="text-muted-foreground">
          Please wait while we load the lesson catalog.
        </div>
      </CardContent>
    </Card>

    <!-- Language selection -->
    <Card v-else class="p-6">
      <CardContent class="p-0">
        <h2 class="text-3xl font-bold mb-4 text-primary">
          Select Learning Options
        </h2>

        <!-- Learning language selection -->
        <div class="mb-4">
          <Label class="block font-semibold mb-3">
            I want to learn in:
          </Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="lang in learningLanguages"
              :key="lang"
              :variant="selectedLearning === lang ? 'default' : 'outline'"
              @click="selectLearning(lang)">
              {{ formatLangName(lang) }}
            </Button>
          </div>
        </div>

        <!-- Teaching topic selection -->
        <div class="mb-4">
          <Label class="block font-semibold mb-3">
            What I want to learn:
          </Label>
          <div v-if="teachingTopics.length > 0" class="flex flex-col gap-3">
            <Card
              v-for="topic in teachingTopics"
              :key="topic"
              @click="selectTeaching(topic)"
              :class="[
                'p-4 cursor-pointer transition',
                selectedTeaching === topic
                  ? 'ring-2 ring-primary bg-accent'
                  : 'hover:border-primary/50'
              ]">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-grow min-w-0">
                  <div class="font-semibold text-foreground">
                    {{ getTopicTitle(topic) }}
                  </div>
                  <div v-if="getTopicDescription(topic)" class="text-sm text-muted-foreground mt-1">
                    {{ getTopicDescription(topic) }}
                  </div>
                  <div v-if="isRemoteTopic(topic)" class="text-xs text-muted-foreground/60 mt-1">
                    {{ getTopicSourceLabel(topic) }}
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    @click.stop="copyWorkshopLink(topic)"
                    class="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-accent transition"
                    title="Copy link to workshop">
                    <span class="text-sm">{{ copiedTopic === topic ? '✓' : '🔗' }}</span>
                  </button>
                  <button
                    v-if="isRemoteTopic(topic)"
                    @click.stop="removeSource(topic)"
                    class="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition"
                    title="Remove external source">
                    <span class="text-sm">✕</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
          <p v-else class="text-muted-foreground">
            Select a learning language first
          </p>
        </div>

        <!-- Workshop discovery -->
        <div v-if="availableWorkshops.length > 0" class="mb-4">
          <Label class="block font-semibold mb-3">
            Discover Workshops
          </Label>
          <div class="flex flex-col gap-2">
            <Card
              v-for="workshop in availableWorkshops"
              :key="workshop.url"
              class="flex items-center justify-between p-3 border-dashed">
              <div>
                <div class="font-semibold text-foreground text-sm">{{ workshop.title }}</div>
                <div class="text-xs text-muted-foreground">{{ workshop.host }}</div>
              </div>
              <a
                :href="'#/add?source=' + encodeURIComponent(workshop.url)"
                class="px-3 py-1 rounded text-sm font-semibold text-primary border border-primary hover:bg-accent transition">
                Add
              </a>
            </Card>
          </div>
        </div>

        <!-- Load lessons button -->
        <Button
          @click="loadLessons"
          :disabled="!canLoadLessons"
          :class="[
            'mt-2 text-lg px-8 py-4 h-auto',
            canLoadLessons
              ? 'bg-green-500 hover:bg-green-600 text-white hover:-translate-y-0.5'
              : ''
          ]">
          Load Lessons
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

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
