'use client'

import { useState, useRef, useEffect } from 'react'
import TdPayment from './TdPayment'
import WsPayment from './WsPayment'

interface PaymentAccordionProps {
  tdEmail: string
  wsHandle: string
  title: string
}

export default function PaymentAccordion({ tdEmail, wsHandle, title }: PaymentAccordionProps) {
  const [activeTab, setActiveTab] = useState<'td' | 'ws'>('td')
  const sliderRef = useRef<HTMLDivElement>(null)

  const scrollTo = (bank: 'td' | 'ws') => {
    if (!sliderRef.current) return
    const index = bank === 'td' ? 0 : 1
    const width = sliderRef.current.offsetWidth
    sliderRef.current.scrollTo({ left: index * width, behavior: 'smooth' })
    setActiveTab(bank)
  }

  const handleScroll = () => {
    if (!sliderRef.current) return
    const { scrollLeft, offsetWidth } = sliderRef.current
    const index = Math.round(scrollLeft / offsetWidth)
    setActiveTab(index === 0 ? 'td' : 'ws')
  }

  return (
    <div className="animate-in delay-300" style={{ width: '100%', maxWidth: '100%', marginTop: 24 }}>
      <div style={{ padding: '0 8px', marginBottom: 16 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--ash)', fontWeight: 700 }}>
          PAY BY 付款
        </p>
      </div>

      <div className="payment-slider-container">
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          className="payment-slider"
        >
          {/* TD Card */}
          <div className="payment-card">
            <div style={{ 
              background: '#00D100', 
              color: 'black', 
              borderRadius: 24, 
              padding: '36px 32px',
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 2px rgba(0, 50, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em' }}>TD</span>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: '0.05em' }}>INTERAC®</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Pay to:</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 500, marginBottom: 20 }}>{tdEmail}</p>
              <div style={{ marginTop: 'auto' }}>
                <TdPayment email={tdEmail} lightMode={true} />
              </div>
            </div>
          </div>

          {/* Wealthsimple Card */}
          <div className="payment-card">
            <div style={{ 
              background: 'black', 
              color: 'white', 
              borderRadius: 24, 
              padding: '36px 32px',
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.05em' }}>Wealthsimple</span>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: '0.05em' }}>INTERAC®</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Pay to:</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 400, marginBottom: 20 }}>
                {wsHandle.includes('@') ? wsHandle : `${wsHandle}@wealthsimple.me`}
              </p>
              <div style={{ marginTop: 'auto' }}>
                <WsPayment email={wsHandle.includes('@') ? wsHandle : `${wsHandle}@wealthsimple.me`} darkMode={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Indicators */}
      <div className="slider-dots">
        <div className={`dot ${activeTab === 'td' ? 'active' : ''}`} />
        <div className={`dot ${activeTab === 'ws' ? 'active' : ''}`} />
      </div>
    </div>
  )
}
