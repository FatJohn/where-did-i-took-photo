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
  getStoredVisitorToken: () => localStorage.getItem('photo-location.visitor-token'),
}))

describe('history view', () => {
  beforeEach(() => {
    fetchHistoryMock.mockReset()
    localStorage.clear()
  })

  it('loads history by using stored visitor context when no route param is present', async () => {
    localStorage.setItem('photo-location.visitor-id', 'visitor_stored')
    localStorage.setItem('photo-location.visitor-token', 'token_stored')
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

  it('renders summary cards and thumbnails for loaded history items', async () => {
    localStorage.setItem('photo-location.visitor-id', 'visitor_stored')
    localStorage.setItem('photo-location.visitor-token', 'token_stored')
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
        {
          searchId: 'search_2',
          resultType: 'approximate',
          source: 'ai',
          primaryResult: {
            label: '台北市信義區',
            latitude: 25.033964,
            longitude: 121.564468,
            confidence: 0.63,
            reasonSummary: 'Skyline hints suggest central Taipei.',
          },
          candidates: [
            {
              label: '台北 101',
              latitude: 25.033964,
              longitude: 121.564468,
              confidence: 0.63,
              clues: ['超高樓天際線'],
            },
          ],
          thumbnailUrl: 'https://bucket.example/2.jpg',
          createdAt: '2026-04-21T10:00:00.000Z',
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

    expect(wrapper.text()).toContain('共 2 筆分析結果')
    expect(wrapper.text()).toContain('Taipei 101')
    expect(wrapper.text()).toContain('台北市信義區')
    expect(wrapper.findAll('img')).toHaveLength(2)
    expect(wrapper.findAll('img')[0]?.attributes('src')).toBe('https://bucket.example/1.jpg')
  })
})
