import type { S3ClientConfig } from '@aws-sdk/client-s3'
import type { Buffer } from 'node:buffer'

import process from 'node:process'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function isLocalEndpoint(endpoint: string | undefined) {
  if (!endpoint) {
    return false
  }

  try {
    const { hostname } = new URL(endpoint)

    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '[::1]'
      || hostname.endsWith('.localhost')
  }
  catch {
    return false
  }
}

function shouldForcePathStyle(endpoint: string | undefined) {
  const configured = process.env.S3_FORCE_PATH_STYLE?.toLowerCase()

  if (configured === 'true') {
    return true
  }

  if (configured === 'false') {
    return false
  }

  return isLocalEndpoint(endpoint)
}

export function buildStorageClientConfig(): S3ClientConfig {
  const endpoint = process.env.S3_ENDPOINT

  return {
    region: process.env.S3_REGION || 'auto',
    endpoint,
    forcePathStyle: shouldForcePathStyle(endpoint),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  }
}

export function createStorageClient() {
  return new S3Client(buildStorageClientConfig())
}

interface UploadThumbnailInput {
  key: string
  buffer: Buffer
  contentType: string
}

export async function uploadThumbnail(params: UploadThumbnailInput) {
  const bucket = process.env.S3_BUCKET
  const endpoint = process.env.S3_ENDPOINT

  if (!bucket) {
    throw new Error('S3_BUCKET is required')
  }

  if (!endpoint) {
    throw new Error('S3_ENDPOINT is required')
  }

  const client = createStorageClient()

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.contentType,
  }))

  return `${endpoint.replace(/\/$/, '')}/${bucket}/${params.key}`
}
