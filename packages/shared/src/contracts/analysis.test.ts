import { describe, expect, it } from 'vitest'

import {
  analysisResponseSchema,
  resultTypeSchema,
} from './analysis'

describe('analysis contracts', () => {
  it('accepts precise, approximate, and not_found result types', () => {
    expect(resultTypeSchema.parse('precise')).toBe('precise')
    expect(resultTypeSchema.parse('approximate')).toBe('approximate')
    expect(resultTypeSchema.parse('not_found')).toBe('not_found')
  })

  it('accepts a precise response payload', () => {
    const payload = {
      searchId: 'search_123',
      resultType: 'precise',
      source: 'exif',
      primaryResult: {
        label: 'Taipei 101',
        latitude: 25.033964,
        longitude: 121.564468,
        confidence: 0.99,
        reasonSummary: 'GPS metadata found in EXIF',
      },
      candidates: [],
      thumbnailUrl: 'https://bucket.example/thumb.jpg',
      createdAt: '2026-04-22T10:00:00.000Z',
    }

    expect(analysisResponseSchema.parse(payload).resultType).toBe('precise')
  })
})
