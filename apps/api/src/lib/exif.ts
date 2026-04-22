import type { Buffer } from 'node:buffer'

import exifr from 'exifr'

export async function readPhotoMetadata(buffer: Buffer) {
  const gps = await exifr.gps(buffer)

  return {
    latitude: gps?.latitude ?? null,
    longitude: gps?.longitude ?? null,
  }
}
