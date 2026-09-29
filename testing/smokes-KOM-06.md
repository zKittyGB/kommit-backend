# Smokes manuels — KOM-06 · Authentification · backend

Scénarios de vérification à la main, écrits **avant** l'implémentation (test-first) mais à
**exécuter après** : ils demandent un serveur qui tourne et une base réelle. Tant que le
ticket n'est pas implémenté, ces cases restent vides.

Périmètre : les règles 🔴 de `testing/inventaire-KOM-06.md` et le complément smoke de ses
règles 🟠. Les sections et leur ordre reprennent ceux de l'inventaire, pour que les 2
fichiers se lisent côte à côte.

Un smoke est **court et superficiel** (cf. `docs/testing-strategy.md`) : il confirme que le
branchement réel tient, il ne remplace pas les tests unitaires.

---

## Préconditions communes à tous les scénarios

- Le serveur tourne : `pnpm dev`, back sur `http://localhost:3000`.
- La base Postgres est joignable, les migrations Prisma sont appliquées.
- **Réglage cross-origin à vérifier en premier en cas d'échec** : `credentials: true` dans
  la config CORS côté back, et l'origine du front (`http://localhost:5173`) déclarée dans
  `trustedOrigins` de Better Auth. Si l'origine manque, Better Auth refuse la requête
  **avant** la logique d'authentification : le scénario échoue pour une raison qui n'est pas
  la règle testée. Concerne le groupe 1 et le scénario RM2. Les commandes ci-dessous
  envoient donc `-H "Origin: http://localhost:5173"`.
- **Variables à ajuster avant exécution** :
  - `AUTH_BASE` : la racine des routes Better Auth. Valeur supposée
    `http://localhost:3000/api/auth` (défaut de Better Auth). À corriger si le `basePath`
    retenu à l'implémentation diffère.
  - `PROTECTED_URL` (scénario RM2 uniquement) : l'URL d'une route protégée par le
    middleware de garde. **Aucune n'existe encore dans le repo** au moment de l'écriture de
    ces scénarios.
- **Sous PowerShell, écrire `curl.exe` et non `curl`** : `curl` y est un alias de
  `Invoke-WebRequest`, qui n'accepte pas ces options. Sous bash, `curl` suffit.
- Les commandes utilisent un fichier de cookies (`cookies.txt`) : `-c` l'écrit, `-b` le
  relit. Le supprimer entre 2 scénarios pour repartir d'un état déconnecté.
- L'option `-i` affiche les en-têtes de réponse : c'est là qu'on lit le `Set-Cookie` et le
  code HTTP.

**Sur les codes HTTP attendus** : le contrat d'API (`src/types/apiContract.ts`) fige la
forme `ApiError { code, message }` et la liste des `code`, **pas** le statut HTTP associé à
chacun. Pour les erreurs métier, l'assertion porte donc sur le `code` du corps et sur le
fait que la réponse n'est **pas** un 5xx. Seul RM2 a un statut imposé par le ticket : 401.

---

### Groupe 1 — Cas nominaux : création, connexion, déconnexion

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM8 | 🔴 | Signup valide : compte créé **et** session posée dans la foulée | [Scénario RM8](#scénario-rm8--signup-valide-connecté-automatiquement) |
| RM12 | 🔴 | Signin valide : email et mot de passe corrects, utilisateur connecté | [Scénario RM12](#scénario-rm12--signin-valide-connecté) |
| RM5 | 🔴 | Signout : la session d'un utilisateur connecté est réellement fermée | [Scénario RM5](#scénario-rm5--signout-session-fermée) |

---

#### Scénario RM8 — Signup valide, connecté automatiquement

> ✅ **Ce qu'on vérifie :**
> - Un signup avec prénom, email non utilisé et mot de passe d'au moins 8 caractères crée le compte.
> - La session est posée **dans la foulée** : un cookie de session revient sur la réponse du signup, sans étape de connexion supplémentaire.
> - Aucun passage par un état déconnecté : `/get-session` renvoie l'utilisateur juste après.
> - Pourquoi à la main : c'est le comportement réel de Better Auth sur `/sign-up/email` (écriture Prisma + pose du cookie) ; le mocker reviendrait à mocker l'objet du test. La contrainte cross-origin (`credentials: true`, `trustedOrigins`) conditionne le résultat et ne s'observe qu'en réel.

**Préconditions**

- L'email `rm8@x.com` n'existe **pas** en base (le supprimer si un run précédent l'a créé).
- Pas de `cookies.txt` résiduel.

**Étapes**

1. Signup :

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"name":"Marc","email":"rm8@x.com","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-up/email
```

2. Session, avec le cookie reçu :

```bash
curl -i -b cookies.txt \
  -H "Origin: http://localhost:5173" \
  http://localhost:3000/api/auth/get-session
```

**Résultat attendu**

- Étape 1 : statut 2xx, **un en-tête `Set-Cookie`** de session présent dans la réponse.
- Étape 2 : statut 200, corps conforme au type `Session` du contrat, non `null` : un objet
  `{ user: { id, name, email } }` avec `name` valant `"Marc"` et `email` valant
  `"rm8@x.com"`.
- Aucun corps `ApiError`.

- [ ] RM8 vérifié

---

#### Scénario RM12 — Signin valide, connecté

> ✅ **Ce qu'on vérifie :**
> - Un signin avec un email et un mot de passe corrects connecte l'utilisateur.
> - Un cookie de session est posé sur la réponse du signin.
> - Pourquoi à la main : le contrôle du mot de passe et la pose du cookie appartiennent entièrement à Better Auth, aucune logique à nous ne décide ici.

**Préconditions**

- Le compte `rm8@x.com` / `motdepasse8` existe (créé par le scénario RM8).
- Supprimer `cookies.txt` pour repartir déconnecté.

**Étapes**

1. Signin :

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"rm8@x.com","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-in/email
```

2. Session, avec le cookie reçu :

```bash
curl -i -b cookies.txt \
  -H "Origin: http://localhost:5173" \
  http://localhost:3000/api/auth/get-session
```

**Résultat attendu**

- Étape 1 : statut 2xx, en-tête `Set-Cookie` de session présent.
- Étape 2 : statut 200, `Session` non `null`, `user.email` valant `"rm8@x.com"`.

- [ ] RM12 vérifié

---

#### Scénario RM5 — Signout, session fermée

> ✅ **Ce qu'on vérifie :**
> - Un appel à `/sign-out` depuis un utilisateur connecté ferme réellement sa session.
> - Le cookie qui fonctionnait avant ne donne plus accès à la session après.
> - Pourquoi à la main : l'effet réel de `/sign-out` sur la session Better Auth n'est constatable que par un `/get-session` qui ne renvoie plus rien après coup.

**Préconditions**

- Le compte `rm8@x.com` / `motdepasse8` existe.
- Supprimer `cookies.txt` pour repartir déconnecté.

> ⚠️ Ce scénario compte 4 étapes, la limite haute pour un smoke. Les étapes 1 et 2 ne sont
> que la mise en place de l'état « connecté » : la vérification propre à RM5 est l'écart
> entre l'étape 2 et l'étape 4.

**Étapes**

1. Se connecter :

```bash
curl -s -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"rm8@x.com","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-in/email
```

2. Confirmer que la session existe :

```bash
curl -i -b cookies.txt -H "Origin: http://localhost:5173" \
  http://localhost:3000/api/auth/get-session
```

3. Se déconnecter :

```bash
curl -i -b cookies.txt -c cookies.txt -X POST \
  -H "Origin: http://localhost:5173" \
  http://localhost:3000/api/auth/sign-out
```

4. Re-demander la session avec le **même** fichier de cookies :

```bash
curl -i -b cookies.txt -H "Origin: http://localhost:5173" \
  http://localhost:3000/api/auth/get-session
```

**Résultat attendu**

- Étape 2 : `Session` non `null`.
- Étape 3 : statut 2xx, et un `Set-Cookie` qui vide ou expire le cookie de session.
- Étape 4 : statut 200 avec un corps `Session` valant `null` (état non connecté du
  contrat), ou 401. Dans tous les cas, **plus aucun `user`** n'est renvoyé.

- [ ] RM5 vérifié

---

### Groupe 2 — Valeurs refusées

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM10 | 🟢 | Email mal formé ou mot de passe de moins de 8 caractères refusé | aucun smoke, couvert en unitaire |
| RM11 | 🟢 | Signup sans prénom refusé | aucun smoke, couvert en unitaire |
| RM20 | 🟢 | Prénom composé uniquement d'espaces refusé | aucun smoke, couvert en unitaire |

---

### Groupe 3 — Unicité de l'email

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM9 | 🟠 | Email déjà utilisé : `EMAIL_ALREADY_EXISTS`, jamais un 500 | [Scénario RM9](#scénario-rm9--email-déjà-utilisé-email_already_exists) |
| RM21 | 🟠 | Unicité insensible à la casse et aux espaces | [Scénario RM21](#scénario-rm21--unicité-insensible-à-la-casse-et-aux-espaces) |

---

#### Scénario RM9 — Email déjà utilisé, EMAIL_ALREADY_EXISTS

> ✅ **Ce qu'on vérifie :**
> - Rejouer le **même** email au signup est refusé, avec le code `EMAIL_ALREADY_EXISTS` du contrat et un message en français.
> - La violation de la contrainte `UNIQUE` ne ressort **jamais** en 500 ni en erreur brute de Prisma ou de Better Auth.
> - Aucun second compte n'est créé.
> - Pourquoi à la main : la part unitaire mocke la forme de l'erreur. Seul un passage réel confirme que l'erreur remontée par Better Auth / Prisma a bien cette forme, donc que le ré-emballage s'accroche.

**Préconditions**

- Le compte `rm9@x.com` existe déjà. Le créer si besoin avec l'étape 1 ci-dessous.

**Étapes**

1. Créer le compte (à sauter s'il existe déjà) :

```bash
curl -s -H "Content-Type: application/json" \
  -d '{"name":"Marc","email":"rm9@x.com","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-up/email
```

2. Rejouer **le même email** :

```bash
curl -i -H "Content-Type: application/json" \
  -d '{"name":"Marc","email":"rm9@x.com","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-up/email
```

**Résultat attendu**

- Étape 2 : statut **4xx, surtout pas 5xx**.
- Corps exactement à la forme `ApiError` du contrat :
  `{ "code": "EMAIL_ALREADY_EXISTS", "message": "<texte en français>" }`.
- Aucune trace d'erreur Prisma brute dans le corps (pas de `P2002`, pas de nom de
  contrainte, pas de `stack`).
- En base, toujours **un seul** utilisateur avec l'email `rm9@x.com`.

- [ ] RM9 vérifié

---

#### Scénario RM21 — Unicité insensible à la casse et aux espaces

> ✅ **Ce qu'on vérifie :**
> - Un compte existant en `marc@x.com` fait refuser un signup en ` MARC@x.com ` (casse différente et espaces autour).
> - La normalisation (minuscules, retrait des espaces) a bien été appliquée **avant stockage** aussi, sinon la collision ne se produirait pas en base.
> - Pourquoi à la main : la part unitaire couvre la normalisation comme fonction pure. Le smoke RM9 rejoue un doublon à l'identique, il ne couvre pas cette variante.

**Préconditions**

- Aucun compte n'existe pour `marc@x.com` (supprimer si un run précédent l'a créé), afin
  que l'étape 1 crée bien l'enregistrement de référence.

**Étapes**

1. Créer le compte de référence, en minuscules et sans espaces :

```bash
curl -s -H "Content-Type: application/json" \
  -d '{"name":"Marc","email":"marc@x.com","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-up/email
```

2. Tenter le signup avec la même adresse en majuscules et entourée d'espaces :

```bash
curl -i -H "Content-Type: application/json" \
  -d '{"name":"Marc","email":"  MARC@x.com  ","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-up/email
```

**Résultat attendu**

- Étape 2 : statut 4xx, corps
  `{ "code": "EMAIL_ALREADY_EXISTS", "message": "<texte en français>" }`.
- En base, toujours **un seul** utilisateur, avec l'email stocké en `marc@x.com` (en
  minuscules, sans espaces). Un second enregistrement, ou un enregistrement stocké
  ` MARC@x.com `, signifie que la normalisation n'est pas appliquée avant stockage.

- [ ] RM21 vérifié

---

### Groupe 4 — Gestion des erreurs et pannes

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM13 | 🟠 | Identifiants incorrects au signin : `INVALID_CREDENTIALS` | [Scénario RM13](#scénario-rm13--identifiants-incorrects-invalid_credentials) |
| RM18, RM19 | 🟢 | Une panne ressort en `INTERNAL_ERROR`, distinct des erreurs métier | aucun smoke, couvert en unitaire |
| RM2 | 🟠 | Route protégée sans session : 401 | [Scénario RM2](#scénario-rm2--route-protégée-sans-session-401) |

---

#### Scénario RM13 — Identifiants incorrects, INVALID_CREDENTIALS

> ✅ **Ce qu'on vérifie :**
> - Un mot de passe faux sur un compte existant renvoie `INVALID_CREDENTIALS`.
> - Un email inexistant renvoie **le même** code, sans jamais révéler lequel des 2 champs est en cause (posture du contrat, opposée à celle du signup).
> - Aucune session n'est posée, aucune erreur brute de Better Auth ne ressort.
> - Pourquoi à la main : la part unitaire mocke le refus de Better Auth. Le smoke confirme la forme réelle de l'erreur, c'est exactement ce que le mock peut rater.

**Préconditions**

- Le compte `rm8@x.com` / `motdepasse8` existe.
- L'email `inconnu@x.com` n'existe **pas** en base.

**Étapes**

1. Bon email, mauvais mot de passe :

```bash
curl -i -H "Content-Type: application/json" \
  -d '{"email":"rm8@x.com","password":"mauvaispassword"}' \
  http://localhost:3000/api/auth/sign-in/email
```

2. Email inexistant :

```bash
curl -i -H "Content-Type: application/json" \
  -d '{"email":"inconnu@x.com","password":"motdepasse8"}' \
  http://localhost:3000/api/auth/sign-in/email
```

**Résultat attendu**

- Les 2 étapes : statut 4xx (pas 5xx), corps
  `{ "code": "INVALID_CREDENTIALS", "message": "<texte en français>" }`, **identique dans
  les 2 cas**.
- Aucun en-tête `Set-Cookie` de session sur l'une ou l'autre réponse.
- Le message ne dit pas lequel du couple email / mot de passe est en faute.

- [ ] RM13 vérifié

---

#### Scénario RM2 — Route protégée sans session, 401

> ✅ **Ce qu'on vérifie :**
> - Une requête sur une route protégée, sans cookie de session, reçoit un 401.
> - Le middleware de garde est **effectivement monté** sur la route, et Better Auth ne renvoie bien aucune session en l'absence de cookie.
> - Pourquoi à la main : la part unitaire teste la décision du middleware avec un lecteur de session mocké. Elle ne dit rien du montage réel. Les smokes du groupe 1 vérifient la pose de la session, pas le refus sur route protégée.

**Préconditions**

- ⚠️ **Variable à ajuster** : `PROTECTED_URL`. Aucune route protégée n'existe dans le repo
  au moment de l'écriture de ce scénario (`src/routes/index.ts` ne monte que `/`,
  `/health`, `/db-health`). Remplacer l'URL ci-dessous par la première route réellement
  gardée par le middleware. Si le ticket se termine sans aucune route protégée, ce smoke
  n'est pas exécutable en l'état : le signaler plutôt que de le cocher.
- Supprimer `cookies.txt` : la requête doit partir **sans** cookie de session.

**Étapes**

1. Appeler la route protégée sans cookie :

```bash
# PROTECTED_URL : à ajuster, exemple ci-dessous
curl -i -H "Origin: http://localhost:5173" \
  http://localhost:3000/standups/today
```

**Résultat attendu**

- Statut **401**.
- Corps à la forme `ApiError` du contrat, avec un message en français, sans erreur brute.

**Lecture d'un résultat différent**

- **404** : la route n'existe pas, ou le middleware n'est pas monté dessus. Ce n'est pas un
  échec de la règle mais un livrable manquant, et le scénario n'a rien vérifié.
- **200** : la route répond sans session, la garde n'est pas branchée. Échec franc de RM2.
- **500** : le middleware lève au lieu de refuser proprement, l'erreur n'est pas ré-emballée.

- [ ] RM2 vérifié
