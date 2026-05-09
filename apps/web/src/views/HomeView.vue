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
    case 'submitting': return 'Reading clues · 翻找線索'
    case 'awaiting-location': return 'Need a fix · 缺少位置'
    case 'success': return 'Found a fix · 已有結果'
    case 'error': return 'Trail went cold · 需要重試'
    default: return 'Stand by · 準備就緒'
  }
})

async function handlePhotoSubmit(photo: File) {
  try { await analysisStore.submitPhoto(photo) }
  catch { /* store exposes the error */ }
}

async function handleUseDeviceLocation() {
  try { await analysisStore.useDeviceLocation() }
  catch { /* store exposes the error */ }
}

async function handleSkipLocation() {
  try { await analysisStore.skipLocation() }
  catch { /* store exposes the error */ }
}
</script>

<template>
  <main class="home">
    <!-- Hero (only when idle / first time) -->
    <section v-if="status === 'idle'" class="hero">
      <p class="eyebrow">
        · Entry №247 ·
      </p>
      <h1 class="hero-title">
        Where<br>
        <em>did</em> I take<br>
        this photo?
      </h1>
      <p class="hero-sub">
        一張照片，沿著線索折開地圖。<br>
        EXIF 先讀，沒座標就交給 AI 推測，證據不足會說不夠。
      </p>
      <p class="status-line" data-testid="analysis-status">
        <span class="status-dot" :data-state="status" />
        {{ statusLabel }}
      </p>
    </section>

    <!-- Upload -->
    <section class="upload-wrap" :data-state="status">
      <UploadPanel
        :status="status"
        @submit="handlePhotoSubmit"
      />
    </section>

    <!-- Results -->
    <section
      v-if="status !== 'idle'"
      class="results"
      :aria-busy="status === 'submitting'"
    >
      <header class="results-head">
        <p class="eyebrow">
          · Field Report ·
        </p>
        <h2>分析結果</h2>
        <span
          v-if="status === 'submitting'"
          class="pill pill-loading"
          data-testid="results-loading-pill"
        >
          <span class="spinner" aria-hidden="true" /> Reading clues…
        </span>
      </header>

      <div
        v-if="status === 'submitting'"
        class="loading-card"
        role="status"
        aria-live="polite"
        data-testid="results-loading"
      >
        <ol class="loading-steps">
          <li class="done">
            <span class="step-mark" /> EXIF / GPS metadata <em>讀取相片標頭</em>
          </li>
          <li class="active">
            <span class="step-mark" /> Visual landmarks <em>辨識視覺地標</em>
          </li>
          <li>
            <span class="step-mark" /> Cross-reference atlas <em>比對地圖庫</em>
          </li>
          <li>
            <span class="step-mark" /> Triangulate confidence <em>計算信心區間</em>
          </li>
        </ol>
        <p class="loading-quote">
          “Look for the small things.” — 留意細節
        </p>
      </div>

      <div
        v-else-if="status === 'awaiting-location'"
        class="awaiting-card"
        data-testid="awaiting-location"
      >
        <p class="eyebrow">
          · No GPS metadata ·
        </p>
        <p class="awaiting-title">
          照片裡沒夾帶位置。
        </p>
        <p class="awaiting-msg">
          手機相簿大多會把 GPS 剝掉再交給網頁，是隱私機制不是 bug。
          要我用「裝置目前的位置」當參考點，還是直接交給 AI 推測？
        </p>
        <p v-if="errorMessage" class="awaiting-error">
          {{ errorMessage }}
        </p>
        <div class="awaiting-actions">
          <button
            class="btn btn-primary"
            type="button"
            data-testid="use-device-location"
            @click="handleUseDeviceLocation"
          >
            Use my location · 使用目前位置
          </button>
          <button
            class="btn btn-ghost"
            type="button"
            data-testid="skip-location"
            @click="handleSkipLocation"
          >
            Skip · 直接交給 AI
          </button>
        </div>
        <p class="awaiting-foot">
          ※ 「目前位置」是現在的，不是拍照當下的。對舊照可能完全錯，請斟酌。
        </p>
      </div>

      <div
        v-else-if="status === 'error'"
        class="error-card"
        data-testid="results-error"
      >
        <p class="eyebrow eyebrow-rust">
          · Inconclusive ·
        </p>
        <p class="error-title">
          The trail went cold.
        </p>
        <p class="error-msg">
          {{ errorMessage }}
        </p>
      </div>

      <div
        v-else-if="status === 'success' && result"
        class="results-grid"
      >
        <ResultCard :result="result" />
        <ResultMap :result="result" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.home {
  width: min(1280px, calc(100% - 2.5rem));
  margin: 0 auto;
  padding: 1.75rem 0 2.5rem;
  display: grid;
  gap: 2rem;
}

/* Hero */
.hero { padding: 1rem 0 0.5rem; }

.hero-title {
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(2.6rem, 7vw, 5.5rem);
  line-height: 0.92;
  letter-spacing: -0.04em;
  margin: 0.5rem 0 0;
  text-wrap: balance;
}

.hero-title em {
  font-style: italic;
  color: var(--amber);
}

.hero-sub {
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  color: var(--ink-2);
  line-height: 1.5;
  margin: 1.25rem 0 0;
  max-width: 32rem;
}

.status-line {
  margin: 1.5rem 0 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}

.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--ink-2);
}
.status-dot[data-state="submitting"] { background: var(--amber); animation: a-pulse 1.2s infinite; }
.status-dot[data-state="success"] { background: var(--green); }
.status-dot[data-state="error"] { background: var(--rust); }

@keyframes a-pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }

/* Upload card */
.upload-wrap {
  padding: 1.5rem;
  border: 1px solid var(--edge);
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: var(--shadow-paper);
}

/* Results */
.results { display: grid; gap: 1rem; }

.results-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--edge);
}
.results-head h2 {
  font-family: var(--serif);
  font-weight: 400;
  font-size: 1.6rem;
  margin: 0;
  letter-spacing: -0.01em;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.pill-loading {
  background: rgba(184, 120, 43, 0.12);
  color: var(--amber);
}
.spinner {
  width: 0.8rem; height: 0.8rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Loading detective panel */
.loading-card {
  padding: 1.25rem 1.4rem;
  border: 1px solid var(--edge);
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.55);
}
.loading-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.1rem;
}
.loading-steps li {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 0.6rem;
  align-items: center;
  padding: 0.55rem 0;
  border-top: 1px dashed var(--edge);
  font-size: 0.95rem;
  color: var(--ink-2);
}
.loading-steps li:first-child { border-top: none; }
.loading-steps li em { display: block; font-style: normal; font-size: 0.72rem; color: var(--ink-2); }
.loading-steps .step-mark {
  width: 16px; height: 16px; border-radius: 50%;
  border: 1.5px solid var(--edge);
}
.loading-steps .done { color: var(--ink); }
.loading-steps .done .step-mark { background: var(--ink); border-color: var(--ink); }
.loading-steps .active { color: var(--ink); font-weight: 600; }
.loading-steps .active .step-mark {
  border-color: var(--ink);
  background: radial-gradient(circle, var(--amber) 0 5px, transparent 5.5px);
  animation: a-pulse 1.2s infinite;
}
.loading-quote {
  margin: 1rem 0 0;
  font-family: var(--serif);
  font-style: italic;
  color: var(--ink-2);
  text-align: center;
}

/* Awaiting location */
.awaiting-card {
  padding: 1.5rem;
  border-radius: var(--r-md);
  background: rgba(184, 120, 43, 0.06);
  border: 1px dashed rgba(184, 120, 43, 0.45);
  display: grid;
  gap: 0.65rem;
}
.awaiting-title {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.4rem;
  margin: 0.2rem 0 0;
  color: var(--ink);
}
.awaiting-msg {
  margin: 0;
  color: var(--ink-2);
  line-height: 1.55;
}
.awaiting-error {
  margin: 0;
  color: var(--rust);
  font-size: 0.85rem;
}
.awaiting-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.4rem;
}
.awaiting-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.7rem 1.05rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}
.awaiting-actions .btn-primary {
  background: var(--ink); color: var(--paper); border-color: var(--ink);
}
.awaiting-actions .btn-ghost {
  background: transparent; color: var(--ink); border-color: var(--ink);
}
.awaiting-foot {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--ink-2);
}

/* Error */
.error-card {
  padding: 1.5rem;
  border-radius: var(--r-md);
  background: rgba(160, 74, 31, 0.06);
  border: 1px dashed rgba(160, 74, 31, 0.4);
}
.eyebrow-rust { color: var(--rust); }
.error-title {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.6rem;
  margin: 0.4rem 0 0.5rem;
  color: var(--rust);
}
.error-msg { margin: 0; color: var(--ink-2); line-height: 1.55; }

/* Result grid */
.results-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .results-grid {
    grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
    align-items: start;
  }
}
</style>
