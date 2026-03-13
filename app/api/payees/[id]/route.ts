import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get('x-admin-key')
  if (!verifyAdmin(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.sql`DELETE FROM payees WHERE id = ${id}`;
  return NextResponse.json({ success: true })
}
