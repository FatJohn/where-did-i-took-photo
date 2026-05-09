import type { FastifyPluginAsync } from 'fastify'

import { getThumbnailObject } from '../lib/storage'

interface ThumbnailParams {
  '*': string
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as { name?: string, $metadata?: { httpStatusCode?: number } }

  return candidate.name === 'NoSuchKey'
    || candidate.$metadata?.httpStatusCode === 404
}

export const thumbnailsRoute: FastifyPluginAsync = async (app) => {
  app.get<{ Params: ThumbnailParams }>('/thumbnails/*', async (request, reply) => {
    const key = request.params['*']

    if (!key) {
      throw app.httpErrors.notFound()
    }

    try {
      const object = await getThumbnailObject(key)

      reply.header('content-type', object.contentType)

      if (object.contentLength != null) {
        reply.header('content-length', object.contentLength)
      }

      if (object.etag) {
        reply.header('etag', object.etag)
      }

      reply.header('cache-control', 'public, max-age=31536000, immutable')

      return reply.send(object.body)
    }
    catch (error) {
      if (isNotFound(error)) {
        throw app.httpErrors.notFound()
      }

      throw error
    }
  })
}
