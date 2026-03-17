'use client'

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import Script from 'next/script'
import { formatCAD, formatDate } from '@/lib/utils'

type RequestPayee = { name: string; amount: number; paid: boolean; note?: string }
type Request = {
  id: string; slug: string; title: string; amount: number
  note?: string; method: string; status: string; fromName?: string
  paidAt?: string; createdAt: string; payees?: RequestPayee[]
  payerName?: string; eventDate?: string; location?: string
}
type Payee = { id: string; name: string }
type View = 'login' | 'list' | 'create' | 'contacts'
type Recipient = { payeeId: string; amount: string; note: string }

// ─── Styles ────────────────────────────────────────────────────────────────
const washi = '#F2EDE4'

// @ts-ignore
const getGsap = () => (typeof window !== 'undefined' ? (window as any).gsap : undefined);
// @ts-ignore
const getScrollTrigger = () => (typeof window !== 'undefined' ? (window as any).ScrollTrigger : undefined);

const sumi = '#1A1714'
const ash = 'var(--ash)' // Using darkened variable from CSS
const fog = '#D4CFC8'
const rust = '#8B4A3C'
const moss = '#4A5240'

const capsule: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  borderRadius: 12,
  border: `1.5px solid ${fog}`,
  background: 'rgba(255,255,255,0.55)',
  fontSize: 15,
  color: sumi,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  backdropFilter: 'blur(4px)',
  transition: 'border-color 0.2s',
  appearance: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const capsuleDiv: React.CSSProperties = {
  ...capsule,
  minHeight: 50,
  cursor: 'text',
  display: 'block',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const btnPrimary: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  borderRadius: 12,
  background: sumi,
  color: washi,
  fontFamily: 'inherit',
  fontSize: 14,
  letterSpacing: '0.1em',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  color: ash,
  padding: '4px 0',
}

const pill: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: `1px solid ${fog}`,
  background: 'rgba(255,255,255,0.4)',
  fontFamily: 'inherit',
  fontSize: 12,
  color: sumi,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}


// ─── GSAP Micro-interactions Hooks ──────────────────────────────────────────
const useMagnetic = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const gsap = getGsap();
    if (!gsap || !ref.current) return;
    const element = ref.current;
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = element.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      gsap.to(element, { x: x * 0.2, y: y * 0.2, duration: 0.4, ease: 'power3.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(element, { x: 0, y: 0, duration: 0.6, ease: 'back.out(1.7)' });
    };
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
};

function MagneticButton({ children, style, onClick, className, 'aria-label': ariaLabel, type }: any) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref);
  const handleEnter = () => {
    const gsap = getGsap();
    if(gsap) gsap.to(ref.current, { scale: 1.03, backgroundColor: 'rgba(26,23,20, 0.9)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', duration: 0.2, ease: 'power2.out' })
    if(gsap) gsap.to('.custom-cursor', { scale: 1.5, opacity: 0.5, duration: 0.2 })
  };
  const handleLeave = () => {
    const gsap = getGsap();
    if(gsap) gsap.to(ref.current, { scale: 1, backgroundColor: style?.background || sumi, boxShadow: 'none', duration: 0.3, ease: 'power2.in' })
    if(gsap) gsap.to('.custom-cursor', { scale: 1, opacity: 1, duration: 0.2 })
  };
  return (
    <button ref={ref} type={type} onClick={onClick} style={style} className={className} aria-label={ariaLabel} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
    </button>
  );
}

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const gsap = getGsap();
    if (!gsap || !cursorRef.current) return;
    // 自訂游標跟隨：使用 gsap.quickTo() 確保平滑 60fps
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
      className="custom-cursor" 
      style={{
        position: 'fixed', top: 0, left: 0, width: 16, height: 16, 
        backgroundColor: '#1A1714', borderRadius: '50%', pointerEvents: 'none', 
        zIndex: 9999, transform: 'translate(-50%, -50%)', opacity: 1,
        mixBlendMode: 'difference' // 給予高端視覺過濾
      }} 
    />
  );
};

// Text Split Animation Utils
const SplitText = ({ text, className, style }: { text: string, className?: string, style?: any }) => {
  return (
    <span className={className} style={{ display: 'inline-block', ...style }}>
      {text.split('').map((char, i) => (
        <span key={i} className="split-char" style={{ display: 'inline-block', opacity: 0, transform: 'translateY(20px)' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function GlobeIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function EditIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function TrashIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  )
}

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function MoreIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  )
}

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

function ContactIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

interface RequestCardProps {
  r: Request
  onShare: (slug: string, title: string, amount: number) => void
  onShareIndividual: (slug: string, title: string, amount: number, payeeName: string) => void
  onPayeePaid: (r: Request, index: number) => void
  onDelete: (id: string) => void
  onEdit: (r: Request) => void
  paid?: boolean
}

function RequestCard({ r, onShare, onShareIndividual, onPayeePaid, onDelete, onEdit, paid }: RequestCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Card hover effect (卡片微互動)
  const handleMouseEnter = () => {
    const gsap = getGsap();
    if (!gsap || !cardRef.current) return;
    gsap.to(cardRef.current, { y: -8, boxShadow: '0 10px 20px rgba(0,0,0,0.06)', borderColor: 'rgba(212,207,200, 0.9)', duration: 0.3, ease: 'power2.out' });
  };
  const handleMouseLeave = () => {
    const gsap = getGsap();
    if (!gsap || !cardRef.current) return;
    gsap.to(cardRef.current, { y: 0, boxShadow: 'none', borderColor: fog, duration: 0.4, ease: 'power2.inOut' });
  };

  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const payeeList: RequestPayee[] = r.payees || (r.fromName ? [{ name: r.fromName, amount: r.amount, paid: r.status === 'paid' }] : [])

  return (
    <div ref={cardRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="gsap-request-card" style={{ position: 'relative', overflow: 'hidden', padding: '14px 18px', border: `1.5px solid ${fog}`, borderRadius: 12, background: paid ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)', opacity: paid ? 0.75 : 1 }}>
      {/* Full-Card Action Overlay */}
      <div 
        onClick={() => setShowActions(false)}
        style={{ 
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: showActions ? 1 : 0,
          pointerEvents: showActions ? 'auto' : 'none',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 10
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          transform: showActions ? 'translateX(0)' : 'translateX(-30px)', 
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)' 
        }}>
          {/* Share Button Group */}
          <button aria-label="Share request" onClick={(e) => { e.stopPropagation(); onShare(r.slug, r.title, r.amount) }} style={{ ...pill, padding: 0, background: sumi, color: washi, border: 'none', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 15 }}>
            <ShareIcon size={18} />
          </button>
          <a aria-label="Open link" href={`/request/${r.slug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ ...pill, padding: 0, background: washi, color: sumi, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 15, border: `1.5px solid ${fog}` }}>
            <GlobeIcon size={18} />
          </a>
          {/* Management Group */}
          <button aria-label="Edit request" onClick={(e) => { e.stopPropagation(); onEdit(r) }} style={{ ...pill, padding: 0, background: washi, color: sumi, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 15, border: `1.5px solid ${fog}` }}>
            <EditIcon size={18} />
          </button>
          <button aria-label="Delete request" onClick={(e) => { e.stopPropagation(); onDelete(r.id) }} style={{ ...pill, padding: 0, background: washi, color: rust, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 15, border: `1.5px solid rgba(139, 74, 60, 0.1)` }}>
            <TrashIcon size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ flex: 1, minWidth: 0, paddingRight: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', paddingTop: 2 }}>
            <p style={{ fontSize: 13, color: ash, marginBottom: 2, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
            <p style={{ fontSize: 11, color: ash, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDate(r.createdAt)} · {r.method?.toUpperCase?.()}</p>
          </div>
          <div style={{ opacity: 0.3, flexShrink: 0, paddingTop: 2 }}>
            <ChevronIcon rotated={isExpanded} size={14} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button 
            onClick={() => setShowActions(!showActions)} 
            style={{ 
              ...pill, 
              padding: 0, 
              background: 'transparent', 
              width: 34, 
              height: 34, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: 10,
              color: ash,
              opacity: 0.3,
              transition: 'all 0.3s',
              border: 'none',
              zIndex: 2,
              paddingTop: 2
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
          >
            <MoreIcon size={16} />
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateRows: isExpanded ? '1fr' : '0fr', 
        transition: 'grid-template-rows 0.7s cubic-bezier(0.85, 0, 0.15, 1)',
        overflow: 'hidden'
      }}>
        <div style={{ minHeight: 0 }}>
          <div style={{ padding: '16px 0 4px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 1, background: fog, marginBottom: 6, transition: 'opacity 0.7s', opacity: isExpanded ? 0.3 : 0 }} />
            {payeeList.map((p: RequestPayee, idx: number) => {
              const isCreditor = p.name === r.payerName
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 100, flexShrink: 0, paddingRight: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: sumi }} className="no-wrap">
                      {p.name}
                      {isCreditor && <span style={{ color: rust, fontSize: 10, fontWeight: 700, opacity: 0.9, marginLeft: 14, letterSpacing: '0.05em' }}>CREDITOR</span>}
                    </p>
                    <p style={{ fontSize: 11, color: ash, fontFamily: 'DM Mono, monospace', opacity: 0.8 }}>{formatCAD(p.amount)}</p>
                  </div>
                  {p.note && (
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: ash, opacity: 0.5, fontStyle: 'italic', padding: '0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.note}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', flexShrink: 0 }}>
                    <button 
                      onClick={() => onPayeePaid(r, idx)} 
                      disabled={isCreditor}
                      style={{
                        width: 76, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none', cursor: isCreditor ? 'default' : 'pointer', fontSize: 10, fontWeight: 700,
                        background: p.paid || isCreditor ? moss : 'rgba(139, 74, 60, 0.1)',
                        color: p.paid || isCreditor ? 'white' : rust,
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em',
                        opacity: isCreditor ? 0.7 : 1
                      }}
                    >
                      {p.paid || isCreditor ? 'PAID' : 'UNPAID'}
                    </button>
                    {!isCreditor && (
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            const menu = e.currentTarget.nextElementSibling as HTMLElement;
                            if (menu) menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
                          }}
                          style={{
                            width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: 'none', cursor: 'pointer', background: 'transparent', color: ash,
                            transition: 'opacity 0.2s', padding: 0, opacity: 0.4
                          }}
                          aria-label="Payee actions"
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                        >
                          <MoreIcon size={16} />
                        </button>
                        <div className="payee-action-menu" style={{
                          display: 'none', position: 'absolute', right: 0, top: '100%', marginTop: 8,
                          background: washi, border: `1px solid ${fog}`, borderRadius: 8,
                          flexDirection: 'column', padding: 4, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          minWidth: 80
                        }}>
                          <button onClick={(e) => { e.stopPropagation(); (e.currentTarget.parentElement as HTMLElement).style.display='none'; onShareIndividual(r.slug, r.title, p.amount, p.name) }} style={{ ...btnGhost, textAlign: 'left', padding: '6px 10px', width: '100%', fontSize: 11 }}>Share</button>
                          <a href={`/request/${r.slug}?p=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); (e.currentTarget.parentElement as HTMLElement).style.display='none'; }} style={{ ...btnGhost, textAlign: 'left', padding: '6px 10px', width: '100%', fontSize: 11, textDecoration: 'none', display: 'block', color: 'inherit' }}>Preview</a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [payees, setPayees] = useState<Payee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  // List filters
  const [searchTitle, setSearchTitle] = useState('')
  const [searchName, setSearchName] = useState('')

  // Create form state
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([{ payeeId: '', amount: '', note: '' }])
  const [splitEqually, setSplitEqually] = useState(false)
  const [groupRequest, setGroupRequest] = useState(false)
  const [totalAmount, setTotalAmount] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [payerName, setPayerName] = useState('')
  const [locationResults, setLocationResults] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [newRequests, setNewRequests] = useState<any[]>([])
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [searchingLocation, setSearchingLocation] = useState(false)

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const paidRequests = requests.filter(r => r.status === 'paid')
  const totalPending = pendingRequests.reduce((s, r) => s + r.amount, 0)
  const filteredPending = pendingRequests.filter(r => {
    const matchTitle = r.title.toLowerCase().includes(searchTitle.toLowerCase())
    const matchName = searchName ? (r.fromName || '').includes(searchName) : true
    return matchTitle && matchName
  })

  const isMultiRecipient = recipients.length > 1

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // ─── GSAP Animations ───
  // Page Load Sequence & View Transitions
  const mainRef = useRef<HTMLElement>(null);
  const [gsapLoaded, setGsapLoaded] = useState(false);

  useEffect(() => {
    const gsap = getGsap();
    if (!gsap || !gsapLoaded) return;
    
    // 清除舊的動畫以防衝突
    gsap.killTweensOf('.split-char');
    gsap.killTweensOf('.gsap-fade-in');
    
    // ① 頁面進場 (Page Load Sequence)
    // - 標題文字按字元浮現
    // - UI 元素依序入場
    const tl = gsap.timeline();
    tl.to('.split-char', {
      y: 0, opacity: 1, stagger: 0.05, duration: 0.8, ease: 'expo.out' // 奢華緩動：極快入場、極長尾巴
    })
    .fromTo('.gsap-fade-in', 
      { y: 20, autoAlpha: 0 }, 
      { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }, // 快入慢出，自然降落
      "-=0.6"
    );

  }, [view, gsapLoaded]);

  // ② 滾動驅動動畫 (ScrollTrigger)
  useEffect(() => {
    const gsap = getGsap();
    const ScrollTrigger = getScrollTrigger();
    if (!gsap || !ScrollTrigger || view !== 'list' || !gsapLoaded) return;
    
    gsap.registerPlugin(ScrollTrigger);
    
    // 列表項目依序滑入 (Stagger)
    gsap.fromTo('.gsap-request-card', 
      { y: 50, autoAlpha: 0 },
      { 
        y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
          trigger: '.gsap-list-container',
          start: 'top 85%',
          once: true // 滾動觸發使用 once: true
        }
      }
    );

    // Header 視差縮放效果搭配 ScrollTrigger scrub: true
    // 取代原有的物理引擎
    const headerTl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: '+=120',
        scrub: true // 根據滾動距離即時更新
      }
    });
    
    headerTl
      .to('.gsap-header-container', { height: 80, ease: 'none'}, 0)
      .to('.gsap-logo-group', { top: 23, left: '0%', xPercent: 0, ease: 'power1.inOut' }, 0)
      .to('.gsap-logo-text', { fontSize: 16, paddingLeft: 0, ease: 'none' }, 0)
      .to('.gsap-admin-text', { fontSize: 7, paddingLeft: 0, ease: 'none' }, 0)
      .to('.gsap-btn-group', { top: 23, right: '0%', xPercent: 0, ease: 'power1.inOut' }, 0)
      .to('.gsap-btn', { height: 29, minWidth: 29, width: 29, borderRadius: 100, padding: 0, ease: 'none' }, 0)
      .to('.gsap-btn-text', { width: 0, opacity: 0, marginLeft: 0, ease: 'none' }, 0);
      
      // 導覽列玻璃態過渡 (backdrop-filter)
      gsap.to('.gsap-header-container', {
        backgroundColor: 'rgba(242, 237, 228, 0.85)',
        backdropFilter: 'blur(12px)',
        scrollTrigger: { trigger: 'body', start: '30px top', end: '80px top', scrub: true }
      });

    // ③ 數字計數動畫 (Counter Animation)
    if (totalPending > 0) {
      const counterEl = document.getElementById('pending-counter');
      if (counterEl) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: totalPending,
          duration: 1.5,
          ease: 'expo.out', // 緩動效果：前面快、後面慢
          onUpdate: () => {
            counterEl.textContent = formatCAD(obj.val);
          },
          scrollTrigger: {
            trigger: '#pending-counter',
            start: 'top 95%',
            once: true
          }
        });
      }
    }

    return () => { ScrollTrigger.getAll().forEach((t: any) => t.kill()); };
  }, [view, requests, gsapLoaded, totalPending]);




  // Contacts management
  const [newContactName, setNewContactName] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  const titleRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Attempt auto-login in local development without password
    if (process.env.NODE_ENV === 'development') {
      setAdminKey('dev')
      fetchData('dev')
      setView('list')
    }
  }, [])

  const fetchData = useCallback(async (key: string) => {
    setLoading(true)
    const [reqRes, payeeRes] = await Promise.all([
      fetch('/api/requests', { headers: { 'x-admin-key': key } }),
      fetch('/api/payees', { headers: { 'x-admin-key': key } }),
    ])
    if (reqRes.ok) setRequests(await reqRes.json())
    if (payeeRes.ok) setPayees(await payeeRes.json())
    setLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/requests', { headers: { 'x-admin-key': password } })
    if (res.ok) {
      setAdminKey(password)
      const data = await res.json()
      setRequests(data)
      fetchData(password)
      setView('list')
    } else setError('Incorrect password')
    setLoading(false)
  }

  const handleLocationSearch = async (query: string) => {
    setLocation(query)

    // ⚡ Bolt: Debounce OSM search to respect rate limits (1 req/sec) and reduce API calls/re-renders
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setLocationResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingLocation(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        const data = await res.json()
        setLocationResults(data)
      } catch (e) { console.error('OSM error', e) }
      setSearchingLocation(false)
    }, 500)
  }

  const handleEdit = (r: Request) => {
    setEditingRequest(r)
    setView('create')
    setNewRequests([])
  }

  useEffect(() => {
    if (editingRequest && view === 'create') {
      if (titleRef.current) titleRef.current.textContent = editingRequest.title
      if (noteRef.current) noteRef.current.textContent = editingRequest.note || ''
      setEventDate(editingRequest.eventDate?.split('T')[0] || '')
      setLocation(editingRequest.location || '')
      setPayerName(editingRequest.payerName || '')
      
      const isGroup = !!editingRequest.payees
      setGroupRequest(isGroup)
      if (isGroup) {
        setRecipients(editingRequest.payees!.map((p: RequestPayee) => {
            const payee = payees.find(contact => contact.name === p.name)
            return { payeeId: payee?.id || '', amount: p.amount.toString(), note: p.note || '' }
        }))
        setTotalAmount(editingRequest.amount.toString())
      } else {
        const payee = payees.find(p => p.name === editingRequest.fromName)
        setRecipients([{ payeeId: payee?.id || '', amount: editingRequest.amount.toString(), note: editingRequest.note || '' }])
      }
    }
  }, [editingRequest, view, payees])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentTitle = titleRef.current?.textContent?.trim() || ''
    const currentNote = noteRef.current?.textContent?.trim() || ''
    if (!currentTitle) { setError('Please fill in the purpose'); return }
    const validRecipients = recipients.filter(r => r.payeeId)
    if (validRecipients.length === 0) { setError('Please select at least one recipient'); return }
    setCreating(true); setError('')

    const commonFields = { 
      title: currentTitle, 
      note: currentNote, 
      method: 'all', 
      eventDate: eventDate || null, 
      location: location || null,
      payerName: payerName || null
    }

    let payload: any;
    if (groupRequest && validRecipients.length > 1) {
      const recipientItems = validRecipients.map(r => {
        const payee = payees.find(p => p.id === r.payeeId)
        const amt = splitEqually
          ? (parseFloat(totalAmount) / validRecipients.length).toFixed(2)
          : r.amount
        return { name: payee?.name || '', amount: parseFloat(amt as string), paid: payee?.name === payerName, note: r.note }
      })
      const totalAmt = parseFloat(totalAmount) || recipientItems.reduce((sum, item) => sum + item.amount, 0)
      
      // Determine initial status based on recipients
      const allPaid = recipientItems.length > 0 && recipientItems.every(r => r.paid)
      payload = { ...commonFields, amount: totalAmt, payees: recipientItems, status: allPaid ? 'paid' : 'pending' }
    } else {
      payload = validRecipients.map(r => {
        const payee = payees.find(p => p.id === r.payeeId)
        const amt = validRecipients.length > 1 && splitEqually
          ? (parseFloat(totalAmount) / validRecipients.length).toFixed(2)
          : r.amount
        const isCreditor = payee?.name === payerName
        return { ...commonFields, amount: parseFloat(amt as string), fromName: payee?.name || '', status: isCreditor ? 'paid' : 'pending', note: r.note || commonFields.note }
      })
      if (editingRequest) payload = payload[0]
    }

    const url = editingRequest ? `/api/requests/${editingRequest.id}` : '/api/requests'
    const method = editingRequest ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      setNewRequests(Array.isArray(data) ? data : [data])
      fetchData(adminKey)
      if (!editingRequest) {
        if (titleRef.current) titleRef.current.textContent = ''
        if (noteRef.current) noteRef.current.textContent = ''
        setTitle(''); setNote('')
        setRecipients([{ payeeId: '', amount: '', note: '' }])
        setSplitEqually(false); setGroupRequest(false); setTotalAmount('')
        setEventDate(''); setLocation(''); setPayerName('')
      }
      setEditingRequest(null)
    } else setError(editingRequest ? 'Update failed' : 'Creation failed')
    setCreating(false)
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newContactName.trim()
    if (!name) return
    setSavingContact(true)
    const res = await fetch('/api/payees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const data = await res.json()
      setPayees(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewContactName('')
    }
    setSavingContact(false)
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    await fetch(`/api/payees/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
    setPayees(prev => prev.filter(p => p.id !== id))
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return
    await fetch(`/api/requests/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
    fetchData(adminKey)
  }

  const onPayeePaid = async (r: Request, index: number) => {
    const payeesList: RequestPayee[] = r.payees || (r.fromName ? [{ name: r.fromName, amount: r.amount, paid: r.status === 'paid' }] : [])
    const updatedPayees = [...payeesList]
    updatedPayees[index].paid = !updatedPayees[index].paid
    
    // Determine overall status
    const allPaid = updatedPayees.every((p: RequestPayee) => p.paid)
    const newStatus = allPaid ? 'paid' : 'pending'

    await fetch(`/api/requests/${r.id}`, { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, 
      body: JSON.stringify({ 
        payees: updatedPayees,
        status: newStatus
      }) 
    })
    fetchData(adminKey)
  }

  const getUrl = (slug: string) => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/request/${slug}`
  }
  const copyLink = (slug: string, payeeName?: string) => { 
    const url = getUrl(slug) + (payeeName ? `?p=${encodeURIComponent(payeeName)}` : '')
    navigator.clipboard.writeText(url); 
    setCopied(slug + (payeeName || '')); 
    setTimeout(() => setCopied(''), 2000) 
  }
  const shareLink = async (slug: string, title?: string, amount?: number, payeeName?: string) => {
    const url = getUrl(slug) + (payeeName ? `?p=${encodeURIComponent(payeeName)}` : '')
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { 
        await (navigator as any).share({ 
          title: `Collect · ${title}${payeeName ? ` for ${payeeName}` : ''}`, 
          text: `Request for ${formatCAD(amount || 0)}`, 
          url 
        }) 
      } catch {}
    } else copyLink(slug, payeeName)
  }

  // WebAuthn Helpers
  const toBase64Url = (buf: ArrayBuffer) => btoa(Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const fromBase64Url = (str: string) => { const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); return buf.buffer }

  const handleWebAuthnLogin = async () => {
    setLoading(true); setError('')
    try {
      const opts = await (await fetch('/api/auth/webauthn', { method: 'POST', body: JSON.stringify({ action: 'login-options' }) })).json()
      opts.challenge = fromBase64Url(opts.challenge)
      opts.allowCredentials = opts.allowCredentials.map((c: any) => ({ ...c, id: fromBase64Url(c.id) }))
      const assertion = await navigator.credentials.get({ publicKey: opts }) as any
      const result = await (await fetch('/api/auth/webauthn', { method: 'POST', body: JSON.stringify({ action: 'login-verify', data: { id: assertion.id, rawId: toBase64Url(assertion.rawId), response: { authenticatorData: toBase64Url(assertion.response.authenticatorData), clientDataJSON: toBase64Url(assertion.response.clientDataJSON), signature: toBase64Url(assertion.response.signature), userHandle: assertion.response.userHandle ? toBase64Url(assertion.response.userHandle) : null } } }) })).json()
      if (result.success) { setAdminKey(result.token); fetchData(result.token); setView('list') } else setError('Authentication failed')
    } catch { setError('Biometrics not supported or cancelled') }
    setLoading(false)
  }

  const handleRegisterPasskey = async () => {
    setCreating(true)
    try {
      const opts = await (await fetch('/api/auth/webauthn', { method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ action: 'register-options' }) })).json()
      opts.challenge = fromBase64Url(opts.challenge)
      opts.user.id = fromBase64Url(opts.user.id)
      const cred = await navigator.credentials.create({ publicKey: opts }) as any
      await fetch('/api/auth/webauthn', { method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify({ action: 'register-verify', data: { id: cred.id, rawId: toBase64Url(cred.rawId), response: { attestationObject: toBase64Url(cred.response.attestationObject), clientDataJSON: toBase64Url(cred.response.clientDataJSON) } } }) })
      alert('FaceID / TouchID setup success!')
    } catch { alert('Setup failed') }
    setCreating(false)
  }


  // ─── LOGIN ───────────────────────────────────────────────────────────────
  if (view === 'login') return (
    <main ref={mainRef} style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: washi }}>
      <CustomCursor />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" onLoad={() => setGsapLoaded(true)} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" onLoad={() => setGsapLoaded(true)} />
      
      <div style={{ width: '100%', maxWidth: 360 }}>
        <p className="gsap-fade-in" style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.3em', color: ash, marginBottom: 8 }}>ADMIN PORTAL</p>
        <h1 style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 32, fontWeight: 700, color: sumi, marginBottom: 48 }}><SplitText text="COLLECT" /></h1>
        <form onSubmit={handleLogin} autoComplete="off" className="gsap-fade-in">
          <div style={{ position: 'relative' }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ ...capsule, marginBottom: 12, paddingRight: 48 }} autoFocus />
            <button 
              type="button" 
              onClick={handleWebAuthnLogin} 
              style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: ash, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28, width: 28 }}
              title="Login with FaceID"
            >
              <LockIcon size={18} />
            </button>
          </div>
          {error && <p style={{ fontSize: 12, color: rust, marginBottom: 12 }}>{error}</p>}
          <MagneticButton type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Verifying…' : 'Sign In'}</MagneticButton>
        </form>
      </div>
    </main>
  )

  // ─── CONTACTS ────────────────────────────────────────────────────────────
  if (view === 'contacts') return (
    <main style={{ minHeight: '100dvh', padding: '0 24px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 32 }} className="gsap-fade-in">
          <button onClick={() => setView('list')} style={btnGhost}>← BACK</button>
          <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.2em', color: ash }}><SplitText text="CONTACTS" /></p>
          <div style={{ width: 48 }} />
        </div>

        <form onSubmit={handleAddContact} autoComplete="off" style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            type="text"
            value={newContactName}
            onChange={e => setNewContactName(e.target.value)}
            placeholder="Name"
            autoComplete="off"
            style={{ ...capsule, flex: 1 }}
          />
          <button type="submit" disabled={savingContact || !newContactName.trim()} style={{ ...btnPrimary, width: 'auto', padding: '14px 24px', flexShrink: 0 }}>
            {savingContact ? '…' : '+ ADD'}
          </button>
        </form>

        {payees.length === 0 ? (
          <p style={{ fontSize: 13, color: fog, textAlign: 'center', paddingTop: 32 }}>No contacts yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payees.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: `1px solid ${fog}`, borderRadius: 12, background: 'rgba(255,255,255,0.4)' }}>
                <p style={{ fontSize: 15, color: sumi }}>{p.name}</p>
                <button onClick={() => handleDeleteContact(p.id)} style={{ ...btnGhost, color: rust, fontSize: 12 }}>DELETE</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 60 }} />
      </div>
    </main>
  )

  // ─── CREATE ──────────────────────────────────────────────────────────────
  if (view === 'create') return (
    <main style={{ minHeight: '100dvh', padding: '0 24px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 32 }} className="gsap-fade-in">
          <button onClick={() => { setView('list'); setNewRequests([]); setEditingRequest(null) }} style={btnGhost}>← BACK</button>
          <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.2em', color: ash }}><SplitText text={editingRequest ? 'EDIT REQUEST' : 'NEW REQUEST'} /></p>
          <div style={{ width: 48 }} />
        </div>

        {newRequests.length > 0 ? (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: moss, marginBottom: 20 }}>LINKS CREATED ✓</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {newRequests.map((req, idx) => (
                <div key={idx} style={{ padding: '16px 20px', border: `1px solid ${fog}`, borderRadius: 12, background: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {req.fromName && <p style={{ fontSize: 15, fontWeight: 600, color: sumi }} className="no-wrap">{req.fromName}</p>}
                      <p style={{ fontSize: 13, color: ash }} className="no-wrap">{req.title}</p>
                    </div>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: moss, marginLeft: 12, flexShrink: 0 }}>{formatCAD(Number(req.amount))}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => copyLink(req.slug)} style={pill}>{copied === req.slug ? '✓ COPIED' : 'COPY'}</button>
                    <a href={`/request/${req.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...pill, textDecoration: 'none' }}>PREVIEW</a>
                    <button onClick={() => shareLink(req.slug, req.title, req.amount)} style={{ ...pill, background: sumi, color: washi, border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShareIcon size={11} /> SHARE
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setNewRequests([])} style={{ ...btnPrimary, marginTop: 28 }}>CREATE ANOTHER</button>
          </div>
        ) : (
          <form onSubmit={handleCreate} autoComplete="off">
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>PURPOSE</p>
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Lunch, Movie tickets..."
              onInput={e => setTitle((e.target as HTMLElement).textContent || '')}
              style={capsuleDiv}
            />

            <div style={{ height: 16 }} />

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>DATE</p>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ ...capsule, padding: '12px 16px' }} />
              </div>
              <div style={{ flex: 1.5, position: 'relative' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>LOCATION</p>
                <input type="text" value={location} onChange={e => handleLocationSearch(e.target.value)} placeholder="Search location..." style={{ ...capsule, padding: '12px 16px' }} />
                {locationResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: `1px solid ${fog}`, borderRadius: 12, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {locationResults.map((r, i) => (
                      <div key={i} onClick={() => { setLocation(r.display_name); setLocationResults([]) }} style={{ padding: '10px 16px', fontSize: 13, borderBottom: i === locationResults.length - 1 ? 'none' : `1px solid ${fog}`, cursor: 'pointer' }}>{r.display_name}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8, fontWeight: 700 }}>ADVANCED BY (PAYER)</p>
              <select 
                value={payerName} 
                onChange={e => setPayerName(e.target.value)} 
                style={{ ...capsule, color: payerName ? sumi : ash, fontWeight: 500 }}
              >
                <option value="">Select who paid (None)</option>
                {payees.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8, fontWeight: 700 }}>NOTE (OPTIONAL)</p>
            <div ref={noteRef} contentEditable suppressContentEditableWarning data-placeholder="Details..." onInput={e => setNote((e.target as HTMLElement).textContent || '')} style={{ ...capsuleDiv, borderRadius: 12, minHeight: 80 }} />

            <div style={{ height: 24 }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash }}>RECIPIENT</p>
              {isMultiRecipient && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ash, cursor: 'pointer' }}>
                    <input type="checkbox" checked={groupRequest} onChange={e => setGroupRequest(e.target.checked)} /> Group link
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ash, cursor: 'pointer' }}>
                    <input type="checkbox" checked={splitEqually} onChange={e => setSplitEqually(e.target.checked)} /> Split equally
                  </label>
                </div>
              )}
            </div>

            {payees.length === 0 ? (
              <div style={{ padding: '20px', border: `1.5px dashed ${fog}`, borderRadius: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: ash, marginBottom: 12 }}>No contacts yet.</p>
                <button type="button" onClick={() => setView('contacts')} style={{ ...pill, background: sumi, color: washi, border: 'none', padding: '8px 20px' }}>→ Add Contacts</button>
              </div>
            ) : (
              <>
                {isMultiRecipient && splitEqually && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>TOTAL AMOUNT (CAD)</p>
                    <input type="number" step="0.01" min="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" style={{ ...capsule, fontFamily: 'DM Mono, monospace', fontSize: 22 }} required />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recipients.map((r, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.3)', padding: 12, borderRadius: 12, border: `1px solid ${fog}` }}>
                      <select value={r.payeeId} onChange={e => { const next = [...recipients]; next[i] = { ...next[i], payeeId: e.target.value }; setRecipients(next) }} style={{ ...capsule, flex: 1, border: 'none', background: 'transparent', padding: 0, height: 'auto', minHeight: 'unset', color: r.payeeId ? sumi : ash }} required>
                        <option value="">Select Contact</option>
                        {payees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: isMultiRecipient && splitEqually ? 'auto' : '100%', marginTop: isMultiRecipient && splitEqually ? 0 : 4 }}>
                        {!(isMultiRecipient && splitEqually) && (
                          <input type="number" step="0.01" min="0.01" value={r.amount} onChange={e => { const next = [...recipients]; next[i] = { ...next[i], amount: e.target.value }; setRecipients(next) }} placeholder="Amt" style={{ ...capsule, width: 80, border: 'none', background: 'transparent', padding: 0, height: 'auto', minHeight: 'unset', fontFamily: 'DM Mono, monospace', fontSize: 14 }} required />
                        )}
                        <input type="text" value={r.note} onChange={e => { const next = [...recipients]; next[i] = { ...next[i], note: e.target.value }; setRecipients(next) }} placeholder="Item note (memo)" style={{ ...capsule, flex: 1, border: 'none', background: 'transparent', padding: 0, height: 'auto', minHeight: 'unset', fontSize: 12, opacity: 0.7 }} />
                        {recipients.length > 1 && <button type="button" onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))} style={{ ...btnGhost, color: rust, fontSize: 18, lineHeight: 1, flexShrink: 0, padding: '0 4px' }}>✕</button>}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setRecipients([...recipients, { payeeId: '', amount: '', note: '' }])} style={{ ...btnGhost, color: moss, marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>+ ADD RECIPIENT</button>
              </>
            )}

            {error && <p style={{ fontSize: 12, color: rust, marginTop: 16 }}>{error}</p>}
            <button type="submit" disabled={creating || payees.length === 0} style={{ ...btnPrimary, marginTop: 32, opacity: payees.length === 0 ? 0.4 : 1 }}>
              {creating ? 'CREATING…' : (editingRequest ? 'UPDATE REQUEST' : 'CREATE LINK')}
            </button>
          </form>
        )}
        <div style={{ height: 60 }} />
      </div>
    </main>
  )

  // ─── LIST ────────────────────────────────────────────────────────────────
  // ─── LIST ────────────────────────────────────────────────────────────────
 

  const renderButtons = () => {
    return (
      <>
        {/* New Button */}
        <MagneticButton onClick={() => setView('create')} aria-label="New request" style={{ 
          ...pill, 
          background: sumi, color: washi, border: 'none', 
          height: 34, minWidth: 34, width: 82, padding: '0 16px', borderRadius: 100, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          willChange: 'width, height, padding'
        }} className="gsap-btn">
          <span style={{ fontSize: 18, marginRight: 4 }}>+</span>
          <span className="gsap-btn-text" style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', width: 35, opacity: 1, overflow: 'hidden' }}>NEW</span>
        </MagneticButton>

        {/* Contacts Button */}
        <MagneticButton onClick={() => setView('contacts')} aria-label="Contacts" style={{ 
          ...pill, 
          background: 'none', border: `1.5px solid ${fog}`, color: sumi,
          height: 34, minWidth: 34, width: 98, padding: '0 14px', borderRadius: 100, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          willChange: 'width, height'
        }} className="gsap-btn">
          <ContactIcon size={14} />
          <span className="gsap-btn-text" style={{ fontSize: 11, fontWeight: 600, marginLeft: 6, width: 50, opacity: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>Contacts</span>
        </MagneticButton>

        {/* FaceID Button */}
        <MagneticButton onClick={handleRegisterPasskey} aria-label="FaceID" style={{ 
          ...pill, 
          background: 'none', border: `1.5px solid ${fog}`, color: sumi,
          height: 34, minWidth: 34, width: 88, padding: '0 14px', borderRadius: 100, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          willChange: 'width, height'
        }} className="gsap-btn">
          <LockIcon size={12} />
          <span className="gsap-btn-text" style={{ fontSize: 11, fontWeight: 600, marginLeft: 6, width: 40, opacity: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>FaceID</span>
        </MagneticButton>
      </>
    );
  };

  return (
    <main ref={mainRef} style={{ minHeight: '100dvh', background: washi, overflow: 'hidden' }}>
      <CustomCursor />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" onLoad={() => setGsapLoaded(true)} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" onLoad={() => setGsapLoaded(true)} />
      
      {/* Sticky Header Container */}
      <div className="gsap-header-container" style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, 
        zIndex: 100,
        height: 170, // GSAP 將動態控制為 80
        background: washi,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        willChange: 'height, background-color, backdrop-filter'
      }}>
        <div className="layout-responsive-container" style={{ width: '100%', padding: '0 20px', position: 'relative', height: '100%' }}>
          
          {/* Combined Layout Container */}
          <div style={{ 
            width: '100%',
            height: '100%',
            position: 'relative'
          }}>
            {/* Logo Group */}
            <div className="gsap-logo-group" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              gap: 2,
              position: 'absolute',
              top: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'left',
              willChange: 'transform, top, left', 
            }}>
              <p className="gsap-logo-text" style={{ 
                fontFamily: 'var(--font-zen,serif)', 
                fontSize: 28, // GSAP: 16
                letterSpacing: '0.42em',
                marginRight: '-0.42em',
                paddingLeft: '0.42em', 
                color: sumi, 
                fontWeight: 700, 
                marginTop: 0,
                marginBottom: 0,
                marginLeft: 0,
                lineHeight: 1,
                willChange: 'font-size, padding-left'
              }}>COLLECT</p>
              
              <p className="gsap-admin-text" style={{ 
                fontFamily: 'var(--font-zen,serif)', 
                fontSize: 11, // GSAP: 7
                letterSpacing: '0.89em',
                marginRight: '-0.89em',
                paddingLeft: '1.3em',
                color: ash, 
                fontWeight: 500,
                opacity: 0.9,
                marginTop: 0,
                marginBottom: 0,
                marginLeft: 0,
                willChange: 'font-size, padding-left'
              }}>ADMIN PORTAL</p>
            </div>

            {/* Button Group */}
            <div className="gsap-btn-group" style={{ 
              display: 'flex', 
              gap: 8,
              alignItems: 'center',
              position: 'absolute',
              top: 106,
              right: '50%',
              transform: 'translateX(50%)',
              willChange: 'transform, top, right, gap'
            }}>
              {renderButtons()}
            </div>
          </div>

        </div>
      </div>

      <div className="layout-responsive-container gsap-list-container" style={{ width: '100%', margin: '0 auto', padding: '0 20px', paddingTop: 174 }}>
        
        {pendingRequests.length > 0 && (
          <div className="gsap-fade-in" style={{ padding: '20px', border: `1.5px solid ${fog}`, borderRadius: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.3)', height: 72 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.15em', color: ash, marginBottom: 4, fontWeight: 600 }}>PENDING TOTAL</p>
              <p id="pending-counter" style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, color: rust, fontWeight: 400 }}>{formatCAD(totalPending)}</p>
            </div>
            <p style={{ fontSize: 11, color: ash, fontWeight: 600 }}>{pendingRequests.length} items</p>
          </div>
        )}

        {filteredPending.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 14, fontWeight: 700 }}>PENDING ({filteredPending.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPending.map(r => <RequestCard key={r.id} r={r} onShare={shareLink} onShareIndividual={shareLink} onDelete={deleteRequest} onEdit={handleEdit} onPayeePaid={onPayeePaid} />)}
            </div>
          </section>
        )}

        {paidRequests.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: ash, marginBottom: 14 }}>RECEIVED</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paidRequests.map(r => <RequestCard key={r.id} r={r} onShare={shareLink} onShareIndividual={shareLink} onDelete={deleteRequest} onEdit={handleEdit} onPayeePaid={onPayeePaid} paid />)}
            </div>
          </section>
        )}

        {!loading && requests.length === 0 && <div style={{ textAlign: 'center', paddingTop: 64 }}><p style={{ fontSize: 13, color: fog, letterSpacing: '0.1em' }}>No records found.</p></div>}
        
        {/* Generous bottom spacer mathematically guarantees enough scroll real-estate (80px minimum needed) to trigger the completed collapsed header state, even on near-empty lists */}
        <div style={{ height: '40vh' }} />
      </div>
    </main>
  )
}


/*
【動畫設計決策說明】

1. 為何選擇這個 easing:
- 頁面進場使用 expo.out：在初始加載時給予極快浮現的動態感，並有長尾平移，創造奢華與質感，非常適合 "COLLECT" 這樣大字的品牌名稱。
- UI卡片入場使用 power3.out：快入慢出，能在捲動時帶來順暢而不拖沓的自然降落感。
- 微互動(Magnetic Button hover)使用 power2.out(進)與 back.out(1.7)(出)：模仿真實物理的回彈與吸力效果，讓體驗更直覺、愉悅。

2. 為何選擇這個時序:
- Stagger 間隔設為 0.05s~0.1s：這是確保使用者閱讀視線能被緊湊引導的節奏，不至於過度等待而造成煩躁感，同時又能看到「層次感」。
- Hover 動畫為 0.2~0.4s 之間：微互動需維持在人類感知的最優範圍（少於0.1s太跳躍，多於0.4s太遲鈍）。

3. 這個動畫如何強化品牌/用戶體驗:
- 使用 GSAP 的 quickTo() 自訂游標與磁吸按鈕，打破傳統矩形點擊區域的無趣感，提升互動的科技黏滯感。
- 捲動時透過 scrub: true 直接將 Header 固定、縮小，加上 backdrop-filter 的引入，不僅有效節省垂直空間，視覺焦點也自然轉移到請款內容上。此種玻璃態過渡也增加了界面的現代感。
*/
