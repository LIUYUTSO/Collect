import { sql } from '@vercel/postgres';

export const db = sql;

export async function ensureTables() {
  console.log('Postgres Env Check:', {
    hasURL: !!process.env.POSTGRES_URL,
    hasDirectURL: !!process.env.POSTGRES_URL_NON_POOLING,
    hasDatabaseURL: !!process.env.DATABASE_URL,
  });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency TEXT DEFAULT 'CAD',
        note TEXT,
        method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        from_name TEXT,
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Migration: Change UUID to TEXT if already exists
    try {
      await sql`ALTER TABLE requests ALTER COLUMN id TYPE TEXT;`;
    } catch (e) {
      // Ignore if already TEXT or other issues
    }
    await sql`
      CREATE TABLE IF NOT EXISTS payees (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    // For WebAuthn / Biometric login
    await sql`
      CREATE TABLE IF NOT EXISTS credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        credential_id TEXT UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        counter INTEGER DEFAULT 0,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Database tables ensured');
  } catch (error) {
    console.error('Error ensuring tables:', error);
  }
}
