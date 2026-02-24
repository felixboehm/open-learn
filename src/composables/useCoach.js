import { ref } from 'vue'
import { useAssessments } from './useAssessments'
import { useProgress } from './useProgress'
import { useLessons } from './useLessons'
import { formatLangName } from '../utils/formatters'

// Chat history per topic: { "learning:teaching": [{ role, content, timestamp }] }
const chatHistory = ref({})

const isLoading = ref(false)
const error = ref('')

function getChatKey(learning, workshop) {
  return `${learning}:${workshop}`
}

function loadChatHistory() {
  const saved = localStorage.getItem('coachChat')
  if (saved) {
    try {
      chatHistory.value = JSON.parse(saved)
    } catch {
      chatHistory.value = {}
    }
  }
}

function saveChatHistory() {
  localStorage.setItem('coachChat', JSON.stringify(chatHistory.value))
}

function getMessages(learning, workshop) {
  const key = getChatKey(learning, workshop)
  return chatHistory.value[key] || []
}

function addMessage(learning, workshop, role, content) {
  const key = getChatKey(learning, workshop)
  if (!chatHistory.value[key]) {
    chatHistory.value[key] = []
  }
  chatHistory.value[key].push({
    role,
    content,
    timestamp: new Date().toISOString()
  })
  saveChatHistory()
}

function clearChat(learning, workshop) {
  const key = getChatKey(learning, workshop)
  delete chatHistory.value[key]
  saveChatHistory()
}

// Format assessment results as plain text for the agent
function formatResultsAsText(learning, workshop, lessons) {
  const { getAnswer } = useAssessments()
  const { isItemLearned } = useProgress()

  const lines = []
  const topicName = formatLangName(workshop)
  lines.push(`Assessment Results for ${topicName}`)
  lines.push('')

  for (const lesson of lessons) {
    lines.push(`Lesson ${lesson.number}: ${lesson.title}`)

    let learnedCount = 0
    let totalItems = 0
    const itemsSeen = new Set()

    lesson.sections.forEach((section, sIdx) => {
      const sectionResults = []

      section.examples.forEach((example, eIdx) => {
        // Count learning items
        if (example.rel) {
          example.rel.forEach(item => {
            const id = item[0]
            if (!itemsSeen.has(id)) {
              itemsSeen.add(id)
              totalItems++
              if (isItemLearned(learning, workshop, id)) learnedCount++
            }
          })
        }

        const type = example.type || 'qa'
        if (type === 'qa') return

        const saved = getAnswer(learning, workshop, lesson.number, sIdx, eIdx)
        if (saved) {
          const mark = saved.correct === true ? 'correct' : saved.correct === false ? 'incorrect' : 'answered'
          sectionResults.push(`  Q: ${example.q} → A: ${saved.answer} (${mark})`)
        } else {
          sectionResults.push(`  Q: ${example.q} → (not answered)`)
        }
      })

      if (sectionResults.length > 0) {
        lines.push(`  Section: ${section.title}`)
        lines.push(...sectionResults)
      }
    })

    if (totalItems > 0) {
      lines.push(`  Learning items: ${learnedCount}/${totalItems} learned`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// Send a message to the service agent
async function sendMessage(coachUrl, learning, workshop, userMessage, lessons) {
  error.value = ''
  isLoading.value = true

  // Add user message to history
  addMessage(learning, workshop, 'user', userMessage)

  try {
    // Build context with assessment results
    const context = formatResultsAsText(learning, workshop, lessons)

    const response = await fetch(coachUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        context
      })
    })

    if (!response.ok) {
      throw new Error(`Coach responded with ${response.status}`)
    }

    const data = await response.json()
    const reply = data.response || data.message || data.text || JSON.stringify(data)

    addMessage(learning, workshop, 'assistant', reply)
    return reply
  } catch (e) {
    error.value = e.message
    addMessage(learning, workshop, 'error', e.message)
    return null
  } finally {
    isLoading.value = false
  }
}

export function useCoach() {
  return {
    chatHistory,
    isLoading,
    error,
    loadChatHistory,
    getMessages,
    sendMessage,
    clearChat,
    formatResultsAsText
  }
}
