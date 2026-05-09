import type { FastifyPluginAsync } from 'fastify'
import type { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'

import { uploadThumbnail } from '../lib/storage'
import { createGeminiVisionLocationProvider } from '../providers/vision/gemini-provider'
import { createHistoryService } from '../services/history-service'
import { createLocationAnalysisService } from '../services/location-analysis-service'
import { createPhotoIntakeService } from '../services/photo-intake-service'
import { createRateLimitService } from '../services/rate-limit-service'
import { createVisitorService } from '../services/visitor-service'

export const analyzeRoute: FastifyPluginAsync = async (app) => {
  app.post('/analyze', async (request, reply) => {
    let visitorToken = ''
    let clientLatitude: number | null = null
    let clientLongitude: number | null = null
    let clientGpsSource: 'exif' | 'device' | null = null
    const uploadDir = await mkdtemp(join(tmpdir(), 'photo-location-'))
    let upload: {
      filename: string
      mimetype: string
      toBuffer: () => Promise<Buffer>
    } | null = null

    try {
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          const tempFilePath = join(uploadDir, `${randomUUID()}-${part.filename}`)

          await pipeline(part.file, createWriteStream(tempFilePath))

          if (part.fieldname !== 'photo') {
            continue
          }

          upload = {
            filename: part.filename,
            mimetype: part.mimetype,
            toBuffer: () => readFile(tempFilePath),
          }
          continue
        }

        if (part.fieldname === 'visitorToken') {
          visitorToken = String(part.value || '')
        }
        else if (part.fieldname === 'clientLatitude') {
          const value = Number.parseFloat(String(part.value))

          if (Number.isFinite(value) && value >= -90 && value <= 90) {
            clientLatitude = value
          }
        }
        else if (part.fieldname === 'clientLongitude') {
          const value = Number.parseFloat(String(part.value))

          if (Number.isFinite(value) && value >= -180 && value <= 180) {
            clientLongitude = value
          }
        }
        else if (part.fieldname === 'clientGpsSource') {
          const value = String(part.value || '')

          if (value === 'exif' || value === 'device') {
            clientGpsSource = value
          }
        }
      }

      if (!upload) {
        throw app.httpErrors.badRequest('Photo upload is required')
      }

      const visitorService = createVisitorService()
      const resolvedVisitor = await visitorService.resolve(visitorToken)
      const rateLimitService = createRateLimitService()

      try {
        await rateLimitService.checkOrThrow({
          visitorId: resolvedVisitor.visitorId,
          ip: request.ip,
        })
      }
      catch (error) {
        if (error instanceof Error && error.message === 'Rate limit exceeded') {
          throw app.httpErrors.tooManyRequests(error.message)
        }

        throw error
      }

      const photoIntakeService = createPhotoIntakeService()
      const intake = await photoIntakeService.process(upload)
      const hasClientGps = clientLatitude !== null && clientLongitude !== null
      const metadata = hasClientGps
        ? { latitude: clientLatitude, longitude: clientLongitude }
        : intake.metadata
      const gpsSource: 'exif' | 'device' | undefined = hasClientGps
        ? clientGpsSource ?? 'exif'
        : undefined
      const locationAnalysisService = createLocationAnalysisService(createGeminiVisionLocationProvider())
      const analysis = await locationAnalysisService.analyze({
        metadata,
        imageBuffer: intake.originalBuffer,
        mimeType: upload.mimetype,
        gpsSource,
      })

      const searchId = `search_${randomUUID()}`
      const thumbnailUrl = await uploadThumbnail({
        key: `${resolvedVisitor.visitorId}/${searchId}.jpg`,
        buffer: intake.thumbnail.buffer,
        contentType: intake.thumbnail.contentType,
      })
      const payload = {
        searchId,
        visitorId: resolvedVisitor.visitorId,
        ...analysis,
        thumbnailUrl,
        createdAt: new Date().toISOString(),
      }

      const historyService = createHistoryService()
      await historyService.save(payload)
      reply.header('x-visitor-token', resolvedVisitor.visitorToken)

      return payload
    }
    catch (error) {
      if (error instanceof Error && error.message === 'Unsupported media type') {
        throw app.httpErrors.unsupportedMediaType(error.message)
      }

      throw error
    }
    finally {
      await rm(uploadDir, { recursive: true, force: true })
    }
  })
}
