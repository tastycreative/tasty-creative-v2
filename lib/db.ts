import { PrismaClient } from '@prisma/client'
import { PrismaClient as PrismaClientSupabase } from '@prisma/client-supabase'

// Primary database (Neon)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Secondary database (Supabase)
const globalForSupabase = globalThis as unknown as {
  supabase: PrismaClientSupabase | undefined
}

export const supabaseDb = globalForSupabase.supabase ?? new PrismaClientSupabase()

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabaseDb

// Export both clients
export default db