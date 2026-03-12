'use client'

import React, { useState, useEffect } from 'react'

export function TdIcon() {
  return (
    <div 
      className="wabi-circle"
      style={{ 
        width: 64, 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 28,
        fontWeight: 700,
        fontFamily: 'var(--font-zen, serif)',
        color: 'var(--sumi)',
        letterSpacing: '-0.05em'
      }}>
        TD
      </div>
    </div>
  )
}

export default function TdPayment({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOpenApp = () => {
    setLoading(true)
    const tdUri = 'tdct://'
    const start = Date.now()
    let timeoutId: NodeJS.Timeout

    const preventFallback = () => {
      clearTimeout(timeoutId)
      setLoading(false)
    }

    // Capture app launch events to kill the fallback timer immediately
    window.addEventListener('pagehide', preventFallback, { once: true })
    window.addEventListener('blur', preventFallback, { once: true })
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) preventFallback()
    }, { once: true })

    // Attempt to open the app using a more robust method
    const link = document.createElement('a')
    link.href = tdUri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Fallback timer
    timeoutId = setTimeout(() => {
      const delta = Date.now() - start
      
      // If the timeout took much longer than 3s, the browser was likely suspended
      // by the app opening. Don't trigger the fallback.
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
    <div style={{ marginTop: 28 }} className={loading ? 'fade-out' : ''}>
      <button
        onClick={handleOpenApp}
        disabled={loading}
        className={`hover-lift ${loading ? 'fade-out' : ''}`}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: 'var(--sumi)',
          color: 'var(--washi)',
          border: 'none',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: '0.12em',
          cursor: loading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
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
        {copied ? '✓ 已複製' : '複製 Interac 地址'}
      </button>
    </div>
  )
}
