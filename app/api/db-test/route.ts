import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Show which env vars are available (names only, not values)
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    // Try to connect
    const { Pool } = require('pg');
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      return NextResponse.json({ error: 'No connection string found', envCheck }, { status: 500 });
    }

    const pool = new Pool({ connectionString });
    const result = await pool.query('SELECT 1 as connected');
    await pool.end();

    return NextResponse.json({ 
      status: 'connected', 
      envCheck,
      result: result.rows[0],
      urlPrefix: connectionString.substring(0, 30) + '...'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      envCheck: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
        DATABASE_URL: !!process.env.DATABASE_URL,
      }
    }, { status: 500 });
  }
}
