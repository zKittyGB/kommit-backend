import type { ApiError } from '@/types/apiContract.js'

/** Stub — aucune logique métier. À implémenter (KOM-06). */

export const MIN_PASSWORD_LENGTH = 0

export type SignupInput = {
  name: string
  email: string
  password: string
}

/** Exactement un des 2 champs est non-nul. */
export type SignupValidation = {
  value: SignupInput | null
  error: ApiError | null
}

export function validateSignup(_input: unknown): SignupValidation {
  return { value: null, error: null }
}
