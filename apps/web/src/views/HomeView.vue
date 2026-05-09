<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useAnalysisStore } from '@/features/analysis/stores/analysis'
import ResultMap from '@/features/map/components/ResultMap.vue'
import ResultCard from '@/features/results/components/ResultCard.vue'
import UploadPanel from '@/features/upload/components/UploadPanel.vue'

const analysisStore = useAnalysisStore()
const { errorMessage, result, status } = storeToRefs(analysisStore)

const statusLabel = computed(() => {
  switch (status.value) {
    case 'submitting':
      return '分析中'
    case 'success':
      return '已有結果'
    case 'error':
      return '需要重試'
    default:
      return '準備就緒'
  }
})

async function handlePhotoSubmit(photo: File) {
  try {
    await analysisStore.submitPhoto(photo)
  }
  catch {
    // The store already exposes the error state for the view.
  }
}
</script>

<template>
  <main class="home-view">
    <section class="hero">
      <p class="eyebrow">
        Photo Location Tool
      </p>
      <h1>照片定位工具</h1>
      <p class="summary">
        EXIF / GPS metadata 優先，沒有座標時再交給 AI 推測，證據不足就明確回傳無法判定。
      </p>
      <p
        data-testid="analysis-status"
        class="status"
      >
        分析狀態：{{ statusLabel }}
      </p>
    </section>

    <section class="foundation-card">
      <UploadPanel
        :status="status"
        @submit="handlePhotoSubmit"
      />
    </section>

    <section
      class="results-section"
      :aria-busy="status === 'submitting'"
    >
      <header class="results-header">
        <h2>分析結果</h2>
        <span
          v-if="status === 'submitting'"
          class="results-pill results-pill-loading"
          data-testid="results-loading-pill"
        >
          <span class="spinner" aria-hidden="true" />
          分析中…
        </span>
      </header>

      <div
        v-if="status === 'submitting'"
        class="results-loading"
        role="status"
        aria-live="polite"
        data-testid="results-loading"
      >
        <div class="skeleton skeleton-line skeleton-line-lg" />
        <div class="skeleton skeleton-line" />
        <div class="skeleton skeleton-line skeleton-line-sm" />
        <div class="skeleton skeleton-block" />
        <p class="loading-hint">
          正在解析 EXIF 並在必要時交給 AI 推測位置，請稍候…
        </p>
      </div>

      <div
        v-else-if="status === 'error'"
        class="results-error"
        data-testid="results-error"
      >
        <p class="results-error-title">
          分析失敗
        </p>
        <p>{{ errorMessage }}</p>
      </div>

      <div
        v-else-if="status === 'success' && result"
        class="results-grid"
      >
        <ResultCard :result="result" />
        <ResultMap :result="result" />
      </div>

      <p
        v-else
        class="results-empty"
        data-testid="results-empty"
      >
        上傳照片後，分析結果會顯示在這裡。
      </p>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  display: grid;
  gap: 1.5rem;
  width: min(960px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 3rem;
}

.hero,
.foundation-card,
.results-section {
  padding: 1.5rem;
  border: 1px solid rgba(146, 64, 14, 0.12);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 45px rgba(148, 163, 184, 0.08);
}

.eyebrow {
  margin: 0 0 0.75rem;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
}

.summary {
  max-width: 42rem;
  margin: 1rem 0;
  line-height: 1.7;
}

.status {
  margin: 0;
  color: #475569;
}

.results-section {
  display: grid;
  gap: 1rem;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.results-header h2 {
  margin: 0;
}

.results-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.results-pill-loading {
  background: rgba(146, 64, 14, 0.12);
  color: #92400e;
}

.spinner {
  width: 0.85rem;
  height: 0.85rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.results-empty {
  margin: 0;
  padding: 2rem;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.7);
  color: #64748b;
  text-align: center;
}

.results-loading {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.95);
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(226, 232, 240, 0.7) 0%,
    rgba(241, 245, 249, 0.95) 50%,
    rgba(226, 232, 240, 0.7) 100%
  );
  background-size: 200% 100%;
  border-radius: 0.5rem;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-line {
  height: 0.9rem;
}

.skeleton-line-lg {
  height: 1.4rem;
  width: 60%;
}

.skeleton-line-sm {
  height: 0.9rem;
  width: 40%;
}

.skeleton-block {
  height: 220px;
  border-radius: 0.85rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.loading-hint {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.results-error {
  display: grid;
  gap: 0.35rem;
  padding: 1.25rem;
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 1rem;
  background: rgba(254, 242, 242, 0.9);
  color: #b91c1c;
}

.results-error p {
  margin: 0;
  line-height: 1.6;
}

.results-error-title {
  font-weight: 700;
}

.results-grid {
  display: grid;
  gap: 1rem;
}
</style>
