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

    <!-- Intro + Language selection -->
    <Card v-else class="p-6">
      <CardContent class="p-0">

        <!-- Intro section for new users -->
        <div v-if="!selectedLearning" class="mb-8">
          <h2 class="text-3xl font-bold mb-3 text-primary">
            Open Learn
          </h2>
          <p class="text-muted-foreground mb-4 leading-relaxed">
            A free, open-source learning platform. No ads, no tracking, no account required.
            Your progress is saved in your browser.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold text-lg leading-none mt-0.5">+</span>
              <span class="text-sm text-foreground">Videos, quizzes, Q&amp;A cards and audio</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold text-lg leading-none mt-0.5">+</span>
              <span class="text-sm text-foreground">Create and share your own workshops</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold text-lg leading-none mt-0.5">+</span>
              <span class="text-sm text-foreground">Works offline — no backend needed</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold text-lg leading-none mt-0.5">+</span>
              <span class="text-sm text-foreground">Load external content from any URL</span>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">
            Select your language below to get started.
          </p>
        </div>

        <!-- Intro section (German) -->
        <div v-if="selectedLearning === 'deutsch'" class="mb-6 p-4 rounded-lg bg-accent/50">
          <h3 class="font-semibold text-foreground mb-2">Willkommen bei Open Learn</h3>
          <p class="text-sm text-muted-foreground mb-2">
            Eine kostenlose, offene Lernplattform. Keine Werbung, kein Tracking, kein Konto nötig.
            Dein Fortschritt wird im Browser gespeichert.
          </p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>+ Videos, Quizze &amp; Audio</span>
            <span>+ Eigene Workshops erstellen</span>
            <span>+ Offline-fähig</span>
            <span>+ Externe Inhalte laden</span>
          </div>
        </div>

        <!-- Intro section (English) -->
        <div v-if="selectedLearning === 'english'" class="mb-6 p-4 rounded-lg bg-accent/50">
          <h3 class="font-semibold text-foreground mb-2">Welcome to Open Learn</h3>
          <p class="text-sm text-muted-foreground mb-2">
            A free, open-source learning platform. No ads, no tracking, no account required.
            Your progress is saved in your browser.
          </p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>+ Videos, quizzes &amp; audio</span>
            <span>+ Create your own workshops</span>
            <span>+ Works offline</span>
            <span>+ Load external content</span>
          </div>
        </div>

        <h2 class="text-3xl font-bold mb-4 text-primary">
          {{ selectedLearning === 'deutsch' ? 'Lernoptionen auswählen' : 'Select Learning Options' }}
        </h2>

        <!-- Learning language selection -->
        <div class="mb-4">
          <Label class="block font-semibold mb-3">
            {{ selectedLearning === 'deutsch' ? 'Ich möchte lernen auf:' : 'I want to learn in:' }}
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
            {{ selectedLearning === 'deutsch' ? 'Was ich lernen möchte:' : 'What I want to learn:' }}
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
          {{ selectedLearning === 'deutsch' ? 'Lektionen laden' : 'Load Lessons' }}
        </Button>

        <!-- Info links -->
        <div v-if="selectedLearning" class="mt-6 pt-4 border-t border-border">
          <div class="flex flex-wrap gap-4 text-sm">
            <a
              :href="'#/' + selectedLearning + '/open-learn-guide/lessons'"
              class="text-primary hover:underline">
              {{ selectedLearning === 'deutsch' ? 'Anleitung &amp; Erste Schritte' : 'Guide &amp; First Steps' }}
            </a>
            <a
              :href="'#/' + selectedLearning + '/open-learn-feedback/lessons'"
              class="text-primary hover:underline">
              {{ selectedLearning === 'deutsch' ? 'Feedback geben' : 'Give Feedback' }}
            </a>
            <a
              href="https://github.com/felixboehm/open-learn/issues"
              target="_blank"
              rel="noopener"
              class="text-primary hover:underline">
              {{ selectedLearning === 'deutsch' ? 'Fehler melden' : 'Report a Bug' }}
            </a>
          </div>
        </div>
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
const knownWorkshops = []

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

// Remove legacy external sources that are now replaced by local workshops
function cleanupLegacySources() {
  const legacyUrls = [
    'https://felixboehm.github.io/workshop-open-learn/index.yaml',
    'https://felixboehm.github.io/workshop-english/index.yaml'
  ]
  const sources = getContentSources()
  const cleaned = sources.filter(s => !legacyUrls.includes(s))
  if (cleaned.length !== sources.length) {
    localStorage.setItem('contentSources', JSON.stringify(cleaned))
  }
}

onMounted(async () => {
  cleanupLegacySources()
  await loadAvailableContent()
  await restorePreviousSelection()
})
</script>
