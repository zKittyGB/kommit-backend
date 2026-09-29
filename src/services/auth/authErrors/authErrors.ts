import type { ApiError } from '@/types/apiContract.js'

/** Stub — aucune logique métier. À implémenter (KOM-06). */

export function toApiError(_error: unknown): ApiError {
  return { code: 'INTERNAL_ERROR', message: '' }
}
