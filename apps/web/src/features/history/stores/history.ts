import type { AnalysisResult } from '@/shared/types/contracts'
import { defineStore } from 'pinia'

import { fetchHistory } from '@/shared/api/client'

export type HistoryStatus = 'idle' | 'loading' | 'success' | 'error'

interface HistoryState {
  status: HistoryStatus
  items: AnalysisResult[]
  errorMessage: string
}

export const useHistoryStore = defineStore('history', {
  state: (): HistoryState => ({
    status: 'idle',
    items: [],
    errorMessage: '',
  }),
  actions: {
    async load(visitorId: string) {
      this.status = 'loading'
      this.items = []
      this.errorMessage = ''

      try {
        const response = await fetchHistory(visitorId)
        this.items = response.items
        this.status = 'success'
      }
      catch (error) {
        this.status = 'error'
        this.errorMessage = error instanceof Error ? error.message : '歷史載入失敗'
        throw error
      }
    },
    reset() {
      this.status = 'idle'
      this.items = []
      this.errorMessage = ''
    },
  },
})
