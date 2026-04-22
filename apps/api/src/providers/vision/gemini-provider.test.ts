import { Buffer } from 'node:buffer'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGenerateContent = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    }
  },
}))

const { createGeminiVisionLocationProvider } = await import('./gemini-provider')

describe('gemini vision location provider', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset()
    process.env.GEMINI_API_KEY = 'test-key'
  })

  it('passes the incoming mime type to Gemini', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        resultType: 'approximate',
        primaryResult: {
          label: 'Taipei City',
          latitude: 25.0375,
          longitude: 121.5637,
          confidence: 0.52,
          reasonSummary: 'Skyline hints',
        },
        candidates: [],
      }),
    })

    const provider = createGeminiVisionLocationProvider()

    await provider.inferLocation({
      imageBuffer: Buffer.from('image'),
      mimeType: 'image/png',
    })

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                inlineData: expect.objectContaining({
                  mimeType: 'image/png',
                }),
              }),
            ]),
          }),
        ],
      }),
    )
  })

  it('returns not_found when Gemini returns empty text', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' })

    const provider = createGeminiVisionLocationProvider()

    await expect(provider.inferLocation({
      imageBuffer: Buffer.from('image'),
      mimeType: 'image/jpeg',
    })).resolves.toEqual({
      resultType: 'not_found',
      primaryResult: {
        label: 'Unable to determine location',
        latitude: null,
        longitude: null,
        confidence: 0,
        reasonSummary: 'Gemini returned an empty response',
      },
      candidates: [],
    })
  })

  it('returns not_found when Gemini returns invalid JSON or schema-invalid JSON', async () => {
    const provider = createGeminiVisionLocationProvider()

    mockGenerateContent.mockResolvedValueOnce({ text: '{not-json' })
    await expect(provider.inferLocation({
      imageBuffer: Buffer.from('image'),
      mimeType: 'image/webp',
    })).resolves.toMatchObject({
      resultType: 'not_found',
      primaryResult: {
        reasonSummary: 'Gemini returned invalid JSON',
      },
    })

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        resultType: 'approximate',
        primaryResult: {
          label: 'Taipei City',
          latitude: '25.0375',
          longitude: 121.5637,
          confidence: 0.52,
          reasonSummary: 'Skyline hints',
        },
        candidates: [],
      }),
    })

    await expect(provider.inferLocation({
      imageBuffer: Buffer.from('image'),
      mimeType: 'image/heic',
    })).resolves.toMatchObject({
      resultType: 'not_found',
      primaryResult: {
        reasonSummary: 'Gemini returned invalid JSON',
      },
    })
  })
})
