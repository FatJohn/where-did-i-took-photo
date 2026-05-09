import { z } from 'zod'

export const resultTypeSchema = z.enum(['precise', 'approximate', 'not_found'])
export const resultSourceSchema = z.enum(['exif', 'ai', 'device'])

export const primaryResultSchema = z.object({
  label: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  reasonSummary: z.string(),
})

export const candidateSchema = z.object({
  label: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  clues: z.array(z.string()),
})

export const analysisResponseSchema = z.object({
  searchId: z.string(),
  resultType: resultTypeSchema,
  source: resultSourceSchema,
  primaryResult: primaryResultSchema,
  candidates: z.array(candidateSchema),
  thumbnailUrl: z.string().min(1),
  createdAt: z.string(),
  visitorId: z.string().optional(),
})

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>
