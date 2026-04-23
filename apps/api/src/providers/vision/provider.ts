import type { Buffer } from 'node:buffer'

import { z } from 'zod'

export interface InferenceCandidate {
  label: string
  latitude: number | null
  longitude: number | null
  confidence: number
  clues: string[]
}

export interface InferencePrimaryResult {
  label: string
  latitude: number | null
  longitude: number | null
  confidence: number
  reasonSummary: string
}

export interface InferenceResult {
  resultType: 'precise' | 'approximate' | 'not_found'
  primaryResult: InferencePrimaryResult
  candidates: InferenceCandidate[]
}

export interface InferenceInput {
  imageBuffer: Buffer
  mimeType: string
}

export const inferenceCandidateSchema = z.object({
  label: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  clues: z.array(z.string()),
})

export const inferencePrimaryResultSchema = z.object({
  label: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  reasonSummary: z.string(),
})

export const inferenceResultSchema = z.object({
  resultType: z.enum(['precise', 'approximate', 'not_found']),
  primaryResult: inferencePrimaryResultSchema,
  candidates: z.array(inferenceCandidateSchema),
})

export interface VisionLocationProvider {
  inferLocation: (input: InferenceInput) => Promise<InferenceResult>
}
