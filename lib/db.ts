import { sql } from '@vercel/postgres';

export const db = sql;

export async function ensureTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    console.log('Database tables ensured');
  } catch (error) {
    console.error('Error ensuring tables:', error);
  }
}
