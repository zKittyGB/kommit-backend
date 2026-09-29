import { describe, expect, it } from 'vitest'
import {
  MIN_PASSWORD_LENGTH,
  validateSignup,
} from '@/services/auth/authValidation/authValidation.js'

// Tests des règles métier de KOM-06 couvertes par le schéma de validation (Zod, côté serveur).
// Ordre et intitulés repris du tableau du ticket.
// Couvre : RM10, RM11, RM20 (groupe 2) et la part unitaire de RM21 (groupe 3).

const validPassword = 'motdepasse'

describe('Groupe 2 — Valeurs refusées', () => {
  describe('Saisie valide (contre-cas de RM10, RM11, RM20)', () => {
    it('accepte un prénom, un email bien formé et un mot de passe de 8 caractères ou plus', () => {
      const signup = { name: 'Marc', email: 'marc@x.com', password: validPassword }

      const signupValidation = validateSignup(signup)

      expect(signupValidation.error).toBeNull()
      expect(signupValidation.value).toEqual({
        name: 'Marc',
        email: 'marc@x.com',
        password: validPassword,
      })
    })
  })

  describe('RM10 — Email mal formé ou mot de passe court, refusé', () => {
    it.each([
      ['sans arobase', 'marcx.com'],
      ['sans domaine', 'marc@'],
      ['sans partie locale', '@x.com'],
      ['vide', ''],
      ['avec une espace au milieu', 'ma rc@x.com'],
    ])('refuse un email %s', (_cas, malformedEmail) => {
      const signupWithMalformedEmail = {
        name: 'Marc',
        email: malformedEmail,
        password: validPassword,
      }

      const signupValidation = validateSignup(signupWithMalformedEmail)

      expect(signupValidation.value).toBeNull()
      expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
      expect(signupValidation.error?.message.length).toBeGreaterThan(0)
    })

    it('refuse un mot de passe de 7 caractères', () => {
      const signupWithShortPassword = { name: 'Marc', email: 'marc@x.com', password: '1234567' }

      const signupValidation = validateSignup(signupWithShortPassword)

      expect(signupValidation.value).toBeNull()
      expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
    })

    it('accepte un mot de passe de exactement 8 caractères', () => {
      const signupWithMinimalPassword = { name: 'Marc', email: 'marc@x.com', password: '12345678' }

      const signupValidation = validateSignup(signupWithMinimalPassword)

      expect(signupValidation.error).toBeNull()
      expect(signupValidation.value?.password).toBe('12345678')
    })

    it("n'impose aucun maximum au mot de passe", () => {
      const signupWithLongPassword = {
        name: 'Marc',
        email: 'marc@x.com',
        password: 'a'.repeat(200),
      }

      const signupValidation = validateSignup(signupWithLongPassword)

      expect(signupValidation.error).toBeNull()
      expect(signupValidation.value?.password).toBe('a'.repeat(200))
    })

    it('fixe le minimum du mot de passe à 8, la même valeur que le défaut de Better Auth', () => {
      expect(MIN_PASSWORD_LENGTH).toBe(8)
    })

    it('annonce ce même minimum dans le message d’erreur du mot de passe trop court', () => {
      const signupWithShortPassword = { name: 'Marc', email: 'marc@x.com', password: 'court' }

      const signupValidation = validateSignup(signupWithShortPassword)

      expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
      expect(signupValidation.error?.message ?? '').toContain(String(MIN_PASSWORD_LENGTH))
    })

    it('refuse un email mal formé ET un mot de passe court en une seule réponse', () => {
      const signupFullyInvalid = { name: 'Marc', email: 'marcx.com', password: 'court' }

      const signupValidation = validateSignup(signupFullyInvalid)

      expect(signupValidation.value).toBeNull()
      expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('RM11 — Signup sans prénom, refusé', () => {
    it('refuse un signup dont le prénom est absent', () => {
      const signupWithoutName = { email: 'marc@x.com', password: validPassword }

      const signupValidation = validateSignup(signupWithoutName)

      expect(signupValidation.value).toBeNull()
      expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
      expect(signupValidation.error?.message.length).toBeGreaterThan(0)
    })

    it('refuse un prénom vide', () => {
      const signupWithEmptyName = { name: '', email: 'marc@x.com', password: validPassword }

      const signupValidation = validateSignup(signupWithEmptyName)

      expect(signupValidation.value).toBeNull()
      expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe("RM20 — Prénom d'espaces seulement, refusé", () => {
    it.each([['   '], ['\t'], [' \n ']])(
      'refuse un prénom composé uniquement de blancs (%j)',
      (blankName) => {
        const signupWithBlankName = {
          name: blankName,
          email: 'marc@x.com',
          password: validPassword,
        }

        const signupValidation = validateSignup(signupWithBlankName)

        expect(signupValidation.value).toBeNull()
        expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
      },
    )

    it('refuse un prénom de blancs exactement comme un prénom absent (RM11)', () => {
      const signupWithBlankName = { name: '   ', email: 'marc@x.com', password: validPassword }
      const signupWithoutName = { email: 'marc@x.com', password: validPassword }

      const blankNameValidation = validateSignup(signupWithBlankName)
      const missingNameValidation = validateSignup(signupWithoutName)

      expect(blankNameValidation.error?.code).toBe('VALIDATION_ERROR')
      expect(blankNameValidation.error).toEqual(missingNameValidation.error)
    })
  })

  describe('Entrées hors forme (appel direct de l’API, sans passer par le front)', () => {
    it.each([[null], [undefined], ['marc@x.com'], [42], [[]]])(
      'refuse une entrée qui n’est pas un objet de signup (%j)',
      (unshapedInput) => {
        const signupValidation = validateSignup(unshapedInput)

        expect(signupValidation.value).toBeNull()
        expect(signupValidation.error?.code).toBe('VALIDATION_ERROR')
      },
    )

    it('ignore les champs supplémentaires et ne renvoie que prénom, email et mot de passe', () => {
      const signupWithExtraField = {
        name: 'Marc',
        email: 'marc@x.com',
        password: validPassword,
        role: 'admin',
      }

      const signupValidation = validateSignup(signupWithExtraField)

      expect(signupValidation.value).toEqual({
        name: 'Marc',
        email: 'marc@x.com',
        password: validPassword,
      })
    })
  })
})

describe("Groupe 3 — Unicité de l'email", () => {
  describe('RM21 — Unicité insensible à la casse et aux espaces (part unitaire : la normalisation)', () => {
    it.each([
      [' MARC@x.com ', 'marc@x.com'],
      ['MARC@X.COM', 'marc@x.com'],
      ['  marc@x.com', 'marc@x.com'],
      ['Marc@x.com  ', 'marc@x.com'],
    ])('normalise %j en %j avant de valider', (rawEmail, normalizedEmail) => {
      const signupWithRawEmail = { name: 'Marc', email: rawEmail, password: validPassword }

      const signupValidation = validateSignup(signupWithRawEmail)

      expect(signupValidation.error).toBeNull()
      expect(signupValidation.value?.email).toBe(normalizedEmail)
    })

    it('retire aussi les espaces autour du prénom', () => {
      const signupWithPaddedName = {
        name: '  Marc  ',
        email: 'marc@x.com',
        password: validPassword,
      }

      const signupValidation = validateSignup(signupWithPaddedName)

      expect(signupValidation.value?.name).toBe('Marc')
    })
  })
})
