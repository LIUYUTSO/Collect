import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Collect Invoice'
    const amount = searchParams.get('amount') || ''

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
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              padding: '60px 80px',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 48,
                color: '#1A1714',
                fontWeight: 800,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {title}
            </div>
            
            {amount && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 80,
                  fontWeight: 800,
                  color: '#8B4A3C',
                  marginTop: 20,
                }}
              >
                {amount}
              </div>
            )}
            
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                color: '#A09D98',
                marginTop: 40,
                letterSpacing: '4px',
              }}
            >
              COLLECT
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
    return new Response('Failed to generate image', { status: 500 })
  }
}
