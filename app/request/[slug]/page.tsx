import { db, ensureTables } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { formatCAD } from '@/lib/utils'
import RequestClient from './RequestClient'
import ClientTransition from '@/components/ClientTransition'

export async function generateMetadata({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const { slug } = await params;
  const { p: activePayeeName } = await searchParams;
  
  const { rows } = await db.sql`
    SELECT * FROM requests WHERE slug = ${slug} LIMIT 1
  `
  const request = rows[0]
  if (!request) return { title: 'Not Found' }

  let displayTitle = request.title;
  let displayAmount = Number(request.amount);
  let recipientName = activePayeeName as string;

  // If there's a specific person, calculate their personal unpaid total across all bills
  if (activePayeeName) {
    try {
      // 1. Fetch current request participants details
      const payees = typeof request.payees === 'string' ? JSON.parse(request.payees) : request.payees;
      const participants = new Set<string>();
      if (Array.isArray(payees)) payees.forEach((p: any) => p.name && participants.add(p.name));
      if (request.from_name) participants.add(request.from_name);
      const participantList = Array.from(participants);

      // 2. Fetch all consolidated requests from the same payer involving these participants
      const { rows: relatedRows } = await db.sql`
        SELECT * FROM requests 
        WHERE slug != ${slug}
        AND payer_name = ${request.payer_name}
        AND (
          from_name = ANY(${participantList as any})
          OR payees @> ANY(${participantList.map(ns => JSON.stringify([{name: ns}])) as any})
        )
      `;
      
      const involved = [request, ...relatedRows];
      let unpaidSum = 0;
      involved.forEach(r => {
        const rPayees = typeof r.payees === 'string' ? JSON.parse(r.payees) : r.payees;
        if (Array.isArray(rPayees)) {
          rPayees.forEach((p: any) => {
            if (p.name === activePayeeName && !p.paid) unpaidSum += (p.amount || 0);
          });
        } else if (r.from_name === activePayeeName && r.status === 'pending') {
          unpaidSum += Number(r.amount);
        }
      });
      displayAmount = unpaidSum;
      displayTitle = activePayeeName as string; 
    } catch (e) {
      console.error('Metadata calc error:', e);
    }
  }

  const formattedAmount = formatCAD(displayAmount)
  const metaTitle = activePayeeName 
    ? `Collect | ${activePayeeName} | ${formattedAmount}`
    : `Collect | ${request.title} | ${formattedAmount}`;
    
  const metaDesc = activePayeeName ? `💳 Invoice to ${activePayeeName}` : `Invoice for ${request.title}`;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
    : new URL('https://collect.adamliu.uk');

  return {
    title: metaTitle,
    description: metaDesc,
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      images: [{ url: `/api/og?title=${encodeURIComponent(displayTitle)}&amount=${encodeURIComponent(formattedAmount)}`, width: 1200, height: 630 }]
    },
    metadataBase: baseUrl,
  }
}

export default async function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 1. Fetch the primary request
  const { rows } = await db.sql`
    SELECT * FROM requests WHERE slug = ${slug} LIMIT 1
  `
  const request = rows[0]
  if (!request) return notFound()

  // 2. Parse payees to identify participants
  let parsedPayees: import("@/lib/types").Payee[] = [];
  try {
    parsedPayees = typeof request.payees === 'string'
      ? JSON.parse(request.payees)
      : (request.payees || []);
  } catch (e) {
    console.error('Failed to parse payees:', e);
  }

  const participants = new Set<string>();
  if (Array.isArray(parsedPayees)) {
    parsedPayees.forEach((p: any) => p.name && participants.add(p.name));
  }
  if (request.from_name) {
    participants.add(request.from_name);
  }

  // 3. Fetch other pending claims for these participants (Efficiency: uses indexes)
  let consolidatedRequests: any[] = [];
  if (participants.size > 0) {
    const participantList = Array.from(participants);
    
    // We search for requests where the participant is from_name OR in payees list
    // This query is optimized to hit the indexes we created
    const { rows: relatedRows } = await db.sql`
      SELECT * FROM requests 
      WHERE slug != ${slug}
      AND payer_name = ${request.payer_name}
      AND (
        from_name = ANY(${participantList as any})
        OR payees @> ANY(${participantList.map(name => JSON.stringify([{name}])) as any})
      )
    `;
    consolidatedRequests = relatedRows;
  }

  const clientRequest = {
    ...request,
    id: request.id,
    slug: request.slug,
    title: request.title,
    method: request.method,
    status: request.status,
    amount: Number(request.amount),
    fromName: request.from_name,
    payerName: request.payer_name,
    createdAt: request.created_at instanceof Date
      ? request.created_at.toISOString()
      : (request.created_at || new Date().toISOString()),
    eventDate: request.event_date
      ? (request.event_date instanceof Date ? request.event_date.toISOString() : request.event_date)
      : undefined,
    payees: Array.isArray(parsedPayees) ? parsedPayees : undefined,
    // Add consolidated data
    consolidated: consolidatedRequests.map(r => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      amount: Number(r.amount),
      fromName: r.from_name,
      payerName: r.payer_name,
      payees: typeof r.payees === 'string' ? JSON.parse(r.payees) : r.payees
    }))
  }

  // 4. Fetch all payees to map their private messages
  let payeesMessageMap: Record<string, string> = {};
  try {
    await ensureTables();
    const { rows: payeesRows } = await db.sql`SELECT name, message FROM payees`;
    payeesMessageMap = payeesRows.reduce((acc: any, p: any) => {
      if (p.message) acc[p.name] = p.message;
      return acc;
    }, {});
  } catch (e) {
    console.error('Failed to fetch payee messages:', e);
    // Fallback if column still missing during initial migration period
  }

  return (
    <ClientTransition title={request.title as string}>
      <RequestClient
        request={clientRequest}
        tdEmail={process.env.TD_EMAIL || ''}
        wsHandle={process.env.WS_HANDLE || ''}
        payeesMessageMap={payeesMessageMap}
      />
    </ClientTransition>
  )
}
