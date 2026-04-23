import type { Buffer } from 'node:buffer'

import { readPhotoMetadata } from '../lib/exif'
import { createThumbnail } from '../lib/thumbnail'

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

interface UploadLike {
  filename: string
  mimetype: string
  toBuffer: () => Promise<Buffer>
}

export function createPhotoIntakeService() {
  return {
    async process(file: UploadLike) {
      if (!allowedMimeTypes.has(file.mimetype)) {
        throw new Error('Unsupported media type')
      }

      const originalBuffer = await file.toBuffer()
      const metadata = await readPhotoMetadata(originalBuffer)
      const thumbnail = await createThumbnail(originalBuffer)

      return {
        metadata,
        thumbnail,
        originalBuffer,
      }
    },
  }
}
