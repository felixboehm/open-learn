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

        <!-- Workshop selection -->
        <div class="mb-4">
          <Label class="block font-semibold mb-3">
            What I want to learn:
          </Label>
          <div v-if="workshops.length > 0" class="flex flex-col gap-3">
            <Card
              v-for="ws in workshops"
              :key="ws"
              @click="selectWorkshop(ws)"
              :class="[
                'p-4 cursor-pointer transition',
                selectedWorkshop === ws
                  ? 'ring-2 ring-primary bg-accent'
                  : 'hover:border-primary/50'
              ]">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-grow min-w-0">
                  <div class="font-semibold text-foreground">
                    {{ getWorkshopTitle(ws) }}
                  </div>
                  <div v-if="getWorkshopDescription(ws)" class="text-sm text-muted-foreground mt-1">
                    {{ getWorkshopDescription(ws) }}
                  </div>
                  <div v-if="isRemoteWorkshop(ws)" class="text-xs text-muted-foreground/60 mt-1">
                    {{ getWorkshopSourceLabel(ws) }}
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    @click.stop="copyWorkshopLink(ws)"
                    class="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-accent transition"
                    title="Copy link to workshop">
                    <span class="text-sm">{{ copiedWorkshop === ws ? '✓' : '🔗' }}</span>
                  </button>
                  <button
                    v-if="isRemoteWorkshop(ws)"
                    @click.stop="removeSource(ws)"
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
const { availableContent, isLoading, loadAvailableContent, loadWorkshopsForLanguage, removeContentSource, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta, getContentSources } = useLessons()

const selectedLearning = ref(null)
const selectedWorkshop = ref(null)
const copiedWorkshop = ref(null)

// Known workshops that can be discovered
const knownWorkshops = [
  { url: 'https://felixboehm.github.io/workshop-open-learn/index.yaml', title: 'Open Learn Workshop', host: 'felixboehm.github.io' },
  { url: 'https://felixboehm.github.io/workshop-english/index.yaml', title: 'Englisch lernen', host: 'felixboehm.github.io' }
]

const learningLanguages = computed(() => {
  return Object.keys(availableContent.value)
})

const workshops = computed(() => {
  if (!selectedLearning.value) return []
  return Object.keys(availableContent.value[selectedLearning.value] || {})
})

const canLoadLessons = computed(() => {
  return selectedLearning.value && selectedWorkshop.value
})

// Workshops not yet added by the user
const availableWorkshops = computed(() => {
  const sources = getContentSources()
  return knownWorkshops.filter(w => !sources.includes(w.url))
})

function getWorkshopTitle(workshop) {
  const meta = getWorkshopMeta(selectedLearning.value, workshop)
  return meta.title || formatLangName(workshop)
}

function getWorkshopDescription(workshop) {
  const meta = getWorkshopMeta(selectedLearning.value, workshop)
  return meta.description || null
}

function getWorkshopSourceLabel(workshop) {
  const sourceUrl = getSourceForSlug(workshop)
  if (!sourceUrl) return ''
  try {
    const url = new URL(sourceUrl)
    const path = url.pathname.replace(/\/index\.yaml$/, '')
    return url.hostname + path
  } catch {
    return sourceUrl
  }
}

async function copyWorkshopLink(workshop) {
  const base = window.location.href.replace(/#.*$/, '')
  const url = `${base}#/${selectedLearning.value}/${workshop}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copiedWorkshop.value = workshop
    setTimeout(() => { copiedWorkshop.value = null }, 2000)
  } catch {
    // Clipboard API not available
  }
}

async function selectLearning(lang) {
  selectedLearning.value = lang
  selectedWorkshop.value = null
  // Save to localStorage
  localStorage.setItem('lastLearningLanguage', lang)
  localStorage.removeItem('lastWorkshop')
  await loadWorkshopsForLanguage(lang)
}

function selectWorkshop(workshop) {
  selectedWorkshop.value = workshop
  // Save to localStorage
  localStorage.setItem('lastWorkshop', workshop)
}

async function removeSource(workshopSlug) {
  const sourceUrl = getSourceForSlug(workshopSlug)
  if (sourceUrl) {
    removeContentSource(sourceUrl)
  }
  // Clear selection if removed workshop was selected
  if (selectedWorkshop.value === workshopSlug) {
    selectedWorkshop.value = null
    localStorage.removeItem('lastWorkshop')
  }
  // Reload content
  await loadAvailableContent()
  if (selectedLearning.value) {
    await loadWorkshopsForLanguage(selectedLearning.value)
  }
}

function loadLessons() {
  if (canLoadLessons.value) {
    router.push({
      name: 'lessons-overview',
      params: {
        learning: selectedLearning.value,
        workshop: selectedWorkshop.value
      }
    })
  }
}

async function restorePreviousSelection() {
  const lastLearning = localStorage.getItem('lastLearningLanguage')
  const lastTeaching = localStorage.getItem('lastWorkshop')

  if (lastLearning && learningLanguages.value.includes(lastLearning)) {
    selectedLearning.value = lastLearning
    await loadWorkshopsForLanguage(lastLearning)

    if (lastTeaching && workshops.value.includes(lastTeaching)) {
      selectedWorkshop.value = lastTeaching
    }
  }
}

onMounted(async () => {
  await loadAvailableContent()
  await restorePreviousSelection()
})
</script>
