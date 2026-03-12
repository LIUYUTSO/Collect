'use client'

import React, { useState, useEffect } from 'react'

export default function ClientTransition({ children, title }: { children: React.ReactNode, title?: string }) {
  const [loading, setLoading] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Stage 1: Loading duration
    const timer = setTimeout(() => {
      setIsExiting(true)
      // Stage 2: Exit animation duration
      setTimeout(() => {
        setLoading(false)
      }, 800)
    }, 2800)

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
          // Fade out the whole background slightly at the end for seamlessness
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 0.8s ease-in-out',
          pointerEvents: isExiting ? 'none' : 'all',
        }}
      >
        <div 
          style={{ 
            width: '100%', 
            maxWidth: 240, 
            textAlign: 'center',
            transform: isExiting ? 'translateY(-60px)' : 'translateY(0)',
            opacity: isExiting ? 0 : 1,
            transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-in',
          }}
        >
          {/* Large COLLECT Logo - Bold Serif (matching title font) */}
          <h1
            style={{
              fontFamily: 'var(--font-zen, serif)',
              fontSize: 48,
              fontWeight: 700,
              color: 'var(--sumi)',
              letterSpacing: '0.15em',
              marginBottom: 40,
              fontVariantCaps: 'all-small-caps',
            }}
          >
            COLLECT
          </h1>
          
          {/* Progress Bar - Pure CSS for maximum smoothness */}
          <div 
            style={{ 
              width: '100%', 
              height: 1, 
              background: 'rgba(26, 23, 20, 0.1)', 
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                background: 'var(--sumi)',
                transformOrigin: 'left',
                animation: 'loadingBar 2.6s cubic-bezier(0.65, 0, 0.35, 1) forwards',
              }}
            />
          {/* Bill-style Description below Progress Bar */}
          {title && (
            <div 
              style={{ 
                marginTop: 20, 
                padding: '12px',
                border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                textAlign: 'left',
                fontFamily: 'DM Mono, monospace',
                fontSize: 10,
                color: 'var(--ash)',
                letterSpacing: '0.05em',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>ITEM:</span>
                <span style={{ color: 'var(--sumi)' }}>{title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, opacity: 0.6 }}>
                <span>TYPE:</span>
                <span>INVOICE / COLLECT</span>
              </div>
            </div>
          )}
        </div>

        {/* Signature at bottom right */}
        <p
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            fontFamily: 'var(--font-zen, serif)',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'var(--ash)',
            textTransform: 'uppercase',
            opacity: isExiting ? 0 : 0.5,
            transition: 'opacity 0.4s ease',
            fontWeight: 400,
          }}
        >
          by ADAM LIU
        </p>

        <style jsx global>{`
          @keyframes loadingBar {
            0% { transform: scaleX(0); }
            30% { transform: scaleX(0.4); }
            60% { transform: scaleX(0.7); }
            100% { transform: scaleX(1); }
          }
        `}</style>
      </main>
    )
  }

  return <>{children}</>
}
