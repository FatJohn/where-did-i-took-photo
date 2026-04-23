import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import { router } from '../router'
import HomeView from './HomeView.vue'

vi.mock('../shared/api/client', () => ({
  analyzePhoto: vi.fn().mockResolvedValue({
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
  }),
}))

describe('home view', () => {
  it('submits a demo photo and renders the main result label', async () => {
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
})
