'use client'

import React, { useState } from 'react'
import TdPayment, { TdIcon } from './TdPayment'
import WsPayment, { WsIcon } from './WsPayment'

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

      {/* Tabs - Equal Width */}
      <div style={{ display: 'flex', width: '100%', marginBottom: 20, padding: '0 8px' }}>
        <div 
          className={`method-tab ${activeMethod === 'td' ? 'active' : ''}`}
          style={{ flex: 1, textAlign: 'center' }}
          onClick={() => setActiveMethod('td')}
        >
          TD Bank
        </div>
        <div 
          className={`method-tab ${activeMethod === 'ws' ? 'active' : ''}`}
          style={{ flex: 1, textAlign: 'center' }}
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
            <p style={{ fontSize: 13, color: 'var(--sumi)', marginBottom: 4 }}>TD Interac</p>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--ash)', marginBottom: 8 }}>{tdEmail}</p>
            <TdPayment email={tdEmail} />
          </div>
        ) : (
          <div key="ws-content" className="animate-in" style={{ animationDuration: '0.4s' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <WsIcon />
            </div>
            <p style={{ fontSize: 13, color: 'var(--sumi)', marginBottom: 4 }}>WealthSimple Interac</p>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--ash)', marginBottom: 8 }}>
              {wsHandle.includes('@') ? wsHandle : `${wsHandle}@wealthsimple.me`}
            </p>
            <WsPayment email={wsHandle.includes('@') ? wsHandle : `${wsHandle}@wealthsimple.me`} />
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
