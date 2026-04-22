import { z } from 'zod'

import { analysisResponseSchema } from './analysis'

export const historyResponseSchema = z.object({
  items: z.array(analysisResponseSchema),
  visitorId: z.string().optional(),
  visitorToken: z.string().optional(),
})

export type HistoryResponse = z.infer<typeof historyResponseSchema>
