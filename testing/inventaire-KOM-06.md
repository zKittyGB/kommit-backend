# Inventaire des tests — KOM-06 · Authentification · backend

Source : ticket Notion KOM-06 (Feature AUTHENTIFICATION, US F1-US1).
Doctrine appliquée : `docs/testing-strategy.md`.

Le découpage en 4 paquets ci-dessous est **celui du ticket**, dans son ordre. Le tableau du
ticket compte 11 lignes pour 12 identifiants : RM18 et RM19 y partagent une seule ligne, on
garde ce regroupement.

Légende des verdicts : **🟢** testable en unitaire, **🟠** partiel (unitaire sur notre tranche
**plus** un smoke manuel sur la tranche réelle), **🔴** non testable en unitaire.

---

### Groupe 1 — Cas nominaux : création, connexion, déconnexion

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM8 | Signup valide : le compte est créé **et** la session est posée dans la foulée, sans repasser par un état déconnecté | 🔴 | Ce qu'on vérifie est le comportement réel de Better Auth sur `/sign-up/email` : l'écriture du compte via Prisma et la pose du cookie de session. Le mocker reviendrait à mocker exactement l'objet du test. La contrainte cross-origin (`credentials: true`, `trustedOrigins`) conditionne le résultat et ne s'observe qu'en réel. | Manuel (smoke) |
| RM12 | Signin valide : email et mot de passe corrects, l'utilisateur est connecté | 🔴 | Le contrôle du mot de passe et la pose du cookie appartiennent entièrement à Better Auth. Aucune logique à nous ne décide ici. | Manuel (smoke) |
| RM5 | Signout : la session d'un utilisateur connecté est réellement fermée | 🔴 | Ce qu'on vérifie est l'effet réel de `/sign-out` sur la session Better Auth, constatable seulement par un `/get-session` qui ne renvoie plus rien après coup. | Manuel (smoke) |

### Groupe 2 — Valeurs refusées

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM10 | Email mal formé ou mot de passe de moins de 8 caractères : la requête est refusée, aucun compte n'est créé | 🟢 | La contrainte technique met toute la validation dans **un seul schéma Zod côté serveur**. Le refus est une décision de notre schéma, fonction pure, avant que Better Auth soit appelé : « aucun compte n'est créé » découle du court-circuit, pas d'un comportement de dépendance. Vérifier au passage que le minimum de 8 caractères du schéma est le même que celui posé dans la config Better Auth et dans le message d'erreur. | Unitaire, test-first |
| RM11 | Signup sans prénom : la requête est refusée, aucun compte n'est créé | 🟢 | Le champ `name` requis est une contrainte de notre schéma Zod. Fonction pure, entrée / sortie, rien à mocker. | Unitaire, test-first |
| RM20 | Prénom composé uniquement d'espaces : refusé exactement comme RM11 | 🟢 | C'est le `trim` puis la longueur minimale de notre schéma Zod qui tranchent. Même nature que RM11, cas d'entrée différent : on garde 2 lignes, donc 2 cas de test. | Unitaire, test-first |

### Groupe 3 — Unicité de l'email

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM9 | Email déjà utilisé : réponse `EMAIL_ALREADY_EXISTS`, aucun compte créé, jamais de 500 | 🟠 | 2 tranches. La nôtre : le ré-emballage de la violation `UNIQUE` en `ApiError { code, message }`, testable en mockant la forme de l'erreur. La tranche réelle : que la contrainte `UNIQUE` de Prisma rejette bien le doublon, et surtout que l'erreur remontée par Better Auth ait **réellement** la forme qu'on a mockée. Rien ne le confirme sans un passage à la main. | Unitaire (mapping) + smoke manuel |
| RM21 | Unicité insensible à la casse et aux espaces : ` MARC@x.com ` est refusé si `marc@x.com` existe | 🟠 | Notre tranche : la normalisation (minuscules, retrait des espaces) appliquée par le schéma Zod avant stockage et avant contrôle d'unicité, fonction pure. La tranche réelle : que la valeur stockée ait été normalisée elle aussi, donc que la collision se produise vraiment en base. Le smoke de RM9 ne la couvre pas, il teste un doublon à l'identique. | Unitaire (normalisation) + smoke manuel |

### Groupe 4 — Gestion des erreurs et pannes

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM13 | Identifiants incorrects au signin : réponse `INVALID_CREDENTIALS` | 🟠 | Notre tranche : la conversion du refus de Better Auth en `ApiError` avec le code du contrat et un message en français, testable en mockant l'erreur. La tranche réelle : la forme exacte de l'erreur que Better Auth renvoie sur un mauvais mot de passe. C'est précisément le mock qui peut ne pas correspondre à la réalité, il faut le confirmer à la main. | Unitaire (mapping) + smoke manuel |
| RM18, RM19 | Une panne (5xx, timeout) ressort en `INTERNAL_ERROR`, code distinct des erreurs métier, jamais d'erreur brute | 🟢 | C'est la branche par défaut de notre ré-emballage : tout ce qu'on ne reconnaît pas tombe sur `INTERNAL_ERROR`. Elle ne dépend d'**aucune** forme d'erreur particulière, donc lui passer une erreur inconnue ne mocke pas l'objet du test. La distinction d'avec les codes métier se vérifie aussi sur notre table de correspondance. | Unitaire, test-first |
| RM2 | Requête sur une route protégée sans session : réponse 401 | 🟠 | Notre tranche : la décision du middleware de garde, session absente donc `ApiError` 401, session présente donc passage au handler, avec le lecteur de session injecté et mocké. La tranche réelle : que le middleware soit effectivement monté sur la route et que Better Auth ne renvoie bien aucune session sans cookie. Les smokes du groupe 1 vérifient la pose de la session, pas le refus sur route protégée. | Unitaire (middleware) + smoke manuel |

---

## Récap

### 1. Test unitaire automatisé, test-first (→ `unit-test-writer`)

- **RM10** — schéma Zod : email mal formé refusé, mot de passe de moins de 8 caractères refusé.
- **RM11** — schéma Zod : prénom absent refusé.
- **RM20** — schéma Zod : prénom composé uniquement d'espaces refusé après `trim`.
- **RM18, RM19** — ré-emballage : une erreur non reconnue ressort en `INTERNAL_ERROR`, jamais brute, et ce code est distinct des codes métier.
- Part unitaire des 🟠 ci-dessous : **RM9** (mapping `UNIQUE` → `EMAIL_ALREADY_EXISTS`), **RM21** (normalisation de l'email), **RM13** (mapping refus Better Auth → `INVALID_CREDENTIALS`), **RM2** (décision du middleware de garde).

### 2. Couverture partielle : unitaire **et** smoke manuel (🟠)

| Règle | Part unitaire | Smoke manuel à ajouter |
|---|---|---|
| RM9 | Mapping de la violation `UNIQUE` vers `EMAIL_ALREADY_EXISTS` | Créer un compte, rejouer le **même** email au signup, vérifier `EMAIL_ALREADY_EXISTS` et non un 500. Confirme la forme réelle de l'erreur Better Auth / Prisma. |
| RM21 | Normalisation minuscules + retrait des espaces dans le schéma Zod | Créer `marc@x.com`, puis tenter le signup avec ` MARC@x.com `, vérifier le refus. Variante de casse et d'espaces, non couverte par le smoke RM9. |
| RM13 | Mapping du refus de signin vers `INVALID_CREDENTIALS` | Signin avec un mot de passe faux, puis avec un email inexistant, vérifier `INVALID_CREDENTIALS` dans les 2 cas. Confirme la forme réelle de l'erreur Better Auth. |
| RM2 | Décision du middleware de garde avec lecteur de session mocké | Appeler une route protégée sans cookie de session, vérifier le 401. Confirme que le middleware est bien monté. |

### 3. Vérification à la main uniquement (→ `smoke-test-writer`)

- **RM8** — signup valide : compte créé et session posée dans la foulée, cookie présent, `/get-session` renvoie l'utilisateur.
- **RM12** — signin valide : connexion effective, cookie de session posé.
- **RM5** — signout : `/get-session` ne renvoie plus de session après l'appel.

### Point d'attention pour les smokes

Les 3 règles du groupe 1 et le smoke de RM2 dépendent du réglage cross-origin décrit dans les
contraintes techniques : `credentials: true` côté CORS, origine du front dans `trustedOrigins`
de Better Auth, cookie laissé en `Lax` par défaut. Si l'origine du front manque dans
`trustedOrigins`, Better Auth refuse la requête **avant** la logique d'authentification : le
smoke échoue pour une raison qui n'est pas la règle testée. À vérifier en premier en cas
d'échec.
