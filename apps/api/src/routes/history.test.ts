import { describe, expect, it } from 'vitest'

import { buildApp } from '../app'
import { createHistoryService } from '../services/history-service'
import { createVisitorService } from '../services/visitor-service'

function makeSearch(visitorId: string) {
  return {
    searchId: 'search_1',
    visitorId,
    resultType: 'precise' as const,
    source: 'exif' as const,
    primaryResult: {
      label: 'Place 1',
      latitude: 25,
      longitude: 121,
      confidence: 0.9,
      reasonSummary: 'fixture',
    },
    candidates: [],
    thumbnailUrl: 'https://bucket.example/1.jpg',
    createdAt: new Date(2026, 3, 1).toISOString(),
  }
}

describe('get /history/:visitorId', () => {
  it('rejects requests for another visitor history', async () => {
    const visitorService = createVisitorService()
    const owner = await visitorService.resolve()
    const intruder = await visitorService.resolve()
    const historyService = createHistoryService()

    await historyService.save(makeSearch(owner.visitorId))

    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })

    const response = await app.inject({
      method: 'GET',
      url: `/history/${owner.visitorId}`,
      headers: {
        'x-visitor-token': intruder.visitorToken,
      },
    })

    expect(response.statusCode).toBe(403)
  })
})
