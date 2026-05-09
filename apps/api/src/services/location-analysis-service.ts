import type { Buffer } from 'node:buffer'

import type { VisionLocationProvider } from '../providers/vision/provider'

interface LocationMetadata {
  latitude: number | null
  longitude: number | null
}

interface AnalysisInput {
  metadata: LocationMetadata
  imageBuffer: Buffer
  mimeType: string
  gpsSource?: 'exif' | 'device'
}

function hasGps(metadata: LocationMetadata): metadata is { latitude: number, longitude: number } {
  const { latitude, longitude } = metadata

  if (latitude === null || longitude === null) {
    return false
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false
  }

  // exifr 有時候對解不到 GPS 的檔案會回 (0, 0)，視同無效
  if (Math.abs(latitude) < 1e-6 && Math.abs(longitude) < 1e-6) {
    return false
  }

  return true
}

export function createLocationAnalysisService(provider: VisionLocationProvider) {
  return {
    async analyze(input: AnalysisInput) {
      if (hasGps(input.metadata)) {
        const isDevice = input.gpsSource === 'device'

        return {
          resultType: 'precise' as const,
          source: isDevice ? 'device' as const : 'exif' as const,
          primaryResult: {
            label: isDevice ? '裝置目前位置' : '照片內建的 GPS 位置',
            latitude: input.metadata.latitude,
            longitude: input.metadata.longitude,
            confidence: isDevice ? 0.7 : 0.99,
            reasonSummary: isDevice
              ? '使用者授權的裝置目前 GPS 位置（並非拍照當下）。'
              : '從照片 EXIF 讀到 GPS 座標。',
          },
          candidates: [],
        }
      }

      const inferred = await provider.inferLocation({
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
      })

      return {
        ...inferred,
        source: 'ai' as const,
      }
    },
  }
}
