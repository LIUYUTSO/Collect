'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { formatCAD, formatDate } from '@/lib/utils'
import PaymentAccordion from '@/components/PaymentAccordion'

interface RequestPayee {
  name: string
  amount: number
  paid: boolean
  note?: string
}

interface RequestClientProps {
  request: any
  tdEmail: string
  wsHandle: string
}

const getGsap = () => (typeof window !== 'undefined' ? (window as any).gsap : undefined);
const getScrollTrigger = () => (typeof window !== 'undefined' ? (window as any).ScrollTrigger : undefined);

export default function RequestClient({ request, tdEmail, wsHandle }: RequestClientProps) {
  const searchParams = useSearchParams();
  const activePayeeName = searchParams.get('p');
  
  const [mounted, setMounted] = useState(false);
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const amountRef = useRef<HTMLSpanElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const isPaid = request.status === 'paid';
  const isGroup = !!request.payees && Array.isArray(request.payees) && request.payees.length > 0;
  const payeesList: RequestPayee[] = isGroup
    ? (request.payees as RequestPayee[])
    : (request.fromName ? [{ name: request.fromName, amount: request.amount, paid: isPaid }] : []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const gsap = getGsap();
    const ScrollTrigger = getScrollTrigger();
    if (!gsap || !ScrollTrigger || !mounted || !gsapLoaded) return;

    gsap.registerPlugin(ScrollTrigger);

    // ─── 初始化隱藏狀態 ──────────────────────────────────────────────────────
    gsap.set('.gsap-main-container', { autoAlpha: 0 });
    gsap.set('.gsap-header-date',     { autoAlpha: 0, y: 16, filter: 'blur(4px)' });
    gsap.set('.gsap-header-title',    { autoAlpha: 0, y: 32, filter: 'blur(8px)' });
    gsap.set('.gsap-header-location', { autoAlpha: 0, y: 16, filter: 'blur(4px)' });
    gsap.set('.gsap-note-container',  { autoAlpha: 0, y: 10 });
    
    // 收據核心：絕對物理位移，藏在出紙口上方，初始不可見 (autoAlpha: 0)
    gsap.set('.gsap-receipt-card', { y: '-100%', autoAlpha: 0 });

    // ─── 統一主時間軸 ────────────────────────────────────────────────────────
    // 移除 delay 2.2s，讓內容在載入動畫結束後立即銜接
    // 動畫結束後刷新 ScrollTrigger，確保佈局變動後計數器觸發點正確
    const masterTl = gsap.timeline({ 
      defaults: { ease: 'expo.out' },
      onComplete: () => ScrollTrigger.refresh()
    });

    masterTl
      // 1. 舞台亮起
      .to('.gsap-main-container', { autoAlpha: 1, duration: 0.8 })

      // 2. Header 文字依序入場
      .to('.gsap-header-date',     { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, '-=0.4')
      .to('.gsap-header-title',    { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.2 }, '-=0.6')
      .to('.gsap-header-location', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, '-=0.8')
      
      // 3. 跑馬燈備註出現，同步開始出紙
      .addLabel('marqueeStart', '-=0.4')
      .to('.gsap-note-container',  { autoAlpha: 1, y: 0, duration: 0.8 }, 'marqueeStart')

      // 4. 收據 Peek：同步開始滑出並顯現 (autoAlpha: 1)，頂部冒出約 18%
      .to('.gsap-receipt-card', {
        autoAlpha: 1, // 開始顯現
        y: '-82%',
        duration: 1.4,
        ease: 'power2.out'
      }, 'marqueeStart')

      // 5. 完整滑出：整張收據徹底滾出來 (同步開始跑數字)
      .to('.gsap-receipt-card', {
        y: '0%',
        duration: 2.5,
        ease: 'power3.out',
        onStart: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: request.amount,
            duration: 2.2,
            ease: 'expo.out',
            onUpdate: () => {
              if (amountRef.current) amountRef.current.textContent = formatCAD(obj.val);
            }
          });
        }
      }, '+=0.2');

    masterTl.eventCallback('onComplete', () => {
      ScrollTrigger.refresh();
      if (activePayeeName) {
        gsap.to('.active-payee', {
          scale: 1.05,
          duration: 1.2,
          ease: 'elastic.out(1, 0.6)',
          delay: 0.2
        });
      }
    });

    // ─── 跑馬燈循環 ──────────────────────────────────────────────────────────
    if (noteRef.current && request.note) {
      const noteWidth = noteRef.current.offsetWidth;
      const maskWidth = Math.min(window.innerWidth - 48, 390);
      gsap.fromTo(noteRef.current,
        { x: maskWidth },
        { x: -noteWidth, duration: (noteWidth + maskWidth) / 40, ease: 'none', repeat: -1 }
      );
    }

    // ─── 浮動 PAY 按鈕邏輯 ──────────────────────────────────────────────────
    if (!isPaid) {
      gsap.set('.gsap-floating-pay', { y: 100, autoAlpha: 0 });
      
      ScrollTrigger.create({
        trigger: 'body',
        start: '10 top',
        endTrigger: '.gsap-payment-section',
        end: 'top center',
        onEnter: () => gsap.to('.gsap-floating-pay', { y: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.7)' }),
        onLeave: () => gsap.to('.gsap-floating-pay', { y: 100, autoAlpha: 0, duration: 0.15, ease: 'power2.in' }),
        onEnterBack: () => gsap.to('.gsap-floating-pay', { y: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.7)' }),
        onLeaveBack: () => gsap.to('.gsap-floating-pay', { y: 100, autoAlpha: 0, duration: 0.15, ease: 'power2.in' }),
      });

      gsap.set('.gsap-floating-logo', { y: 20, autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: '.gsap-payment-section',
        start: 'bottom bottom',
        onUpdate: (self: any) => {
          const maxScroll = ScrollTrigger.maxScroll(window);
          const isAtBottom = self.scroll() >= maxScroll - 2; 
          
          if (self.direction === -1 && !isAtBottom) {
            gsap.to('.gsap-floating-logo', { y: 20, autoAlpha: 0, duration: 0.15, overwrite: true, ease: 'power1.in' });
          } else if (self.direction === 1 && self.isActive) {
            gsap.to('.gsap-floating-logo', { y: 0, autoAlpha: 1, duration: 0.4, overwrite: true, ease: 'power2.out' });
          }
        },
        onLeaveBack: () => gsap.to('.gsap-floating-logo', { y: 20, autoAlpha: 0, duration: 0.15, overwrite: true }),
      });
    }

    return () => {
      masterTl.kill();
      ScrollTrigger.getAll().forEach((t: any) => t.kill());
      gsap.killTweensOf('*');
    };

  }, [gsapLoaded, mounted, request.amount, request.note]);

  if (!mounted) return <main style={{ minHeight: '100dvh', background: '#F2EDE4' }} />;

  return (
    <>
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
        .gsap-header-title, .gsap-header-date, .gsap-header-location {
          will-change: transform, opacity;
        }
        .gsap-receipt-card {
          will-change: transform;
        }

        .gsap-print-slot-wrapper {
          width: 100%;
          max-width: 390px;
          position: relative;
          margin-top: 40px;
        }

        .gsap-print-slot {
          width: 100%;
          height: 0;
          position: relative;
          z-index: 10;
          box-shadow:
            0 6px 24px 0px rgba(0, 0, 0, 0.18),
            0 2px 8px 0px rgba(0, 0, 0, 0.10);
        }

        .gsap-receipt-clip {
          width: 100%;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .receipt-dashed {
          width: 100%; height: 1px; border-top: 1.5px dashed var(--fog); margin: 24px 0;
        }

        .receipt-edge { position: relative; }
        .receipt-edge::after {
          content: ""; position: absolute; bottom: -12px; left: 0; right: 0; height: 12px;
          background-image: linear-gradient(-45deg, transparent 6px, white 6px), linear-gradient(45deg, transparent 6px, white 6px);
          background-size: 12px 12px; background-repeat: repeat-x;
        }

        .note-mask {
          width: 100%; max-width: 390px; margin-top: 24px; overflow: hidden;
          position: relative; height: 32px;
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          display: flex; align-items: center;
        }

        .header-block {
          width: 100%; max-width: 390px;
          display: flex; flex-direction: column; align-items: center; padding-top: 100px;
        }
        .header-lockup {
          width: fit-content; max-width: 100%;
          display: flex; flex-direction: column; align-items: center;
        }
        .header-title-text {
          font-family: var(--font-zen, serif); font-weight: 800; color: var(--sumi);
          line-height: 1.1; letter-spacing: -0.02em; text-align: center; margin: 16px 0; width: 100%;
        }
        .header-date-text {
          font-size: 11px; letter-spacing: 0.3em; color: var(--clay);
          font-weight: 700; font-family: var(--font-mono, monospace); text-transform: uppercase;
        }
        .header-location-text {
          font-size: 13px; letter-spacing: 0.05em; color: var(--ash);
          font-weight: 500; text-align: center; width: 100%;
        }

        .gsap-payment-section {
          width: 100%; max-width: 390px; margin-top: 60px; display: flex; justify-content: center;
        }

        .gsap-floating-pay {
          position: fixed;
          bottom: 5%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: rgba(212, 207, 200, 0.7); /* var(--fog) with transparency */
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          color: var(--sumi);
          padding: 8px 16px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-weight: 700;
          font-size: 9px;
          letter-spacing: 0.1em;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
        }
        .gsap-floating-pay:hover {
          transform: translateX(-50%) scale(1.05);
          background: rgba(200, 195, 188, 0.9);
          opacity: 1;
        }
        .gsap-floating-pay:active {
          transform: translateX(-50%) scale(0.95);
        }

        .gsap-floating-logo {
          position: fixed;
          bottom: 5%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1001;
          pointer-events: none;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .gsap-logo-text {
          font-size: 13px;
          letter-spacing: 0.5em;
          color: var(--sumi);
          text-transform: uppercase;
          font-weight: 900;
          opacity: 0.9;
        }
        .gsap-copyright-text {
          font-size: 10px;
          letter-spacing: 0.25em;
          color: var(--ash);
          margin-top: 12px;
          opacity: 0.6;
          fontWeight: 500;
          text-transform: uppercase;
        }
      `}</style>

      <main
        className="gsap-main-container"
        style={{
          opacity: 0,
          minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '0 24px', paddingTop: 'env(safe-area-inset-top)', background: 'var(--washi)',
          paddingBottom: 150, overflowX: 'hidden'
        }}
      >
        <div className="header-block">
          <div className="header-lockup">
            {request.eventDate && (
              <div className="gsap-header-date header-date-text">{formatDate(request.eventDate)}</div>
            )}
            <h1
              className="gsap-header-title header-title-text"
              style={{ fontSize: `clamp(18px, calc(min(100vw - 48px, 342px) / ${Math.max(1, [...(request.title || '')].length) * 0.55}), 48px)` }}
            >
              {request.title}
            </h1>
            {request.location && (
              <div className="gsap-header-location header-location-text">{request.location}</div>
            )}
          </div>
        </div>

        {request.note && (
          <div className="gsap-note-container note-mask">
            <div ref={noteRef} style={{ whiteSpace: 'nowrap', display: 'inline-block', fontSize: 13, color: 'var(--ash)', fontWeight: 500, letterSpacing: '0.02em' }}>
              {request.note}
            </div>
          </div>
        )}

        <div className="gsap-print-slot-wrapper">
          <div className="gsap-print-slot" />
          <div className="gsap-receipt-clip">
              <div
                ref={receiptRef}
                className="gsap-receipt-card receipt-edge"
                style={{
                  width: '100%', maxWidth: 390, padding: '40px 32px 56px 32px',
                  background: 'white',
                  boxShadow: '0 -4px 20px rgba(0,0,0,0.08), 0 10px 40px rgba(0,0,0,0.06)',
                  borderRadius: '0 0 2px 2px',
                  transform: 'translateY(-100%)', 
                  opacity: 0, // 初始隱藏，防止 header 動畫期間看到白色區塊
                }}
              >
              <div className="receipt-dashed" style={{ marginTop: 0 }} />

              <p style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--ash)', marginBottom: 20, textAlign: 'center', fontWeight: 800, opacity: 0.6 }}>
                {request.payerName ? 'BILLING INVOICE' : 'COLLECT RECEIPT'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {!isGroup && (
                  <div className="gsap-amount-display" style={{ textAlign: 'center', marginBottom: 24 }}>
                    <p style={{ fontSize: 11, color: 'var(--ash)', marginBottom: 12, letterSpacing: '0.15em', fontWeight: 700 }}>AMOUNT DUE</p>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 52, fontWeight: 400, color: isPaid ? 'var(--moss)' : 'var(--sumi)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      <span ref={amountRef} suppressHydrationWarning>{formatCAD(0)}</span>
                    </p>
                  </div>
                )}

                <div className="gsap-payee-list" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {payeesList.map((p, idx) => {
                    const isActive = p.name === activePayeeName;
                    return (
                      <div 
                        key={idx} 
                        className={isActive ? "gsap-payee-item active-payee" : "gsap-payee-item"}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                            <span style={{ 
                              fontSize: 15, 
                              color: p.paid ? 'var(--clay)' : 'var(--sumi)', 
                              fontWeight: isActive ? 700 : 600
                            }}>
                              {p.name}
                            </span>
                            <span style={{ fontSize: 10, color: p.paid ? 'var(--moss)' : 'var(--rust)', fontWeight: 800, letterSpacing: '0.1em', marginTop: 4 }}>
                              {p.paid ? 'PAID ✓' : 'UNPAID'}
                            </span>
                          </div>
                          {p.note && (
                            <div style={{ 
                              fontSize: 13, 
                              color: 'var(--ash)', 
                              opacity: 0.6, 
                              fontStyle: 'italic',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              · {p.note}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {p.name === request.payerName && (
                            <span style={{ fontSize: 8, background: 'var(--sumi)', color: 'var(--washi)', padding: '1px 5px', borderRadius: 4, marginBottom: 6, fontWeight: 800 }}>PAYER</span>
                          )}
                          <span style={{ 
                            fontFamily: 'DM Mono, monospace', 
                            fontSize: 18, 
                            color: p.paid ? 'var(--fog)' : 'var(--sumi)', 
                            textDecoration: p.paid ? 'line-through' : 'none', 
                            opacity: p.paid ? 0.6 : 1,
                            fontWeight: isActive ? 600 : 400
                          }} suppressHydrationWarning>
                            {formatCAD(p.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
          </div>
        </div>

        {!isPaid && (
          <div className="gsap-payment-section">
            <PaymentAccordion tdEmail={tdEmail} wsHandle={wsHandle} title={request.title} />
          </div>
        )}

        {/* Tighter proximity for the logo */}
        <div style={{ paddingBottom: 10 }} />

        {!isPaid && (
          <button 
            className="gsap-floating-pay" 
            onClick={() => {
              const el = document.querySelector('.gsap-payment-section');
              if (el) {
                const rect = el.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetY = scrollTop + rect.top + (rect.height / 2) - (window.innerHeight / 2) - 38;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
              }
            }}
          >
            PAY
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1 }}>
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </button>
        )}

        <div className="gsap-floating-logo">
          <span className="gsap-logo-text">Collect</span>
          <span className="gsap-copyright-text">© BY ADAM LIU</span>
        </div>
      </main>
    </>
  );
}
