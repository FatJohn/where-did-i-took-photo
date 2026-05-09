import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildStorageClientConfig } from './storage'

const storageEnvKeys = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_FORCE_PATH_STYLE',
] as const

type StorageEnvKey = typeof storageEnvKeys[number]

const originalEnv: Partial<Record<StorageEnvKey, string>> = {}

describe('buildStorageClientConfig', () => {
  beforeEach(() => {
    for (const key of storageEnvKeys) {
      originalEnv[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    for (const key of storageEnvKeys) {
      const originalValue = originalEnv[key]

      if (originalValue === undefined) {
        delete process.env[key]
        continue
      }

      process.env[key] = originalValue
    }
  })

  it('uses path-style addressing for local MinIO endpoints', () => {
    process.env.S3_ENDPOINT = 'http://localhost:9000'
    process.env.S3_ACCESS_KEY_ID = 'minioadmin'
    process.env.S3_SECRET_ACCESS_KEY = 'minioadmin'

    const config = buildStorageClientConfig()

    expect(config.endpoint).toBe('http://localhost:9000')
    expect(config.region).toBe('auto')
    expect(config.forcePathStyle).toBe(true)
  })

  it('keeps virtual-hosted style as the default for remote S3 endpoints', () => {
    process.env.S3_ENDPOINT = 'https://bucket.example.com'
    process.env.S3_ACCESS_KEY_ID = 'access-key'
    process.env.S3_SECRET_ACCESS_KEY = 'secret-key'

    const config = buildStorageClientConfig()

    expect(config.forcePathStyle).toBe(false)
  })

  it('allows force path-style to be configured explicitly', () => {
    process.env.S3_ENDPOINT = 'https://storage.example.com'
    process.env.S3_ACCESS_KEY_ID = 'access-key'
    process.env.S3_SECRET_ACCESS_KEY = 'secret-key'
    process.env.S3_FORCE_PATH_STYLE = 'true'

    const config = buildStorageClientConfig()

    expect(config.forcePathStyle).toBe(true)
  })
})
