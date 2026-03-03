import { ref } from 'vue'

// Gun is loaded dynamically to avoid SSR issues
let Gun = null
let gun = null
let listeners = []

// Guard flag to prevent sync loops when applying remote changes
let isMergingRemote = false

// Reactive state
const isLoggedIn = ref(false)
const username = ref('')
const authError = ref('')
const isSyncing = ref(false)
const relayUrl = ref(localStorage.getItem('gunRelayUrl') || '')
const isConnected = ref(false)

const RELAY_KEY = 'gunRelayUrl'
const ALIAS_KEY = 'gun-alias'

// Initialize Gun (browser-only, with WebRTC for peer discovery)
async function initGun() {
  if (gun) return

  const GunModule = await import('gun/gun')
  Gun = GunModule.default || GunModule
  await import('gun/sea')

  // WebRTC enables browser-to-browser mesh networking (same WLAN discovery)
  try {
    await import('gun/lib/webrtc')
  } catch {
    // WebRTC module not available, continue without peer mesh
  }

  const peers = relayUrl.value ? [relayUrl.value] : []
  gun = Gun({
    peers,
    localStorage: true,
    radisk: false,
    file: 'gun-data',
    multicast: true
  })

  // Listen for recall-based session restoration
  gun.on('auth', () => {
    if (gun.user().is) {
      isLoggedIn.value = true
      // After recall(), gun.user().is.alias may be the public key, not the readable name.
      // The readable alias is stored separately.
      username.value = localStorage.getItem(ALIAS_KEY) || ''
      setupListeners()
      pushLocalToGun()
    }
  })
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
        localStorage.removeItem(ALIAS_KEY)
        resolve(false)
      } else {
        isLoggedIn.value = true
        username.value = alias
        // Store only the alias for display — never the password.
        // Session is handled by Gun's recall().
        localStorage.setItem(ALIAS_KEY, alias)
        setupListeners()
        pushLocalToGun()
        resolve(true)
      }
    })
  })
}

// Logout
function logout() {
  teardownListeners()
  if (gun && gun.user()) {
    gun.user().leave()
  }
  isLoggedIn.value = false
  username.value = ''
  authError.value = ''
  localStorage.removeItem(ALIAS_KEY)
}

// Auto-login via Gun's recall (session stored by Gun internally, no password needed)
async function autoLogin() {
  if (!gun) await initGun()

  // Gun's recall() + gun.on('auth') handler in initGun() restores the session.
  // We use recall() with sessionStorage to trigger it, then wait briefly.
  gun.user().recall({ sessionStorage: true })

  return new Promise((resolve) => {
    if (isLoggedIn.value) {
      resolve(true)
      return
    }
    const timeout = setTimeout(() => resolve(false), 2000)
    const check = setInterval(() => {
      if (isLoggedIn.value) {
        clearTimeout(timeout)
        clearInterval(check)
        resolve(true)
      }
    }, 100)
  })
}

// Sync data to Gun (encrypted under user space)
async function syncToGun(key, data) {
  if (!isLoggedIn.value || !gun || isMergingRemote) return

  try {
    gun.user().get('openlearn').get(key).put(JSON.stringify(data))
  } catch (e) {
    console.error('Gun sync error:', e)
  }
}

// Load all data from Gun (one-time read)
async function loadFromGun() {
  if (!isLoggedIn.value || !gun) return null

  isSyncing.value = true

  const keys = ['settings', 'progress', 'assessments']
  const results = {}

  try {
    for (const key of keys) {
      const data = await new Promise((resolve) => {
        let resolved = false
        gun.user().get('openlearn').get(key).once((val) => {
          if (resolved) return
          resolved = true
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
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            resolve(null)
          }
        }, 3000)
      })
      if (data) results[key] = data
    }
  } finally {
    isSyncing.value = false
  }

  return results
}

// Set up real-time listeners (Gun .on()) for continuous cross-tab/device sync.
// These fire whenever data changes in Gun — from local writes or remote peers.
function setupListeners() {
  teardownListeners()

  if (!isLoggedIn.value || !gun) return

  const keys = ['settings', 'progress', 'assessments']

  for (const key of keys) {
    const gunRef = gun.user().get('openlearn').get(key)
    const cb = (val) => {
      if (isMergingRemote) return
      if (!val || typeof val !== 'string') return

      try {
        const data = JSON.parse(val)
        isMergingRemote = true
        window.dispatchEvent(new CustomEvent('gun-sync', { detail: { key, data } }))
        isMergingRemote = false
      } catch {
        isMergingRemote = false
      }
    }
    gunRef.on(cb)
    listeners.push({ ref: gunRef, cb })
  }
}

// Remove listeners — pass callback reference for proper cleanup
function teardownListeners() {
  for (const { ref: gunRef, cb } of listeners) {
    try {
      gunRef.off(cb)
    } catch {
      // ignore
    }
  }
  listeners = []
}

// Push all current localStorage data to Gun
async function pushLocalToGun() {
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

// Set relay peer URL (requires page reload to take effect)
function setRelayUrl(url) {
  relayUrl.value = url
  if (url) {
    localStorage.setItem(RELAY_KEY, url)
  } else {
    localStorage.removeItem(RELAY_KEY)
  }
}

// Check connection status to relay peer
function updateConnectionStatus() {
  if (!gun || !relayUrl.value) {
    isConnected.value = false
    return
  }
  try {
    const peers = gun._.opt.peers || {}
    isConnected.value = Object.values(peers).some(p => p.wire?.readyState === 1)
  } catch {
    isConnected.value = false
  }
}

export function useGun() {
  return {
    isLoggedIn,
    username,
    authError,
    isSyncing,
    relayUrl,
    isConnected,
    initGun,
    register,
    login,
    logout,
    autoLogin,
    syncToGun,
    loadFromGun,
    pushLocalToGun,
    setRelayUrl,
    updateConnectionStatus
  }
}
