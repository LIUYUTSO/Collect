import { NextRequest, NextResponse } from 'next/server'
import { db, ensureTables } from '@/lib/db'
import { generateSlug } from '@/lib/utils'
import { nanoid } from 'nanoid'
import { verifyAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Simple admin auth
  const auth = req.headers.get('x-admin-key')
  if (!verifyAdmin(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTables()
    const body = await req.json()
    const items = Array.isArray(body) ? body : [body]
    const results = []

    for (const item of items) {
      const { title, amount, note, method = 'all', fromName, payerName, payees, eventDate, location } = item
      if (!title || (!amount && (!payees || payees.length === 0))) continue

      const slug = generateSlug()
      const id = nanoid()

      await db.sql`
        INSERT INTO requests (id, slug, title, amount, note, method, from_name, payer_name, payees, event_date, location)
        VALUES (
          ${id}, ${slug}, ${title}, ${parseFloat(amount || 0)}, ${note || null}, 
          ${method}, ${fromName || null}, ${payerName || null}, ${payees ? JSON.stringify(payees) : null},
          ${eventDate || null}, ${location || null}
        )
      `;
      results.push({ id, slug, title, amount: parseFloat(amount || 0), fromName: fromName || null, payerName: payerName || null, payees, eventDate, location })
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'No valid data provided' }, { status: 400 })
    }

    return NextResponse.json(Array.isArray(body) ? results : results[0])
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (!verifyAdmin(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureTables()
  
  const { rows } = await db.sql`
    SELECT * FROM requests 
    ORDER BY created_at DESC 
    LIMIT 50
  `;

  // Map database naming (snake_case) to client naming (camelCase) if necessary
  const requests = rows.map(r => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    amount: parseFloat(r.amount),
    note: r.note,
    method: r.method,
    status: r.status,
    fromName: r.from_name,
    payerName: r.payer_name,
    payees: r.payees,
    eventDate: r.event_date,
    location: r.location,
    paidAt: r.paid_at,
    createdAt: r.created_at
  }))

  return NextResponse.json(requests)
}
