import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function POST(req: NextRequest) {
  // Simple admin auth
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, amount, note, method, fromName } = body

    if (!title || !amount || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const slug = generateSlug()

    const request = await prisma.request.create({
      data: {
        slug,
        title,
        amount: parseFloat(amount),
        note: note || null,
        method,
        fromName: fromName || null,
      },
    })

    return NextResponse.json({ slug: request.slug, id: request.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requests = await prisma.request.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(requests)
}
