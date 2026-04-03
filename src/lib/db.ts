import { PrismaClient } from '@prisma/client'

/**
 * Singleton global de Prisma para evitar múltiples instancias en hot-reload de Next.js.
 * En producción, usa Supabase Supavisor (puerto 6543) vía DATABASE_URL para connection pooling.
 * Para migraciones, usa DIRECT_URL (puerto 5432) — solo desde CLI.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db