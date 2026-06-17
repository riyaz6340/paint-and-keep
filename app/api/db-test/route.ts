import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    const { Pool } = require('pg');
    let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      return NextResponse.json({ error: 'No connection string found', envCheck }, { status: 500 });
    }

    // Strip sslmode from URL and handle SSL manually
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    const cleanUrl = url.toString();

    const pool = new Pool({ 
      connectionString: cleanUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    const result = await pool.query('SELECT 1 as connected');
    await pool.end();

    return NextResponse.json({ 
      status: 'connected', 
      envCheck,
      result: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
      envCheck: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
        DATABASE_URL: !!process.env.DATABASE_URL,
      }
    }, { status: 500 });
  }
}
