import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await req.json()

  const request = await prisma.request.update({
    where: { id: params.id },
    data: {
      status,
      paidAt: status === 'paid' ? new Date() : null,
    },
  })

  return NextResponse.json(request)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.request.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
