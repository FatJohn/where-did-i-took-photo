import type { Buffer } from 'node:buffer'
import process from 'node:process'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export function createStorageClient() {
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  })
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
