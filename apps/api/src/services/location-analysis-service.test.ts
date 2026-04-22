import { Buffer } from 'node:buffer'

import { describe, expect, it, vi } from 'vitest'

import { createLocationAnalysisService } from './location-analysis-service'

describe('location analysis service', () => {
  it('returns precise result immediately when GPS exists', async () => {
    const service = createLocationAnalysisService({
      inferLocation: async () => {
        throw new Error('should not call AI when GPS exists')
      },
    })

    const result = await service.analyze({
      metadata: {
        latitude: 25.033964,
        longitude: 121.564468,
      },
      imageBuffer: Buffer.from('image'),
      mimeType: 'image/jpeg',
    })

    expect(result.resultType).toBe('precise')
    expect(result.source).toBe('exif')
    expect(result.primaryResult.latitude).toBe(25.033964)
  })

  it('downgrades uncertain AI output to approximate', async () => {
    const inferLocation = vi.fn(async () => ({
      resultType: 'approximate' as const,
      primaryResult: {
        label: 'Taipei City',
        latitude: 25.0375,
        longitude: 121.5637,
        confidence: 0.52,
        reasonSummary: 'Skyline and language hints suggest central Taipei',
      },
      candidates: [
        {
          label: 'Taipei City',
          latitude: 25.0375,
          longitude: 121.5637,
          confidence: 0.52,
          clues: ['dense skyline', 'Traditional Chinese signage'],
        },
      ],
    }))

    const service = createLocationAnalysisService({
      inferLocation,
    })

    const result = await service.analyze({
      metadata: {
        latitude: null,
        longitude: null,
      },
      imageBuffer: Buffer.from('image'),
      mimeType: 'image/png',
    })

    expect(result.resultType).toBe('approximate')
    expect(result.source).toBe('ai')
    expect(inferLocation).toHaveBeenCalledWith({
      imageBuffer: Buffer.from('image'),
      mimeType: 'image/png',
    })
  })
})
