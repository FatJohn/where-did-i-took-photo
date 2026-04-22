import type { Buffer } from 'node:buffer'

import sharp from 'sharp'

export async function createThumbnail(buffer: Buffer) {
  const thumbnailBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 640, height: 640, fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer()

  return {
    contentType: 'image/jpeg',
    buffer: thumbnailBuffer,
  }
}
