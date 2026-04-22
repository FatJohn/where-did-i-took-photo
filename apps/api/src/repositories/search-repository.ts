export interface StoredSearch {
  searchId: string
  visitorId: string
  resultType: 'precise' | 'approximate' | 'not_found'
  source: 'exif' | 'ai'
  primaryResult: {
    label: string
    latitude: number | null
    longitude: number | null
    confidence: number
    reasonSummary: string
  }
  candidates: Array<{
    label: string
    latitude: number | null
    longitude: number | null
    confidence: number
    clues: string[]
  }>
  thumbnailUrl: string
  createdAt: string
}

export function createSearchRepository() {
  const items: StoredSearch[] = []

  return {
    async save(search: StoredSearch) {
      items.unshift(search)
    },
    async listByVisitor(visitorId: string) {
      return items.filter(item => item.visitorId === visitorId)
    },
    async trimToLatestTen(visitorId: string) {
      const kept = items.filter(item => item.visitorId === visitorId).slice(0, 10)
      const others = items.filter(item => item.visitorId !== visitorId)
      items.splice(0, items.length, ...kept, ...others)
    },
  }
}
