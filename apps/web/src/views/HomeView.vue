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

async function handlePhotoSelected(photo: File) {
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
      <UploadPanel @select="handlePhotoSelected" />

      <p
        v-if="status === 'submitting'"
        class="helper-text"
      >
        正在解析照片、整理 EXIF，並在必要時交給 AI 推測位置。
      </p>
      <p
        v-else-if="status === 'error'"
        class="helper-text helper-text-error"
      >
        分析失敗：{{ errorMessage }}
      </p>

      <h2>也可以直接跑既有 demo flow</h2>
      <p>
        這個按鈕會維持既有示範提交流程，方便快速驗證 API 與頁面整合。
      </p>

      <div class="actions">
        <button
          data-testid="submit-demo"
          class="demo-button"
          type="button"
          @click="analysisStore.submitDemo()"
        >
          分析示範照片
        </button>
        <RouterLink
          data-testid="history-link"
          class="history-link"
          to="/history"
        >
          查看匿名歷史
        </RouterLink>
      </div>
    </section>

    <section
      v-if="status === 'success' && result"
      class="results-grid"
    >
      <ResultCard :result="result" />
      <ResultMap :result="result" />
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
.results-grid {
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

h1,
h2 {
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

.foundation-card p {
  margin-bottom: 1rem;
  line-height: 1.7;
}

.helper-text {
  margin-top: 1rem;
  color: #475569;
}

.helper-text-error {
  color: #b91c1c;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.results-grid {
  display: grid;
  gap: 1rem;
}

.history-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: #92400e;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.demo-button {
  border: 0;
  cursor: pointer;
  font: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: #1f2937;
  color: #fff;
  font-weight: 600;
}
</style>
