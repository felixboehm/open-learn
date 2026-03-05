<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <div v-else>
      <!-- Hero section (only when no language selected yet) -->
      <div v-if="!selectedLanguage" class="mb-8">
        <h2 class="text-3xl font-bold mb-3 text-primary">
          Open Learn
        </h2>
        <p class="text-muted-foreground mb-6 leading-relaxed">
          A free, open-source learning platform. No ads, no tracking, no account required.
          Your progress is saved in your browser.
        </p>
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="flex items-center gap-2 text-sm text-foreground">
            <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Videos, quizzes &amp; audio
          </div>
          <div class="flex items-center gap-2 text-sm text-foreground">
            <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Create your own workshops
          </div>
          <div class="flex items-center gap-2 text-sm text-foreground">
            <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Works offline
          </div>
          <div class="flex items-center gap-2 text-sm text-foreground">
            <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Load external content
          </div>
        </div>
        <p class="text-sm text-muted-foreground">
          Select your language in the top-left dropdown to get started.
        </p>
      </div>

      <!-- Language-specific welcome (compact, shown after selection) -->
      <div v-if="selectedLanguage === 'deutsch'" class="mb-6 p-4 rounded-lg bg-accent/50">
        <h3 class="font-semibold text-foreground mb-1">Willkommen bei Open Learn</h3>
        <p class="text-sm text-muted-foreground">
          Eine kostenlose, offene Lernplattform. Keine Werbung, kein Tracking, kein Konto nötig.
        </p>
      </div>
      <div v-else-if="selectedLanguage === 'english'" class="mb-6 p-4 rounded-lg bg-accent/50">
        <h3 class="font-semibold text-foreground mb-1">Welcome to Open Learn</h3>
        <p class="text-sm text-muted-foreground">
          A free, open-source learning platform. No ads, no tracking, no account required.
        </p>
      </div>

      <!-- Workshops as tiles -->
      <div v-if="selectedLanguage">
        <label class="block text-sm font-medium text-muted-foreground mb-3">
          {{ selectedLanguage === 'deutsch' ? 'Workshops' : 'Workshops' }}
        </label>

        <div v-if="workshops.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="ws in workshops"
            :key="ws"
            @click="openWorkshop(ws)"
            class="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50 overflow-hidden">

            <!-- Color accent bar at top -->
            <div class="h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

            <div class="p-5">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-semibold text-foreground text-lg group-hover:text-primary transition-colors leading-tight">
                  {{ getWorkshopTitle(ws) }}
                </h3>
                <button
                  @click.stop="copyWorkshopLink(ws)"
                  class="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-accent transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Copy link">
                  <svg v-if="copiedWorkshop !== ws" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>

              <p v-if="getWorkshopDescription(ws)" class="text-sm text-muted-foreground leading-relaxed mb-3">
                {{ getWorkshopDescription(ws) }}
              </p>

              <div class="flex items-center justify-between">
                <span v-if="isRemoteWorkshop(ws)" class="text-xs text-muted-foreground/50 truncate max-w-[60%]">
                  {{ getWorkshopSourceLabel(ws) }}
                </span>
                <span v-else></span>

                <div class="flex items-center gap-1">
                  <button
                    v-if="isRemoteWorkshop(ws)"
                    @click.stop="removeSource(ws)"
                    class="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition text-xs"
                    title="Remove">
                    Remove
                  </button>
                  <span class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <p v-else class="text-muted-foreground text-sm py-4">
          {{ selectedLanguage === 'deutsch' ? 'Keine Workshops verfügbar.' : 'No workshops available.' }}
        </p>

        <!-- Workshop discovery -->
        <div v-if="availableWorkshops.length > 0" class="mt-6">
          <label class="block text-sm font-medium text-muted-foreground mb-3">
            Discover Workshops
          </label>
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

        <!-- Info links -->
        <div class="mt-8 pt-4 border-t border-border">
          <div class="flex flex-wrap gap-4 text-sm">
            <a
              :href="'#/' + selectedLanguage + '/open-learn-guide/lessons'"
              class="text-primary hover:underline">
              {{ selectedLanguage === 'deutsch' ? 'Anleitung & Erste Schritte' : 'Guide & First Steps' }}
            </a>
            <a
              :href="'#/' + selectedLanguage + '/open-learn-feedback/lessons'"
              class="text-primary hover:underline">
              {{ selectedLanguage === 'deutsch' ? 'Feedback geben' : 'Give Feedback' }}
            </a>
            <a
              href="https://github.com/felixboehm/open-learn/issues"
              target="_blank"
              rel="noopener"
              class="text-primary hover:underline">
              {{ selectedLanguage === 'deutsch' ? 'Fehler melden' : 'Report a Bug' }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import { Card } from '@/components/ui/card'

const router = useRouter()
const { availableContent, isLoading, loadAvailableContent, loadWorkshopsForLanguage, removeContentSource, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta, getContentSources } = useLessons()
const { selectedLanguage } = useLanguage()

const copiedWorkshop = ref(null)

// Known workshops that can be discovered
const knownWorkshops = []

const workshops = computed(() => {
  if (!selectedLanguage.value) return []
  return Object.keys(availableContent.value[selectedLanguage.value] || {})
})

// Workshops not yet added by the user
const availableWorkshops = computed(() => {
  const sources = getContentSources()
  return knownWorkshops.filter(w => !sources.includes(w.url))
})

function getWorkshopTitle(workshop) {
  const meta = getWorkshopMeta(selectedLanguage.value, workshop)
  return meta.title || formatLangName(workshop)
}

function getWorkshopDescription(workshop) {
  const meta = getWorkshopMeta(selectedLanguage.value, workshop)
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
  const url = `${base}#/${selectedLanguage.value}/${workshop}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copiedWorkshop.value = workshop
    setTimeout(() => { copiedWorkshop.value = null }, 2000)
  } catch {
    // Clipboard API not available
  }
}

// Navigate directly to the workshop
function openWorkshop(workshop) {
  localStorage.setItem('lastWorkshop', workshop)
  router.push({
    name: 'lessons-overview',
    params: {
      learning: selectedLanguage.value,
      workshop: workshop
    }
  })
}

async function removeSource(workshopSlug) {
  const sourceUrl = getSourceForSlug(workshopSlug)
  if (sourceUrl) {
    removeContentSource(sourceUrl)
  }
  await loadAvailableContent()
  if (selectedLanguage.value) {
    await loadWorkshopsForLanguage(selectedLanguage.value)
  }
}

// Remove legacy external sources
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
  // Content is loaded by App.vue — just wait for it
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
})
</script>
