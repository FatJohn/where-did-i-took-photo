import { createRouter, createWebHistory } from 'vue-router'

import HistoryView from '@/views/HistoryView.vue'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/history/:visitorId?',
      name: 'history',
      component: HistoryView,
    },
  ],
})
