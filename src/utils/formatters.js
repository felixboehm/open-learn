/**
 * Format language/topic names for display
 * @param {string} lang - Language or topic identifier (folder name or URL)
 * @returns {string} - Formatted display name
 */
export function formatLangName(lang) {
  const names = {
    'deutsch': 'Deutsch',
    'english': 'English',
    'portugiesisch': 'Portugiesisch',
    'englisch': 'Englisch',
    'spanish': 'Spanish',
    'spanisch': 'Spanisch'
  }

  if (names[lang]) return names[lang]

  // For slug-based remote topics (e.g. "workshop-open-learn~open-learn-workshop")
  if (lang.includes('~')) {
    const topicPart = lang.split('~').pop()
    return topicPart.charAt(0).toUpperCase() + topicPart.slice(1).replace(/-/g, ' ')
  }

  return lang.charAt(0).toUpperCase() + lang.slice(1)
}
