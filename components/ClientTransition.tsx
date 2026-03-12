'use client'

import React, { useState, useEffect } from 'react'

export default function ClientTransition({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Artificial delay to ensure the "premium" animation is seen (Google Motion feel)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          background: 'var(--washi)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          <p
            style={{
              fontFamily: 'var(--font-zen, serif)',
              fontSize: 11,
              letterSpacing: '0.4em',
              color: 'var(--ash)',
              textTransform: 'uppercase',
              marginBottom: 24,
              opacity: 0.6,
            }}
          >
            COLLECT · 讀取中
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg 
              className="premium-loader" 
              viewBox="0 0 50 50" 
              style={{ width: 32, height: 32, color: 'var(--sumi)' }}
            >
              <circle cx="25" cy="25" r="20" fill="none"></circle>
            </svg>
          </div>
        </div>
        
        <p 
          style={{ 
            position: 'absolute', 
            bottom: 48, 
            fontSize: 10, 
            letterSpacing: '0.1em', 
            color: 'var(--fog)',
            fontFamily: 'var(--font-zen, serif)'
          }}
        >
          WABI-SABI DESIGN
        </p>
      </main>
    )
  }

  return <>{children}</>
}
