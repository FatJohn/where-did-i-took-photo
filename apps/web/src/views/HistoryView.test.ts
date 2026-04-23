import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { router } from '../router'
import HistoryView from './HistoryView.vue'

const { fetchHistoryMock } = vi.hoisted(() => ({
  fetchHistoryMock: vi.fn(),
}))

vi.mock('../shared/api/client', () => ({
  analyzePhoto: vi.fn(),
  fetchHistory: fetchHistoryMock,
  getStoredVisitorId: () => localStorage.getItem('photo-location.visitor-id'),
}))

describe('history view', () => {
  beforeEach(() => {
    fetchHistoryMock.mockReset()
    localStorage.clear()
  })

  it('loads history by using stored visitor context when no route param is present', async () => {
    localStorage.setItem('photo-location.visitor-id', 'visitor_stored')
    fetchHistoryMock.mockResolvedValue({
      items: [
        {
          searchId: 'search_1',
          resultType: 'precise',
          source: 'exif',
          primaryResult: {
            label: 'Taipei 101',
            latitude: 25.033964,
            longitude: 121.564468,
            confidence: 0.99,
            reasonSummary: 'GPS metadata found in EXIF',
          },
          candidates: [],
          thumbnailUrl: 'https://bucket.example/1.jpg',
          createdAt: '2026-04-22T10:00:00.000Z',
        },
      ],
      visitorId: 'visitor_stored',
      visitorToken: 'token_stored',
    })

    await router.push('/history')

    const wrapper = mount(HistoryView, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    await flushPromises()

    expect(fetchHistoryMock).toHaveBeenCalledWith('visitor_stored')
    expect(wrapper.text()).toContain('Taipei 101')
  })
})
