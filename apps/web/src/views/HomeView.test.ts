import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import { useAnalysisStore } from '@/features/analysis/stores/analysis'
import { router } from '../router'
import HomeView from './HomeView.vue'

const { analyzePhotoMock } = vi.hoisted(() => ({
  analyzePhotoMock: vi.fn(),
}))

vi.mock('../shared/api/client', () => ({
  analyzePhoto: analyzePhotoMock,
}))

describe('home view', () => {
  it('submits a demo photo and renders the main result label', async () => {
    analyzePhotoMock.mockReset()
    analyzePhotoMock.mockResolvedValue({
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
      visitorId: 'visitor_1',
    })

    await router.push('/')

    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    await wrapper.get('[data-testid="submit-demo"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Taipei 101')
  })

  it('hides the previous result when the next submission fails', async () => {
    analyzePhotoMock.mockReset()
    analyzePhotoMock
      .mockResolvedValueOnce({
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
        visitorId: 'visitor_1',
      })
      .mockRejectedValueOnce(new Error('分析失敗'))

    await router.push('/')

    const pinia = createPinia()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia, router],
      },
    })
    const analysisStore = useAnalysisStore(pinia)

    await analysisStore.submitDemo()
    await flushPromises()

    expect(wrapper.text()).toContain('Taipei 101')

    await expect(analysisStore.submitDemo()).rejects.toThrow('分析失敗')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Taipei 101')
    expect(wrapper.text()).toContain('分析失敗')
  })
})
