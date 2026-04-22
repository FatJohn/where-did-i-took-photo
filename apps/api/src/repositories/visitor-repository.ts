export interface VisitorRecord {
  id: string
  tokenHash: string
  createdAt: string
  lastSeenAt: string
}

export function createVisitorRepository() {
  const items = new Map<string, VisitorRecord>()

  return {
    async findByTokenHash(tokenHash: string) {
      return items.get(tokenHash) || null
    },
    async save(record: VisitorRecord) {
      items.set(record.tokenHash, record)
      return record
    },
    async touch(tokenHash: string) {
      const current = items.get(tokenHash)

      if (!current) {
        return null
      }

      const next = {
        ...current,
        lastSeenAt: new Date().toISOString(),
      }

      items.set(tokenHash, next)
      return next
    },
  }
}
