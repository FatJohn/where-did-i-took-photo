import type { AnalysisResponse, HistoryResponse } from '@photo-location/shared'
import {
  analysisResponseSchema,
  historyResponseSchema,
} from '@photo-location/shared'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const VISITOR_ID_STORAGE_KEY = 'photo-location.visitor-id'
const VISITOR_TOKEN_STORAGE_KEY = 'photo-location.visitor-token'

export interface AnalyzePhotoInput {
  photo: File
  visitorToken?: string | null
}

function resolveApiUrl(path: string) {
  if (!API_BASE_URL) {
    return path
  }

  return new URL(path, API_BASE_URL).toString()
}

export function getStoredVisitorToken() {
  return localStorage.getItem(VISITOR_TOKEN_STORAGE_KEY)
}

export function getStoredVisitorId() {
  return localStorage.getItem(VISITOR_ID_STORAGE_KEY)
}

function persistVisitorContext(visitorToken?: string | null, visitorId?: string) {
  if (visitorToken) {
    localStorage.setItem(VISITOR_TOKEN_STORAGE_KEY, visitorToken)
  }

  if (visitorId) {
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId)
  }
}

async function readError(response: Response) {
  const message = await response.text()

  throw new Error(message || `Request failed with status ${response.status}`)
}

export async function analyzePhoto(input: AnalyzePhotoInput): Promise<AnalysisResponse> {
  const formData = new FormData()
  formData.append('photo', input.photo)

  const visitorToken = input.visitorToken ?? getStoredVisitorToken()
  if (visitorToken) {
    formData.append('visitorToken', visitorToken)
  }

  const response = await fetch(resolveApiUrl('/analyze'), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    await readError(response)
  }

  const payload = analysisResponseSchema.parse(await response.json())

  persistVisitorContext(response.headers.get('x-visitor-token'), payload.visitorId)

  return payload
}

export async function fetchHistory(visitorId: string, visitorToken?: string | null): Promise<HistoryResponse> {
  const resolvedVisitorToken = visitorToken ?? getStoredVisitorToken()
  if (!resolvedVisitorToken) {
    throw new Error('Visitor token is required to fetch history')
  }

  const response = await fetch(resolveApiUrl(`/history/${visitorId}`), {
    headers: {
      'x-visitor-token': resolvedVisitorToken,
    },
  })

  if (!response.ok) {
    await readError(response)
  }

  const payload = historyResponseSchema.parse(await response.json())

  persistVisitorContext(payload.visitorToken ?? resolvedVisitorToken, payload.visitorId ?? visitorId)

  return payload
}
