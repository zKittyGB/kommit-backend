import { APIError } from 'better-auth/api'
import { describe, expect, it } from 'vitest'
import { PrismaClientKnownRequestError } from '@/generated/prisma/internal/prismaNamespace.js'
import { toApiError } from '@/services/auth/authErrors/authErrors.js'

// Tests du ré-emballage des erreurs de Better Auth et de Prisma en `ApiError`.
// Couvre : la part unitaire de RM9 (groupe 3), la part unitaire de RM13 et RM18/RM19 (groupe 4).
//
// Les erreurs d'entrée ne sont PAS inventées : elles sont construites avec les vraies
// classes des dépendances, avec les valeurs constatées dans leur source (better-auth 1.7.6) :
//   - signup, email déjà pris : `dist/api/routes/sign-up.mjs` fait
//     `throw APIError.from('UNPROCESSABLE_ENTITY', BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL)`,
//     et `APIError.from` (@better-auth/core/dist/error/index.mjs) construit
//     `body = { code, message }`.
//   - signin, identifiants faux : `dist/api/routes/sign-in.mjs` fait
//     `throw APIError.from('UNAUTHORIZED', BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD)`.
// Les messages anglais viennent de `@better-auth/core/dist/error/codes.mjs`.

const userAlreadyExistsError = new APIError('UNPROCESSABLE_ENTITY', {
  code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
  message: 'User already exists. Use another email.',
})

const invalidEmailOrPasswordError = new APIError('UNAUTHORIZED', {
  code: 'INVALID_EMAIL_OR_PASSWORD',
  message: 'Invalid email or password',
})

const uniqueConstraintError = new PrismaClientKnownRequestError(
  'Unique constraint failed on the fields: (`email`)',
  { code: 'P2002', clientVersion: '7.10.0', meta: { modelName: 'User', target: ['email'] } },
)

describe("Groupe 3 — Unicité de l'email", () => {
  describe('RM9 — Email déjà utilisé, EMAIL_ALREADY_EXISTS (part unitaire : le ré-emballage)', () => {
    it("convertit le refus de Better Auth en EMAIL_ALREADY_EXISTS, avec le message du contrat d'API", () => {
      const apiError = toApiError(userAlreadyExistsError)

      expect(apiError).toEqual({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Un compte avec cet email existe déjà',
      })
    })

    it('convertit une violation de la contrainte UNIQUE (P2002) en EMAIL_ALREADY_EXISTS, jamais en INTERNAL_ERROR', () => {
      const apiError = toApiError(uniqueConstraintError)

      expect(apiError.code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('convertit une violation P2002 sans `meta` en EMAIL_ALREADY_EXISTS', () => {
      const uniqueConstraintErrorWithoutMeta = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '7.10.0' },
      )

      const apiError = toApiError(uniqueConstraintErrorWithoutMeta)

      expect(apiError.code).toBe('EMAIL_ALREADY_EXISTS')
    })
  })
})

describe('Groupe 4 — Gestion des erreurs et pannes', () => {
  describe('RM13 — Identifiants incorrects, INVALID_CREDENTIALS (part unitaire : le ré-emballage)', () => {
    it('convertit le refus de signin de Better Auth en INVALID_CREDENTIALS', () => {
      const apiError = toApiError(invalidEmailOrPasswordError)

      expect(apiError.code).toBe('INVALID_CREDENTIALS')
    })

    it('renvoie un message en français, pas celui de Better Auth', () => {
      const apiError = toApiError(invalidEmailOrPasswordError)

      expect(apiError.message.length).toBeGreaterThan(0)
      expect(apiError.message).not.toBe('Invalid email or password')
    })
  })

  describe('RM18, RM19 — Panne, INTERNAL_ERROR distinct du métier', () => {
    it('convertit une panne réseau en INTERNAL_ERROR', () => {
      const timeoutError = new Error('connect ETIMEDOUT 10.0.0.1:5432')

      const apiError = toApiError(timeoutError)

      expect(apiError).toEqual({ code: 'INTERNAL_ERROR', message: expect.stringMatching(/\S/) })
    })

    it('convertit une erreur 500 de Better Auth en INTERNAL_ERROR', () => {
      const failedToCreateSessionError = new APIError('INTERNAL_SERVER_ERROR', {
        code: 'FAILED_TO_CREATE_SESSION',
        message: 'Failed to create session',
      })

      const apiError = toApiError(failedToCreateSessionError)

      expect(apiError).toEqual({ code: 'INTERNAL_ERROR', message: expect.stringMatching(/\S/) })
    })

    it('convertit un code Better Auth non reconnu en INTERNAL_ERROR', () => {
      const unknownCodeError = new APIError('BAD_REQUEST', {
        code: 'SOME_FUTURE_CODE',
        message: 'Something new',
      })

      const apiError = toApiError(unknownCodeError)

      expect(apiError).toEqual({ code: 'INTERNAL_ERROR', message: expect.stringMatching(/\S/) })
    })

    it('convertit une erreur Prisma autre que P2002 en INTERNAL_ERROR', () => {
      const databaseUnreachableError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '7.10.0' },
      )

      const apiError = toApiError(databaseUnreachableError)

      expect(apiError).toEqual({ code: 'INTERNAL_ERROR', message: expect.stringMatching(/\S/) })
    })

    it.each([['boom'], [null], [undefined], [{ oops: true }], [42]])(
      'convertit une valeur lancée qui n’est même pas une Error en INTERNAL_ERROR (%j)',
      (thrownValue) => {
        const apiError = toApiError(thrownValue)

        expect(apiError).toEqual({ code: 'INTERNAL_ERROR', message: expect.stringMatching(/\S/) })
      },
    )

    it('ne laisse jamais fuiter le message technique de la panne', () => {
      const timeoutError = new Error('connect ETIMEDOUT 10.0.0.1:5432')

      const apiError = toApiError(timeoutError)

      expect(apiError.message.length).toBeGreaterThan(0)
      expect(apiError.message).not.toContain('ETIMEDOUT')
    })

    it('rend INTERNAL_ERROR distinct des codes métier, pour que le front affiche un autre message', () => {
      const internalErrorCode = toApiError(new Error('panne')).code
      const emailAlreadyExistsCode = toApiError(userAlreadyExistsError).code
      const invalidCredentialsCode = toApiError(invalidEmailOrPasswordError).code

      expect(
        new Set([internalErrorCode, emailAlreadyExistsCode, invalidCredentialsCode]).size,
      ).toBe(3)
    })
  })
})
