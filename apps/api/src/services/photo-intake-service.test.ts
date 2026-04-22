import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/exif', () => ({
  readPhotoMetadata: vi.fn().mockResolvedValue({
    latitude: 25.033964,
    longitude: 121.564468,
  }),
}))

vi.mock('../lib/thumbnail', () => ({
  createThumbnail: vi.fn().mockResolvedValue({
    contentType: 'image/jpeg',
    buffer: Buffer.from('thumb'),
  }),
}))

import { createPhotoIntakeService } from './photo-intake-service'

describe('photo intake service', () => {
  it('returns parsed GPS metadata and thumbnail bytes', async () => {
    const service = createPhotoIntakeService()
    const file = {
      filename: 'taipei.jpg',
      mimetype: 'image/jpeg',
      toBuffer: async () => Buffer.from('image-bytes'),
    }

    const result = await service.process(file)

    expect(result.metadata.latitude).toBe(25.033964)
    expect(result.metadata.longitude).toBe(121.564468)
    expect(result.thumbnail.contentType).toBe('image/jpeg')
  })

  it('rejects unsupported mime types', async () => {
    const service = createPhotoIntakeService()
    const file = {
      filename: 'taipei.pdf',
      mimetype: 'application/pdf',
      toBuffer: async () => Buffer.from('bad'),
    }

    await expect(service.process(file)).rejects.toThrow('Unsupported media type')
  })
})
