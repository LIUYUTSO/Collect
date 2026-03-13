import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, amount, note, status, method, fromName, payees, eventDate, location } = body

  const { rows } = await db.sql`
    UPDATE requests 
    SET title = COALESCE(${title}, title),
        amount = COALESCE(${amount ? parseFloat(amount) : null}, amount),
        note = COALESCE(${note}, note),
        status = COALESCE(${status}, status),
        method = COALESCE(${method}, method),
        from_name = COALESCE(${fromName}, from_name),
        payees = COALESCE(${payees ? (typeof payees === 'string' ? payees : JSON.stringify(payees)) : null}, payees),
        event_date = COALESCE(${eventDate}, event_date),
        location = COALESCE(${location}, location),
        paid_at = ${status === 'paid' ? new Date().toISOString() : (status === 'pending' ? null : undefined)},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(rows[0])
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.sql`DELETE FROM requests WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
