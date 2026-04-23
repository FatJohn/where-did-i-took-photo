<script setup lang="ts">
import type { AnalysisResult } from '@/shared/types/contracts'
import { computed } from 'vue'

const props = defineProps<{
  result: AnalysisResult
}>()

const badgeLabel = computed(() => {
  switch (props.result.resultType) {
    case 'precise':
      return '精準定位'
    case 'approximate':
      return '約略位置'
    default:
      return '無法判定'
  }
})

const confidenceLabel = computed(() => `${Math.round(props.result.primaryResult.confidence * 100)}%`)

const createdAtLabel = computed(() => new Date(props.result.createdAt).toLocaleString('zh-TW'))

const hasCoordinates = computed(() => (
  props.result.primaryResult.latitude !== null
  && props.result.primaryResult.longitude !== null
))

function formatCandidateConfidence(value: number) {
  return `${Math.round(value * 100)}%`
}
</script>

<template>
  <article class="result-card">
    <header class="result-header">
      <div class="heading">
        <span
          class="badge"
          :class="`badge-${result.resultType}`"
        >
          {{ badgeLabel }}
        </span>
        <h2>{{ result.primaryResult.label }}</h2>
      </div>
      <p class="meta">
        {{ createdAtLabel }}
      </p>
    </header>

    <p class="summary">
      {{ result.primaryResult.reasonSummary }}
    </p>

    <dl class="facts">
      <div>
        <dt>來源</dt>
        <dd>{{ result.source === 'exif' ? 'EXIF / GPS' : 'AI 推測' }}</dd>
      </div>
      <div>
        <dt>信心</dt>
        <dd>{{ confidenceLabel }}</dd>
      </div>
      <div>
        <dt>座標</dt>
        <dd v-if="hasCoordinates">
          {{ result.primaryResult.latitude }}, {{ result.primaryResult.longitude }}
        </dd>
        <dd v-else>
          無可用座標
        </dd>
      </div>
    </dl>

    <section
      v-if="result.candidates.length > 0"
      class="candidates"
    >
      <h3>可能候選</h3>
      <ol>
        <li
          v-for="candidate in result.candidates"
          :key="`${result.searchId}-${candidate.label}`"
        >
          <p class="candidate-label">
            {{ candidate.label }}
            <span>{{ formatCandidateConfidence(candidate.confidence) }}</span>
          </p>
          <p class="candidate-clues">
            {{ candidate.clues.join(' / ') }}
          </p>
        </li>
      </ol>
    </section>
  </article>
</template>

<style scoped>
.result-card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.95);
}

.result-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.heading {
  display: grid;
  gap: 0.5rem;
}

.heading h2,
.summary,
.meta,
.candidate-label,
.candidate-clues,
.candidates h3 {
  margin: 0;
}

.badge {
  width: fit-content;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.badge-precise {
  background: rgba(22, 163, 74, 0.14);
  color: #166534;
}

.badge-approximate {
  background: rgba(217, 119, 6, 0.16);
  color: #9a3412;
}

.badge-not_found {
  background: rgba(100, 116, 139, 0.14);
  color: #334155;
}

.meta,
.summary,
.candidate-clues {
  color: #475569;
  line-height: 1.6;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.facts div {
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: #f8fafc;
}

.facts dt {
  margin-bottom: 0.35rem;
  color: #64748b;
  font-size: 0.85rem;
}

.facts dd {
  margin: 0;
  color: #0f172a;
  font-weight: 600;
}

.candidates {
  display: grid;
  gap: 0.75rem;
}

.candidates ol {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding-left: 1.25rem;
}

.candidate-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-weight: 700;
}
</style>
