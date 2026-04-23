import { describe, expect, it } from 'vitest'

import { createCleanupService } from './cleanup-service'

describe('cleanup service', () => {
  it('marks only searches older than 180 days for deletion', () => {
    const service = createCleanupService()

    const plan = service.plan({
      now: new Date('2026-04-23T00:00:00.000Z'),
      searches: [
        {
          id: 'search_cutoff',
          createdAt: new Date('2025-10-25T00:00:00.000Z'),
        },
        {
          id: 'search_older',
          createdAt: new Date('2025-10-24T23:59:59.000Z'),
        },
        {
          id: 'search_recent',
          createdAt: new Date('2025-10-26T00:00:00.000Z'),
        },
      ],
    })

    expect(plan.cutoffAt).toEqual(new Date('2025-10-25T00:00:00.000Z'))
    expect(plan.expiredSearchIds).toEqual(['search_older'])
  })

  it('returns no expired ids when there are no searches', () => {
    const service = createCleanupService()

    const plan = service.plan({
      now: new Date('2026-04-23T00:00:00.000Z'),
      searches: [],
    })

    expect(plan.cutoffAt).toEqual(new Date('2025-10-25T00:00:00.000Z'))
    expect(plan.expiredSearchIds).toEqual([])
  })

  it('marks every search when all items are older than the cutoff', () => {
    const service = createCleanupService()

    const plan = service.plan({
      now: new Date('2026-04-23T00:00:00.000Z'),
      searches: [
        {
          id: 'search_1',
          createdAt: new Date('2025-09-01T00:00:00.000Z'),
        },
        {
          id: 'search_2',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        },
      ],
    })

    expect(plan.expiredSearchIds).toEqual(['search_1', 'search_2'])
  })
})
