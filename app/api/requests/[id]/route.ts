import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await req.json()

  const { rows } = await db.sql`
    UPDATE requests 
    SET status = ${status}, 
        paid_at = ${status === 'paid' ? new Date().toISOString() : null},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${params.id}
    RETURNING *
  `;

  return NextResponse.json(rows[0])
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.sql`DELETE FROM requests WHERE id = ${params.id}`
  return NextResponse.json({ ok: true })
}
