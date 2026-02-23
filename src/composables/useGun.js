import { ref } from 'vue'

// Gun is loaded dynamically to avoid SSR issues
let Gun = null
let gun = null
let user = null
let listeners = []

// Reactive state
const isLoggedIn = ref(false)
const username = ref('')
const authError = ref('')
const isSyncing = ref(false)

const SESSION_KEY = 'gun-session'

// Initialize Gun (browser-only, no relay peers)
async function initGun() {
  if (gun) return

  const GunModule = await import('gun/gun')
  Gun = GunModule.default || GunModule
  await import('gun/sea')

  gun = Gun({ localStorage: true, radisk: false, file: 'gun-data' })
  user = gun.user().recall({ sessionStorage: false })
}

// Register a new user
async function register(alias, pass) {
  authError.value = ''
  if (!gun) await initGun()

  return new Promise((resolve) => {
    gun.user().create(alias, pass, (ack) => {
      if (ack.err) {
        authError.value = ack.err
        resolve(false)
      } else {
        // Auto-login after register
        login(alias, pass).then(resolve)
      }
    })
  })
}

// Login
async function login(alias, pass) {
  authError.value = ''
  if (!gun) await initGun()

  return new Promise((resolve) => {
    gun.user().auth(alias, pass, (ack) => {
      if (ack.err) {
        authError.value = ack.err
        isLoggedIn.value = false
        username.value = ''
        localStorage.removeItem(SESSION_KEY)
        resolve(false)
      } else {
        isLoggedIn.value = true
        username.value = alias
        localStorage.setItem(SESSION_KEY, JSON.stringify({ alias, pass }))
        setupListeners()
        resolve(true)
      }
    })
  })
}

// Logout
function logout() {
  if (gun && gun.user()) {
    gun.user().leave()
  }
  isLoggedIn.value = false
  username.value = ''
  authError.value = ''
  localStorage.removeItem(SESSION_KEY)
  teardownListeners()
}

// Auto-login from saved session
async function autoLogin() {
  const saved = localStorage.getItem(SESSION_KEY)
  if (!saved) return false

  try {
    const { alias, pass } = JSON.parse(saved)
    return await login(alias, pass)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return false
  }
}

// Sync data to Gun (encrypted under user space)
async function syncToGun(key, data) {
  if (!isLoggedIn.value || !gun) return

  try {
    gun.user().get('openlearn').get(key).put(JSON.stringify(data))
  } catch (e) {
    console.error('Gun sync error:', e)
  }
}

// Load all data from Gun into localStorage
async function loadFromGun() {
  if (!isLoggedIn.value || !gun) return null

  isSyncing.value = true

  const keys = ['settings', 'progress', 'assessments']
  const results = {}

  try {
    for (const key of keys) {
      const data = await new Promise((resolve) => {
        gun.user().get('openlearn').get(key).once((val) => {
          if (val && typeof val === 'string') {
            try {
              resolve(JSON.parse(val))
            } catch {
              resolve(null)
            }
          } else {
            resolve(null)
          }
        })
        // Timeout after 3 seconds
        setTimeout(() => resolve(null), 3000)
      })
      if (data) results[key] = data
    }
  } finally {
    isSyncing.value = false
  }

  return results
}

// Set up real-time listeners for cross-tab/device sync
function setupListeners() {
  teardownListeners()

  if (!isLoggedIn.value || !gun) return

  const keys = ['settings', 'progress', 'assessments']

  for (const key of keys) {
    const ref = gun.user().get('openlearn').get(key)
    const handler = ref.on((val) => {
      if (!val || typeof val !== 'string') return

      try {
        const data = JSON.parse(val)
        // Dispatch custom event so composables can react
        window.dispatchEvent(new CustomEvent('gun-sync', { detail: { key, data } }))
      } catch {
        // ignore parse errors
      }
    })
    listeners.push({ ref, handler })
  }
}

// Remove listeners
function teardownListeners() {
  for (const { ref: gunRef } of listeners) {
    try {
      gunRef.off()
    } catch {
      // ignore
    }
  }
  listeners = []
}

// Sync all current localStorage data to Gun
async function syncAll() {
  if (!isLoggedIn.value) return

  isSyncing.value = true

  try {
    const keys = ['settings', 'progress', 'assessments']
    for (const key of keys) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          await syncToGun(key, data)
        } catch {
          // skip invalid data
        }
      }
    }
  } finally {
    isSyncing.value = false
  }
}

export function useGun() {
  return {
    isLoggedIn,
    username,
    authError,
    isSyncing,
    initGun,
    register,
    login,
    logout,
    autoLogin,
    syncToGun,
    loadFromGun,
    syncAll
  }
}
