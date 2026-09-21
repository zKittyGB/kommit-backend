import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Le CLI Prisma ne charge pas le .env tout seul. En production, les variables viennent de l'hébergeur.
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
