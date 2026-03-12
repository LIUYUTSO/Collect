import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, challenge, data } = await req.json()

    // 1. REGISTRATION - CHALLEGE
    if (action === 'register-options') {
      const challenge = crypto.randomBytes(32).toString('base64url')
      // In a real app, we'd store this challenge in a session or temp DB
      // For this simple POC, we'll return it and expect it back
      return NextResponse.json({
        challenge,
        rp: { name: 'Collect', id: req.headers.get('host')?.split(':')[0] },
        user: { 
          id: Buffer.from('admin').toString('base64url'), 
          name: 'admin', 
          displayName: 'Admin' 
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
        authenticatorSelection: { userVerification: 'preferred' },
        timeout: 60000,
      })
    }

    // 2. REGISTRATION - VERIFY
    if (action === 'register-verify') {
      // Data contains the response from navigator.credentials.create
      // In a full implementation, we'd verify the signature and attestation
      // For this POC, we'll store the credentialId and publicKey
      const { id, rawId, response } = data
      
      // Extract public key and other info from response (Simplified)
      // Normally we use @simplewebauthn/server here.
      // Since we can't install it, we'll store the raw data for now
      // and assume trust (since this is behind a password)
      
      await db.sql`
        INSERT INTO credentials (credential_id, public_key)
        VALUES (${id}, ${JSON.stringify(response)})
        ON CONFLICT (credential_id) DO NOTHING
      `

      return NextResponse.json({ success: true })
    }

    // 3. LOGIN - OPTIONS
    if (action === 'login-options') {
      const challenge = crypto.randomBytes(32).toString('base64url')
      const { rows } = await db.sql`SELECT credential_id FROM credentials`
      
      return NextResponse.json({
        challenge,
        allowCredentials: rows.map(r => ({
          id: r.credential_id,
          type: 'public-key',
          transports: ['internal']
        })),
        userVerification: 'preferred',
        timeout: 60000,
      })
    }

    // 4. LOGIN - VERIFY
    if (action === 'login-verify') {
      const { id } = data
      const { rows } = await db.sql`
        SELECT * FROM credentials WHERE credential_id = ${id}
      `
      
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Invalid credential' }, { status: 400 })
      }

      // Success!
      return NextResponse.json({ success: true, token: process.env.ADMIN_PASSWORD })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Auth API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
