export function createRateLimitRepository() {
  const counters = new Map<string, number>()

  return {
    async increment(key: string) {
      const next = (counters.get(key) || 0) + 1
      counters.set(key, next)
      return next
    },
  }
}
