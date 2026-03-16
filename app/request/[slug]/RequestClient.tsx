'use client'

import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { formatCAD, formatDate } from '@/lib/utils'
import PaymentAccordion from '@/components/PaymentAccordion'

interface RequestPayee {
  name: string
  amount: number
  paid: boolean
}

interface RequestClientProps {
  request: any
  tdEmail: string
  wsHandle: string
}

const getGsap = () => (typeof window !== 'undefined' ? (window as any).gsap : undefined);
const getScrollTrigger = () => (typeof window !== 'undefined' ? (window as any).ScrollTrigger : undefined);

// ─── Animations Helpers ──────────────────────────────────────────────────────

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const gsap = getGsap();
    if (!gsap || !cursorRef.current) return;
    const xTo = gsap.quickTo(cursorRef.current, "x", {duration: 0.3, ease: "power3", force3D: true});
    const yTo = gsap.quickTo(cursorRef.current, "y", {duration: 0.3, ease: "power3", force3D: true});
    
    const moveCursor = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <div 
      ref={cursorRef} 
      style={{
        position: 'fixed', top: 0, left: 0, width: 14, height: 14, 
        backgroundColor: 'var(--sumi)', borderRadius: '50%', pointerEvents: 'none', 
        zIndex: 9999, transform: 'translate(-50%, -50%)', opacity: 1,
        mixBlendMode: 'difference'
      }} 
    />
  );
};

export default function RequestClient({ request, tdEmail, wsHandle }: RequestClientProps) {
  const [mounted, setMounted] = useState(false);
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const amountRef = useRef<HTMLSpanElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  
  const isPaid = request.status === 'paid'
  const isGroup = !!request.payees && Array.isArray(request.payees) && request.payees.length > 0;
  
  const payeesList: RequestPayee[] = isGroup ? (request.payees as RequestPayee[]) : 
    (request.fromName ? [{ name: request.fromName, amount: request.amount, paid: isPaid }] : [])

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const gsap = getGsap();
    const ScrollTrigger = getScrollTrigger();
    
    // 確保 gsap 和 ScrollTrigger 都載入後才執行
    if (!gsap || !ScrollTrigger || !mounted) return;

    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline();

    // 1. Header 進場
    tl.fromTo('.gsap-header-date', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.4 })
      .fromTo('.gsap-header-title', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, "-=0.5")
      .fromTo('.gsap-header-location', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, "-=0.6");

    // 2. 優化跑馬燈：單次循環，不重複顯示
    if (noteRef.current && request.note) {
      const noteWidth = noteRef.current.offsetWidth;
      const maskWidth = 390; // 固定容器寬度
      
      // 文字從右側進入，穿過容器，消失在左側，再重新開始
      gsap.fromTo(noteRef.current, 
        { x: maskWidth },
        {
          x: -noteWidth,
          duration: (noteWidth + maskWidth) / 45, // 調整速度
          ease: 'none',
          repeat: -1,
          delay: 1
        }
      );
      
      tl.fromTo('.gsap-note-container', { opacity: 0 }, { opacity: 1, duration: 0.8 }, "-=0.2");
    }

    // 3. 收據列印特效
    tl.fromTo('.gsap-receipt-card', 
      { clipPath: 'inset(0% 0% 100% 0%)' }, 
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'power2.inOut' }, 
      "-=0.5"
    );

    // 4. 重獲金額計數器 - 明確指定 ScrollTrigger
    const amountObj = { val: 0 };
    gsap.to(amountObj, {
      val: request.amount,
      duration: 2.5,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.gsap-amount-display', // 使用更具體的計數器區域作為觸發點
        start: 'top 85%',
        toggleActions: 'play none none none',
        // markers: true, // 開發調試可用
      },
      onUpdate: () => {
        if (amountRef.current) {
          amountRef.current.textContent = formatCAD(amountObj.val);
        }
      }
    });

    // 5. 清單 Stagger
    tl.fromTo('.gsap-payee-item', 
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power2.out' },
      "-=1.5"
    );

  }, [gsapLoaded, mounted, request.amount, request.note]);

  if (!mounted) return <main style={{ minHeight: '100dvh', background: 'var(--washi)', opacity: 0 }} />;

  return (
    <>
      <CustomCursor />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" 
        strategy="afterInteractive"
        onLoad={() => {
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
          script.onload = () => setGsapLoaded(true);
          document.body.appendChild(script);
        }}
      />
      
      <style jsx global>{`
        .receipt-edge { position: relative; }
        .receipt-edge::after {
          content: ""; position: absolute; bottom: -12px; left: 0; right: 0; height: 12px;
          background-image: linear-gradient(-45deg, transparent 6px, white 6px), linear-gradient(45deg, transparent 6px, white 6px);
          background-size: 12px 12px; background-repeat: repeat-x;
        }
        .note-mask {
          width: 100%; max-width: 390px; margin-top: 24px; overflow: hidden; position: relative; height: 32px;
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          display: flex; align-items: center;
        }
        .receipt-dashed { width: 100%; height: 1px; border-top: 1.5px dashed var(--fog); margin: 24px 0; }
        
        .header-block {
          width: 100%; max-width: 390px; display: flex; flex-direction: column; align-items: center; padding-top: 80px;
        }
        .header-lockup { width: fit-content; max-width: 100%; display: flex; flex-direction: column; align-items: center; }
        .header-title-text {
          font-family: var(--font-zen, serif); font-weight: 800; color: var(--sumi); line-height: 1.1; letter-spacing: -0.02em;
          text-align: center; margin: 12px 0; width: 100%;
        }
        .header-date-text {
          font-size: 11px; letter-spacing: 0.25em; color: var(--clay); font-weight: 700; font-family: var(--font-mono, monospace); text-transform: uppercase;
        }
        .header-location-text {
          font-size: 13px; letter-spacing: 0.05em; color: var(--ash); font-weight: 500; text-align: center; width: 100%;
        }
      `}</style>

      <main
        style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '0 24px', paddingTop: 'env(safe-area-inset-top)', background: 'var(--washi)', paddingBottom: 100
        }}
      >
        <div className="header-block">
          <div className="header-lockup">
            {request.eventDate && (
              <div className="gsap-header-date header-date-text" style={{ opacity: 0 }}>
                {formatDate(request.eventDate)}
              </div>
            )}

            <h1 
              className="gsap-header-title header-title-text"
              style={{
                fontSize: `clamp(16px, calc(min(100vw - 48px, 342px) / ${Math.max(1, [...(request.title || '')].length) * 0.55}), 48px)`,
                opacity: 0
              }}
            >
              {request.title}
            </h1>

            {request.location && (
              <div className="gsap-header-location header-location-text" style={{ opacity: 0 }}>
                {request.location}
              </div>
            )}
          </div>
        </div>

        {/* 跑馬燈：確保區塊內只出現一次文字 */}
        {request.note && (
          <div className="gsap-note-container note-mask" style={{ opacity: 0 }}>
            <div ref={noteRef} style={{ whiteSpace: 'nowrap', display: 'inline-block', fontSize: 13, color: 'var(--ash)', fontWeight: 500, letterSpacing: '0.02em' }}>
              {request.note}
            </div>
          </div>
        )}

        {/* 帳單卡片 */}
        <div
          className="gsap-receipt-card receipt-edge"
          style={{
            width: '100%', maxWidth: 390, marginTop: 32, padding: '48px 32px 56px 32px',
            background: 'white', boxShadow: '0 12px 32px rgba(26,23,20,0.05)', borderRadius: '2px',
          }}
        >
          <div className="receipt-dashed" style={{ marginTop: 0 }} />
          
          <p style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--ash)', marginBottom: 24, textAlign: 'center', fontWeight: 800, opacity: 0.6 }}>
            {request.payerName ? 'BILLING INVOICE' : 'COLLECT RECEIPT'}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!isGroup && (
              <div className="gsap-amount-display" style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ fontSize: 11, color: 'var(--ash)', marginBottom: 12, letterSpacing: '0.15em', fontWeight: 700 }}>AMOUNT DUE</p>
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace', fontSize: 52, fontWeight: 400,
                    color: isPaid ? 'var(--moss)' : 'var(--sumi)', letterSpacing: '-0.04em', lineHeight: 1,
                  }}
                >
                  <span ref={amountRef} suppressHydrationWarning>{formatCAD(0)}</span>
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {payeesList.map((p, idx) => (
                <div key={idx} className="gsap-payee-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, color: p.paid ? 'var(--clay)' : 'var(--sumi)', fontWeight: 600 }}>{p.name}</span>
                      {p.name === request.payerName && (
                        <span style={{ fontSize: 8, background: 'var(--sumi)', color: 'var(--washi)', padding: '1px 5px', borderRadius: 4, transform: 'translateY(-1px)', fontWeight: 800 }}>PAYER</span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: p.paid ? 'var(--moss)' : 'var(--rust)', fontWeight: 800, letterSpacing: '0.1em', marginTop: 4 }}>
                      {p.paid ? 'PAID ✓' : 'UNPAID'}
                    </span>
                  </div>
                  <span style={{ 
                    fontFamily: 'DM Mono, monospace', fontSize: 18, 
                    color: p.paid ? 'var(--fog)' : 'var(--sumi)',
                    textDecoration: p.paid ? 'line-through' : 'none',
                    opacity: p.paid ? 0.6 : 1
                  }} suppressHydrationWarning>
                    {formatCAD(p.amount)}
                  </span>
                </div>
              ))}
            </div>
            
            {isGroup && (
              <>
                <div className="receipt-dashed" style={{ margin: '14px 0' }} />
                <div className="gsap-amount-display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, letterSpacing: '0.2em', color: 'var(--sumi)', fontWeight: 800 }}>TOTAL</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 32, color: isPaid ? 'var(--moss)' : 'var(--rust)', fontWeight: 600 }}>
                    <span ref={amountRef} suppressHydrationWarning>{formatCAD(0)}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="receipt-dashed" style={{ marginBottom: 0, marginTop: 40 }} />
          
          <div style={{ marginTop: 24, textAlign: 'center' }}>
             <p style={{ fontSize: 10, color: 'var(--ash)', letterSpacing: '0.12em', fontWeight: 600 }} suppressHydrationWarning>
               ISSUED: {formatDate(request.createdAt)}
             </p>
          </div>

          {isPaid && (
            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
              <div style={{ padding: '8px 24px', background: 'var(--moss)', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em' }}>
                PAID 💰
              </div>
            </div>
          )}
        </div>

        {!isPaid && (
          <div className="gsap-payment-section" style={{ width: '100%', maxWidth: 390, marginTop: 32 }}>
            <PaymentAccordion 
              tdEmail={tdEmail} 
              wsHandle={wsHandle}
              title={request.title}
            />
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 390, marginTop: 'auto', paddingTop: 100, textAlign: 'center' }}>
          <p style={{ fontSize: 13, letterSpacing: '0.5em', color: 'var(--sumi)', textTransform: 'uppercase', fontWeight: 900, opacity: 0.9 }}>
            Collect
          </p>
          <p style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--ash)', marginTop: 12, opacity: 0.6, fontWeight: 500 }}>
            © BY ADAM LIU
          </p>
        </div>
      </main>
    </>
  )
}
