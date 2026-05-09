import type { InferenceInput, InferenceResult, VisionLocationProvider } from './provider'
import process from 'node:process'
import { GoogleGenAI } from '@google/genai'

import { inferenceResultSchema } from './provider'

const SYSTEM_INSTRUCTION = `You are a photo geolocation analyst. Examine the supplied image and infer where the photo was most likely taken using only visual evidence (signs, language, architecture, vegetation, terrain, vehicles, license plates, sky, lighting, etc.).

Reply with ONLY a JSON object — no markdown, no commentary, no code fences — that conforms exactly to this schema:

{
  "resultType": "precise" | "approximate" | "not_found",
  "primaryResult": {
    "label": string,                 // human-readable place name
    "latitude": number | null,       // decimal degrees, null if unknown
    "longitude": number | null,      // decimal degrees, null if unknown
    "confidence": number,            // 0..1
    "reasonSummary": string          // 1-2 sentences citing visual clues
  },
  "candidates": [                    // up to 3 alternatives, [] if none
    {
      "label": string,
      "latitude": number | null,
      "longitude": number | null,
      "confidence": number,          // 0..1
      "clues": string[]              // bullet-style clue list
    }
  ]
}

Rules:
- Use "precise" only when you can pinpoint a specific place / coordinates with high confidence.
- Use "approximate" when only a city / region / country is identifiable.
- Use "not_found" when there is not enough visual evidence; latitude and longitude must then be null and confidence must be 0.
- Never invent coordinates. If unsure, set latitude / longitude to null.
- Output must be valid JSON parseable by JSON.parse — no leading/trailing text.
- All natural-language fields ("label", "reasonSummary", "clues") MUST be written in Traditional Chinese using Taiwanese phrasing (繁體中文，台灣用語). Keep the JSON keys and enum values ("precise" / "approximate" / "not_found") in English exactly as specified.`

const USER_PROMPT = 'Analyze the photo and respond with the JSON object described in the system instruction.'

function createNotFoundResult(reasonSummary: string): InferenceResult {
  return {
    resultType: 'not_found',
    primaryResult: {
      label: '無法判斷拍攝地點',
      latitude: null,
      longitude: null,
      confidence: 0,
      reasonSummary,
    },
    candidates: [],
  }
}

function stripJsonFence(text: string) {
  const trimmed = text.trim()

  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
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
              { text: USER_PROMPT },
              {
                inlineData: {
                  mimeType,
                  data: imageBuffer.toString('base64'),
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })

      const text = response.text

      if (!text) {
        return createNotFoundResult('Gemini 沒有回傳任何內容。')
      }

      try {
        return inferenceResultSchema.parse(JSON.parse(stripJsonFence(text)))
      }
      catch (error) {
        console.warn('[gemini-provider] failed to parse response', {
          error: error instanceof Error ? error.message : String(error),
          rawText: text,
        })
        return createNotFoundResult('Gemini 回傳的內容無法解析。')
      }
    },
  }
}
