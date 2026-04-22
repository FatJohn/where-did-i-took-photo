import type { InferenceInput, InferenceResult, VisionLocationProvider } from './provider'
import process from 'node:process'
import { GoogleGenAI } from '@google/genai'

import { inferenceResultSchema } from './provider'

function createNotFoundResult(reasonSummary: string): InferenceResult {
  return {
    resultType: 'not_found',
    primaryResult: {
      label: 'Unable to determine location',
      latitude: null,
      longitude: null,
      confidence: 0,
      reasonSummary,
    },
    candidates: [],
  }
}

export function createGeminiVisionLocationProvider(): VisionLocationProvider {
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY ?? '',
  })

  return {
    async inferLocation({ imageBuffer, mimeType }: InferenceInput) {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Analyze the photo and return JSON with precise, approximate, or not_found only.',
              },
              {
                inlineData: {
                  mimeType,
                  data: imageBuffer.toString('base64'),
                },
              },
            ],
          },
        ],
      })

      const text = response.text

      if (!text) {
        return createNotFoundResult('Gemini returned an empty response')
      }

      try {
        return inferenceResultSchema.parse(JSON.parse(text))
      }
      catch {
        return createNotFoundResult('Gemini returned invalid JSON')
      }
    },
  }
}
