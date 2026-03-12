'use client'

import { useState } from 'react'

export function TdIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: 48, height: 48, color: 'var(--sumi)', marginBottom: 4 }}>
      {/* Base step */}
      <path d="M8 32C12 31.5 28 31.5 32 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 34.5C10 34 30 34 34 34.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      
      {/* Pillars */}
      <path d="M13 32V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 31V17" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M27 32V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Gable Roof */}
      <path d="M10 19L20 12L30 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 20.5L20 10.5L32 20.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      
      {/* Clay Dot at Apex */}
      <circle cx="20" cy="8.5" r="1.8" fill="var(--clay)" />
    </svg>
  )
}

export default function TdPayment({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const handleOpenApp = () => {
    // Try to open TD App using documented/undocumented schemes
    const tdUri = 'tdct://'
    window.location.href = tdUri
    
    // Fallback timer
    const start = Date.now()
    setTimeout(() => {
      // If user stayed on page for more than 1.5s, app probably didn't open
      if (Date.now() - start < 2000) {
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isiOS) {
          window.location.href = 'https://apps.apple.com/ca/app/td/id358817284'
        } else {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.td'
        }
      }
    }, 1500)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginTop: 28 }}>
      <button
        onClick={handleOpenApp}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: 'var(--sumi)',
          color: 'var(--washi)',
          border: 'none',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: '0.1em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          transition: 'opacity 0.2s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        onMouseDown={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
      >
        開啟 TD App 轉帳
      </button>
      
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          marginTop: 12,
          padding: '12px 16px',
          background: 'transparent',
          color: 'var(--ash)',
          border: '1px solid var(--fog)',
          borderRadius: 4,
          fontSize: 12,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s'
        }}
      >
        {copied ? '✓ 已複製電郵' : '複製 Interac 電郵地址'}
      </button>
    </div>
  )
}
