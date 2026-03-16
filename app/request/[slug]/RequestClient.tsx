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

// ─── 修改一：Apple Precision Cursor ───────────────────────────────────────────

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gsap = getGsap();
    if (!gsap) return;

    // 小點：極快跟隨，提供精準的定位反饋
    const dotX = gsap.quickTo(dotRef.current, "x", { duration: 0.15, ease: "power3" });
    const dotY = gsap.quickTo(dotRef.current, "y", { duration: 0.15, ease: "power3" });

    // 外環：滯後跟隨，製造如 Apple 介面般的物理慣性質感
    const ringX = gsap.quickTo(ringRef.current, "x", { duration: 0.55, ease: "power2" });
    const ringY = gsap.quickTo(ringRef.current, "y", { duration: 0.55, ease: "power2" });

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    // Hover 互動：當滑鼠移入可點擊元素時，變換型態
    const onEnter = () => {
      gsap.to(ringRef.current, { scale: 2.2, opacity: 0.4, duration: 0.4, ease: "power2.out" });
      gsap.to(dotRef.current, { scale: 0, duration: 0.3, ease: "power2.out" });
    };
    const onLeave = () => {
      gsap.to(ringRef.current, { scale: 1, opacity: 0.9, duration: 0.5, ease: "expo.out" });
      gsap.to(dotRef.current, { scale: 1, duration: 0.4, ease: "back.out(2)" });
    };

    const clickables = document.querySelectorAll('button, a, [role="button"]');
    clickables.forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      clickables.forEach(el => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <>
      {/* 外環：慢速跟隨，呈現優雅的惰性 */}
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, width: 36, height: 36,
        border: '1.5px solid var(--sumi)', borderRadius: '50%', pointerEvents: 'none', zIndex: 9998,
        transform: 'translate(-50%, -50%)', opacity: 0.9, backdropFilter: 'blur(1px)', willChange: 'transform'
      }} />
      {/* 小點：快速精準，滿足操作直覺 */}
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, width: 5, height: 5,
        backgroundColor: 'var(--sumi)', borderRadius: '50%', pointerEvents: 'none', zIndex: 9999,
        transform: 'translate(-50%, -50%)', willChange: 'transform'
      }} />
    </>
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
    if (!gsap || !ScrollTrigger || !mounted || !gsapLoaded) return;

    gsap.registerPlugin(ScrollTrigger);

    // ─── 修改二：Apple Keynote Reveal 節奏 — 初始化及 MasterTimeline ───────

    // 初始化狀態：全部隱藏，並加入 Blur 濾鏡製造焦距感，交由 GSAP 統一控制
    gsap.set('.gsap-main-container', { autoAlpha: 0 });
    gsap.set('.gsap-header-date', { autoAlpha: 0, y: 16, filter: 'blur(4px)' });
    gsap.set('.gsap-header-title', { autoAlpha: 0, y: 32, filter: 'blur(8px)' });
    gsap.set('.gsap-header-location', { autoAlpha: 0, y: 16, filter: 'blur(4px)' });
    gsap.set('.gsap-note-container', { autoAlpha: 0, y: 10 });
    gsap.set('.gsap-receipt-card', { clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set('.gsap-print-slot', { scaleX: 0, transformOrigin: 'center center' });

    const masterTl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    masterTl
      // 1. 舞台亮起：建立頁面基礎呈現
      .to('.gsap-main-container', { autoAlpha: 1, duration: 1.2 })

      // 2. 日期：小標先出，在空間中建立時間座標
      .to('.gsap-header-date', {
        autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.0
      }, '-=0.6')

      // 3. 主標題：給予最長的 Duration (1.4s)，並透過 Blur 消散模擬眼睛對焦過程
      .to('.gsap-header-title', {
        autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.4
      }, '-=0.7')

      // 4. 地點：緊隨標題之後，完善活動資訊
      .to('.gsap-header-location', {
        autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.0
      }, '-=0.8')

      // 5. 備註跑馬燈進場
      .to('.gsap-note-container', {
        autoAlpha: 1, y: 0, duration: 0.9
      }, '-=0.6')

      // 6. 印表機插槽：從中心向兩側展開，像機器準備就緒的機械感
      .to('.gsap-print-slot', {
        scaleX: 1, duration: 1.0, ease: 'power4.inOut'
      }, '-=0.3')

      // 7. 自動首印 (Peek)：紙張從插槽中冒出頂部約 18%
      .to('.gsap-receipt-card', {
        clipPath: 'inset(0% 0% 82% 0%)',
        duration: 1.6,
        ease: 'power3.out'
      }, '-=0.2');


    // ─── 修改三：收據列印 — 重力感紙張展開與 Scrub 聯動 ──────────────────────

    // 滾動列印：紙張隨著滾動軌跡手動吐出，具備高級皮革般的絲滑慣性 (scrub: 2.5)
    gsap.to('.gsap-receipt-card', {
      clipPath: 'inset(0% 0% 0% 0%)', 
      ease: 'none',
      scrollTrigger: {
        trigger: '.gsap-print-slot',
        start: 'top 52%',       
        end: '+=680',           // 需要捲動 680px 才能完全出紙，製造長收據的體感
        scrub: 2.5,             
        invalidateOnRefresh: true
      }
    });

    // 紙張展開時，讓插槽產生微弱的提示發光
    gsap.to('.gsap-print-slot', {
      scrollTrigger: {
        trigger: '.gsap-print-slot',
        start: 'top 52%',
        end: '+=100',
        scrub: true,
        onEnter: () => gsap.to('.gsap-print-slot', {
          boxShadow: '0 0 12px 2px rgba(0,0,0,0.12)',
          duration: 0.6, ease: 'power2.out',
          yoyo: true, repeat: 1
        })
      }
    });


    // ─── 修改四：內容 Stagger 與金額動畫定錨 ─────────────────────────────────

    // 金額計數器：當收據印到一半 (38%) 才開始觸發計數，並給予 2.2s 的長尾緩動
    let amountFired = false;
    ScrollTrigger.create({
      trigger: '.gsap-receipt-card',
      start: 'top 38%',
      onEnter: () => {
        if (amountFired) return;
        amountFired = true;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: request.amount,
          duration: 2.2,
          ease: 'expo.out', // 迅速上升後緩慢定錨，呈現數字的莊重感
          onUpdate: () => {
            if (amountRef.current) {
              amountRef.current.textContent = formatCAD(obj.val);
            }
          }
        });
      }
    });

    // Payee 列表：每行依序滑入，Stagger 設定為 0.14s，確保護資訊被視覺充分捕捉
    gsap.fromTo('.gsap-payee-item', 
      { y: 20, autoAlpha: 0 },
      { 
        y: 0, autoAlpha: 1, 
        stagger: 0.14, 
        duration: 1.0, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.gsap-receipt-card',
          start: 'top 32%',
          once: true
        }
      }
    );

    // 跑馬燈穩定執行動畫
    if (noteRef.current && request.note) {
      const noteWidth = noteRef.current.offsetWidth;
      const maskWidth = Math.min(window.innerWidth - 48, 390);
      gsap.fromTo(noteRef.current, 
        { x: maskWidth },
        { x: -noteWidth, duration: (noteWidth + maskWidth) / 40, ease: 'none', repeat: -1 }
      );
    }

    // ─── 修改五：Cleanup ──────────────────────────────────────────────────

    return () => {
      ScrollTrigger.getAll().forEach((t: any) => t.kill());
      gsap.killTweensOf('*');
    };

  }, [gsapLoaded, mounted, request.amount, request.note]);

  if (!mounted) return <main style={{ minHeight: '100dvh', background: '#F2EDE4' }} />;

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
        /* 避免瀏覽器初次渲染與 GSAP 衝突 */
        .gsap-header-title,
        .gsap-header-date,
        .gsap-header-location {
          will-change: transform, opacity, filter;
        }
        .gsap-receipt-card {
          will-change: clip-path;
        }
        .gsap-print-slot {
          will-change: transform;
        }

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
        
        .gsap-print-slot {
          width: 100%; max-width: 390px; height: 4px; background: #e0dcd5; 
          margin-top: 40px; border-radius: 4px; position: relative; z-index: 10;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) inset;
        }

        .header-block {
          width: 100%; max-width: 390px; display: flex; flex-direction: column; align-items: center; padding-top: 100px;
        }
        .header-lockup { width: fit-content; max-width: 100%; display: flex; flex-direction: column; align-items: center; }
        .header-title-text {
          font-family: var(--font-zen, serif); font-weight: 800; color: var(--sumi); line-height: 1.1; letter-spacing: -0.02em;
          text-align: center; margin: 16px 0; width: 100%;
        }
        .header-date-text {
          font-size: 11px; letter-spacing: 0.3em; color: var(--clay); font-weight: 700; font-family: var(--font-mono, monospace); text-transform: uppercase;
        }
        .header-location-text {
          font-size: 13px; letter-spacing: 0.05em; color: var(--ash); font-weight: 500; text-align: center; width: 100%;
        }
        
        .receipt-dashed { width: 100%; height: 1px; border-top: 1.5px dashed var(--fog); margin: 24px 0; }
        
        .gsap-payment-section {
          width: 100%;
          max-width: 390px;
          margin-top: 48px;
          display: flex;
          justify-content: center;
        }
      `}</style>

      <main
        className="gsap-main-container"
        style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '0 24px', paddingTop: 'env(safe-area-inset-top)', background: 'var(--washi)', paddingBottom: 150,
          overflowX: 'hidden'
        }}
      >
        <div className="header-block">
          <div className="header-lockup">
            {request.eventDate && (
              <div className="gsap-header-date header-date-text">
                {formatDate(request.eventDate)}
              </div>
            )}

            <h1 
              className="gsap-header-title header-title-text"
              style={{
                fontSize: `clamp(18px, calc(min(100vw - 48px, 342px) / ${Math.max(1, [...(request.title || '')].length) * 0.55}), 48px)`,
              }}
            >
              {request.title}
            </h1>

            {request.location && (
              <div className="gsap-header-location header-location-text">
                {request.location}
              </div>
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

        <div className="gsap-print-slot" />

        <div
          className="gsap-receipt-card receipt-edge"
          style={{
            width: '100%', maxWidth: 390, marginTop: 0, padding: '40px 32px 56px 32px',
            background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderRadius: '2px',
            position: 'relative', top: -4, zIndex: 1,
            clipPath: 'inset(0% 0% 100% 0%)'
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
          <div className="gsap-payment-section">
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
