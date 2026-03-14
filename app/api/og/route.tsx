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

    const title = requestData.title || 'Invoice'
    const amount = formatCAD(requestData.amount || 0)
    const date = formatDate(requestData.created_at || new Date())
    const payerName = requestData.payer_name || 'Anonymous'
    
    // Safely parse JSON array depending on the DB driver
    const rawPayees = requestData.payees
    const payees: { name: string; amount: number }[] = typeof rawPayees === 'string' ? JSON.parse(rawPayees) : (rawPayees || [])

    // Load Zen Old Mincho font (Using default weight for all text)
    const fontUrl = 'https://fonts.gstatic.com/s/zenoldmincho/v10/tss0ApVaYytLwxTqcxfMyBLack0Zx7tS.woff'
    const fontResponse = await fetch(fontUrl)
    const fontData = await fontResponse.arrayBuffer()

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
              display: 'flex',
              fontSize: '8px',
              letterSpacing: '4px',
              color: '#A09D98',
              justifyContent: 'center',
              marginBottom: '16px',
              fontFamily: 'monospace',
              width: '100%'
            }}>
              BILLING INVOICE
            </div>

            {/* Title */}
            <div style={{
              display: 'flex',
              fontSize: '18px',
              fontWeight: 800,
              color: '#1A1714',
              textAlign: 'center',
              marginBottom: '4px',
              fontFamily: '"Zen Old Mincho"',
              justifyContent: 'center',
            }}>
              {title}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #D4CFC8', marginTop: '16px', marginBottom: '16px', width: '100%', height: '1px' }} />

            {/* Payees */}
            {payees.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {payees.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', fontSize: '9px', color: '#A09D98', fontFamily: 'monospace' }}>{p.name}</div>
                    <div style={{ display: 'flex', fontSize: '9px', color: '#A09D98', fontFamily: 'monospace' }}>{formatCAD(p.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', fontSize: '9px', color: '#A09D98', fontFamily: 'monospace', justifyContent: 'center', width: '100%' }}>
                {payerName || '—'}
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #D4CFC8', marginTop: '16px', marginBottom: '16px', width: '100%', height: '1px' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', fontSize: '9px', color: '#3D3933', letterSpacing: '2px', fontFamily: 'monospace' }}>TOTAL</div>
              <div style={{ display: 'flex', fontSize: '32px', color: '#8B4A3C', fontFamily: 'monospace', letterSpacing: '-1px' }}>{amount}</div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #D4CFC8', marginTop: '16px', marginBottom: '16px', width: '100%', height: '1px' }} />

            {/* Date */}
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: '8px', color: '#C4BFB8', fontFamily: 'monospace', letterSpacing: '2px', width: '100%' }}>
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
