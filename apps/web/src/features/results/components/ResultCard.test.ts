import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResultCard from './ResultCard.vue'

describe('result card', () => {
  it('shows the approximate badge and top candidates', () => {
    const wrapper = mount(ResultCard, {
      props: {
        result: {
          searchId: 'search_approximate',
          resultType: 'approximate',
          source: 'ai',
          primaryResult: {
            label: '台北市信義區',
            latitude: 25.033964,
            longitude: 121.564468,
            confidence: 0.62,
            reasonSummary: '天際線與繁體中文招牌指向台北市中心。',
          },
          candidates: [
            {
              label: '台北 101',
              latitude: 25.033964,
              longitude: 121.564468,
              confidence: 0.62,
              clues: ['超高樓天際線', '繁體中文'],
            },
            {
              label: '國父紀念館',
              latitude: 25.040082,
              longitude: 121.560244,
              confidence: 0.31,
              clues: ['都會廣場', '觀光地標'],
            },
          ],
          thumbnailUrl: 'https://bucket.example/approximate.jpg',
          createdAt: '2026-04-23T10:00:00.000Z',
        },
      },
    })

    expect(wrapper.text()).toContain('約略位置')
    expect(wrapper.text()).toContain('台北市信義區')
    expect(wrapper.text()).toContain('可能候選')
    expect(wrapper.text()).toContain('台北 101')
    expect(wrapper.text()).toContain('國父紀念館')
  })

  it('shows not found state without rendering candidates when no match exists', () => {
    const wrapper = mount(ResultCard, {
      props: {
        result: {
          searchId: 'search_not_found',
          resultType: 'not_found',
          source: 'ai',
          primaryResult: {
            label: '無法判定拍攝地點',
            latitude: null,
            longitude: null,
            confidence: 0.12,
            reasonSummary: '畫面缺少足夠地標與文字線索。',
          },
          candidates: [],
          thumbnailUrl: 'https://bucket.example/not-found.jpg',
          createdAt: '2026-04-23T10:00:00.000Z',
        },
      },
    })

    expect(wrapper.text()).toContain('無法判定')
    expect(wrapper.text()).toContain('無可用座標')
    expect(wrapper.text()).not.toContain('可能候選')
  })
})
