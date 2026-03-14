import { db } from '@/lib/db'
import { formatCAD, formatDate, getPaymentInstructions } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import TdPayment, { TdIcon } from '@/components/TdPayment'
import WsPayment, { WsIcon } from '@/components/WsPayment'
import PaymentAccordion from '@/components/PaymentAccordion'
import ClientTransition from '@/components/ClientTransition'

interface Payee {
  name: string
  amount: number
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { rows } = await db.sql`
    SELECT title, amount FROM requests WHERE slug = ${slug} LIMIT 1
  `
  const request = rows[0]

  if (!request) return { title: 'Not Found' }

  const formattedAmount = formatCAD(request.amount)
  const title = `Collect | ${request.title} | ${formattedAmount}`

  // Ensure Base URL is defined
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_BASE_URL) : new URL('https://collect.adamliu.uk');
  
  return {
    title,
    openGraph: {
      title,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(request.title)}&amount=${encodeURIComponent(formattedAmount)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [`/api/og?title=${encodeURIComponent(request.title)}&amount=${encodeURIComponent(formattedAmount)}`],
    },
    metadataBase: baseUrl,
  }
}

export default async function RequestPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const { rows } = await db.sql`
    SELECT * FROM requests WHERE slug = ${slug} LIMIT 1
  `
  const request = rows[0]

  if (request) {
    // Map snake_case to camelCase
    request.fromName = request.from_name;
    request.payerName = request.payer_name;
    request.createdAt = request.created_at;
  }

  if (!request) return notFound()

  const payment = getPaymentInstructions(request.method)
  const isPaid = request.status === 'paid'
  const yourName = process.env.YOUR_NAME || '朋友'

  return (
    <ClientTransition title={request.title}>
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 24px',
          paddingTop: 'env(safe-area-inset-top)',
          background: 'var(--washi)',
        }}
      >
        {/* Top decoration */}
        <div style={{ width: '100%', maxWidth: 390, paddingTop: 56, paddingBottom: 8 }}>
          <div className="brush-line" />
        </div>

        {/* Header */}
        <div
          style={{
            width: '100%',
            maxWidth: 390,
            paddingTop: 32,
          }}
        >
          {request.eventDate && (
            <p style={{ 
              fontSize: 12, 
              color: 'var(--clay)', 
              letterSpacing: '0.15em', 
              marginBottom: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600
            }}>
              {formatDate(request.eventDate)}
            </p>
          )}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <h1
              style={{
                fontFamily: 'var(--font-zen, serif)',
                fontSize: `clamp(12px, calc(min(100vw - 48px, 342px) / ${Math.max(1, [...(request.title || '')].length) * 0.55}), 48px)`,
                fontWeight: 800,
                color: 'var(--sumi)',
                lineHeight: 1,
                marginBottom: 8,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}
            >
              {request.title}
            </h1>
          </div>
          {request.location && (
            <p className="no-wrap" style={{ 
              fontSize: 12, 
              color: 'var(--ash)', 
              marginTop: 4,
              fontWeight: 500,
              opacity: 1,
              width: '100%',
              textAlign: 'center'
            }}>
              {request.location}
            </p>
          )}
          
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', width: '100%' }}>
            {request.payerName ? (
              <div style={{ 
                background: 'var(--sumi)', 
                color: 'var(--washi)', 
                padding: '6px 14px', 
                borderRadius: 20, 
                fontSize: 12, 
                fontWeight: 600,
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ opacity: 0.5, fontSize: 10 }}>給</span> {request.payerName} <span style={{ opacity: 0.5, fontSize: 10 }}>已代付</span>
              </div>
            ) : (
              request.fromName && (
                <p style={{ fontSize: 13, color: 'var(--ash)', fontWeight: 500 }}>
                  給 {request.fromName}
                </p>
              )
            )}
          </div>
        </div>

        {/* Marquee Note */}
        {request.note && (
          <div style={{ 
            width: '100%', 
            maxWidth: 390,
            marginTop: 20, 
            overflow: 'hidden', 
            position: 'relative',
            height: 24,
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
          }}>
            <div className="marquee-text" style={{ fontSize: 13, color: 'var(--ash)', fontWeight: 500 }}>
              {request.note}
            </div>
          </div>
        )}

        {/* Amount Card - Receipt Style */}
        <div
          className="animate-in delay-100 receipt-edge"
          style={{
            width: '100%',
            maxWidth: 390,
            marginTop: 28,
            padding: '40px 32px 48px 32px',
            background: 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            borderRadius: '2px', /* Sharp receipt look */
          }}
        >
          <div className="receipt-dashed" style={{ marginTop: 0 }} />
          
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.25em',
              color: 'var(--ash)', /* Darkened */
              marginBottom: 20,
              textAlign: 'center',
              fontWeight: 800
            }}
          >
            {request.payerName ? 'BILLING INVOICE' : 'COLLECT RECEIPT'}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!request.payees ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--ash)', marginBottom: 8, letterSpacing: '0.1em' }}>TOTAL OWED</p>
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 48,
                    fontWeight: 400,
                    color: isPaid ? 'var(--moss)' : 'var(--sumi)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {formatCAD(request.amount)}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(request.payees as Payee[]).map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--ash)' }}>{p.name}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: 'var(--ash)' }}>{formatCAD(p.amount)}</span>
                  </div>
                ))}
                <div className="receipt-dashed" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--sumi)', fontWeight: 700 }}>TOTAL</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 26, color: isPaid ? 'var(--moss)' : 'var(--rust)', fontWeight: 600 }}>{formatCAD(request.amount)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="receipt-dashed" style={{ marginBottom: 0, marginTop: 24 }} />
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
             <p style={{ fontSize: 10, color: 'var(--ash)', letterSpacing: '0.1em', fontWeight: 600 }}>
               {formatDate(request.createdAt)}
             </p>
          </div>

          {isPaid && (
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div style={{
                padding: '6px 16px',
                background: 'var(--moss)',
                borderRadius: 4,
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.1em'
              }}>
                PAID 💰
              </div>
            </div>
          )}
        </div>

        {/* Interactive Payment Switcher */}
        {!isPaid && (
          <PaymentAccordion 
            tdEmail={process.env.TD_EMAIL || ''} 
            wsHandle={process.env.WS_HANDLE || ''}
            title={request.title}
          />
        )}

        {/* Footer */}
        <div
          className="animate-in delay-400"
          style={{
            width: '100%',
            maxWidth: 390,
            marginTop: 'auto',
            paddingTop: 64,
            paddingBottom: 48,
            textAlign: 'center',
          }}
        >
          <p style={{ 
            fontSize: 12, 
            letterSpacing: '0.4em', 
            color: 'var(--sumi)', 
            textTransform: 'uppercase', 
            fontWeight: 800,
            opacity: 0.9
          }}>
            Collect
          </p>
          <p style={{ 
            fontSize: 8, 
            letterSpacing: '0.2em', 
            color: 'var(--ash)', 
            marginTop: 8,
            opacity: 0.6,
            fontWeight: 500
          }}>
            © BY ADAM LIU
          </p>
        </div>
      </main>
    </ClientTransition>
  )
}
