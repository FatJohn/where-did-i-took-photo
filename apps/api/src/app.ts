import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import sensible from '@fastify/sensible'
import Fastify from 'fastify'

import { analyzeRoute } from './routes/analyze'
import { healthRoute } from './routes/health'
import { historyRoute } from './routes/history'

interface BuildAppOptions {
  maxUploadBytes: number
}

export async function buildApp(options: BuildAppOptions) {
  const app = Fastify()

  await app.register(cors, {
    origin: true,
    credentials: true,
  })
  await app.register(sensible)
  await app.register(multipart, {
    limits: {
      fileSize: options.maxUploadBytes,
      files: 1,
    },
  })
  await app.register(healthRoute)
  await app.register(analyzeRoute)
  await app.register(historyRoute)

  return app
}
