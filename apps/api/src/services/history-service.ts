import { createSearchRepository } from '../repositories/search-repository'

const repository = createSearchRepository()

export function createHistoryService() {
  return {
    async save(search: Parameters<typeof repository.save>[0]) {
      await repository.save(search)
      await repository.trimToLatestTen(search.visitorId)
    },
    async listByVisitor(visitorId: string) {
      return repository.listByVisitor(visitorId)
    },
  }
}
