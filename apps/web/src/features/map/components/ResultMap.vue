<script setup lang="ts">
import type { Map as LeafletMap } from 'leaflet'
import type { AnalysisResult } from '@/shared/types/contracts'
import * as L from 'leaflet'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  result: AnalysisResult
}>()

const TILE_PROVIDER = {
  attribution: '&copy; OpenStreetMap contributors',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
}
const APPROXIMATE_RADIUS_METERS = 1800

const mapContainer = ref<HTMLElement | null>(null)

const latitude = computed(() => props.result.primaryResult.latitude)
const longitude = computed(() => props.result.primaryResult.longitude)

const hasCoordinates = computed(() => latitude.value !== null && longitude.value !== null)
const isApproximate = computed(() => props.result.resultType === 'approximate')

const mapTitle = computed(() => {
  if (props.result.resultType === 'precise') {
    return '精準地圖資訊'
  }

  if (props.result.resultType === 'approximate') {
    return '約略地圖資訊'
  }

  return '沒有可用座標'
})

const googleMapsUrl = computed(() => {
  if (!hasCoordinates.value) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${latitude.value},${longitude.value}`
})

const mapRenderKey = computed(() => [
  props.result.resultType,
  props.result.primaryResult.label,
  latitude.value,
  longitude.value,
].join(':'))

let mapInstance: LeafletMap | null = null

function destroyMap() {
  mapInstance?.remove()
  mapInstance = null
}

function renderMap() {
  if (!mapContainer.value || latitude.value === null || longitude.value === null) {
    destroyMap()
    return
  }

  destroyMap()

  const coordinates: [number, number] = [latitude.value, longitude.value]
  mapInstance = L.map(mapContainer.value, {
    scrollWheelZoom: false,
  })

  L.tileLayer(TILE_PROVIDER.url, {
    attribution: TILE_PROVIDER.attribution,
  }).addTo(mapInstance)

  if (isApproximate.value) {
    const area = L.circle(coordinates, {
      color: '#d97706',
      fillColor: '#f59e0b',
      fillOpacity: 0.2,
      radius: APPROXIMATE_RADIUS_METERS,
      weight: 2,
    }).addTo(mapInstance)

    mapInstance.fitBounds(area.getBounds(), {
      padding: [24, 24],
    })
    return
  }

  L.circleMarker(coordinates, {
    color: '#0f766e',
    fillColor: '#14b8a6',
    fillOpacity: 0.9,
    radius: 8,
    weight: 3,
  }).addTo(mapInstance)

  mapInstance.setView(coordinates, 15)
}

onMounted(() => {
  if (hasCoordinates.value) {
    renderMap()
  }
})

watch(mapRenderKey, () => {
  if (hasCoordinates.value) {
    renderMap()
    return
  }

  destroyMap()
})

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<template>
  <section class="result-map">
    <div class="map-header">
      <p class="eyebrow">
        Step 3
      </p>
      <h2>{{ mapTitle }}</h2>
    </div>

    <div
      v-if="hasCoordinates"
      class="map-state map-state-has-coordinates"
    >
      <div
        ref="mapContainer"
        class="map-canvas"
        data-testid="leaflet-map"
      />
      <p class="label">
        {{ result.primaryResult.label }}
      </p>
      <p class="coordinates">
        {{ latitude }}, {{ longitude }}
      </p>
      <p class="hint">
        {{ result.resultType === 'precise' ? '座標直接來自照片 metadata。' : '這組座標是 AI 推測的約略位置。' }}
      </p>
      <a
        :href="googleMapsUrl"
        class="map-link"
        rel="noreferrer"
        target="_blank"
      >
        在 Google Maps 開啟
      </a>
    </div>

    <div
      v-else
      class="map-state map-state-empty"
    >
      <p>
        沒有可用座標，因此目前無法提供地圖定位或外部地圖連結。
      </p>
    </div>
  </section>
</template>

<style scoped>
.result-map {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(14, 116, 144, 0.12);
  border-radius: 1.25rem;
  background:
    linear-gradient(135deg, rgba(186, 230, 253, 0.35), rgba(255, 255, 255, 0.96)),
    #fff;
}

.map-header h2,
.map-header p,
.map-state p {
  margin: 0;
}

.eyebrow {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.map-state {
  display: grid;
  gap: 0.75rem;
  padding: 1.1rem;
  border-radius: 1rem;
}

.map-state-has-coordinates {
  background: rgba(255, 255, 255, 0.86);
}

.map-canvas {
  min-height: 280px;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(15, 118, 110, 0.16);
}

.map-state-empty {
  background: rgba(248, 250, 252, 0.9);
  color: #475569;
}

.label {
  font-size: 1.1rem;
  font-weight: 700;
}

.coordinates {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: #0f172a;
}

.hint {
  color: #475569;
  line-height: 1.6;
}

.map-link {
  width: fit-content;
  padding: 0.7rem 0.95rem;
  border-radius: 999px;
  background: #0f766e;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}
</style>
