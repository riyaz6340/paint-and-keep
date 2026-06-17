import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env file manually since prisma.config.ts doesn't auto-load it
config({ path: path.join(__dirname, '.env') });
config({ path: path.join(__dirname, '.env.local'), override: true });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    // Support Vercel+Supabase integration env vars or standard DATABASE_URL
    url: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
});
