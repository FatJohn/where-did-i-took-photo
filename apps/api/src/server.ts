import process from 'node:process'

import { buildApp } from './app'
import { loadEnv } from './plugins/env'

async function main() {
  const env = loadEnv(process.env)
  const app = await buildApp({
    maxUploadBytes: env.MAX_UPLOAD_BYTES,
  })

  await app.listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
}

void main()
