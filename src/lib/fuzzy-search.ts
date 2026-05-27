function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase()
}

function scoreCandidate(candidate: string, query: string) {
  const text = normalizeSearchText(candidate)
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return 1
  }

  if (text === normalizedQuery) {
    return 1000
  }

  if (text.startsWith(normalizedQuery)) {
    return 800 - text.length
  }

  const includesAt = text.indexOf(normalizedQuery)
  if (includesAt >= 0) {
    return 600 - includesAt - text.length
  }

  let queryIndex = 0
  let firstMatch = -1
  for (let textIndex = 0; textIndex < text.length; textIndex += 1) {
    if (text[textIndex] !== normalizedQuery[queryIndex]) {
      continue
    }

    if (firstMatch === -1) {
      firstMatch = textIndex
    }
    queryIndex += 1

    if (queryIndex === normalizedQuery.length) {
      return 300 - firstMatch - text.length
    }
  }

  return 0
}

export function getBestFuzzyScore(candidates: string[], query: string) {
  return candidates.reduce(
    (bestScore, candidate) =>
      Math.max(bestScore, scoreCandidate(candidate, query)),
    0
  )
}

export function fuzzyMatch<T>(
  items: T[],
  query: string,
  getCandidates: (item: T) => string[]
) {
  return items
    .map(item => ({
      item,
      score: getBestFuzzyScore(getCandidates(item), query),
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.item)
}
