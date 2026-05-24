import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'

const DATABASE_URL = process.env.DATABASE_URL ?? ''

function createPrismaClient() {
  if (DATABASE_URL.startsWith('prisma+postgres://')) {
    const adapter = new PrismaPostgresAdapter({ connectionString: DATABASE_URL })
    return new PrismaClient({ adapter })
  }
  const adapter = new PrismaPg({ connectionString: DATABASE_URL })
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
