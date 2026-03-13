'use client'

import React, { useState, useEffect } from 'react'

export function TdIcon() {
  return (
    <div style={{ 
      width: 48, 
      height: 48, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 700,
      fontFamily: 'var(--font-zen, serif)',
      color: 'var(--sumi)',
      marginBottom: 4,
      background: 'var(--fog)',
      borderRadius: '50%'
    }}>
      TD
    </div>
  )
}

export default function TdPayment({ email, lightMode }: { email: string, lightMode?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const textColor = lightMode ? 'black' : 'var(--ash)'
  const primaryBg = lightMode ? 'black' : 'var(--sumi)'
  const primaryText = lightMode ? 'white' : 'var(--washi)'
  const secondaryBorder = lightMode ? 'rgba(0,0,0,0.2)' : 'var(--fog)'

  const handleOpenApp = () => {
    // ... logic remains same
    setLoading(true)
    const tdUri = 'tdct://'
    const start = Date.now()
    let timeoutId: NodeJS.Timeout

    const preventFallback = () => {
      clearTimeout(timeoutId)
      setLoading(false)
    }

    window.addEventListener('pagehide', preventFallback, { once: true })
    window.addEventListener('blur', preventFallback, { once: true })
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) preventFallback()
    }, { once: true })

    const link = document.createElement('a')
    link.href = tdUri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    timeoutId = setTimeout(() => {
      const delta = Date.now() - start
      if (delta > 3500) {
        setLoading(false)
        return
      }
      setLoading(false)
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const storeUrl = isiOS 
        ? 'https://apps.apple.com/ca/app/td/id358817284'
        : 'https://play.google.com/store/apps/details?id=com.td'
      window.location.href = storeUrl
    }, 3000)
  }

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const primaryHeight = 56
  const secondaryHeight = 42

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={handleOpenApp}
        disabled={loading}
        style={{
          width: '100%',
          height: primaryHeight,
          background: primaryBg,
          color: primaryText,
          border: 'none',
          borderRadius: primaryHeight / 2,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.02em',
          cursor: loading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '0 24px',
          whiteSpace: 'nowrap'
        }}
      >
        {loading ? (
          <div className="premium-loader" style={{ width: 16, height: 16, border: `2px solid ${primaryText}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span style={{ flexShrink: 0 }}>Open TD app</span>
          </>
        )}
      </button>
      
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          height: secondaryHeight,
          marginTop: 12,
          background: 'transparent',
          color: textColor,
          border: `1.5px solid ${secondaryBorder}`,
          borderRadius: secondaryHeight / 2,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
          padding: '0 24px',
          whiteSpace: 'nowrap'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span style={{ flexShrink: 0 }}>{copied ? 'Copied' : 'Copy e-Transfer address'}</span>
      </button>
    </div>
  )
}
