import process from 'node:process'

import { createRateLimitRepository } from '../repositories/rate-limit-repository'

const repository = createRateLimitRepository()

interface RateLimitCheckInput {
  visitorId: string
  ip: string
}

function getDailyBucket() {
  return new Date().toISOString().slice(0, 10)
}

export function createRateLimitService() {
  return {
    async checkOrThrow(input: RateLimitCheckInput) {
      const bucket = getDailyBucket()
      const visitorCount = await repository.increment(`visitor:${bucket}:${input.visitorId}`)
      const ipCount = await repository.increment(`ip:${bucket}:${input.ip}`)
      const visitorLimit = Number(process.env.VISITOR_LIMIT_PER_DAY || 20)
      const ipLimit = Number(process.env.IP_LIMIT_PER_DAY || 50)

      if (visitorCount > visitorLimit || ipCount > ipLimit) {
        throw new Error('Rate limit exceeded')
      }
    },
  }
}
