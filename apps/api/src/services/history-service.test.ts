import { describe, expect, it } from 'vitest'

import { createHistoryService } from './history-service'

function makeSearch(id: number) {
  return {
    searchId: `search_${id}`,
    visitorId: 'visitor_1',
    resultType: 'precise' as const,
    source: 'exif' as const,
    primaryResult: {
      label: `Place ${id}`,
      latitude: 25 + id,
      longitude: 121 + id,
      confidence: 0.9,
      reasonSummary: 'fixture',
    },
    candidates: [],
    thumbnailUrl: `https://bucket.example/${id}.jpg`,
    createdAt: new Date(2026, 3, id + 1).toISOString(),
  }
}

describe('history service', () => {
  it('keeps only the newest 10 searches for a visitor', async () => {
    const service = createHistoryService()

    for (let index = 1; index <= 11; index += 1) {
      await service.save(makeSearch(index))
    }

    const items = await service.listByVisitor('visitor_1')

    expect(items).toHaveLength(10)
    expect(items[0].searchId).toBe('search_11')
    expect(items.at(-1)?.searchId).toBe('search_2')
  })
})
