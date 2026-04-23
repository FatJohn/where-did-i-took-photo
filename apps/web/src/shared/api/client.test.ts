import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { analyzePhoto, fetchHistory } from './client'

describe('api client', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends analyze requests as multipart form data using the photo field name', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      searchId: 'search_1',
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
      thumbnailUrl: 'https://bucket.example/1.jpg',
      createdAt: '2026-04-22T10:00:00.000Z',
      visitorId: 'visitor_1',
    }), {
      status: 200,
      headers: {
        'x-visitor-token': 'issued_token',
      },
    }))

    const photo = new File(['demo photo'], 'demo.jpg', {
      type: 'image/jpeg',
    })

    await analyzePhoto({ photo })

    const call = fetchMock.mock.calls[0]
    expect(call).toBeDefined()
    const [url, init] = call as [RequestInfo | URL, RequestInit | undefined]
    const formData = init?.body

    expect(url).toBe('/analyze')
    expect(formData).toBeInstanceOf(FormData)
    expect((formData as FormData).get('photo')).toBe(photo)
    expect((formData as FormData).get('visitorToken')).toBeNull()
    expect(localStorage.getItem('photo-location.visitor-token')).toBe('issued_token')
    expect(localStorage.getItem('photo-location.visitor-id')).toBe('visitor_1')
  })

  it('sends history requests with x-visitor-token and persists visitor context', async () => {
    localStorage.setItem('photo-location.visitor-token', 'stored_token')

    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      items: [],
      visitorId: 'visitor_2',
      visitorToken: 'refreshed_token',
    }), {
      status: 200,
    }))

    await fetchHistory('visitor_2')

    const call = fetchMock.mock.calls[0]
    expect(call).toBeDefined()
    const [url, init] = call as [RequestInfo | URL, RequestInit | undefined]

    expect(url).toBe('/history/visitor_2')
    expect(init?.headers).toEqual({
      'x-visitor-token': 'stored_token',
    })
    expect(localStorage.getItem('photo-location.visitor-token')).toBe('refreshed_token')
    expect(localStorage.getItem('photo-location.visitor-id')).toBe('visitor_2')
  })
})
