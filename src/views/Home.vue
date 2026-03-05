<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <div v-else>

      <!-- Hero section -->
      <div class="mb-10">
        <h2 class="text-3xl sm:text-4xl font-extrabold mb-3 text-foreground leading-tight">
          {{ t('title') }}
        </h2>
        <p class="text-base text-muted-foreground leading-relaxed max-w-2xl">
          {{ t('subtitle') }}
        </p>

        <!-- Getting started hint (when no language selected) -->
        <div v-if="!selectedLanguage" class="mt-5 flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <span class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </span>
          <div>
            <p class="text-sm font-medium text-foreground">{{ t('getStartedTitle') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('getStartedDesc') }}</p>
          </div>
        </div>
      </div>

      <!-- Workshops section (when language selected) -->
      <div v-if="selectedLanguage && workshops.length > 0" class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-foreground">{{ t('workshops') }}</h3>
          <span class="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full">
            {{ workshops.length }} {{ workshops.length === 1 ? 'Workshop' : 'Workshops' }}
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
                  title="Copy link">
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
                    title="Remove">
                    Remove
                  </button>
                  <span v-if="isRemoteWorkshop(ws)" class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                    &#8599;
                  </span>
                  <span v-else class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                    &rarr;
                  </span>
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
                class="px-3 py-1 rounded-full text-sm font-semibold text-primary border border-primary hover:bg-accent transition">
                Add
              </a>
            </Card>
          </div>
        </div>

        <!-- Info links -->
        <div class="mt-6 flex flex-wrap gap-4 text-sm">
          <a
            :href="'#/' + selectedLanguage + '/open-learn-guide/lessons'"
            class="text-primary hover:underline">
            {{ t('guide') }}
          </a>
          <a
            :href="'#/' + selectedLanguage + '/open-learn-feedback/lessons'"
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

      <!-- How it works -->
      <div class="mb-10">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('howItWorks') }}</h3>
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
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ t('whatYouCanLearn') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ t('whatYouCanLearnDesc') }}</p>
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
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('builtInTools') }}</h3>
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
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ t('forCreators') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ t('forCreatorsDesc') }}</p>
        <div class="p-4 rounded-xl bg-accent/30 font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto">
          <div>sections:</div>
          <div class="pl-4">- title: "{{ t('yamlExampleTitle') }}"</div>
          <div class="pl-6">explanation: |</div>
          <div class="pl-8">{{ t('yamlExampleExplanation') }}</div>
          <div class="pl-6">video: "https://..."</div>
          <div class="pl-6">examples:</div>
          <div class="pl-8">- q: "{{ t('yamlExampleQ') }}"</div>
          <div class="pl-10">a: "{{ t('yamlExampleA') }}"</div>
          <div class="pl-10">type: select</div>
        </div>
      </div>

      <!-- Privacy & Roadmap side by side on desktop -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

        <!-- Privacy & ownership -->
        <div>
          <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('privacyTitle') }}</h3>
          <div class="space-y-3">
            <div v-for="item in privacyPoints" :key="item.key" class="p-3 rounded-xl bg-accent/20">
              <div class="text-sm font-semibold text-foreground mb-1">{{ item.title }}</div>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Roadmap -->
        <div>
          <h3 class="text-lg font-semibold text-foreground mb-2">{{ t('roadmapTitle') }}</h3>
          <p class="text-xs text-muted-foreground mb-4">{{ t('roadmapDesc') }}</p>
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
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ t('openSourceTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">{{ t('openSourceDesc') }}</p>
        <a href="https://github.com/felixboehm/open-learn"
          target="_blank" rel="noopener"
          class="inline-block px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition">
          {{ t('viewOnGitHub') }}
        </a>
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
const showAll = ref(false)
const maxVisible = 4

const knownWorkshops = []

const isDE = computed(() => selectedLanguage.value === 'deutsch')

// Simple i18n helper
function t(key) {
  const strings = {
    title: isDE.value ? 'Lerne alles. Kostenlos. In deinem Tempo.' : 'Learn anything. For free. On your terms.',
    subtitle: isDE.value
      ? 'Ohne Konto, ohne Werbung, ohne Tracking. Dein Fortschritt bleibt in deinem Browser — immer.'
      : 'No account, no ads, no tracking. Your data stays in your browser — always.',
    getStartedTitle: isDE.value ? 'Erste Schritte' : 'Get Started',
    getStartedDesc: isDE.value
      ? 'Wähle oben links deine Sprache aus, um verfügbare Workshops zu sehen.'
      : 'Select your language in the top-left dropdown to see available workshops.',
    howItWorks: isDE.value ? 'So funktioniert es' : 'How It Works',
    whatYouCanLearn: isDE.value ? 'Was du lernen kannst' : 'What You Can Learn',
    whatYouCanLearnDesc: isDE.value
      ? 'Open Learn ist nicht auf Sprachen beschränkt. Jedes Wissen, das sich in Lektionen mit Fragen und Antworten strukturieren lässt, funktioniert.'
      : 'Open Learn is not limited to languages. Any knowledge that can be structured into lessons with questions and answers works.',
    builtInTools: isDE.value ? 'Was alles eingebaut ist' : 'Built-in Tools',
    forCreators: isDE.value ? 'Für Workshop-Ersteller' : 'For Workshop Creators',
    forCreatorsDesc: isDE.value
      ? 'Workshops werden in einfachem YAML geschrieben — kein Code nötig. Hoste sie auf GitHub Pages, IPFS oder jeder URL. Nutzer fügen sie mit einem Link hinzu.'
      : 'Workshops are written in simple YAML — no code needed. Host them on GitHub Pages, IPFS, or any URL. Learners add them with a single link.',
    yamlExampleTitle: isDE.value ? 'Grundlagen' : 'The Basics',
    yamlExampleExplanation: isDE.value ? 'Markdown-Erklärungen mit **fett** und Listen' : 'Markdown explanations with **bold** and lists',
    yamlExampleQ: isDE.value ? 'Was ist 2 + 2?' : 'What is 2 + 2?',
    yamlExampleA: isDE.value ? '4' : '4',
    privacyTitle: isDE.value ? 'Privatsphäre & Datenhoheit' : 'Privacy & Data Ownership',
    roadmapTitle: isDE.value ? 'Was kommt als Nächstes' : 'What\'s Coming Next',
    roadmapDesc: isDE.value
      ? 'Open Learn wird aktiv weiterentwickelt. Hier sind einige der geplanten Funktionen:'
      : 'Open Learn is actively developed. Here are some of the features we\'re working on:',
    openSourceTitle: isDE.value ? 'Open Source — für immer' : 'Open Source — Forever',
    openSourceDesc: isDE.value
      ? 'Open Learn ist quelloffen und kostenlos. Schau dir den Code an, melde Fehler, oder trage bei.'
      : 'Open Learn is open source and free. View the code, report issues, or contribute.',
    viewOnGitHub: isDE.value ? 'Auf GitHub ansehen' : 'View on GitHub',
    workshops: isDE.value ? 'Deine Workshops' : 'Your Workshops',
    showAll: isDE.value ? 'Alle anzeigen' : 'Show all',
    more: isDE.value ? 'weitere' : 'more',
    discover: isDE.value ? 'Workshops entdecken' : 'Discover Workshops',
    guide: isDE.value ? 'Anleitung & Erste Schritte' : 'Guide & First Steps',
    feedback: isDE.value ? 'Feedback geben' : 'Give Feedback',
    bugReport: isDE.value ? 'Fehler melden' : 'Report a Bug',
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
  { title: 'Sprache wählen', desc: 'Wähle oben links deine Sprache — die Oberfläche passt sich an.' },
  { title: 'Workshop starten', desc: 'Klicke auf einen Workshop und starte sofort — kein Konto nötig.' },
  { title: 'Lernen & Fortschritt', desc: 'Beantworte Fragen, höre Audio, markiere Gelerntes — alles lokal gespeichert.' },
] : [
  { title: 'Pick a Language', desc: 'Choose your language in the top-left dropdown — the interface adapts.' },
  { title: 'Start a Workshop', desc: 'Click any workshop and start immediately — no sign-up required.' },
  { title: 'Learn & Track', desc: 'Answer questions, listen to audio, mark items learned — all saved locally.' },
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
