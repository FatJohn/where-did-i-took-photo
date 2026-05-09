<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useHistoryStore } from '@/features/history/stores/history'
import ResultCard from '@/features/results/components/ResultCard.vue'
import { getStoredVisitorId, getStoredVisitorToken } from '@/shared/api/client'

const route = useRoute()
const historyStore = useHistoryStore()
const { errorMessage, items, status } = storeToRefs(historyStore)

const resolvedVisitorId = computed(() => {
  const visitorIdParam = route.params.visitorId

  if (typeof visitorIdParam === 'string' && visitorIdParam.length > 0) {
    return visitorIdParam
  }

  return getStoredVisitorId()
})

watch(resolvedVisitorId, async (visitorId) => {
  if (!visitorId || !getStoredVisitorToken()) {
    historyStore.reset()
    return
  }

  try {
    await historyStore.load(visitorId)
  }
  catch {
    // The store already exposes the error state for the view.
  }
}, {
  immediate: true,
})

const historySummary = computed(() => {
  if (items.value.length === 0) {
    return ''
  }

  return `共 ${items.value.length} 筆分析結果`
})
</script>

<template>
  <main class="history-view">
    <section class="history-card">
      <h1>匿名歷史</h1>
      <p
        v-if="status === 'success' && historySummary"
        class="history-summary"
      >
        {{ historySummary }}
      </p>
      <p v-if="status === 'idle'">
        尚未找到可用的訪客歷史。先回首頁完成一次分析，或直接開啟帶有 visitor id 的歷史網址。
      </p>
      <p v-else-if="status === 'loading'">
        正在載入歷史資料...
      </p>
      <p v-else-if="status === 'error'">
        歷史資料載入失敗：{{ errorMessage }}
      </p>
      <ul v-else-if="items.length > 0">
        <li
          v-for="item in items"
          :key="item.searchId"
          class="history-item"
        >
          <img
            :alt="`${item.primaryResult.label} thumbnail`"
            :src="item.thumbnailUrl"
            class="history-thumbnail"
          >
          <ResultCard :result="item" />
        </li>
      </ul>
      <p v-else>
        目前還沒有歷史資料。
      </p>

      <RouterLink
        class="back-link"
        to="/"
      >
        回到首頁
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.history-view {
  width: min(960px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 3rem;
}

.history-card {
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 45px rgba(148, 163, 184, 0.08);
}

h1 {
  margin-top: 0;
}

.history-summary {
  margin-top: -0.25rem;
  color: #475569;
}

ul {
  display: grid;
  gap: 1rem;
  padding: 0;
  margin: 1rem 0 0;
  list-style: none;
}

.history-item {
  display: grid;
  gap: 1rem;
}

.history-thumbnail {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 1rem;
  background: #e2e8f0;
}

.back-link {
  display: inline-flex;
  margin-top: 1rem;
  color: #92400e;
  font-weight: 600;
  text-decoration: none;
}
</style>
