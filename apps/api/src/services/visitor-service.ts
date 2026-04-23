import { randomUUID } from 'node:crypto'

import { generateVisitorToken, hashVisitorToken } from '../lib/token'
import { createVisitorRepository } from '../repositories/visitor-repository'

const visitorRepository = createVisitorRepository()

export function createVisitorService() {
  return {
    async resolve(rawToken?: string | null) {
      if (rawToken) {
        const tokenHash = hashVisitorToken(rawToken)
        const existing = await visitorRepository.findByTokenHash(tokenHash)

        if (existing) {
          await visitorRepository.touch(tokenHash)
          return {
            visitorId: existing.id,
            visitorToken: rawToken,
          }
        }
      }

      const visitorToken = generateVisitorToken()
      const record = await visitorRepository.save({
        id: `visitor_${randomUUID()}`,
        tokenHash: hashVisitorToken(visitorToken),
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      })

      return {
        visitorId: record.id,
        visitorToken,
      }
    },
  }
}
