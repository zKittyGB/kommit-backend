# kommit-backend

Backend du projet Kommit : une API Node.js en TypeScript (Express, Prisma/Postgres).

## Arborescence

```
kommit-backend/
├── .claude/
│   ├── settings.json
│   ├── agents/
│   │   ├── code-reviewer.md
│   │   ├── smoke-test-writer.md
│   │   ├── test-planner.md
│   │   └── unit-test-writer.md
│   ├── rules/
│   │   ├── architecture-backend.md
│   │   ├── files.md
│   │   ├── imports.md
│   │   ├── perimetre-backend.md
│   │   ├── pnpm.md
│   │   ├── structure-a-jour.md
│   │   └── tests-arrange-act-assert.md
│   └── skills/
│       ├── merge-pr/SKILL.md
│       ├── open-pr/SKILL.md
│       ├── review-code/SKILL.md
│       ├── start-ticket/SKILL.md
│       ├── write-code/SKILL.md
│       └── write-tests/SKILL.md
├── .vscode/
│   └── settings.json
├── docs/
│   ├── TECH.md
│   ├── testing-strategy.md
│   └── workflow-ticket-backend.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── service.ts
│   ├── middlewares/
│   │   └── cors.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── dbHealthRoutes.ts
│   │   ├── healthRoutes.ts
│   │   └── rootRoutes.ts
│   ├── controllers/
│   │   ├── dbHealthController.ts
│   │   ├── healthController.ts
│   │   └── rootController.ts
│   ├── services/
│   │   ├── dbHealth/
│   │   │   └── dbHealthService.ts
│   │   ├── health/
│   │   │   └── healthService.ts
│   │   └── root/
│   │       └── rootService.ts
│   ├── repositories/
│   │   ├── dbHealthRepository.ts
│   │   └── prismaClient.ts
│   └── types/
│       └── apiContract.ts
├── .env.example
├── .gitignore
├── CLAUDE.md
├── package.json
├── pnpm-lock.yaml
├── prisma.config.ts
└── tsconfig.json
```
