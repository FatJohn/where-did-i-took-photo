import process from 'node:process'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export function createDb() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const client = postgres(connectionString)

  return drizzle(client)
}
