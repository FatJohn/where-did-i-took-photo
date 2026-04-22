import { describe, expect, it } from 'vitest'

import { buildApp } from '../app'

describe('get /health', () => {
  it('returns ok status', async () => {
    const app = await buildApp({
      maxUploadBytes: 10_485_760,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'photo-location-api',
    })
  })
})
