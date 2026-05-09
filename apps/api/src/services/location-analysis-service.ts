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
}

function hasGps(metadata: LocationMetadata) {
  return metadata.latitude !== null && metadata.longitude !== null
}

export function createLocationAnalysisService(provider: VisionLocationProvider) {
  return {
    async analyze(input: AnalysisInput) {
      if (hasGps(input.metadata)) {
        return {
          resultType: 'precise' as const,
          source: 'exif' as const,
          primaryResult: {
            label: '照片內建的 GPS 位置',
            latitude: input.metadata.latitude,
            longitude: input.metadata.longitude,
            confidence: 0.99,
            reasonSummary: '從照片 EXIF 讀到 GPS 座標。',
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
