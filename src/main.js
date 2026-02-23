import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useSettings } from './composables/useSettings'
import { useProgress } from './composables/useProgress'
import { useAssessments } from './composables/useAssessments'
import { useGun } from './composables/useGun'

// Initialize and load settings, progress, and assessments before mounting the app
const { loadSettings, settings } = useSettings()
loadSettings()

const { loadProgress, mergeProgress } = useProgress()
loadProgress()

const { loadAssessments, mergeAssessments } = useAssessments()
loadAssessments()

const app = createApp(App)
app.use(router)
app.mount('#app')

// Gun auto-login (async, after mount so UI is ready)
const { initGun, autoLogin, loadFromGun } = useGun()
initGun().then(async () => {
  const ok = await autoLogin()
  if (ok) {
    const remote = await loadFromGun()
    if (remote) {
      if (remote.progress) mergeProgress(remote.progress)
      if (remote.assessments) mergeAssessments(remote.assessments)
      if (remote.settings) {
        Object.assign(settings, remote.settings)
      }
    }
  }
})
