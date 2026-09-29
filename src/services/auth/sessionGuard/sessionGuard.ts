import type { Session, SessionUser } from '@/types/apiContract.js'

/** Stub — aucune logique métier. À implémenter (KOM-06). */

/** Port : le middleware injecte un lecteur de session (implémenté par Better Auth). */
export interface SessionReader {
  read(headers: Headers): Promise<Session>
}

export type SessionCheck = {
  user: SessionUser | null
  status: 200 | 401
}

export async function checkSession(
  _reader: SessionReader,
  _headers: Headers,
): Promise<SessionCheck> {
  return { user: null, status: 200 }
}
