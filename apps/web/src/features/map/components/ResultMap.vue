<script setup lang="ts">
import type { Map as LeafletMap } from 'leaflet'
import type { AnalysisResult } from '@/shared/types/contracts'
import * as L from 'leaflet'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ result: AnalysisResult }>()

// Stamen-style sepia-ish tiles via CARTO Voyager — reads as paper-feel
const TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap, &copy; CARTO',
}
const APPROX_RADIUS_M = 1800

const mapEl = ref<HTMLElement | null>(null)
const lat = computed(() => props.result.primaryResult.latitude)
const lng = computed(() => props.result.primaryResult.longitude)
const hasCoords = computed(() => lat.value !== null && lng.value !== null)
const isApprox = computed(() => props.result.resultType === 'approximate')

const mapsUrl = computed(() => hasCoords.value
  ? `https://www.google.com/maps/search/?api=1&query=${lat.value},${lng.value}`
  : '')

const renderKey = computed(() => [
  props.result.resultType,
  props.result.primaryResult.label,
  lat.value, lng.value,
].join(':'))

let map: LeafletMap | null = null

function destroy() { map?.remove(); map = null }

function render() {
  if (!mapEl.value || lat.value === null || lng.value === null) { destroy(); return }
  destroy()
  const c: [number, number] = [lat.value, lng.value]
  map = L.map(mapEl.value, { scrollWheelZoom: false, zoomControl: false })
  L.control.zoom({ position: 'topright' }).addTo(map)
  L.tileLayer(TILE.url, { attribution: TILE.attribution }).addTo(map)

  if (isApprox.value) {
    const halo = L.circle(c, {
      color: '#b8782b', fillColor: '#e8c389',
      fillOpacity: 0.25, radius: APPROX_RADIUS_M, weight: 2,
    }).addTo(map)
    map.fitBounds(halo.getBounds(), { padding: [28, 28] })
    return
  }

  // Precise: rust pin marker
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#a04a1f;border:3px solid #f5efe4;box-shadow:0 4px 12px rgba(0,0,0,0.25);"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  })
  L.marker(c, { icon }).addTo(map)
  map.setView(c, 15)
}

onMounted(() => { if (hasCoords.value) render() })
watch(renderKey, () => { hasCoords.value ? render() : destroy() })
onBeforeUnmount(destroy)
</script>

<template>
  <section class="map-card">
    <header class="map-head">
      <p class="eyebrow">
        · {{ isApprox ? 'Approximate area' : hasCoords ? 'Pinned location' : 'No coordinates' }} ·
      </p>
      <h2>
        <template v-if="hasCoords">
          {{ result.primaryResult.label }}
        </template>
        <template v-else>
          沒有可用座標
        </template>
      </h2>
    </header>

    <div v-if="hasCoords" class="map-shell">
      <div ref="mapEl" class="map-canvas" data-testid="leaflet-map" />
      <span class="compass" aria-hidden="true">N↑</span>
      <p class="coord-tag">
        <span>{{ lat?.toFixed(5) }}°</span><span>{{ (lat ?? 0) >= 0 ? 'N' : 'S' }}</span>
        <span class="dot">·</span>
        <span>{{ lng?.toFixed(5) }}°</span><span>{{ (lng ?? 0) >= 0 ? 'E' : 'W' }}</span>
      </p>
    </div>

    <div v-else class="empty">
      <p>沒有可用座標，因此目前無法提供地圖定位或外部地圖連結。</p>
      <p class="muted">
        Try a wider angle, an outdoor sign, or an original camera file with EXIF.
      </p>
    </div>

    <a
      v-if="hasCoords"
      :href="mapsUrl"
      class="map-link"
      rel="noreferrer"
      target="_blank"
    >
      Open in Google Maps · 在 Google Maps 開啟
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
    </a>
  </section>
</template>

<style scoped>
.map-card {
  display: grid;
  gap: 1rem;
  padding: 1.4rem;
  border: 1px solid var(--edge);
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-paper);
}
.map-head h2 {
  font-family: var(--serif); font-weight: 400;
  font-size: 1.4rem; line-height: 1.15; margin: 0.3rem 0 0;
  letter-spacing: -0.01em;
}

.map-shell {
  position: relative;
  border-radius: var(--r-sm);
  overflow: hidden;
  border: 1px solid var(--edge);
  background: var(--paper-warm);
}
.map-canvas {
  height: clamp(280px, 50vh, 520px);
  background: var(--paper-warm);
}
:deep(.leaflet-container) {
  background: var(--paper-warm);
  font-family: var(--sans);
  filter: sepia(0.18) saturate(0.85);
}
:deep(.leaflet-control-attribution) {
  font-family: var(--mono);
  font-size: 9px;
  background: rgba(245, 239, 228, 0.85);
}
:deep(.leaflet-bar a) {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--edge);
}

.compass {
  position: absolute; left: 14px; top: 14px; z-index: 400;
  width: 40px; height: 40px; border-radius: 50%;
  border: 1px solid var(--ink); background: rgba(245,239,228,0.92);
  display: grid; place-items: center;
  font-family: var(--serif); font-size: 0.85rem;
  pointer-events: none;
}
.coord-tag {
  position: absolute; bottom: 10px; left: 10px; z-index: 400;
  display: inline-flex; gap: 0.25rem; align-items: baseline;
  padding: 0.3rem 0.6rem;
  background: var(--paper); border: 1px solid var(--edge);
  font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.06em;
  color: var(--ink);
  margin: 0;
}
.coord-tag .dot { color: var(--amber); margin: 0 0.2rem; }

.empty {
  padding: 1.2rem;
  background: var(--paper-warm);
  border: 1px dashed var(--edge);
  border-radius: var(--r-sm);
  display: grid; gap: 0.4rem;
}
.empty p { margin: 0; color: var(--ink-2); line-height: 1.6; }
.empty .muted { font-style: italic; font-family: var(--serif); }

.map-link {
  display: inline-flex; align-items: center; gap: 0.5rem;
  width: fit-content;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--ink); color: var(--paper);
  text-decoration: none; font-weight: 600; font-size: 0.9rem;
  transition: transform 0.1s;
}
.map-link:hover { background: #1c1814; }
.map-link:active { transform: translateY(1px); }
</style>
