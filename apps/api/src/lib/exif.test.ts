import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

vi.mock('exifr', () => ({
  default: {
    gps: vi.fn().mockResolvedValue(undefined),
  },
}))

import { readPhotoMetadata } from './exif'

describe('readPhotoMetadata', () => {
  it('returns null gps values for an image without EXIF GPS data', async () => {
    const buffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer()

    await expect(readPhotoMetadata(buffer)).resolves.toEqual({
      latitude: null,
      longitude: null,
    })
  })
})
