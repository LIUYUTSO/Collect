'use client'

import React, { useState, useEffect } from 'react'

export default function ClientTransition({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Longer duration (2.5 seconds total)
    const duration = 2500
    const interval = 20
    const increment = (interval / duration) * 100
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + increment
      })
    }, interval)

    const totalTimer = setTimeout(() => {
      setLoading(false)
    }, duration + 200) // Slight buffer for completion feel

    return () => {
      clearInterval(progressTimer)
      clearTimeout(totalTimer)
    }
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
        <div style={{ width: '100%', maxWidth: 240, textAlign: 'center' }}>
          {/* Large COLLECT Logo - Bold Serif */}
          <h1
            style={{
              fontFamily: 'var(--font-zen, serif)',
              fontSize: 42,
              fontWeight: 700,
              color: 'var(--sumi)',
              letterSpacing: '0.1em',
              marginBottom: 48,
              opacity: 0.9,
            }}
          >
            COLLECT
          </h1>
          
          {/* Progress Bar Container */}
          <div 
            style={{ 
              width: '100%', 
              height: 2, 
              background: 'var(--fog)', 
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Active Progress Bar */}
            <div 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${progress}%`,
                background: 'var(--sumi)',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
          
          <p
            style={{
              fontFamily: 'var(--font-zen, serif)',
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'var(--ash)',
              textTransform: 'uppercase',
              marginTop: 16,
              opacity: 0.6,
            }}
          >
            Loading Request
          </p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
