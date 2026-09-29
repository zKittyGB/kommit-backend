import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkSession, type SessionReader } from '@/services/auth/sessionGuard/sessionGuard.js'

// Tests de la décision de garde d'une route protégée.
// Couvre : la part unitaire de RM2 (groupe 4). Le lecteur de session (Better Auth) est
// injecté et mocké : le test porte sur la décision, pas sur la lecture réelle du cookie.

const readSession = vi.fn()
const sessionReader: SessionReader = { read: readSession }

const cookieHeaders = new Headers({ cookie: 'better-auth.session_token=un-jeton' })
const headersWithoutCookie = new Headers()

const marc = { id: 'usr_1', name: 'Marc', email: 'marc@x.com' }

beforeEach(() => readSession.mockReset())

describe('Groupe 4 — Gestion des erreurs et pannes', () => {
  describe('RM2 — Route protégée sans session, 401 (part unitaire : la décision de garde)', () => {
    it('répond 401 quand le lecteur ne trouve aucune session', async () => {
      readSession.mockResolvedValue(null)

      const sessionCheck = await checkSession(sessionReader, headersWithoutCookie)

      expect(sessionCheck.status).toBe(401)
      expect(sessionCheck.user).toBeNull()
    })

    it("laisse passer et rend l'utilisateur quand une session existe", async () => {
      readSession.mockResolvedValue({ user: marc })

      const sessionCheck = await checkSession(sessionReader, cookieHeaders)

      expect(sessionCheck.status).toBe(200)
      expect(sessionCheck.user).toEqual(marc)
    })

    it('lit la session à partir des en-têtes de la requête', async () => {
      readSession.mockResolvedValue({ user: marc })

      await checkSession(sessionReader, cookieHeaders)

      expect(readSession).toHaveBeenCalledWith(cookieHeaders)
    })
  })
})
