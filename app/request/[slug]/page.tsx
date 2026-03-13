import { db } from '@/lib/db'
import { formatCAD, formatDate, getPaymentInstructions } from '@/lib/utils'
import { notFound } from 'next/navigation'
import TdPayment, { TdIcon } from '@/components/TdPayment'
import WsPayment, { WsIcon } from '@/components/WsPayment'
import PaymentAccordion from '@/components/PaymentAccordion'
import ClientTransition from '@/components/ClientTransition'

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
    request.createdAt = request.created_at;
  }

  if (!request) return notFound()

  const payment = getPaymentInstructions(request.method)
  const isPaid = request.status === 'paid'
  const yourName = process.env.YOUR_NAME || '朋友'

  return (
    <ClientTransition title={request.title}>
      <main
        className="animate-in"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 24px',
          paddingTop: 'env(safe-area-inset-top)',
          background: 'var(--washi)',
          animationDuration: '1.2s', /* Slower, more premium reveal */
        }}
      >
        {/* Top decoration */}
        <div style={{ width: '100%', maxWidth: 390, paddingTop: 56, paddingBottom: 8 }}>
          <div className="brush-line" />
        </div>

        {/* Header */}
        <div
          className="animate-in"
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
              marginBottom: 8,
              fontFamily: 'var(--font-mono)'
            }}>
              {formatDate(request.eventDate)}
            </p>
          )}
          <h1
            style={{
              fontFamily: 'var(--font-zen, serif)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--sumi)',
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            {request.title}
          </h1>
          {request.location && (
            <p style={{ 
              fontSize: 11, 
              color: 'var(--ash)', 
              marginTop: 6,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: 0.8
            }}>
              {request.location}
            </p>
          )}
          {request.fromName && (
            <p style={{ fontSize: 13, color: 'var(--ash)', marginTop: 8 }}>
              給 {request.fromName}
            </p>
          )}
        </div>

        {/* Amount Card */}
        <div
          className="animate-in delay-100"
          style={{
            width: '100%',
            maxWidth: 390,
            marginTop: 36,
            padding: '32px 28px',
            border: '1px solid var(--fog)',
            borderRadius: 8,
            background: isPaid ? 'rgba(74, 82, 64, 0.05)' : 'rgba(255,255,255,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle corner mark - wabi-sabi */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '1px solid var(--clay)',
              opacity: 0.15,
              transform: 'rotate(-8deg)',
            }}
          />

          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              color: 'var(--ash)',
              marginBottom: 12,
            }}
          >
            金額 · AMOUNT
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!request.payees ? (
              <p
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 42,
                  fontWeight: 300,
                  color: isPaid ? 'var(--moss)' : 'var(--sumi)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {formatCAD(request.amount)}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(request.payees as any[]).map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, color: 'var(--sumi)' }}>{p.name}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, color: 'var(--sumi)', fontWeight: 300 }}>{formatCAD(p.amount)}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: 'var(--fog)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--ash)' }}>TOTAL</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, color: isPaid ? 'var(--moss)' : 'var(--rust)', fontWeight: 400 }}>{formatCAD(request.amount)}</span>
                </div>
              </div>
            )}
          </div>

          {isPaid && (
            <div
              style={{
                marginTop: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: 'rgba(74, 82, 64, 0.1)',
                borderRadius: 4,
                border: '1px solid rgba(74, 82, 64, 0.2)',
              }}
            >
              <span style={{ fontSize: 10 }}>✓</span>
              <span style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--moss)' }}>
                已收到 · RECEIVED
              </span>
            </div>
          )}
        </div>

        {/* Note */}
        {request.note && (
          <div
            className="animate-in delay-200"
            style={{
              width: '100%',
              maxWidth: 390,
              marginTop: 20,
              padding: '20px 28px',
              borderLeft: '2px solid var(--clay)',
              background: 'rgba(196, 168, 130, 0.06)',
            }}
          >
            <p
              style={{
                fontSize: 11,
                letterSpacing: '0.2em',
                color: 'var(--ash)',
                marginBottom: 8,
              }}
            >
              備註 · NOTE
            </p>
            <p style={{ fontSize: 15, color: 'var(--sumi)', lineHeight: 1.7 }}>
              {request.note}
            </p>
          </div>
        )}

        {/* Interactive Payment Switcher (Folding Card) */}
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
            paddingTop: 48,
            paddingBottom: 40,
            textAlign: 'center',
          }}
        >
          <div className="brush-line" style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--clay)', opacity: 0.6 }} />
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--fog)', textTransform: 'uppercase' }}>
              Collect
            </p>
          </div>
        </div>
      </main>
    </ClientTransition>
  )
}
