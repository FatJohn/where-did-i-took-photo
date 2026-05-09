<script setup lang="ts">
import type { AnalysisResult } from '@/shared/types/contracts'
import { computed, ref } from 'vue'

const props = defineProps<{ result: AnalysisResult }>()

const activeIdx = ref(0)
const candidates = computed(() => props.result.candidates ?? [])

const badge = computed(() => {
  switch (props.result.resultType) {
    case 'precise': return { label: 'Found it · 精準定位', tone: 'green' }
    case 'approximate': return { label: 'Approximate · 約略位置', tone: 'amber' }
    default: return { label: 'Inconclusive · 無法判定', tone: 'mute' }
  }
})

const sourceLabel = computed(() => {
  switch (props.result.source) {
    case 'exif': return 'EXIF · GPS'
    case 'device': return 'Device · 目前位置'
    case 'ai':
    default: return 'AI · 推測'
  }
})
const confidencePct = computed(() => Math.round(props.result.primaryResult.confidence * 100))
const createdAtLabel = computed(() => new Date(props.result.createdAt).toLocaleString('zh-TW'))

const hasCoords = computed(() => (
  props.result.primaryResult.latitude !== null
  && props.result.primaryResult.longitude !== null
))
</script>

<template>
  <article class="result-card">
    <header class="head">
      <div class="head-meta">
        <span class="badge" :data-tone="badge.tone">
          <span class="badge-dot" />{{ badge.label }}
        </span>
        <span class="meta-time">{{ createdAtLabel }}</span>
      </div>
      <h2 class="title">
        {{ result.primaryResult.label }}
      </h2>
    </header>

    <p class="reason">
      <span class="eyebrow">Why here</span>
      {{ result.primaryResult.reasonSummary }}
    </p>

    <dl class="facts">
      <div>
        <dt>Source · 來源</dt>
        <dd>{{ sourceLabel }}</dd>
      </div>
      <div>
        <dt>Confidence · 信心</dt>
        <dd>
          <span class="confbar">
            <span :style="{ width: `${confidencePct}%` }" />
          </span>
          <span class="confnum">{{ confidencePct }}%</span>
        </dd>
      </div>
      <div>
        <dt>Coordinates · 座標</dt>
        <dd v-if="hasCoords" class="coord">
          {{ result.primaryResult.latitude }}, {{ result.primaryResult.longitude }}
        </dd>
        <dd v-else class="muted">
          無可用座標
        </dd>
      </div>
    </dl>

    <section v-if="candidates.length > 0" class="candidates">
      <p class="eyebrow">
        Candidates · 候選地點 · {{ candidates.length }}
      </p>
      <div class="cand-list">
        <button
          v-for="(c, i) in candidates"
          :key="`${result.searchId}-${c.label}`"
          class="cand"
          :class="{ active: i === activeIdx }"
          type="button"
          @click="activeIdx = i"
        >
          <div class="cand-row">
            <span class="cand-label">{{ c.label }}</span>
            <span class="cand-pct">{{ Math.round(c.confidence * 100) }}%</span>
          </div>
          <div class="confbar">
            <span :style="{ width: `${c.confidence * 100}%` }" />
          </div>
          <p v-if="c.clues?.length" class="cand-clues">
            {{ c.clues.join(' · ') }}
          </p>
        </button>
      </div>
    </section>
  </article>
</template>

<style scoped>
.result-card {
  display: grid;
  gap: 1.1rem;
  padding: 1.4rem;
  border: 1px solid var(--edge);
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.65);
  box-shadow: var(--shadow-paper);
}

.head { display: grid; gap: 0.5rem; }
.head-meta {
  display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap: 0.5rem;
}
.title {
  font-family: var(--serif); font-weight: 400;
  font-size: 1.7rem; line-height: 1.1;
  letter-spacing: -0.02em; margin: 0;
}

.badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.7rem; border-radius: 999px;
  font-size: 0.78rem; font-weight: 600;
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; }
.badge[data-tone="green"] { background: rgba(74,107,58,0.14); color: var(--green); }
.badge[data-tone="green"] .badge-dot { background: var(--green); }
.badge[data-tone="amber"] { background: rgba(184,120,43,0.14); color: var(--amber); }
.badge[data-tone="amber"] .badge-dot { background: var(--amber); }
.badge[data-tone="mute"] { background: rgba(90,77,63,0.12); color: var(--ink-2); }
.badge[data-tone="mute"] .badge-dot { background: var(--ink-2); }

.meta-time {
  font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.06em;
  color: var(--ink-2);
}

.reason {
  font-family: var(--serif); font-size: 1rem;
  line-height: 1.55; color: var(--ink); margin: 0;
  padding: 0.8rem 1rem;
  background: var(--paper-warm);
  border-left: 2px solid var(--amber);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}
.reason .eyebrow { display: block; margin-bottom: 0.25rem; font-size: 0.62rem; }

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem;
  margin: 0;
}
.facts > div {
  padding: 0.7rem 0.85rem;
  border-radius: var(--r-sm);
  background: var(--paper-warm);
  border: 1px solid var(--edge);
}
.facts dt {
  margin-bottom: 0.25rem;
  font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.12em;
  color: var(--ink-2); text-transform: uppercase;
}
.facts dd { margin: 0; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 0.5rem; }
.facts dd.coord { font-family: var(--mono); font-size: 0.85rem; }
.facts dd.muted { color: var(--ink-2); font-weight: 400; }

.confbar {
  display: block;
  flex: 1; height: 3px; background: var(--edge); border-radius: 2px; overflow: hidden;
  min-width: 60px;
}
.confbar > span { display: block; height: 100%; background: var(--amber); transition: width 0.3s; }
.confnum { font-family: var(--mono); font-size: 0.78rem; color: var(--ink-2); }

.candidates { display: grid; gap: 0.6rem; }
.cand-list { display: grid; gap: 0.5rem; }
.cand {
  display: grid; gap: 0.45rem;
  padding: 0.85rem 1rem;
  border-radius: var(--r-sm);
  border: 1px solid var(--edge);
  background: rgba(255, 255, 255, 0.45);
  text-align: left; cursor: pointer; font: inherit;
  color: inherit; transition: border-color .15s, background .15s;
}
.cand:hover { border-color: var(--amber-soft); }
.cand.active { border-color: var(--amber); background: rgba(184,120,43,0.08); }
.cand-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
.cand-label { font-family: var(--serif); font-size: 1.05rem; }
.cand-pct { font-family: var(--mono); font-weight: 700; font-size: 0.8rem; color: var(--ink-2); }
.cand.active .cand-pct { color: var(--amber); }
.cand .confbar > span { background: var(--ink-2); }
.cand.active .confbar > span { background: var(--amber); }
.cand-clues { margin: 0; font-size: 0.82rem; color: var(--ink-2); line-height: 1.55; }
</style>
