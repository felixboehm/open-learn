<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">{{ $t('home.loading') }}</p>
    </div>

    <div v-else>

      <!-- Hero section -->
      <div class="mb-10">
        <h2 class="text-3xl sm:text-4xl font-extrabold mb-3 text-foreground leading-tight">
          {{ $t('home.title') }}
        </h2>
        <p class="text-base text-muted-foreground leading-relaxed max-w-2xl">
          {{ $t('home.subtitle') }}
        </p>

        <!-- Getting started hint (when no language selected) -->
        <div v-if="!selectedLanguage" class="mt-5 flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <span class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </span>
          <div>
            <p class="text-sm font-medium text-foreground">{{ $t('home.getStartedTitle') }}</p>
            <p class="text-sm text-muted-foreground">{{ $t('home.getStartedDesc') }}</p>
          </div>
        </div>
      </div>

      <!-- Workshops section (when language selected) -->
      <div v-if="selectedLanguage && workshops.length > 0" class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-foreground">{{ $t('home.workshops') }}</h3>
          <span class="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full">
            {{ workshops.length }} {{ workshops.length === 1 ? $t('home.workshop') : $t('home.workshopPlural') }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="ws in visibleWorkshops"
            :key="ws"
            @click="openWorkshop(ws)"
            class="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50 overflow-hidden">

            <div class="h-1 bg-primary"></div>

            <div class="p-5">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-semibold text-foreground text-base group-hover:text-primary transition-colors leading-tight">
                  {{ getWorkshopTitle(ws) }}
                </h3>
                <button
                  @click.stop="copyWorkshopLink(ws)"
                  class="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-accent transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                  :title="$t('home.copyLink')">
                  <svg v-if="copiedWorkshop !== ws" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
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
                    :title="$t('home.remove')">
                    {{ $t('home.remove') }}
                  </button>
                  <span v-if="isRemoteWorkshop(ws)" class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform">&#8599;</span>
                  <span v-else class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Show more button -->
        <div v-if="workshops.length > maxVisible && !showAll" class="mt-4 text-center">
          <button
            @click="showAll = true"
            class="px-6 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-full hover:bg-primary/5 transition">
            {{ $t('home.showAll') }} ({{ workshops.length - maxVisible }} {{ $t('home.more') }})
          </button>
        </div>

        <!-- Workshop discovery -->
        <div v-if="availableWorkshops.length > 0" class="mt-6">
          <label class="block text-sm font-medium text-muted-foreground mb-3">
            {{ $t('home.discover') }}
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
                class="px-3 py-1 rounded-full text-sm font-semibold text-primary border border-primary hover:bg-accent transition">
                {{ $t('home.add') }}
              </a>
            </Card>
          </div>
        </div>

        <!-- Info links -->
        <div class="mt-6 flex flex-wrap gap-4 text-sm">
          <a :href="'#/' + selectedLanguage + '/open-learn-guide/lessons'" class="text-primary hover:underline">
            {{ $t('home.guide') }}
          </a>
          <a :href="'#/' + selectedLanguage + '/open-learn-feedback/lessons'" class="text-primary hover:underline">
            {{ $t('home.feedback') }}
          </a>
          <a href="https://github.com/felixboehm/open-learn/issues" target="_blank" rel="noopener" class="text-primary hover:underline">
            {{ $t('home.bugReport') }}
          </a>
        </div>
      </div>

      <!-- How it works -->
      <div class="mb-10">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ $t('home.howItWorks') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="(step, i) in steps" :key="i" class="text-center p-5 rounded-xl bg-accent/30">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
              {{ i + 1 }}
            </div>
            <div class="text-sm font-semibold text-foreground mb-1">{{ step.title }}</div>
            <div class="text-xs text-muted-foreground leading-relaxed">{{ step.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Feature highlights -->
      <div class="mb-10">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="feature in features" :key="feature.key"
            class="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition">
            <span class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg flex-shrink-0">
              {{ feature.icon }}
            </span>
            <div>
              <div class="text-sm font-semibold text-foreground">{{ feature.title }}</div>
              <div class="text-xs text-muted-foreground leading-relaxed">{{ feature.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- What you can learn -->
      <div class="mb-10">
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('home.whatYouCanLearn') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ $t('home.whatYouCanLearnDesc') }}</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="example in useCaseExamples" :key="example.key"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/40 text-sm text-foreground">
            <span>{{ example.icon }}</span>
            <span class="text-xs font-medium">{{ example.label }}</span>
          </span>
        </div>
      </div>

      <!-- Built-in tools -->
      <div class="mb-10">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ $t('home.builtInTools') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="tool in tools" :key="tool.key" class="p-4 rounded-xl border border-border">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg">{{ tool.icon }}</span>
              <span class="text-sm font-semibold text-foreground">{{ tool.title }}</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ tool.desc }}</p>
          </div>
        </div>
      </div>

      <!-- For creators -->
      <div class="mb-10">
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('home.forCreators') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ $t('home.forCreatorsDesc') }}</p>
        <div class="p-4 rounded-xl bg-accent/30 font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto" dir="ltr">
          <div>sections:</div>
          <div class="pl-4">- title: "{{ $t('home.yamlExampleTitle') }}"</div>
          <div class="pl-6">explanation: |</div>
          <div class="pl-8">{{ $t('home.yamlExampleExplanation') }}</div>
          <div class="pl-6">video: "https://..."</div>
          <div class="pl-6">examples:</div>
          <div class="pl-8">- q: "{{ $t('home.yamlExampleQ') }}"</div>
          <div class="pl-10">a: "{{ $t('home.yamlExampleA') }}"</div>
          <div class="pl-10">type: select</div>
        </div>
      </div>

      <!-- Privacy & Roadmap side by side on desktop -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

        <!-- Privacy & ownership -->
        <div>
          <h3 class="text-lg font-semibold text-foreground mb-4">{{ $t('home.privacyTitle') }}</h3>
          <div class="space-y-3">
            <div v-for="item in privacyPoints" :key="item.key" class="p-3 rounded-xl bg-accent/20">
              <div class="text-sm font-semibold text-foreground mb-1">{{ item.title }}</div>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Roadmap -->
        <div>
          <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('home.roadmapTitle') }}</h3>
          <p class="text-xs text-muted-foreground mb-4">{{ $t('home.roadmapDesc') }}</p>
          <div class="space-y-2">
            <div v-for="item in roadmapItems" :key="item.key"
              class="flex items-start gap-3 p-3 rounded-xl border border-border">
              <span class="text-base mt-0.5">{{ item.icon }}</span>
              <div class="flex-grow min-w-0">
                <div class="text-sm font-medium text-foreground">{{ item.title }}</div>
                <p class="text-xs text-muted-foreground leading-relaxed">{{ item.desc }}</p>
              </div>
              <a v-if="item.issue"
                :href="'https://github.com/felixboehm/open-learn/issues/' + item.issue"
                target="_blank" rel="noopener"
                class="text-xs text-primary hover:underline flex-shrink-0"
                @click.stop>
                #{{ item.issue }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Open source CTA -->
      <div class="mb-6 p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center">
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('home.openSourceTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">{{ $t('home.openSourceDesc') }}</p>
        <a href="https://github.com/felixboehm/open-learn"
          target="_blank" rel="noopener"
          class="inline-block px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition">
          {{ $t('home.viewOnGitHub') }}
        </a>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import { Card } from '@/components/ui/card'

const router = useRouter()
const { t } = useI18n()
const { availableContent, isLoading, loadAvailableContent, loadWorkshopsForLanguage, removeContentSource, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta, getContentSources } = useLessons()
const { selectedLanguage } = useLanguage()

const copiedWorkshop = ref(null)
const showAll = ref(false)
const maxVisible = 4

const knownWorkshops = []

const features = computed(() => [
  { key: 'any', icon: '🎯', title: t('home.features.anySubject'), desc: t('home.features.anySubjectDesc') },
  { key: 'rich', icon: '🎬', title: t('home.features.richExperience'), desc: t('home.features.richExperienceDesc') },
  { key: 'create', icon: '✏️', title: t('home.features.yourContent'), desc: t('home.features.yourContentDesc') },
  { key: 'infra', icon: '🔒', title: t('home.features.zeroInfra'), desc: t('home.features.zeroInfraDesc') },
])

const steps = computed(() => [
  { title: t('home.steps.pickLang'), desc: t('home.steps.pickLangDesc') },
  { title: t('home.steps.startWorkshop'), desc: t('home.steps.startWorkshopDesc') },
  { title: t('home.steps.learnTrack'), desc: t('home.steps.learnTrackDesc') },
])

const useCaseExamples = computed(() => [
  { key: 'lang', icon: '🌍', label: t('home.useCases.languages') },
  { key: 'math', icon: '🧮', label: t('home.useCases.math') },
  { key: 'drive', icon: '🚗', label: t('home.useCases.driving') },
  { key: 'music', icon: '🎵', label: t('home.useCases.music') },
  { key: 'code', icon: '💻', label: t('home.useCases.coding') },
  { key: 'science', icon: '🔬', label: t('home.useCases.science') },
  { key: 'history', icon: '📜', label: t('home.useCases.history') },
  { key: 'med', icon: '🏥', label: t('home.useCases.medicine') },
  { key: 'law', icon: '⚖️', label: t('home.useCases.law') },
])

const tools = computed(() => [
  { key: 'quiz', icon: '✅', title: t('home.tools.assessments'), desc: t('home.tools.assessmentsDesc') },
  { key: 'audio', icon: '🔊', title: t('home.tools.audio'), desc: t('home.tools.audioDesc') },
  { key: 'video', icon: '🎬', title: t('home.tools.video'), desc: t('home.tools.videoDesc') },
  { key: 'progress', icon: '📊', title: t('home.tools.progress'), desc: t('home.tools.progressDesc') },
  { key: 'coach', icon: '🎓', title: t('home.tools.coach'), desc: t('home.tools.coachDesc') },
  { key: 'sync', icon: '🔄', title: t('home.tools.sync'), desc: t('home.tools.syncDesc') },
])

const privacyPoints = computed(() => [
  { key: 'local', title: t('home.privacy.local'), desc: t('home.privacy.localDesc') },
  { key: 'notrack', title: t('home.privacy.noTracking'), desc: t('home.privacy.noTrackingDesc') },
  { key: 'export', title: t('home.privacy.yourData'), desc: t('home.privacy.yourDataDesc') },
])

const roadmapItems = computed(() => [
  { key: 'coach', icon: '🤖', title: t('home.roadmap.aiCoach'), desc: t('home.roadmap.aiCoachDesc'), issue: 45 },
  { key: 'kids', icon: '🧒', title: t('home.roadmap.kidsMode'), desc: t('home.roadmap.kidsModeDesc'), issue: 46 },
  { key: 'images', icon: '🖼️', title: t('home.roadmap.images'), desc: t('home.roadmap.imagesDesc'), issue: 47 },
  { key: 'i18n', icon: '🌐', title: t('home.roadmap.i18n'), desc: t('home.roadmap.i18nDesc'), issue: 44 },
  { key: 'upload', icon: '📄', title: t('home.roadmap.uploads'), desc: t('home.roadmap.uploadsDesc'), issue: 51 },
])

const workshops = computed(() => {
  if (!selectedLanguage.value) return []
  return Object.keys(availableContent.value[selectedLanguage.value] || {})
})

const visibleWorkshops = computed(() => {
  if (showAll.value) return workshops.value
  return workshops.value.slice(0, maxVisible)
})

const availableWorkshops = computed(() => {
  const sources = getContentSources()
  return knownWorkshops.filter(w => !sources.includes(w.url))
})

// Reset showAll when language changes
watch(selectedLanguage, () => {
  showAll.value = false
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
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
  if (selectedLanguage.value) {
    await loadWorkshopsForLanguage(selectedLanguage.value)
  }
})
</script>
