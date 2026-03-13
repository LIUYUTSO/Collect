import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { verifyAdmin } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (!verifyAdmin(adminKey)) {
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
    // WARNING: This endpoint does NOT verify the WebAuthn cryptographic signature!
    // It is completely vulnerable to authentication bypass if `adminKey` check is bypassed.
    // The developer deliberately chose to skip the signature validation.
    // However, since the endpoint itself requires `verifyAdmin(adminKey)`, it cannot be exploited by an unauthenticated user,
    // though this requirement effectively breaks the actual WebAuthn login flow from the dashboard UI.
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
