'use client'

import React, { useState } from 'react'
import TdPayment, { TdIcon } from './TdPayment'
import WsPayment from './WsPayment'

interface PaymentAccordionProps {
  tdEmail: string
  wsHandle: string
  title: string
}

export default function PaymentAccordion({ tdEmail, wsHandle, title }: PaymentAccordionProps) {
  const [activeMethod, setActiveMethod] = useState<'td' | 'ws'>('td')

  return (
    <div className="fold-container" style={{ marginTop: 32 }}>
      <p
        style={{
          fontSize: 11,
          letterSpacing: '0.2em',
          color: 'var(--ash)',
          marginBottom: 16,
        }}
      >
        選擇付款方式 · CHOOSE METHOD
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div 
          className={`method-tab ${activeMethod === 'td' ? 'active' : ''}`}
          onClick={() => setActiveMethod('td')}
        >
          TD Bank
        </div>
        <div 
          className={`method-tab ${activeMethod === 'ws' ? 'active' : ''}`}
          onClick={() => setActiveMethod('ws')}
        >
          WealthSimple
        </div>
      </div>

      <div 
        className={`fold-content ${activeMethod ? 'active' : ''}`}
        style={{
          padding: '28px 24px',
          border: '1px solid var(--fog)',
          borderRadius: 3,
          background: 'rgba(255,255,255,0.3)',
          textAlign: 'center'
        }}
      >
        {activeMethod === 'td' ? (
          <div key="td-content" className="animate-in" style={{ animationDuration: '0.4s' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <TdIcon />
            </div>
            <p style={{ fontSize: 13, color: 'var(--sumi)', marginBottom: 4 }}>TD Interac e-Transfer</p>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--ash)', marginBottom: 8 }}>{tdEmail}</p>
            <TdPayment email={tdEmail} />
          </div>
        ) : (
          <div key="ws-content" className="animate-in" style={{ animationDuration: '0.4s' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <img 
                src="/assets/ws-logo.png" 
                alt="WealthSimple" 
                style={{ width: 48, height: 48, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
              />
            </div>
            <p style={{ fontSize: 13, color: 'var(--sumi)', marginBottom: 4 }}>WealthSimple Interac</p>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--ash)', marginBottom: 8 }}>
              {wsHandle}@wealthsimple.me
            </p>
            <WsPayment email={`${wsHandle}@wealthsimple.me`} />
          </div>
        )}

        <div className="brush-line" style={{ margin: '24px 0' }} />

        <p style={{ fontSize: 12, color: 'var(--ash)', lineHeight: 1.7 }}>
          請使用 Interac 轉帳。
          備註欄填入「<strong style={{ color: 'var(--sumi)' }}>{title}</strong>」。
        </p>
      </div>
    </div>
  )
}
