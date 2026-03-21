import { NextRequest, NextResponse } from 'next/server'
import { db, ensureTables } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (!verifyAdmin(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureTables()
  const { rows } = await db.sql`SELECT * FROM payees ORDER BY name ASC`;
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (!verifyAdmin(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureTables()
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const id = crypto.randomUUID()
  try {
    const { rows } = await db.sql`
      INSERT INTO payees (id, name)
      VALUES (${id}, ${name})
      RETURNING *
    `;
    return NextResponse.json(rows[0])
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === '23505') { // Unique constraint
      const { rows } = await db.sql`SELECT * FROM payees WHERE name = ${name}`;
      return NextResponse.json(rows[0])
    }
    return NextResponse.json({ error: 'Server error', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (!verifyAdmin(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureTables()
  const { id, message } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    const { rows } = await db.sql`
      UPDATE payees 
      SET message = ${message || null}
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0])
  } catch (e) {
    return NextResponse.json({ error: 'Server error', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
