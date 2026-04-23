import { Buffer } from 'node:buffer'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveVisitorMock = vi.fn(async (visitorToken?: string) => ({
  visitorId: `visitor_for_${visitorToken || 'new'}`,
  visitorToken: visitorToken || 'issued_token',
}))

const checkOrThrowMock = vi.fn().mockResolvedValue(undefined)

const processMock = vi.fn().mockResolvedValue({
  metadata: {
    latitude: 25.033964,
    longitude: 121.564468,
  },
  thumbnail: {
    contentType: 'image/jpeg',
    buffer: Buffer.from('thumb'),
  },
  originalBuffer: Buffer.from('image'),
})

const analyzeMock = vi.fn().mockResolvedValue({
  resultType: 'precise' as const,
  source: 'exif' as const,
  primaryResult: {
    label: 'Taipei 101',
    latitude: 25.033964,
    longitude: 121.564468,
    confidence: 0.99,
    reasonSummary: 'GPS metadata found in EXIF',
  },
  candidates: [],
})

const uploadThumbnailMock = vi.fn().mockResolvedValue('https://bucket.example/thumb.jpg')

vi.mock('../services/photo-intake-service', () => ({
  createPhotoIntakeService: () => ({
    process: processMock,
  }),
}))

vi.mock('../services/location-analysis-service', () => ({
  createLocationAnalysisService: () => ({
    analyze: analyzeMock,
  }),
}))

vi.mock('../providers/vision/gemini-provider', () => ({
  createGeminiVisionLocationProvider: () => ({
    inferLocation: vi.fn(),
  }),
}))

vi.mock('../services/rate-limit-service', () => ({
  createRateLimitService: () => ({
    checkOrThrow: checkOrThrowMock,
  }),
}))

vi.mock('../services/visitor-service', () => ({
  createVisitorService: () => ({
    resolve: resolveVisitorMock,
  }),
}))

vi.mock('../lib/storage', () => ({
  uploadThumbnail: uploadThumbnailMock,
}))

const { buildApp } = await import('../app')

function createMultipartBody(boundary: string, options?: {
  fieldName?: string
  mimeType?: string
  includePhoto?: boolean
  visitorToken?: string
}) {
  const includePhoto = options?.includePhoto ?? true
  const fieldName = options?.fieldName ?? 'photo'
  const mimeType = options?.mimeType ?? 'image/jpeg'
  const visitorToken = options?.visitorToken ?? 'visitor_token_1'
  const parts = [
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="visitorToken"\r\n\r\n'),
    Buffer.from(`${visitorToken}\r\n`),
  ]

  if (includePhoto) {
    parts.push(
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="${fieldName}"; filename="taipei.jpg"\r\n`),
      Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
      Buffer.from('fake-image-bytes\r\n'),
    )
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`))

  return Buffer.concat(parts)
}

function createFileFirstMultipartBody(boundary: string) {
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="photo"; filename="taipei.jpg"\r\n'),
    Buffer.from('Content-Type: image/jpeg\r\n\r\n'),
    Buffer.from('fake-image-bytes\r\n'),
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="visitorToken"\r\n\r\n'),
    Buffer.from('visitor_token_late\r\n'),
    Buffer.from(`--${boundary}--\r\n`),
  ])
}

beforeEach(() => {
  resolveVisitorMock.mockClear()
  checkOrThrowMock.mockReset()
  checkOrThrowMock.mockResolvedValue(undefined)
  processMock.mockReset()
  processMock.mockResolvedValue({
    metadata: {
      latitude: 25.033964,
      longitude: 121.564468,
    },
    thumbnail: {
      contentType: 'image/jpeg',
      buffer: Buffer.from('thumb'),
    },
    originalBuffer: Buffer.from('image'),
  })
  analyzeMock.mockReset()
  analyzeMock.mockResolvedValue({
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
  })
  uploadThumbnailMock.mockReset()
  uploadThumbnailMock.mockResolvedValue('https://bucket.example/thumb.jpg')
})

describe('post /analyze', () => {
  it('returns a normalized analysis response', async () => {
    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })
    const boundary = '----codex-boundary'

    const response = await app.inject({
      method: 'POST',
      url: '/analyze',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: createMultipartBody(boundary),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      resultType: 'precise',
      source: 'exif',
      thumbnailUrl: 'https://bucket.example/thumb.jpg',
    })
    expect(response.headers['x-visitor-token']).toBeTruthy()
    expect(processMock).toHaveBeenCalledTimes(1)
    expect(analyzeMock).toHaveBeenCalledTimes(1)
    expect(uploadThumbnailMock).toHaveBeenCalledTimes(1)
    expect(resolveVisitorMock).toHaveBeenCalledWith('visitor_token_1')
    expect(checkOrThrowMock).toHaveBeenCalledTimes(1)
    expect(checkOrThrowMock.mock.invocationCallOrder[0]).toBeLessThan(processMock.mock.invocationCallOrder[0])
  })

  it('accepts visitorToken fields that arrive after the file part', async () => {
    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })
    const boundary = '----codex-boundary-late-token'

    const response = await app.inject({
      method: 'POST',
      url: '/analyze',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: createFileFirstMultipartBody(boundary),
    })

    expect(response.statusCode).toBe(200)
    expect(resolveVisitorMock).toHaveBeenCalledWith('visitor_token_late')
    expect(checkOrThrowMock).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when the photo upload is missing', async () => {
    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })
    const boundary = '----codex-boundary-no-photo'

    const response = await app.inject({
      method: 'POST',
      url: '/analyze',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: createMultipartBody(boundary, { includePhoto: false }),
    })

    expect(response.statusCode).toBe(400)
    expect(processMock).not.toHaveBeenCalled()
  })

  it('returns 415 for unsupported media types', async () => {
    processMock.mockRejectedValueOnce(new Error('Unsupported media type'))

    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })
    const boundary = '----codex-boundary-unsupported'

    const response = await app.inject({
      method: 'POST',
      url: '/analyze',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: createMultipartBody(boundary, { mimeType: 'image/gif' }),
    })

    expect(response.statusCode).toBe(415)
  })

  it('returns 429 when the rate limit is exceeded', async () => {
    checkOrThrowMock.mockRejectedValueOnce(new Error('Rate limit exceeded'))

    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })
    const boundary = '----codex-boundary-rate-limit'

    const response = await app.inject({
      method: 'POST',
      url: '/analyze',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: createMultipartBody(boundary),
    })

    expect(response.statusCode).toBe(429)
    expect(processMock).not.toHaveBeenCalled()
  })

  it('requires the upload file field to be named photo', async () => {
    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })
    const boundary = '----codex-boundary-wrong-field'

    const response = await app.inject({
      method: 'POST',
      url: '/analyze',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: createMultipartBody(boundary, { fieldName: 'attachment' }),
    })

    expect(response.statusCode).toBe(400)
    expect(processMock).not.toHaveBeenCalled()
  })
})
