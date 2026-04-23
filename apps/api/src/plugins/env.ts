import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8787),
  MAX_UPLOAD_BYTES: z.coerce.number().default(10_485_760),
})

export type AppEnv = z.infer<typeof envSchema>

export function loadEnv(raw: NodeJS.ProcessEnv): AppEnv {
  return envSchema.parse(raw)
}
