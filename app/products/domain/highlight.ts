export interface TextSegment {
  text: string
  match: boolean
}

/**
 * Découpe un texte autour des occurrences de la recherche, sans tenir compte de la casse,
 * comme la recherche du serveur. Rendus en texte par Vue, les segments rendent toute injection
 * HTML impossible, à l'inverse d'un `v-html` sur un titre venu de l'extérieur.
 */
export function highlightMatches(text: string, search: string | undefined): TextSegment[] {
  if (!search) return [{ text, match: false }]

  const lowerText = text.toLowerCase()
  const lowerSearch = search.toLowerCase()
  const segments: TextSegment[] = []
  let start = 0
  let index = lowerText.indexOf(lowerSearch)
  while (index !== -1) {
    if (index > start) segments.push({ text: text.slice(start, index), match: false })
    segments.push({ text: text.slice(index, index + search.length), match: true })
    start = index + search.length
    index = lowerText.indexOf(lowerSearch, start)
  }
  if (start < text.length) segments.push({ text: text.slice(start), match: false })
  return segments
}
