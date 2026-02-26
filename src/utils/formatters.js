/**
 * Format language/workshop names for display
 * @param {string} lang - Language or workshop identifier (folder name or URL)
 * @returns {string} - Formatted display name
 */
export function formatLangName(lang) {
  const names = {
    'deutsch': 'Deutsch',
    'portugiesisch': 'Portugiesisch',
    'spanisch': 'Spanisch'
  }

  if (names[lang]) return names[lang]

  // For URL-based workshops, extract the last path segment
  if (lang.startsWith('http://') || lang.startsWith('https://')) {
    const parts = lang.replace(/\/+$/, '').split('/')
    const lastPart = parts[parts.length - 1]
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ')
  }

  return lang.charAt(0).toUpperCase() + lang.slice(1)
}
