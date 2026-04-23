import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  circleMarkerMock,
  circleMock,
  fitBoundsMock,
  mapMock,
  removeMock,
  setViewMock,
  tileLayerMock,
} = vi.hoisted(() => {
  const fitBoundsMock = vi.fn()
  const removeMock = vi.fn()
  const setViewMock = vi.fn()
  const mapMock = vi.fn(() => ({
    fitBounds: fitBoundsMock,
    remove: removeMock,
    setView: setViewMock,
  }))
  const tileLayerMock = vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  }))
  const circleMarkerMock = vi.fn(() => {
    const layer = {
      addTo: vi.fn().mockReturnValue(undefined),
      bindPopup: vi.fn().mockReturnThis(),
    }

    return layer
  })
  const circleMock = vi.fn(() => {
    const layer = {
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
      getBounds: vi.fn(() => 'approximate-bounds'),
    }

    return layer
  })

  return {
    circleMarkerMock,
    circleMock,
    fitBoundsMock,
    mapMock,
    removeMock,
    setViewMock,
    tileLayerMock,
  }
})

vi.mock('leaflet', () => ({
  circle: circleMock,
  circleMarker: circleMarkerMock,
  map: mapMock,
  tileLayer: tileLayerMock,
}))

const { default: ResultMap } = await import('./ResultMap.vue')

describe('result map', () => {
  beforeEach(() => {
    circleMarkerMock.mockClear()
    circleMock.mockClear()
    fitBoundsMock.mockClear()
    mapMock.mockClear()
    removeMock.mockClear()
    setViewMock.mockClear()
    tileLayerMock.mockClear()
  })

  it('renders a leaflet map and precise marker when coordinates are precise', () => {
    const wrapper = mount(ResultMap, {
      props: {
        result: {
          searchId: 'search_precise',
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
          thumbnailUrl: 'https://bucket.example/precise.jpg',
          createdAt: '2026-04-23T10:00:00.000Z',
        },
      },
    })

    expect(wrapper.find('[data-testid="leaflet-map"]').exists()).toBe(true)
    expect(mapMock).toHaveBeenCalledTimes(1)
    expect(tileLayerMock).toHaveBeenCalledTimes(1)
    expect(circleMarkerMock).toHaveBeenCalledTimes(1)
    expect(circleMock).not.toHaveBeenCalled()
    expect(setViewMock).toHaveBeenCalledWith([25.033964, 121.564468], 15)
  })

  it('renders an approximate area and keeps the google maps link', () => {
    const wrapper = mount(ResultMap, {
      props: {
        result: {
          searchId: 'search_approximate',
          resultType: 'approximate',
          source: 'ai',
          primaryResult: {
            label: '信義計畫區',
            latitude: 25.033964,
            longitude: 121.564468,
            confidence: 0.61,
            reasonSummary: 'Skyline hints suggest central Taipei.',
          },
          candidates: [],
          thumbnailUrl: 'https://bucket.example/approximate.jpg',
          createdAt: '2026-04-23T10:00:00.000Z',
        },
      },
    })

    expect(wrapper.find('[data-testid="leaflet-map"]').exists()).toBe(true)
    expect(circleMock).toHaveBeenCalledTimes(1)
    expect(fitBoundsMock).toHaveBeenCalledWith('approximate-bounds', expect.any(Object))
    expect(wrapper.get('a').attributes('href')).toContain('google.com/maps/search')
  })

  it('shows a clear empty state when coordinates are unavailable', () => {
    const wrapper = mount(ResultMap, {
      props: {
        result: {
          searchId: 'search_not_found',
          resultType: 'not_found',
          source: 'ai',
          primaryResult: {
            label: '無法判定拍攝地點',
            latitude: null,
            longitude: null,
            confidence: 0.18,
            reasonSummary: 'Not enough clues.',
          },
          candidates: [],
          thumbnailUrl: 'https://bucket.example/not-found.jpg',
          createdAt: '2026-04-23T10:00:00.000Z',
        },
      },
    })

    expect(wrapper.find('[data-testid="leaflet-map"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('沒有可用座標')
    expect(mapMock).not.toHaveBeenCalled()
  })
})
