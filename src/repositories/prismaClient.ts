import { PrismaPg } from '@prisma/adapter-pg'
import { databaseUrl } from '@/config/env.js'
import { PrismaClient } from '@/generated/prisma/client.js'

export const prisma = new PrismaClient({
  // Sans délai, une base injoignable peut bloquer une requête (et /db-health) indéfiniment.
  adapter: new PrismaPg({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 }),
})
