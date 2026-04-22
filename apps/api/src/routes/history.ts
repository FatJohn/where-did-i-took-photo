import type { FastifyPluginAsync } from 'fastify'

import { createHistoryService } from '../services/history-service'
import { createVisitorService } from '../services/visitor-service'

export const historyRoute: FastifyPluginAsync = async (app) => {
  app.get('/history/:visitorId', async (request) => {
    const visitorService = createVisitorService()
    const resolved = await visitorService.resolve(request.headers['x-visitor-token'] as string | undefined)
    const { visitorId } = request.params as { visitorId: string }

    if (visitorId !== resolved.visitorId) {
      throw app.httpErrors.forbidden('Cannot access another visitor history')
    }

    const historyService = createHistoryService()
    const items = await historyService.listByVisitor(visitorId)

    return {
      items,
      visitorId: resolved.visitorId,
      visitorToken: resolved.visitorToken,
    }
  })
}
