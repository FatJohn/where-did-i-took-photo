interface CleanupSearch {
  id: string
  createdAt: Date
}

interface CleanupPlanInput {
  now: Date
  searches: CleanupSearch[]
}

const RETENTION_DAYS = 180
const DAY_IN_MS = 24 * 60 * 60 * 1000

export function createCleanupService() {
  return {
    plan(input: CleanupPlanInput) {
      const now = input.now
      const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_IN_MS)
      const expiredSearchIds = input.searches
        .filter(search => search.createdAt.getTime() < cutoff.getTime())
        .map(search => search.id)

      return {
        cutoffAt: cutoff,
        expiredSearchIds,
      }
    },
  }
}
