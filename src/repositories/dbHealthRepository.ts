import { prisma } from '@/repositories/prismaClient.js'
import type { DbHealthRepository } from '@/services/dbHealth/dbHealthService.js'

export const dbHealthRepository: DbHealthRepository = {
  async ping() {
    await prisma.$queryRaw`SELECT 1`
  },
}
