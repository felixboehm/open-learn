import { ref } from 'vue'
import yaml from 'js-yaml'

// Helper function to resolve IPFS URLs to HTTP gateway URLs
function resolveUrl(urlOrPath) {
  if (typeof urlOrPath === 'string' && urlOrPath.startsWith('ipfs://')) {
    // Convert IPFS URL to HTTP gateway URL
    const ipfsHash = urlOrPath.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${ipfsHash}`
  }
  return urlOrPath
}

// Helper function to parse source (string, folder object, or url object)
function parseSource(source) {
  if (typeof source === 'string') {
    // Backward compatible: string is treated as folder
    return { type: 'folder', path: source }
  }
  if (typeof source === 'object') {
    if (source.folder) {
      return { type: 'folder', path: source.folder, code: source.code, title: source.title || null, description: source.description || null, coach: source.coach || null }
    }
    if (source.url) {
      return { type: 'url', path: resolveUrl(source.url), code: source.code, title: source.title || null, description: source.description || null, coach: source.coach || null }
    }
  }
  return null
}

export function useLessons() {
  const availableContent = ref({})
  const languageCodes = ref({}) // Store language codes
  const workshopCodes = ref({}) // Store workshop codes
  const workshopSlugMap = ref({}) // slug → URL mapping for remote workshops
  const workshopMeta = ref({}) // { lang: { workshop: { title, description } } }
  const isLoading = ref(false)

  // Get content sources from localStorage
  function getContentSources() {
    try {
      return JSON.parse(localStorage.getItem('contentSources') || '[]')
    } catch {
      return []
    }
  }

  // Save content sources to localStorage
  function saveContentSources(sources) {
    localStorage.setItem('contentSources', JSON.stringify(sources))
  }

  // Add a content source
  function addContentSource(url) {
    const sources = getContentSources()
    if (!sources.includes(url)) {
      sources.push(url)
      saveContentSources(sources)
    }
  }

  // Remove a content source
  function removeContentSource(url) {
    const sources = getContentSources().filter(s => s !== url)
    saveContentSources(sources)
  }

  // Check if a workshop key is from a remote content source
  function isRemoteWorkshop(workshopKey) {
    return workshopKey in workshopSlugMap.value
  }

  // Resolve a workshop key: if it's a slug, return the URL; otherwise return as-is
  function resolveWorkshopKey(workshopKey) {
    return workshopSlugMap.value[workshopKey] || workshopKey
  }

  // Get the source URL for a remote workshop slug (for removing sources)
  function getSourceForSlug(slug) {
    const url = workshopSlugMap.value[slug]
    if (!url) return null
    const sources = getContentSources()
    // Sources include index.yaml filename, strip it for prefix matching
    return sources.find(s => {
      const base = s.replace(/\/workshop\.yaml$/, '')
      return url.startsWith(base)
    }) || null
  }

  // Get metadata (title, description) for a workshop
  function getWorkshopMeta(langFolder, workshopFolder) {
    return workshopMeta.value[langFolder]?.[workshopFolder] || { title: null, description: null }
  }

  // Get share URL for a remote workshop
  function getShareUrl(workshopSlug) {
    const sourceUrl = getSourceForSlug(workshopSlug)
    if (!sourceUrl) return null
    return `https://felixboehm.github.io/open-learn/#/add?source=${encodeURIComponent(sourceUrl)}`
  }

  // Load a remote content source's languages and topics
  // sourceUrl is the full URL to index.yaml (e.g. https://user.github.io/repo/index.yaml)
  async function loadContentSource(sourceUrl, content, codes) {
    try {
      // If URL doesn't end with .yaml, append /index.yaml
      let fetchUrl = sourceUrl
      if (!sourceUrl.endsWith('.yaml')) {
        fetchUrl = sourceUrl.replace(/\/$/, '') + '/index.yaml'
      }

      console.log(`📡 Loading content source: ${fetchUrl}`)
      const response = await fetch(fetchUrl)
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch ${fetchUrl}: ${response.status}`)
        return
      }

      const text = await response.text()
      const data = yaml.load(text)

      // Derive base URL by stripping the yaml filename
      const baseUrl = fetchUrl.replace(/\/[^/]+\.yaml$/, '')

      for (const lang of data.languages) {
        const source = parseSource(lang)
        if (!source) continue

        // For remote sources, the language key is the folder name (e.g. "deutsch")
        // so it merges with local languages
        const langKey = source.path
        if (!content[langKey]) {
          content[langKey] = {}
        }
        if (!codes[langKey]) {
          codes[langKey] = source.code || null
        }

        // Load workshops for this language from the remote source
        // Try workshops.yaml first, fallback to topics.yaml
        let workshopsData = null
        const workshopsUrl = `${baseUrl}/${langKey}/workshops.yaml`
        const topicsUrl = `${baseUrl}/${langKey}/topics.yaml`
        try {
          let workshopsResponse = await fetch(workshopsUrl)
          if (!workshopsResponse.ok) {
            workshopsResponse = await fetch(topicsUrl)
          }
          if (!workshopsResponse.ok) continue

          const workshopsText = await workshopsResponse.text()
          workshopsData = yaml.load(workshopsText)

          // Accept both 'workshops' and 'topics' YAML keys
          const workshopList = workshopsData.workshops || workshopsData.topics
          if (!workshopList) continue

          for (const workshop of workshopList) {
            const workshopSource = parseSource(workshop)
            if (!workshopSource) continue

            // Use the workshop folder name as the slug for clean URLs
            const slug = workshopSource.path
            const workshopUrl = `${baseUrl}/${langKey}/${workshopSource.path}`
            content[langKey][slug] = []

            // Map slug → full URL for resolving later
            workshopSlugMap.value[slug] = workshopUrl

            // Store workshop code and metadata
            if (!workshopCodes.value[langKey]) {
              workshopCodes.value[langKey] = {}
            }
            workshopCodes.value[langKey][slug] = workshopSource.code || null

            if (!workshopMeta.value[langKey]) {
              workshopMeta.value[langKey] = {}
            }
            workshopMeta.value[langKey][slug] = {
              title: workshopSource.title || null,
              description: workshopSource.description || null,
              coach: workshopSource.coach || null
            }

            console.log(`  ✓ Remote workshop: ${slug} → ${workshopUrl} (${workshopSource.code || 'no code'})`)
          }
        } catch (e) {
          console.warn(`⚠️ Failed to load workshops from ${workshopsUrl}:`, e)
        }
      }

      console.log(`✅ Content source loaded: ${sourceUrl}`)
    } catch (error) {
      console.warn(`⚠️ Error loading content source ${sourceUrl}:`, error)
    }
  }

  async function loadAvailableContent() {
    try {
      console.log('📚 Loading available languages...')
      isLoading.value = true
      const response = await fetch('lessons/index.yaml')

      if (!response.ok) {
        throw new Error(`Failed to fetch index.yaml: ${response.status}`)
      }

      const text = await response.text()
      const data = yaml.load(text)
      console.log('📖 Loaded languages data:', data)

      const content = {}
      const codes = {}

      for (const lang of data.languages) {
        const source = parseSource(lang)
        if (!source) {
          console.warn(`⚠️ Invalid language source:`, lang)
          continue
        }

        // Use path as the key (for folders, it's the folder name; for URLs, it's the full URL)
        const key = source.path
        content[key] = {}
        codes[key] = source.code || null
        console.log(`  ✓ Language: ${key} (${source.type}) (${source.code || 'no code'})`)
      }

      // Load remote content sources from localStorage
      const contentSources = getContentSources()
      for (const sourceUrl of contentSources) {
        await loadContentSource(sourceUrl, content, codes)
      }

      availableContent.value = content
      languageCodes.value = codes
      isLoading.value = false
      console.log('✅ Languages loaded successfully')
    } catch (error) {
      console.error('❌ Error loading available content:', error)
      isLoading.value = false
    }
  }

  async function loadWorkshopsForLanguage(lang) {
    try {
      console.log(`📚 Loading workshops for language: ${lang}`)

      // Ensure languages are loaded first
      if (!availableContent.value[lang]) {
        console.log('⚠️ Languages not loaded yet, loading now...')
        await loadAvailableContent()

        if (!availableContent.value[lang]) {
          throw new Error(`Language ${lang} not found in available content`)
        }
      }

      // Try workshops.yaml first, fallback to topics.yaml
      let response
      if (lang.startsWith('http://') || lang.startsWith('https://')) {
        response = await fetch(`${lang}/workshops.yaml`)
        if (!response.ok) {
          response = await fetch(`${lang}/topics.yaml`)
        }
      } else {
        response = await fetch(`lessons/${lang}/workshops.yaml`)
        if (!response.ok) {
          response = await fetch(`lessons/${lang}/topics.yaml`)
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch workshops/topics.yaml for ${lang}: ${response.status}`)
      }

      const text = await response.text()
      const data = yaml.load(text)
      console.log(`📖 Loaded workshops data for ${lang}:`, data)

      // Initialize workshop codes storage for this language if needed
      if (!workshopCodes.value[lang]) {
        workshopCodes.value[lang] = {}
      }

      // Accept both 'workshops' and 'topics' YAML keys
      const workshopList = data.workshops || data.topics

      for (const workshop of workshopList) {
        const source = parseSource(workshop)
        if (!source) {
          console.warn(`⚠️ Invalid workshop source:`, workshop)
          continue
        }

        const key = source.path
        availableContent.value[lang][key] = []
        workshopCodes.value[lang][key] = source.code || null

        if (!workshopMeta.value[lang]) {
          workshopMeta.value[lang] = {}
        }
        workshopMeta.value[lang][key] = {
          title: source.title || null,
          description: source.description || null,
          coach: source.coach || null
        }

        console.log(`  ✓ Workshop: ${key} (${source.type}) (${source.code || 'no code'})`)
      }

      console.log(`✅ Workshops loaded for ${lang}`)
    } catch (error) {
      console.error(`❌ Error loading workshops for ${lang}:`, error)
    }
  }

  async function loadLessonsForTopic(lang, topic) {
    try {
      console.log(`📚 Loading lesson list for ${lang}/${topic}`)

      // Ensure workshops are loaded first
      if (!availableContent.value[lang] || availableContent.value[lang][topic] === undefined) {
        console.log('⚠️ Workshops not loaded yet, loading now...')
        await loadWorkshopsForLanguage(lang)

        if (!availableContent.value[lang] || availableContent.value[lang][topic] === undefined) {
          throw new Error(`Workshop ${topic} not found for language ${lang}`)
        }
      }

      // Resolve slug to URL if needed
      const resolvedTopic = resolveWorkshopKey(topic)

      // Construct lessons.yaml URL
      let lessonsUrl
      if (resolvedTopic.startsWith('http://') || resolvedTopic.startsWith('https://')) {
        // Topic is a URL (resolved from slug or direct)
        lessonsUrl = `${resolvedTopic}/lessons.yaml`
      } else if (lang.startsWith('http://') || lang.startsWith('https://')) {
        // Language is a URL, topic is a folder
        lessonsUrl = `${lang}/${topic}/lessons.yaml`
      } else {
        // Both are folders
        lessonsUrl = `lessons/${lang}/${topic}/lessons.yaml`
      }

      const response = await fetch(lessonsUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch lessons.yaml for ${lang}/${topic}: ${response.status}`)
      }

      const text = await response.text()
      const data = yaml.load(text)
      console.log(`📖 Loaded lessons list for ${lang}/${topic}:`, data.lessons)

      availableContent.value[lang][topic] = data.lessons
      console.log(`✅ Lesson list loaded: ${data.lessons.length} lessons found`)
    } catch (error) {
      console.error(`❌ Error loading lessons for ${lang}/${topic}:`, error)
    }
  }

  async function loadLesson(lang, topic, filenameOrSource) {
    try {
      const sourceDisplay = typeof filenameOrSource === 'string'
        ? filenameOrSource
        : JSON.stringify(filenameOrSource)
      console.log(`📄 Loading lesson: ${lang}/${topic}/${sourceDisplay}`)

      // Parse lesson source (can be string, folder object, or url object)
      const source = parseSource(filenameOrSource)
      if (!source) {
        console.error(`❌ Invalid lesson source:`, filenameOrSource)
        return null
      }

      // Resolve slug to URL if needed
      const resolvedTopic = resolveWorkshopKey(topic)

      // Construct content.yaml URL
      let lessonPath
      if (source.type === 'url') {
        // Lesson is a URL
        lessonPath = `${source.path}/content.yaml`
      } else if (resolvedTopic.startsWith('http://') || resolvedTopic.startsWith('https://')) {
        // Topic is a URL (resolved from slug), lesson is a folder
        lessonPath = `${resolvedTopic}/${source.path}/content.yaml`
      } else if (lang.startsWith('http://') || lang.startsWith('https://')) {
        // Language is a URL, others are folders
        lessonPath = `${lang}/${topic}/${source.path}/content.yaml`
      } else {
        // All are folders
        lessonPath = `lessons/${lang}/${topic}/${source.path}/content.yaml`
      }

      const response = await fetch(lessonPath)

      if (!response.ok) {
        console.error(`❌ Failed to fetch lesson ${lessonPath}: ${response.status}`)
        return null
      }

      const text = await response.text()
      const lesson = yaml.load(text)

      if (lesson) {
        console.log(`  ✓ Lesson loaded: #${lesson.number} - ${lesson.title}`)
        // Store the source path for audio loading
        lesson._source = source
      } else {
        console.error(`  ❌ Failed to parse lesson: ${filenameOrSource}`)
      }

      return lesson
    } catch (error) {
      console.error(`❌ Error loading lesson ${filenameOrSource}:`, error)
      return null
    }
  }

  async function loadAllLessonsForTopic(lang, topic) {
    try {
      console.log(`📚 Loading all lessons for ${lang}/${topic}`)

      // Load the lesson list first (this will ensure topics are loaded too)
      await loadLessonsForTopic(lang, topic)

      const lessonFiles = availableContent.value[lang]?.[topic]

      if (!lessonFiles || lessonFiles.length === 0) {
        console.error(`❌ No lesson files found for ${lang}/${topic}`)
        return []
      }

      console.log(`📖 Found ${lessonFiles.length} lesson files to load`)

      const lessons = []
      for (const filename of lessonFiles) {
        const lesson = await loadLesson(lang, topic, filename)
        if (lesson) {
          // Add filename (without .yaml extension) to lesson object for audio path
          const source = parseSource(filename)
          lesson._filename = source ? source.path.replace(/\.yaml$/, '') : filename.replace(/\.yaml$/, '')
          lessons.push(lesson)
        }
      }

      const sortedLessons = lessons.sort((a, b) => a.number - b.number)
      console.log(`✅ All lessons loaded and sorted: ${sortedLessons.length} lessons`)

      return sortedLessons
    } catch (error) {
      console.error(`❌ Error loading all lessons for ${lang}/${topic}:`, error)
      return []
    }
  }

  // Get language code for a language folder
  function getLanguageCode(langFolder) {
    return languageCodes.value[langFolder] || null
  }

  // Get workshop code for a workshop folder
  function getTopicCode(langFolder, workshopFolder) {
    return workshopCodes.value[langFolder]?.[workshopFolder] || getLanguageCode(langFolder)
  }

  return {
    availableContent,
    languageCodes,
    workshopCodes,
    isLoading,
    loadAvailableContent,
    loadWorkshopsForLanguage,
    loadLessonsForTopic,
    loadLesson,
    loadAllLessonsForTopic,
    getLanguageCode,
    getTopicCode,
    getContentSources,
    addContentSource,
    removeContentSource,
    isRemoteWorkshop,
    resolveWorkshopKey,
    getSourceForSlug,
    getWorkshopMeta,
    getShareUrl
  }
}
