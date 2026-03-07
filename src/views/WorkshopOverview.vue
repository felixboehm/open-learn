<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <div v-else>
      <!-- Workshop count -->
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium text-muted-foreground">
          {{ t('workshops') }}
        </label>
        <span class="text-xs text-muted-foreground">
          {{ workshops.length }} {{ workshops.length === 1 ? 'Workshop' : 'Workshops' }}
        </span>
      </div>

      <!-- Workshop cards grid -->
      <div v-if="workshops.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="ws in visibleWorkshops"
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
                <span v-if="isRemoteWorkshop(ws)" class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform" title="Opens external website">
                  ↗
                </span>
                <span v-else class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- No workshops -->
      <p v-else class="text-muted-foreground text-center py-8">
        {{ t('noWorkshops') }}
      </p>

      <!-- Show more button -->
      <div v-if="workshops.length > maxVisible && !showAll" class="mt-4 text-center">
        <button
          @click="showAll = true"
          class="px-6 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition">
          {{ t('showAll') }} ({{ workshops.length - maxVisible }} {{ t('more') }})
        </button>
      </div>

      <!-- Workshop discovery -->
      <div v-if="availableWorkshops.length > 0" class="mt-6">
        <label class="block text-sm font-medium text-muted-foreground mb-3">
          {{ t('discover') }}
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
            :href="'#/' + learning + '/open-learn-guide/lessons'"
            class="text-primary hover:underline">
            {{ t('guide') }}
          </a>
          <a
            :href="'#/' + learning + '/open-learn-feedback/lessons'"
            class="text-primary hover:underline">
            {{ t('feedback') }}
          </a>
          <a
            href="https://github.com/felixboehm/open-learn/issues"
            target="_blank"
            rel="noopener"
            class="text-primary hover:underline">
            {{ t('bugReport') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import { Card } from '@/components/ui/card'

const emit = defineEmits(['update-title'])
const router = useRouter()
const route = useRoute()

const { availableContent, isLoading, loadAvailableContent, loadWorkshopsForLanguage, removeContentSource, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta, getContentSources } = useLessons()
const { selectedLanguage, setLanguage } = useLanguage()

const copiedWorkshop = ref(null)
const showAll = ref(false)
const maxVisible = 6

const knownWorkshops = []

const learning = computed(() => route.params.learning)
const isDE = computed(() => learning.value === 'deutsch')

function t(key) {
  const strings = {
    workshops: isDE.value ? 'Workshops' : 'Workshops',
    noWorkshops: isDE.value ? 'Keine Workshops verfügbar.' : 'No workshops available.',
    showAll: isDE.value ? 'Alle anzeigen' : 'Show all',
    more: isDE.value ? 'weitere' : 'more',
    discover: isDE.value ? 'Workshops entdecken' : 'Discover Workshops',
    guide: isDE.value ? 'Anleitung & Erste Schritte' : 'Guide & First Steps',
    feedback: isDE.value ? 'Feedback geben' : 'Give Feedback',
    bugReport: isDE.value ? 'Fehler melden' : 'Report a Bug',
  }
  return strings[key] || key
}

const workshops = computed(() => {
  if (!learning.value) return []
  return Object.keys(availableContent.value[learning.value] || {})
})

const visibleWorkshops = computed(() => {
  if (showAll.value) return workshops.value
  return workshops.value.slice(0, maxVisible)
})

const availableWorkshops = computed(() => {
  const sources = getContentSources()
  return knownWorkshops.filter(w => !sources.includes(w.url))
})

watch(learning, () => {
  showAll.value = false
})

function getWorkshopTitle(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  return meta.title || formatLangName(workshop)
}

function getWorkshopDescription(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
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
  const url = `${base}#/${learning.value}/${workshop}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copiedWorkshop.value = workshop
    setTimeout(() => { copiedWorkshop.value = null }, 2000)
  } catch {
    // Clipboard API not available
  }
}

function getWorkshopWebsite(workshop) {
  const sourceUrl = getSourceForSlug(workshop)
  if (!sourceUrl) return null
  try {
    const url = new URL(sourceUrl)
    url.pathname = url.pathname.replace(/\/index\.yaml$/, '/')
    return url.toString()
  } catch {
    return null
  }
}

function openWorkshop(workshop) {
  if (isRemoteWorkshop(workshop)) {
    const website = getWorkshopWebsite(workshop)
    if (website) {
      window.open(website, '_blank', 'noopener')
      return
    }
  }
  localStorage.setItem('lastWorkshop', workshop)
  router.push({
    name: 'lessons-overview',
    params: { learning: learning.value, workshop }
  })
}

async function removeSource(workshopSlug) {
  const sourceUrl = getSourceForSlug(workshopSlug)
  if (sourceUrl) {
    removeContentSource(sourceUrl)
  }
  await loadAvailableContent()
  if (learning.value) {
    await loadWorkshopsForLanguage(learning.value)
  }
}

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
  // Sync language state with route param
  if (learning.value && learning.value !== selectedLanguage.value) {
    setLanguage(learning.value)
  }
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
  if (learning.value) {
    await loadWorkshopsForLanguage(learning.value)
  }
  emit('update-title', 'Workshops')
})
</script>
