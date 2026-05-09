import type { ClientGps } from '@/shared/api/client'
import type { AnalysisResult } from '@/shared/types/contracts'
import { defineStore } from 'pinia'

import { analyzePhoto, readExifGps } from '@/shared/api/client'

export type AnalysisStatus = 'idle' | 'submitting' | 'awaiting-location' | 'success' | 'error'

interface AnalysisState {
  status: AnalysisStatus
  result: AnalysisResult | null
  errorMessage: string
  pendingPhoto: File | null
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('裝置不支援定位 API'))

      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    })
  })
}

export const useAnalysisStore = defineStore('analysis', {
  state: (): AnalysisState => ({
    status: 'idle',
    result: null,
    errorMessage: '',
    pendingPhoto: null,
  }),
  actions: {
    async submitPhoto(photo: File) {
      this.status = 'submitting'
      this.errorMessage = ''
      this.pendingPhoto = null

      const exifGps = await readExifGps(photo)

      if (exifGps) {
        await this.runAnalyze(photo, { ...exifGps, source: 'exif' })

        return
      }

      this.pendingPhoto = photo
      this.status = 'awaiting-location'
    },
    async useDeviceLocation() {
      const photo = this.pendingPhoto

      if (!photo) {
        return
      }

      this.status = 'submitting'
      this.errorMessage = ''

      try {
        const position = await getCurrentPosition()

        await this.runAnalyze(photo, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'device',
        })
      }
      catch (error) {
        this.status = 'awaiting-location'
        this.errorMessage = error instanceof Error
          ? `取得目前位置失敗：${error.message}`
          : '取得目前位置失敗'
      }
    },
    async skipLocation() {
      const photo = this.pendingPhoto

      if (!photo) {
        return
      }

      await this.runAnalyze(photo)
    },
    async runAnalyze(photo: File, gps?: ClientGps) {
      this.status = 'submitting'
      this.errorMessage = ''

      try {
        this.result = await analyzePhoto({ photo, gps: gps ?? null })
        this.status = 'success'
        this.pendingPhoto = null
      }
      catch (error) {
        this.status = 'error'
        this.errorMessage = error instanceof Error ? error.message : '分析失敗'
        this.pendingPhoto = null
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
      this.pendingPhoto = null
    },
  },
})
