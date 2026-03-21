'use client'

import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { formatCAD, formatDate } from '@/lib/utils'
import PaymentAccordion from '@/components/PaymentAccordion'
import { PaymentRequest, Payee } from '@/lib/types'

interface RequestPayee {
  name: string
  amount: number
  paid: boolean
  note?: string
}

interface RequestClientProps {
  request: PaymentRequest & { consolidated?: any[] }
  tdEmail: string
  wsHandle: string
}

const getGsap = () => (typeof window !== 'undefined' ? (window as any).gsap : undefined);
const getScrollTrigger = () => (typeof window !== 'undefined' ? (window as any).ScrollTrigger : undefined);

function ChevronIcon({ size = 12, rotated = false }: { size?: number, rotated?: boolean }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: rotated ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
}

function ListIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

const ParticipantRow = ({ 
  p, 
  isActive, 
  isPayer, 
  initialExpanded 
}: { 
  p: { name: string; amount: number; paid: boolean; items: { title: string; amount: number; note?: string; paid: boolean; payerName: string }[] }, 
  isActive: boolean, 
  isPayer: boolean, 
  initialExpanded: boolean 
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const expandRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const gsap = getGsap();
    if (!gsap || !expandRef.current) return;
    
    if (isExpanded) {
      gsap.fromTo(expandRef.current, 
        { height: 0, opacity: 0 }, 
        { height: 'auto', opacity: 1, duration: 0.5, ease: 'power3.inOut' }
      );
    } else {
      gsap.to(expandRef.current, { 
        height: 0, 
        opacity: 0, 
        duration: 0.4, 
        ease: 'power3.inOut' 
      });
    }
  }, [isExpanded]);

  return (
    <div 
      className={isActive ? "gsap-payee-item active-payee" : "gsap-payee-item"}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: 15, 
              color: p.paid ? 'var(--clay)' : 'var(--sumi)', 
              fontWeight: isActive ? 700 : 800,
              letterSpacing: '-0.01em'
            }}>
              {isPayer ? `Pay to ${p.name}` : p.name}
            </span>
            {!isPayer && (
              p.paid ? (
                <span style={{ fontSize: 10, color: 'var(--moss)', fontWeight: 800, letterSpacing: '0.1em', marginTop: 4 }}>
                  All paid ✓
                </span>
              ) : (
                <span style={{ fontSize: 10, color: 'var(--rust)', fontWeight: 800, letterSpacing: '0.1em', marginTop: 4 }}>
                  UNPAID
                </span>
              )
            )}
          </div>
          {isPayer && (
            <span style={{ 
              fontSize: 8, 
              background: 'var(--sumi)', 
              color: 'var(--washi)', 
              padding: '1px 5px', 
              borderRadius: 4, 
              fontWeight: 800,
              flexShrink: 0
            }}>
              PAYER
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ 
            fontFamily: 'DM Mono, monospace', 
            fontSize: 18, 
            color: p.paid ? 'var(--fog)' : 'var(--sumi)', 
            textDecoration: (p.paid && !isPayer) ? 'line-through' : 'none', 
            opacity: p.paid ? 0.6 : 1,
            fontWeight: isActive ? 600 : 400
          }} suppressHydrationWarning>
            {formatCAD(p.amount)}
          </span>
          {!isPayer && (
            <div style={{ opacity: 0.3, flexShrink: 0 }}>
              <ChevronIcon rotated={isExpanded} size={14} />
            </div>
          )}
        </div>
      </div>

      {!isPayer && (
        <div ref={expandRef} style={{ height: initialExpanded ? 'auto' : 0, opacity: initialExpanded ? 1 : 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 0, paddingBottom: 4 }}>
             {p.items.map((item: { title: string; amount: number; note?: string; paid: boolean; payerName: string }, iIdx: number) => (
               <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: 0.6 }}>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, flex: 1 }}>
                   <span style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                   {item.note && <span style={{ fontSize: 10, color: 'var(--ash)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> · {item.note}</span>}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, flexShrink: 0 }}>{formatCAD(item.amount)}</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                     <span style={{ 
                        fontSize: 8, 
                        background: item.paid ? 'var(--moss)' : 'rgba(219, 104, 75, 0.1)', 
                        color: item.paid ? 'white' : 'var(--rust)', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        flexShrink: 0
                      }}>
                        {item.paid ? 'PAID' : 'UNPAID'}
                      </span>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const displayPersonName = activePayeeName || (!isGroup ? request.fromName : null);

  // ─── Consolidation Logic ───
  const consolidatedData = useMemo(() => {
    // 1. Identify all requests (primary and consolidated)
    const allRequests = [
      { 
        title: request.title, 
        amount: request.amount, 
        payerName: request.payerName,
        fromName: request.fromName,
        payees: request.payees,
        status: request.status
      },
      ...(request.consolidated || []).map((r: PaymentRequest & { payerName: string }) => ({
        title: r.title,
        amount: r.amount,
        payerName: r.payerName || request.payerName,
        fromName: r.fromName,
        payees: r.payees,
        status: 'pending'
      }))
    ];

    // 2. Identify "Involved" requests (the ones the activePayeeName is part of)
    // If no activePayeeName, we show all (e.g. payer's view)
    const involvedRequests = activePayeeName 
      ? allRequests.filter(r => {
          const names = Array.isArray(r.payees) ? r.payees.map((p: Payee) => p.name) : [r.fromName];
          return names.includes(activePayeeName);
        })
      : allRequests;

    // 3. Calculate Payer Total: Sum of the full original amounts of involved requests
    const payerTotal = involvedRequests.reduce((sum, r) => sum + (r.amount || 0), 0);

    // 4. Map participants from involved requests
    type ParticipantItem = { title: string; amount: number; note: string; paid: boolean; payerName: string };
    type Participant = { name: string; amount: number; paid: boolean; items: ParticipantItem[] };
    const map = new Map<string, Participant>();

    // Helper to add/update entry in map
    involvedRequests.forEach(r => {
      const isRGroup = Array.isArray(r.payees) && r.payees.length > 0;
      if (isRGroup) {
        (r.payees as Payee[]).forEach((p: Payee) => {
          const amount = p.amount || 0;
          const paid = p.paid || false;
          const existing = map.get(p.name);
          if (existing) {
            existing.amount += amount;
            existing.items.push({ title: r.title, amount: amount, note: p.note || '', paid: paid, payerName: r.payerName || '' });
            if (!paid) existing.paid = false;
          } else {
            map.set(p.name, {
              name: p.name,
              amount: amount,
              paid: paid,
              items: [{ title: r.title, amount: amount, note: p.note || '', paid: paid, payerName: r.payerName || '' }]
            });
          }
        });
      } else if (r.fromName) {
        const pPaid = r.status === 'paid';
        const existing = map.get(r.fromName);
        if (existing) {
          existing.amount += r.amount;
          existing.items.push({ title: r.title, amount: r.amount, note: '', paid: pPaid, payerName: r.payerName || '' });
          if (!pPaid) existing.paid = false;
        } else {
          map.set(r.fromName, {
            name: r.fromName,
            amount: r.amount,
            paid: pPaid,
            items: [{ title: r.title, amount: r.amount, note: '', paid: pPaid, payerName: r.payerName || '' }]
          });
        }
      }
    });

    // 5. Build final list
    const finalItems = Array.from(map.values()) as Participant[];
    
    // Amount for Payer is how much they EXPENDED originally.
    const payerItem: Participant = {
      name: request.payerName || '',
      amount: payerTotal,
      paid: true,
      items: []
    };

    // Filter out the Payer from the participant list to avoid double listing 
    const otherParticipants = finalItems.filter(p => p.name !== request.payerName);
    
    // Sort active participant to the top among participants
    otherParticipants.sort((a, b) => {
      if (a.name === activePayeeName) return -1;
      if (b.name === activePayeeName) return 1;
      return 0;
    });

    return [payerItem, ...otherParticipants];
  }, [request, activePayeeName]);

  const payeesList = consolidatedData;
  
  // Owed Summary Logic
  const activeParticipant = activePayeeName ? payeesList.find(p => p.name === activePayeeName) : null;
  const unpaidItems = activeParticipant ? activeParticipant.items.filter(i => !i.paid) : [];
  const totalAmount = unpaidItems.length > 0 
    ? unpaidItems.reduce((sum: number, item) => sum + item.amount, 0)
    : (activePayeeName ? 0 : payeesList[0]?.amount || 0);

  const marqueeMessage = (displayPersonName && activeParticipant?.items[0]?.note) || request.note;

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
            val: totalAmount,
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

    // ─── 跑馬燈循環 ──────────────────────────────────────────────────────
    if (noteRef.current && marqueeMessage) {
      const noteWidth = noteRef.current.offsetWidth;
      const maskWidth = Math.min(window.innerWidth - 48, 390);
      gsap.fromTo(noteRef.current,
        { x: maskWidth },
        { x: -noteWidth, duration: (noteWidth + maskWidth) / 40, ease: 'none', repeat: -1 }
      );
    }

    // ─── 浮動 PAY 按鈕邏輯 ───────────────────────────────────────────────
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

  }, [gsapLoaded, mounted, totalAmount, marqueeMessage]);

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
          margin-top: 32px;
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
          width: 100%; max-width: 390px; margin-top: 4px; overflow: hidden;
          position: relative; height: 32px;
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          display: flex; align-items: center;
        }

        .header-block {
          width: 100%; max-width: 390px;
          display: flex; flex-direction: column; align-items: center; padding-top: 48px;
        }
        .header-lockup {
          width: fit-content; max-width: 100%;
          display: flex; flex-direction: column; align-items: center;
        }
        .header-title-text {
          font-family: var(--font-zen, serif); font-weight: 800; color: var(--sumi);
          line-height: 1.1; letter-spacing: -0.02em; text-align: center; margin: 0; margin-top: 14px; margin-bottom: 12px; width: 100%;
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
              style={{ fontSize: `clamp(18px, calc(min(100vw - 48px, 342px) / ${Math.max(1, [...(displayPersonName || request.title || '')].length) * 0.55}), 48px)` }}
            >
              {displayPersonName ? displayPersonName : request.title}
            </h1>
            {!displayPersonName && request.location && (
              <div className="gsap-header-location header-location-text">{request.location}</div>
            )}
          </div>
        </div>

        {marqueeMessage && (
          <div className="gsap-note-container note-mask">
            <div ref={noteRef} style={{ whiteSpace: 'nowrap', display: 'inline-block', fontSize: 13, color: 'var(--ash)', fontWeight: 500, letterSpacing: '0.02em' }}>
              {marqueeMessage}
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
                {request.payerName ? 'CONSOLIDATED INVOICE' : 'COLLECT RECEIPT'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {payeesList.length === 1 && (
                  <div className="gsap-amount-display" style={{ textAlign: 'center', marginBottom: 24 }}>
                    <p style={{ fontSize: 11, color: 'var(--ash)', marginBottom: 12, letterSpacing: '0.15em', fontWeight: 700 }}>AMOUNT DUE</p>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 52, fontWeight: 400, color: isPaid ? 'var(--moss)' : 'var(--sumi)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      <span ref={amountRef} suppressHydrationWarning>{formatCAD(0)}</span>
                    </p>
                  </div>
                )}

                <div className="gsap-payee-list" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {payeesList.map((p, idx) => {
                    const isActive = p.name === activePayeeName;
                    const isPayer = p.name === request.payerName;
                    return (
                      <ParticipantRow 
                        key={`${p.name}-${idx}`}
                        p={p}
                        isActive={isActive}
                        isPayer={isPayer}
                        initialExpanded={isActive}
                      />
                    );
                  })}
                </div>

                {(unpaidItems.length > 0) && (
                  <>
                    <div className="receipt-dashed" style={{ margin: '24px 0 14px 0' }} />
                    <div className="gsap-unpaid-summary" style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <ListIcon size={10} />
                        <p style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--clay)', fontWeight: 800 }}>UNPAID</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {unpaidItems.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sumi)' }}>{item.title}</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600, color: 'var(--rust)' }}>{formatCAD(item.amount)}</span>
                              <span style={{ fontSize: 9, color: 'var(--sumi)', fontWeight: 500 }}>pay to {item.payerName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(payeesList.length > 1 || (payeesList[0]?.items.length > 1)) && (
                  <>
                    <div className="receipt-dashed" style={{ margin: '14px 0' }} />
                    <div className="gsap-amount-display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, letterSpacing: '0.2em', color: 'var(--sumi)', fontWeight: 800 }}>
                        {activePayeeName ? 'TOTAL OWED' : 'TOTAL'}
                      </span>
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
                  ISSUED: {formatDate(request.createdAt || new Date().toISOString())}
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
