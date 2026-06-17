import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  // Priority: POSTGRES_URL (Vercel+Supabase integration pooled) > DATABASE_URL (manual)
  const rawUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!rawUrl) {
    throw new Error('No database URL found. Set POSTGRES_URL or DATABASE_URL.');
  }

  // Strip sslmode param from URL — we handle SSL config directly via Pool options
  let connectionString = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete('sslmode');
    connectionString = parsed.toString();
  } catch {
    // If URL parsing fails, use as-is
  }

  const pool = globalForPrisma.pool ?? new Pool({ 
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool;
  }

  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
