<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <div v-else>
      <!-- Hero section -->
      <div class="mb-8">
        <p class="text-sm font-semibold text-primary mb-1 tracking-wide uppercase">Open Learn</p>
        <h2 class="text-3xl font-bold mb-2 text-foreground">
          {{ t('title') }}
        </h2>
        <p class="text-muted-foreground mb-5 leading-relaxed">
          {{ t('subtitle') }}
        </p>

        <!-- Feature highlights -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div v-for="feature in features" :key="feature.key"
            class="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
            <span class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base flex-shrink-0">
              {{ feature.icon }}
            </span>
            <div>
              <div class="text-sm font-medium text-foreground">{{ feature.title }}</div>
              <div class="text-xs text-muted-foreground">{{ feature.desc }}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- How it works (with integrated language selector as step 1) -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('howItWorks') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Step 1: Pick a language (interactive dropdown) -->
          <div class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
              1
            </div>
            <div class="text-sm font-medium text-foreground mb-2">{{ steps[0].title }}</div>
            <div class="text-xs text-muted-foreground mb-3">{{ steps[0].desc }}</div>
            <div class="relative inline-block">
              <button
                @click="showLanguageMenu = !showLanguageMenu"
                class="flex items-center gap-1.5 bg-primary text-white font-medium text-sm rounded-full px-4 py-2 cursor-pointer hover:bg-primary/90 transition">
                <span class="text-base leading-none">{{ getFlag(currentLanguage) }}</span>
                <span>{{ formatLangName(currentLanguage) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div
                v-if="showLanguageMenu"
                class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden min-w-[160px] z-[100]">
                <button
                  v-for="lang in learningLanguages"
                  :key="lang"
                  @click="goToWorkshops(lang)"
                  :class="[
                    'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition',
                    currentLanguage === lang ? 'bg-accent font-medium' : ''
                  ]">
                  <span class="text-base leading-none">{{ getFlag(lang) }}</span>
                  <span>{{ formatLangName(lang) }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Steps 2 & 3 -->
          <div v-for="(step, i) in steps.slice(1)" :key="i + 1" class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
              {{ i + 2 }}
            </div>
            <div class="text-sm font-medium text-foreground mb-1">{{ step.title }}</div>
            <div class="text-xs text-muted-foreground">{{ step.desc }}</div>
          </div>
        </div>
      </div>

      <!-- What you can learn -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('whatYouCanLearn') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ t('whatYouCanLearnDesc') }}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-for="example in useCaseExamples" :key="example.key"
            class="flex items-center gap-2 p-2 rounded-md bg-accent/20 text-sm">
            <span class="text-base">{{ example.icon }}</span>
            <span class="text-foreground text-xs">{{ example.label }}</span>
          </div>
        </div>
      </div>

      <!-- Built-in tools -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('builtInTools') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="tool in tools" :key="tool.key" class="p-3 rounded-lg border border-border">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-base">{{ tool.icon }}</span>
              <span class="text-sm font-medium text-foreground">{{ tool.title }}</span>
            </div>
            <p class="text-xs text-muted-foreground">{{ tool.desc }}</p>
          </div>
        </div>
      </div>

      <!-- For creators (teaser) -->
      <div class="mb-8 p-5 rounded-lg border border-border bg-accent/10">
        <div class="flex items-start gap-4">
          <span class="text-3xl flex-shrink-0">✏️</span>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-1">{{ t('forCreators') }}</h3>
            <p class="text-sm text-muted-foreground mb-3">{{ t('forCreatorsDesc') }}</p>
            <a href="#/creators" class="text-sm font-medium text-primary hover:underline">
              {{ t('forCreatorsLink') }} →
            </a>
          </div>
        </div>
      </div>

      <!-- Privacy & ownership -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('privacyTitle') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div v-for="item in privacyPoints" :key="item.key" class="p-3 rounded-lg bg-accent/20">
            <div class="text-sm font-medium text-foreground mb-1">{{ item.title }}</div>
            <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Roadmap -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('roadmapTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ t('roadmapDesc') }}</p>
        <div class="space-y-2">
          <div v-for="item in roadmapItems" :key="item.key"
            class="flex items-start gap-3 p-3 rounded-lg border border-border">
            <span class="text-base mt-0.5">{{ item.icon }}</span>
            <div class="flex-grow">
              <div class="text-sm font-medium text-foreground">{{ item.title }}</div>
              <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
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

      <!-- Open source CTA -->
      <div class="mb-8 p-5 rounded-lg border border-primary/20 bg-primary/5 text-center">
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ t('openSourceTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ t('openSourceDesc') }}</p>
        <a href="https://github.com/felixboehm/open-learn"
          target="_blank" rel="noopener"
          class="inline-block px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition">
          {{ t('viewOnGitHub') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'

const router = useRouter()
const { availableContent, isLoading, loadAvailableContent } = useLessons()
const { selectedLanguage, getFlag, setLanguage } = useLanguage()

const showLanguageMenu = ref(false)

const learningLanguages = computed(() => {
  return [...new Set(Object.keys(availableContent.value))]
})

const currentLanguage = computed(() => {
  return selectedLanguage.value || learningLanguages.value[0] || 'english'
})

function handleClickOutside(e) {
  if (showLanguageMenu.value && !e.target.closest('.relative')) {
    showLanguageMenu.value = false
  }
}

const isDE = computed(() => selectedLanguage.value === 'deutsch')

function t(key) {
  const strings = {
    title: isDE.value ? 'Lerne alles. Kostenlos. In deinem Tempo.' : 'Learn anything. For free. On your terms.',
    subtitle: isDE.value
      ? 'Ohne Konto, ohne Werbung, ohne Tracking. Dein Fortschritt bleibt in deinem Browser — immer.'
      : 'No account, no ads, no tracking. Your data stays in your browser — always.',
    getStartedTitle: isDE.value ? 'Sprache wählen und loslegen' : 'Pick a language and get started',
    howItWorks: isDE.value ? 'So funktioniert es' : 'How It Works',
    whatYouCanLearn: isDE.value ? 'Was du lernen kannst' : 'What You Can Learn',
    whatYouCanLearnDesc: isDE.value
      ? 'Open Learn eignet sich für jedes Thema — von Fremdsprachen über Mathe bis zur Führerschein-Theorie. Alles, was sich in Lektionen mit Fragen und Antworten strukturieren lässt, funktioniert.'
      : 'Open Learn works for any subject — from foreign languages to math to driving theory. Anything that can be structured into lessons with questions and answers works.',
    builtInTools: isDE.value ? 'Was alles eingebaut ist' : 'Built-in Tools',
    forCreators: isDE.value ? 'Eigene Workshops erstellen' : 'Create Your Own Workshops',
    forCreatorsDesc: isDE.value
      ? 'Erstelle dein eigenes Lernmaterial und teile es mit der Welt. Kein Programmieren nötig — hoste kostenlos auf GitHub Pages und teile mit einem Link.'
      : 'Build your own learning content and share it with the world. No coding required — host for free on GitHub Pages and share with a link.',
    forCreatorsLink: isDE.value ? 'So erstellst du einen Workshop' : 'Learn how to create a workshop',
    privacyTitle: isDE.value ? 'Privatsphäre und Datenhoheit' : 'Privacy & Data Ownership',
    roadmapTitle: isDE.value ? 'Was kommt als Nächstes' : 'What\'s Coming Next',
    roadmapDesc: isDE.value
      ? 'Open Learn wird aktiv weiterentwickelt. Hier sind einige der geplanten Funktionen:'
      : 'Open Learn is actively developed. Here are some of the features we\'re working on:',
    openSourceTitle: isDE.value ? 'Open Source — für immer' : 'Open Source — Forever',
    openSourceDesc: isDE.value
      ? 'Open Learn ist quelloffen und kostenlos. Schau dir den Code an, melde Fehler, oder trage bei.'
      : 'Open Learn is open source and free. View the code, report issues, or contribute.',
    viewOnGitHub: isDE.value ? 'Auf GitHub ansehen' : 'View on GitHub',
  }
  return strings[key] || key
}

const features = computed(() => isDE.value ? [
  { key: 'any', icon: '🎯', title: 'Jedes Thema', desc: 'Sprachen, Mathe, Führerschein-Theorie, Musik — alles, was sich strukturieren lässt' },
  { key: 'rich', icon: '🎬', title: 'Reichhaltiges Lernerlebnis', desc: 'Videos, Audio mit variabler Geschwindigkeit, Quizze, Multiple-Choice und Fortschrittsverfolgung' },
  { key: 'create', icon: '✏️', title: 'Eigene Inhalte erstellen', desc: 'Workshops in einfachem YAML schreiben. Auf GitHub, IPFS oder beliebiger URL hosten und per Link teilen' },
  { key: 'infra', icon: '🔒', title: 'Null Infrastruktur', desc: 'Läuft als statische Seite. Kein Server, keine Datenbank. Offline-fähig. Optionaler P2P-Sync zwischen Geräten' },
] : [
  { key: 'any', icon: '🎯', title: 'Any Subject', desc: 'Languages, math, driving theory, music — if it can be structured, it can be learned here' },
  { key: 'rich', icon: '🎬', title: 'Rich Learning Experience', desc: 'Videos, audio with variable speed, interactive quizzes, multiple-choice, and progress tracking' },
  { key: 'create', icon: '✏️', title: 'Your Content, Your Way', desc: 'Write workshops in simple YAML. Host on GitHub, IPFS, or any URL. Share with a link' },
  { key: 'infra', icon: '🔒', title: 'Zero Infrastructure', desc: 'Runs as a static site. No server, no database. Works offline. Optional P2P sync across devices' },
])

const steps = computed(() => isDE.value ? [
  { title: 'Sprache wählen', desc: 'Wähle deine Sprache — die Oberfläche passt sich an.' },
  { title: 'Workshop starten', desc: 'Klicke auf einen Workshop und starte sofort — kein Konto nötig.' },
  { title: 'Lernen & Fortschritt', desc: 'Starte eine Lektion, beantworte Fragen, höre Audio, markiere Gelerntes und gestalte deinen eigenen Lernpfad.' },
] : [
  { title: 'Pick a Language', desc: 'Choose your language below — the interface adapts.' },
  { title: 'Start a Workshop', desc: 'Click any workshop and start immediately — no sign-up required.' },
  { title: 'Learn & Track', desc: 'Start a lesson, answer questions, listen to audio, mark items learned, and customize your learning path.' },
])

const useCaseExamples = computed(() => isDE.value ? [
  { key: 'lang', icon: '🌍', label: 'Fremdsprachen' },
  { key: 'math', icon: '🧮', label: 'Mathematik' },
  { key: 'drive', icon: '🚗', label: 'Führerschein-Theorie' },
  { key: 'music', icon: '🎵', label: 'Musiktheorie' },
  { key: 'code', icon: '💻', label: 'Programmieren' },
  { key: 'science', icon: '🔬', label: 'Naturwissenschaften' },
  { key: 'history', icon: '📜', label: 'Geschichte' },
  { key: 'med', icon: '🏥', label: 'Medizin & Pflege' },
  { key: 'law', icon: '⚖️', label: 'Rechtswissen' },
] : [
  { key: 'lang', icon: '🌍', label: 'Foreign Languages' },
  { key: 'math', icon: '🧮', label: 'Mathematics' },
  { key: 'drive', icon: '🚗', label: 'Driving Theory' },
  { key: 'music', icon: '🎵', label: 'Music Theory' },
  { key: 'code', icon: '💻', label: 'Programming' },
  { key: 'science', icon: '🔬', label: 'Science' },
  { key: 'history', icon: '📜', label: 'History' },
  { key: 'med', icon: '🏥', label: 'Medicine & Nursing' },
  { key: 'law', icon: '⚖️', label: 'Legal Studies' },
])

const tools = computed(() => isDE.value ? [
  { key: 'quiz', icon: '✅', title: '4 Assessment-Typen', desc: 'Freitext-Eingabe, Multiple-Choice, Single-Select und klassische Frage-Antwort-Karten' },
  { key: 'audio', icon: '🔊', title: 'Audio-System', desc: 'MP3-Aussprache mit variabler Geschwindigkeit (0.6×–1.0×), Sperrbildschirm-Steuerung und Auto-Play' },
  { key: 'video', icon: '🎬', title: 'Video-Einbettung', desc: 'YouTube-Videos und lokale Videodateien direkt in Lektionen einbinden' },
  { key: 'progress', icon: '📊', title: 'Fortschritt & Lernelemente', desc: 'Markiere Vokabeln und Konzepte als gelernt. Fortschritt pro Lektion und Workshop sichtbar' },
  { key: 'coach', icon: '🎓', title: 'Coach-Integration', desc: 'Antworten optional an einen externen Coach-Service weiterleiten — für Feedback und Auswertung' },
  { key: 'sync', icon: '🔄', title: 'P2P-Sync (GunDB)', desc: 'Fortschritt dezentral zwischen Geräten synchronisieren — kein zentraler Server nötig' },
] : [
  { key: 'quiz', icon: '✅', title: '4 Assessment Types', desc: 'Free-text input, multiple-choice, single-select, and classic Q&A flashcards' },
  { key: 'audio', icon: '🔊', title: 'Audio System', desc: 'MP3 pronunciation with variable speed (0.6×–1.0×), lock screen controls, and auto-play' },
  { key: 'video', icon: '🎬', title: 'Video Embeds', desc: 'YouTube videos and local video files embedded directly into lessons' },
  { key: 'progress', icon: '📊', title: 'Progress & Learning Items', desc: 'Mark vocabulary and concepts as learned. Progress visible per lesson and workshop' },
  { key: 'coach', icon: '🎓', title: 'Coach Integration', desc: 'Optionally forward answers to an external coach service — for feedback and evaluation' },
  { key: 'sync', icon: '🔄', title: 'P2P Sync (GunDB)', desc: 'Sync progress across devices peer-to-peer — no central server needed' },
])

const privacyPoints = computed(() => isDE.value ? [
  { key: 'local', title: 'Alles lokal', desc: 'Fortschritt, Einstellungen und Antworten bleiben in deinem Browser. Nichts wird an einen Server gesendet.' },
  { key: 'notrack', title: 'Kein Tracking', desc: 'Keine Cookies, kein Analytics, keine Werbung. Wir wissen nicht, wer du bist.' },
  { key: 'export', title: 'Deine Daten gehören dir', desc: 'Exportiere und importiere deine Daten jederzeit als JSON. Du hast die volle Kontrolle.' },
] : [
  { key: 'local', title: 'Everything Local', desc: 'Progress, settings, and answers stay in your browser. Nothing is sent to a server.' },
  { key: 'notrack', title: 'Zero Tracking', desc: 'No cookies, no analytics, no ads. We don\'t know who you are.' },
  { key: 'export', title: 'Your Data Is Yours', desc: 'Export and import your data anytime as JSON. You\'re in full control.' },
])

const roadmapItems = computed(() => isDE.value ? [
  { key: 'coach', icon: '🤖', title: 'KI-Lerncoach', desc: 'Ein autonomer Coach-Agent, der Feedback gibt, Fortschritte bewertet und personalisierte Lernpfade vorschlägt.', issue: 45 },
  { key: 'kids', icon: '🧒', title: 'Lernmodus für Kinder', desc: 'Vereinfachte Oberfläche für Kinder — weniger Buttons, größere Elemente, geführtes Lernen.', issue: 46 },
  { key: 'images', icon: '🖼️', title: 'Bilder in Lektionen', desc: 'Screenshots und Bilder als Sektions-Header — für Schritt-für-Schritt-Anleitungen und visuelle Erklärungen.', issue: 47 },
  { key: 'i18n', icon: '🌐', title: 'Vollständige Mehrsprachigkeit & RTL', desc: 'Die gesamte Plattform in jeder Sprache — inklusive Rechts-nach-Links-Unterstützung für Arabisch und Farsi.', issue: 44 },
  { key: 'upload', icon: '📄', title: 'Datei-Upload', desc: 'PDFs, Skripte und andere Dokumente als Lernmaterial hochladen und bereitstellen.', issue: 51 },
] : [
  { key: 'coach', icon: '🤖', title: 'AI Learning Coach', desc: 'An autonomous coach agent that gives feedback, evaluates progress, and suggests personalized learning paths.', issue: 45 },
  { key: 'kids', icon: '🧒', title: 'Kids Mode', desc: 'Simplified interface for children — fewer buttons, larger elements, guided learning.', issue: 46 },
  { key: 'images', icon: '🖼️', title: 'Images in Lessons', desc: 'Screenshots and images as section headers — for step-by-step guides and visual explanations.', issue: 47 },
  { key: 'i18n', icon: '🌐', title: 'Full i18n & RTL Support', desc: 'The entire platform in any language — including right-to-left support for Arabic and Farsi.', issue: 44 },
  { key: 'upload', icon: '📄', title: 'File Uploads', desc: 'Upload PDFs, scripts, and other documents as learning material.', issue: 51 },
])

function goToWorkshops(lang) {
  showLanguageMenu.value = false
  setLanguage(lang)
  router.push({ name: 'workshop-overview', params: { learning: lang } })
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
