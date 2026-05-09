<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useHistoryStore } from '@/features/history/stores/history'
import { getStoredVisitorId, getStoredVisitorToken } from '@/shared/api/client'

const route = useRoute()
const historyStore = useHistoryStore()
const { errorMessage, items, status } = storeToRefs(historyStore)

const resolvedVisitorId = computed(() => {
  const p = route.params.visitorId
  if (typeof p === 'string' && p.length > 0) return p
  return getStoredVisitorId()
})

watch(resolvedVisitorId, async (visitorId) => {
  if (!visitorId || !getStoredVisitorToken()) {
    historyStore.reset()
    return
  }
  try { await historyStore.load(visitorId) }
  catch { /* store exposes the error */ }
}, { immediate: true })

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}
function tone(kind: string) {
  return kind === 'precise' ? 'green' : kind === 'approximate' ? 'amber' : 'mute'
}
function kindLabel(kind: string, source: string) {
  if (kind === 'not_found') return '—'
  return source === 'exif' ? 'EXIF' : 'AI'
}
</script>

<template>
  <main class="history">
    <header class="history-head">
      <p class="eyebrow">
        · Travel Log · 旅行日誌 ·
      </p>
      <h1 class="title">
        Your <em>field log</em>
      </h1>
      <p v-if="status === 'success'" class="summary">
        共 {{ items.length }} 筆 · 匿名儲存
      </p>
    </header>

    <p v-if="status === 'idle'" class="empty">
      尚未找到可用的訪客歷史。先回首頁完成一次分析，或直接開啟帶有 visitor id 的歷史網址。
    </p>
    <p v-else-if="status === 'loading'" class="empty">
      Loading log... 正在載入歷史資料
    </p>
    <p v-else-if="status === 'error'" class="empty error">
      歷史資料載入失敗：{{ errorMessage }}
    </p>

    <ul v-else-if="items.length > 0" class="grid">
      <li
        v-for="(item, i) in items"
        :key="item.searchId"
        class="entry"
        :data-tone="tone(item.resultType)"
      >
        <div class="thumb-wrap">
          <img
            class="thumb"
            :src="item.thumbnailUrl"
            :alt="`${item.primaryResult.label} thumbnail`"
            loading="lazy"
          >
          <span class="tape" :style="{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }" aria-hidden="true" />
          <span class="kind-badge">{{ kindLabel(item.resultType, item.source) }}</span>
        </div>
        <div class="entry-body">
          <p class="entry-meta">
            <span class="dot" />
            <span>{{ fmtDate(item.createdAt) }} · {{ fmtTime(item.createdAt) }}</span>
            <span v-if="item.primaryResult.latitude !== null">
              · {{ item.primaryResult.latitude.toFixed(2) }}°
            </span>
          </p>
          <h3 class="entry-title">
            {{ item.primaryResult.label }}
          </h3>
          <p class="entry-reason">
            {{ item.primaryResult.reasonSummary }}
          </p>
          <div class="entry-foot">
            <div class="bar">
              <span :style="{ width: `${item.primaryResult.confidence * 100}%` }" />
            </div>
            <span class="pct">
              {{ item.resultType === 'not_found' ? '—' : `${Math.round(item.primaryResult.confidence * 100)}%` }}
            </span>
          </div>
        </div>
      </li>
    </ul>

    <p v-else class="empty">
      目前還沒有歷史資料。
    </p>

    <RouterLink class="back" to="/">
      ← Back to Find · 回到首頁
    </RouterLink>
  </main>
</template>

<style scoped>
.history {
  width: min(1280px, calc(100% - 2.5rem));
  margin: 0 auto;
  padding: 1.75rem 0 3rem;
  display: grid;
  gap: 1.5rem;
}

.history-head {
  display: grid;
  gap: 0.4rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--edge);
}
.title {
  font-family: var(--serif); font-weight: 400;
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  line-height: 1; letter-spacing: -0.03em;
  margin: 0.2rem 0 0;
}
.title em { font-style: italic; }
.summary {
  margin: 0.5rem 0 0;
  font-family: var(--mono); font-size: 0.78rem;
  letter-spacing: 0.08em; color: var(--ink-2);
}

.empty {
  padding: 2rem 1.5rem;
  text-align: center;
  color: var(--ink-2);
  border: 1px dashed var(--edge);
  border-radius: var(--r-md);
  background: var(--paper-warm);
}
.empty.error { color: var(--rust); border-color: rgba(160,74,31,0.4); }

.grid {
  list-style: none;
  padding: 0; margin: 0;
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}
@media (min-width: 720px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.entry {
  position: relative;
  border: 1px solid var(--edge);
  border-radius: var(--r-md);
  background: var(--paper-warm);
  overflow: hidden;
  box-shadow: var(--shadow-paper);
  display: grid; grid-template-rows: auto 1fr;
}

.thumb-wrap { position: relative; }
.thumb {
  width: 100%; aspect-ratio: 5/4; object-fit: cover;
  background: var(--paper-deep); display: block;
}
.tape {
  position: absolute; top: -8px; left: 22px;
  width: 56px; height: 18px;
  background: rgba(184, 120, 43, 0.35);
}
.kind-badge {
  position: absolute; top: 10px; right: 10px;
  padding: 3px 8px;
  background: var(--paper);
  font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.14em;
  border: 1px solid var(--edge);
  border-radius: 999px;
  font-weight: 700;
}
.entry[data-tone="green"] .kind-badge { color: var(--green); border-color: rgba(74,107,58,0.4); }
.entry[data-tone="amber"] .kind-badge { color: var(--amber); border-color: rgba(184,120,43,0.4); }

.entry-body { padding: 0.9rem 1.1rem 1.1rem; display: grid; gap: 0.5rem; }
.entry-meta {
  margin: 0;
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.08em;
  color: var(--ink-2);
}
.dot { width: 6px; height: 6px; border-radius: 50%; }
.entry[data-tone="green"] .dot { background: var(--green); }
.entry[data-tone="amber"] .dot { background: var(--amber); }
.entry[data-tone="mute"] .dot { background: var(--ink-2); }

.entry-title {
  font-family: var(--serif); font-weight: 400;
  font-size: 1.25rem; line-height: 1.15;
  margin: 0; letter-spacing: -0.01em;
}
.entry-reason {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-foot { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.2rem; }
.bar { flex: 1; height: 3px; background: var(--edge); border-radius: 2px; overflow: hidden; }
.bar > span { display: block; height: 100%; }
.entry[data-tone="green"] .bar > span { background: var(--green); }
.entry[data-tone="amber"] .bar > span { background: var(--amber); }
.entry[data-tone="mute"] .bar > span { background: var(--ink-2); }
.pct { font-family: var(--serif); font-size: 1.05rem; }
.entry[data-tone="green"] .pct { color: var(--green); }
.entry[data-tone="amber"] .pct { color: var(--amber); }
.entry[data-tone="mute"] .pct { color: var(--ink-2); }

.back {
  width: fit-content;
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--ink);
  color: var(--ink); font-weight: 600; font-size: 0.9rem;
  text-decoration: none;
  margin-top: 0.5rem;
}
.back:hover { background: rgba(43,37,32,0.06); }
</style>
