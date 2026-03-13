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

  return (
    <div style={{ marginTop: 8 }} className={loading ? 'fade-out' : ''}>
      <button
        onClick={handleOpenApp}
        disabled={loading}
        style={{
          width: '100%',
          padding: '18px 20px',
          background: primaryBg,
          color: primaryText,
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.05em',
          cursor: loading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          opacity: loading ? 0.9 : 1
        }}
      >
        {loading ? (
          <svg className="premium-loader" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none"></circle>
          </svg>
        ) : (
          '開啟 TD App 轉帳'
        )}
      </button>
      
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '12px 16px',
          background: 'transparent',
          color: textColor,
          border: `1px solid ${secondaryBorder}`,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s'
        }}
      >
        {copied ? '✓ 已複製' : '按此複製 e-Transfer 地址'}
      </button>
    </div>
  )
}
