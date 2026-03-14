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

    // Map snake_case to camelCase
    const title = requestData.title
    const amount = formatCAD(requestData.amount)
    const date = formatDate(requestData.created_at)
    const receiver = requestData.payer_name || 'COLLECT INVOICE'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F2EDE4',
            fontFamily: 'sans-serif',
            padding: '80px',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              width: '800px',
              height: '500px',
              borderRadius: '24px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.08)',
              padding: '60px',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '24px',
                  letterSpacing: '0.2em',
                  color: '#6D5A42',
                  fontWeight: 600,
                  marginBottom: '20px',
                }}
              >
                {receiver.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '64px',
                  fontWeight: 800,
                  color: '#1A1714',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </span>
            </div>

            {/* Footer containing Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '20px', color: '#A09D98', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  {date}
                 </span>
                 <span style={{ fontSize: '24px', fontWeight: 600, color: '#3D3933' }}>
                  by Collect
                 </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '20px', letterSpacing: '0.2em', color: '#1A1714', fontWeight: 700, marginBottom: '12px' }}>
                  TOTAL OWED
                </span>
                <span
                  style={{
                    fontSize: '84px',
                    fontWeight: 400,
                    color: '#8B4A3C',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {amount}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error(e)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
