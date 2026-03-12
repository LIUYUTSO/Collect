import { prisma } from '@/lib/prisma'
import { formatCAD, formatDate, getPaymentInstructions } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function RequestPage({
  params,
}: {
  params: { slug: string }
}) {
  const request = await prisma.request.findUnique({
    where: { slug: params.slug },
  })

  if (!request) return notFound()

  const payment = getPaymentInstructions(request.method)
  const isPaid = request.status === 'paid'
  const yourName = process.env.YOUR_NAME || '朋友'

  return (
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
        className="animate-in"
        style={{
          width: '100%',
          maxWidth: 390,
          paddingTop: 32,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-zen, serif)',
            fontSize: 11,
            letterSpacing: '0.25em',
            color: 'var(--ash)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          來自 · {yourName}
        </p>
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
        {request.fromName && (
          <p style={{ fontSize: 13, color: 'var(--ash)', marginTop: 4 }}>
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
          borderRadius: 3,
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

        {isPaid && (
          <div
            style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: 'rgba(74, 82, 64, 0.1)',
              borderRadius: 2,
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

      {/* Payment Instructions */}
      {!isPaid && (
        <div
          className="animate-in delay-300"
          style={{
            width: '100%',
            maxWidth: 390,
            marginTop: 32,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              color: 'var(--ash)',
              marginBottom: 16,
            }}
          >
            付款方式 · HOW TO PAY
          </p>

          <div
            style={{
              padding: '24px 28px',
              border: '1px solid var(--fog)',
              borderRadius: 3,
              background: 'rgba(255,255,255,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: 22, marginTop: 2 }}>{payment.icon}</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: 'var(--sumi)',
                    marginBottom: 4,
                  }}
                >
                  {payment.label}
                </p>
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 15,
                    color: 'var(--sumi)',
                    letterSpacing: '0.02em',
                    wordBreak: 'break-all',
                  }}
                >
                  {payment.detail}
                </p>
              </div>
            </div>

            <div className="brush-line" style={{ margin: '20px 0' }} />

            <p style={{ fontSize: 12, color: 'var(--ash)', lineHeight: 1.7 }}>
              請使用 Interac e-Transfer 轉帳。
              備註欄填入「<strong style={{ color: 'var(--sumi)' }}>{request.title}</strong>」。
            </p>
          </div>
        </div>
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
        <p style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--fog)' }}>
          {formatDate(request.createdAt)} · 請款
        </p>
      </div>
    </main>
  )
}
