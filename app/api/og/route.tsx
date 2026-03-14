import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'
import { formatCAD, formatDate } from '@/lib/utils'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return new Response('Missing slug', { status: 400 })
    }

    const { rows } = await db.sql`
      SELECT * FROM requests WHERE slug = ${slug} LIMIT 1
    `
    const requestData = rows[0]

    if (!requestData) {
      return new Response('Not found', { status: 404 })
    }

    const title = requestData.title
    const amount = formatCAD(requestData.amount)
    const date = formatDate(requestData.created_at)
    const payerName = requestData.payer_name
    
    // Safely parse JSON array depending on the DB driver
    const rawPayees = requestData.payees
    const payees: { name: string; amount: number }[] = typeof rawPayees === 'string' ? JSON.parse(rawPayees) : (rawPayees || [])

    // Load Zen Old Mincho font
    const fontUrl = 'https://fonts.gstatic.com/s/zenoldmincho/v10/tss0ApVaYytLwxTqcxfMyBLack0Zx7tS.woff'
    const fontData = await fetch(fontUrl).then((res) => res.arrayBuffer())

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F2EDE4',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* COLLECT — large, sharp, behind blur (Satori z-index trick since blur filter lacks full support) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <span
              style={{
                fontFamily: 'Zen Old Mincho',
                fontSize: '120px',
                fontWeight: 400,
                color: '#1A1714',
                letterSpacing: '0.35em',
                textShadow: '0px 1px 1px rgba(26,23,20,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              COLLECT
            </span>
          </div>

          {/* Receipt — centered over the text */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '320px',
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: '32px',
              paddingRight: '24px',
              paddingBottom: '32px',
              paddingLeft: '24px',
              opacity: 0.95, // Filter blur is not natively supported by Satori, relying on opacity
              borderRadius: '8px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.1)' // Give it some depth instead of blur
            }}
          >
            {/* BILLING INVOICE */}
            <div style={{
              fontSize: '8px',
              letterSpacing: '4px',
              color: '#A09D98',
              textAlign: 'center',
              marginBottom: '16px',
              fontFamily: 'monospace',
            }}>
              BILLING INVOICE
            </div>

            {/* Title */}
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#1A1714',
              textAlign: 'center',
              marginBottom: '4px',
              fontFamily: 'serif',
            }}>
              {title}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #D4CFC8', marginTop: '16px', marginBottom: '16px', width: '100%', height: '1px' }} />

            {/* Payees */}
            {payees.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {payees.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '9px', color: '#A09D98', fontFamily: 'monospace' }}>{p.name}</span>
                    <span style={{ fontSize: '9px', color: '#A09D98', fontFamily: 'monospace' }}>{formatCAD(p.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '9px', color: '#A09D98', fontFamily: 'monospace', textAlign: 'center' }}>
                {payerName || '—'}
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #D4CFC8', marginTop: '16px', marginBottom: '16px', width: '100%', height: '1px' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '9px', color: '#3D3933', letterSpacing: '2px', fontFamily: 'monospace' }}>TOTAL</span>
              <span style={{ fontSize: '32px', color: '#8B4A3C', fontFamily: 'monospace', letterSpacing: '-1px' }}>{amount}</span>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #D4CFC8', marginTop: '16px', marginBottom: '16px', width: '100%', height: '1px' }} />

            {/* Date */}
            <div style={{ fontSize: '8px', color: '#C4BFB8', textAlign: 'center', fontFamily: 'monospace', letterSpacing: '2px' }}>
              {date}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Zen Old Mincho',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    )
  } catch (e: any) {
    console.error(e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
