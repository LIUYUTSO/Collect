import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { formatCAD } from '@/lib/utils'
import RequestClient from './RequestClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { rows } = await db.sql`
    SELECT title, amount FROM requests WHERE slug = ${slug} LIMIT 1
  `
  const request = rows[0]
  if (!request) return { title: 'Not Found' }

  const formattedAmount = formatCAD(Number(request.amount))
  const title = `Collect | ${request.title} | ${formattedAmount}`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_BASE_URL) : new URL('https://collect.adamliu.uk');
  
  return {
    title,
    openGraph: { title, images: [{ url: `/api/og?title=${encodeURIComponent(request.title)}&amount=${encodeURIComponent(formattedAmount)}`, width: 1200, height: 630 }] },
    metadataBase: baseUrl,
  }
}

export default async function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { rows } = await db.sql`
    SELECT * FROM requests WHERE slug = ${slug} LIMIT 1
  `
  const request = rows[0]

  if (!request) return notFound()

  // 資料清洗與映射，確保進入 Client 端時格式正確
  let parsedPayees = null;
  try {
    if (typeof request.payees === 'string') {
      parsedPayees = JSON.parse(request.payees);
    } else {
      parsedPayees = request.payees;
    }
  } catch (e) {
    console.error('Failed to parse payees:', e);
  }

  const clientRequest = {
    ...request,
    amount: Number(request.amount),
    fromName: request.from_name,
    payerName: request.payer_name,
    createdAt: request.created_at instanceof Date ? request.created_at.toISOString() : (request.created_at || new Date().toISOString()),
    eventDate: request.event_date ? (request.event_date instanceof Date ? request.event_date.toISOString() : request.event_date) : null,
    payees: Array.isArray(parsedPayees) ? parsedPayees : null
  }

  return (
    <RequestClient 
      request={clientRequest} 
      tdEmail={process.env.TD_EMAIL || ''}
      wsHandle={process.env.WS_HANDLE || ''}
    />
  )
}
