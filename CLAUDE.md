# kommit-backend

Backend du projet Kommit : une API Node.js en TypeScript (Express, Prisma/Postgres).

## Arborescence

```
kommit-backend/
├── .claude/
│   ├── settings.json
│   └── rules/
│       ├── architecture-backend.md
│       ├── files.md
│       ├── imports.md
│       ├── perimetre-backend.md
│       ├── pnpm.md
│       └── tests-arrange-act-assert.md
├── .vscode/
│   └── settings.json
├── docs/
│   └── TECH.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── service.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── healthRoutes.ts
│   │   └── rootRoutes.ts
│   ├── controllers/
│   │   ├── healthController.ts
│   │   └── rootController.ts
│   ├── services/
│   │   ├── health/
│   │   │   └── healthService.ts
│   │   └── root/
│   │       └── rootService.ts
│   └── repositories/
│       └── prismaClient.ts
├── .env.example
├── .gitignore
├── CLAUDE.md
├── package.json
├── pnpm-lock.yaml
├── prisma.config.ts
└── tsconfig.json
```
