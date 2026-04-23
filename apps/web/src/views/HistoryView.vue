<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useHistoryStore } from '@/features/history/stores/history'
import { getStoredVisitorId } from '@/shared/api/client'

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
  if (!visitorId) {
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
</script>

<template>
  <main class="history-view">
    <section class="history-card">
      <h1>匿名歷史</h1>
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
        >
          {{ item.primaryResult.label }}
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

.back-link {
  display: inline-flex;
  margin-top: 1rem;
  color: #92400e;
  font-weight: 600;
  text-decoration: none;
}
</style>
