import type { AnalysisResult } from '@/shared/types/contracts'
import { defineStore } from 'pinia'

import { analyzePhoto } from '@/shared/api/client'

export type AnalysisStatus = 'idle' | 'submitting' | 'success' | 'error'

interface AnalysisState {
  status: AnalysisStatus
  result: AnalysisResult | null
  errorMessage: string
}

export const useAnalysisStore = defineStore('analysis', {
  state: (): AnalysisState => ({
    status: 'idle',
    result: null,
    errorMessage: '',
  }),
  actions: {
    async submitPhoto(photo: File) {
      this.status = 'submitting'
      this.errorMessage = ''

      try {
        this.result = await analyzePhoto({ photo })
        this.status = 'success'
      }
      catch (error) {
        this.status = 'error'
        this.errorMessage = error instanceof Error ? error.message : '分析失敗'
        throw error
      }
    },
    async submitDemo() {
      const demoPhoto = new File(['demo photo'], 'demo-photo.jpg', {
        type: 'image/jpeg',
      })

      await this.submitPhoto(demoPhoto)
    },
    clear() {
      this.status = 'idle'
      this.result = null
      this.errorMessage = ''
    },
  },
})
