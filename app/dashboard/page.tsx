'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatCAD, formatDate } from '@/lib/utils'

type Request = {
  id: string; slug: string; title: string; amount: number
  note?: string; method: string; status: string; fromName?: string
  paidAt?: string; createdAt: string; payees?: any[]
}
type Payee = { id: string; name: string }
type View = 'login' | 'list' | 'create' | 'contacts'
type Recipient = { payeeId: string; amount: string }

// ─── Styles ────────────────────────────────────────────────────────────────
const washi = '#F2EDE4'
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

// ─── Sub-components ─────────────────────────────────────────────────────────
function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function PreviewIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

function ContactIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function RequestCard({ r, onShare, onPayeePaid, onDelete, onEdit, paid }: any) {
  const payeeList = r.payees || (r.fromName ? [{ name: r.fromName, amount: r.amount, paid: r.status === 'paid' }] : [])
  
  return (
    <div style={{ padding: '20px', border: `1.5px solid ${fog}`, borderRadius: 12, background: paid ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)', opacity: paid ? 0.75 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ overflow: 'hidden', flex: 1, paddingRight: 12 }}>
          <p style={{ fontSize: 13, color: ash, marginBottom: 2, fontWeight: 500 }} className="no-wrap">{r.title}</p>
          <p style={{ fontSize: 11, color: ash, opacity: 0.9 }}>{formatDate(r.createdAt)} · {r.method?.toUpperCase?.()}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onShare(r.slug, r.title, r.amount)} style={{ ...pill, padding: '7px', background: sumi, color: washi, border: 'none' }}>
            <ShareIcon size={13} />
          </button>
          <a href={`/request/${r.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...pill, padding: '7px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <PreviewIcon size={13} />
          </a>
          <button onClick={() => onEdit(r)} style={{ ...pill, padding: '7px' }}>
            <EditIcon size={13} />
          </button>
          <button onClick={() => onDelete(r.id)} style={{ ...pill, padding: '7px', background: rust, color: washi, border: 'none' }}>
            <TrashIcon size={13} />
          </button>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${fog}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {payeeList.map((p: any, idx: number) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: sumi }} className="no-wrap">{p.name}</p>
              <p style={{ fontSize: 12, color: ash, fontFamily: 'DM Mono, monospace', opacity: 0.8 }}>{formatCAD(p.amount)}</p>
            </div>
            <button 
              onClick={() => onPayeePaid(r, idx)} 
              style={{
                padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
                border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: p.paid ? moss : 'rgba(139, 74, 60, 0.1)',
                color: p.paid ? 'white' : rust,
                transition: 'all 0.2s',
                letterSpacing: '0.05em'
              }}
            >
              {p.paid ? 'PAID 💰' : 'UNPAID'}
            </button>
          </div>
        ))}
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

  // New create form state
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([{ payeeId: '', amount: '' }])
  const [splitEqually, setSplitEqually] = useState(false)
  const [groupRequest, setGroupRequest] = useState(false)
  const [totalAmount, setTotalAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const [newRequests, setNewRequests] = useState<any[]>([])
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)

  // New fields
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [locationResults, setLocationResults] = useState<any[]>([])
  const [searchingLocation, setSearchingLocation] = useState(false)

  // Contacts management
  const [newContactName, setNewContactName] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  const titleRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)

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
    if (query.length < 2) { setLocationResults([]); return }
    setSearchingLocation(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      const data = await res.json()
      setLocationResults(data)
    } catch (e) { console.error('OSM error', e) }
    setSearchingLocation(false)
  }

  const handleEdit = (r: any) => {
    setEditingRequest(r)
    setView('create')
    setNewRequests([])
  }

  useEffect(() => {
    if (editingRequest && view === 'create') {
      if (titleRef.current) titleRef.current.textContent = editingRequest.title
      if (noteRef.current) noteRef.current.textContent = editingRequest.note || ''
      setEventDate((editingRequest as any).eventDate?.split('T')[0] || '')
      setLocation((editingRequest as any).location || '')
      
      const isGroup = !!editingRequest.payees
      setGroupRequest(isGroup)
      if (isGroup) {
        setRecipients(editingRequest.payees!.map((p: any) => {
            const payee = payees.find(contact => contact.name === p.name)
            return { payeeId: payee?.id || '', amount: p.amount.toString() }
        }))
        setTotalAmount(editingRequest.amount.toString())
      } else {
        const payee = payees.find(p => p.name === editingRequest.fromName)
        setRecipients([{ payeeId: payee?.id || '', amount: editingRequest.amount.toString() }])
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
      location: location || null 
    }

    let payload: any;
    if (groupRequest && validRecipients.length > 1) {
      const recipientItems = validRecipients.map(r => {
        const payee = payees.find(p => p.id === r.payeeId)
        const amt = splitEqually
          ? (parseFloat(totalAmount) / validRecipients.length).toFixed(2)
          : r.amount
        return { name: payee?.name || '', amount: parseFloat(amt as string), paid: false }
      })
      const totalAmt = recipientItems.reduce((sum, item) => sum + item.amount, 0)
      payload = { ...commonFields, amount: totalAmt, payees: recipientItems }
    } else {
      payload = validRecipients.map(r => {
        const payee = payees.find(p => p.id === r.payeeId)
        const amt = validRecipients.length > 1 && splitEqually
          ? (parseFloat(totalAmount) / validRecipients.length).toFixed(2)
          : r.amount
        return { ...commonFields, amount: parseFloat(amt as string), fromName: payee?.name || '' }
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
        setRecipients([{ payeeId: '', amount: '' }])
        setSplitEqually(false); setGroupRequest(false); setTotalAmount('')
        setEventDate(''); setLocation('')
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

  const onPayeePaid = async (r: any, index: number) => {
    const payeesList = r.payees || (r.fromName ? [{ name: r.fromName, amount: r.amount, paid: r.status === 'paid' }] : [])
    const updatedPayees = [...payeesList]
    updatedPayees[index].paid = !updatedPayees[index].paid
    
    // Determine overall status
    const allPaid = updatedPayees.every((p: any) => p.paid)
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

  const getUrl = (slug: string) => `${window.location.origin}/request/${slug}`
  const copyLink = (slug: string) => { navigator.clipboard.writeText(getUrl(slug)); setCopied(slug); setTimeout(() => setCopied(''), 2000) }
  const shareLink = async (slug: string, title?: string, amount?: number) => {
    const url = getUrl(slug)
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title: `Collect · ${title}`, text: `Payment Request: ${formatCAD(amount || 0)}`, url }) } catch {}
    } else copyLink(slug)
  }

  // WebAuthn
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

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const paidRequests = requests.filter(r => r.status === 'paid')
  const totalPending = pendingRequests.reduce((s, r) => s + r.amount, 0)
  const filteredPending = pendingRequests.filter(r => {
    const matchTitle = r.title.toLowerCase().includes(searchTitle.toLowerCase())
    const matchName = searchName ? (r.fromName || '').includes(searchName) : true
    return matchTitle && matchName
  })

  const isMultiRecipient = recipients.length > 1

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  if (view === 'login') return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.3em', color: ash, marginBottom: 8 }}>ADMIN PORTAL</p>
        <h1 style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 32, fontWeight: 700, color: sumi, marginBottom: 48 }}>COLLECT</h1>
        <form onSubmit={handleLogin} autoComplete="off">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ ...capsule, marginBottom: 12 }} autoFocus />
          {error && <p style={{ fontSize: 12, color: rust, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Verifying…' : 'Sign In'}</button>
          <button type="button" onClick={handleWebAuthnLogin} style={{ ...btnGhost, width: '100%', marginTop: 16, textAlign: 'center' }}>Login with FaceID / TouchID</button>
        </form>
      </div>
    </main>
  )

  // ─── CONTACTS ────────────────────────────────────────────────────────────
  if (view === 'contacts') return (
    <main style={{ minHeight: '100dvh', padding: '0 24px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 32 }}>
          <button onClick={() => setView('list')} style={btnGhost}>← BACK</button>
          <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.2em', color: ash }}>CONTACTS</p>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 32 }}>
          <button onClick={() => { setView('list'); setNewRequests([]); setEditingRequest(null) }} style={btnGhost}>← BACK</button>
          <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.2em', color: ash }}>{editingRequest ? 'EDIT REQUEST' : 'NEW REQUEST'}</p>
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

            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>NOTE (OPTIONAL)</p>
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
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <select value={r.payeeId} onChange={e => { const next = [...recipients]; next[i] = { ...next[i], payeeId: e.target.value }; setRecipients(next) }} style={{ ...capsule, flex: 1, color: r.payeeId ? sumi : ash }} required>
                        <option value="">Select Contact</option>
                        {payees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {!(isMultiRecipient && splitEqually) && (
                        <input type="number" step="0.01" min="0.01" value={r.amount} onChange={e => { const next = [...recipients]; next[i] = { ...next[i], amount: e.target.value }; setRecipients(next) }} placeholder="Amt" style={{ ...capsule, width: 80, fontFamily: 'DM Mono, monospace', fontSize: 14 }} required />
                      )}
                      {recipients.length > 1 && <button type="button" onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))} style={{ ...btnGhost, color: rust, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✕</button>}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setRecipients([...recipients, { payeeId: '', amount: '' }])} style={{ ...btnGhost, color: moss, marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>+ ADD RECIPIENT</button>
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
  return (
    <main style={{ minHeight: '100dvh', padding: '0 20px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
        <div style={{ paddingTop: 56, paddingBottom: 8 }}><div className="brush-line" /></div>
        
        <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 10, letterSpacing: '0.3em', color: ash, fontWeight: 600 }}>ADMIN PORTAL</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setView('create')} style={{ ...pill, background: sumi, color: washi, border: 'none', padding: '8px 14px', fontSize: 11, fontWeight: 700 }}>+ NEW</button>
              <button onClick={() => setView('contacts')} style={{ ...pill, fontSize: 11, color: sumi, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <ContactIcon size={12} /> Contacts
              </button>
              <button onClick={handleRegisterPasskey} style={{ ...pill, fontSize: 11, color: sumi, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <LockIcon size={11} /> FaceID
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1.2 }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ash, opacity: 0.7 }}>
                <PreviewIcon size={14} />
              </div>
              <input 
                value={searchTitle} 
                onChange={e => setSearchTitle(e.target.value)} 
                placeholder="Search..." 
                style={{ ...capsule, paddingLeft: 38, fontSize: 13, height: 46, fontWeight: 500 }} 
              />
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
               <select 
                value={searchName} 
                onChange={e => setSearchName(e.target.value)} 
                style={{ ...capsule, fontSize: 13, height: 46, color: sumi, fontWeight: 500 }}
              >
                <option value="">All Contacts</option>
                {payees.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div style={{ padding: '20px', border: `1.5px solid ${fog}`, borderRadius: 12, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.3)', height: 72 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.15em', color: ash, marginBottom: 4, fontWeight: 600 }}>PENDING TOTAL</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, color: rust, fontWeight: 400 }}>{formatCAD(totalPending)}</p>
            </div>
            <p style={{ fontSize: 11, color: ash, fontWeight: 600 }}>{pendingRequests.length} items</p>
          </div>
        )}

        {filteredPending.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 14, fontWeight: 700 }}>PENDING ({filteredPending.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPending.map(r => <RequestCard key={r.id} r={r} onShare={shareLink} onDelete={deleteRequest} onEdit={handleEdit} onPayeePaid={onPayeePaid} />)}
            </div>
          </section>
        )}

        {paidRequests.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: ash, marginBottom: 14 }}>RECEIVED</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paidRequests.map(r => <RequestCard key={r.id} r={r} onShare={shareLink} onDelete={deleteRequest} onEdit={handleEdit} onPayeePaid={onPayeePaid} paid />)}
            </div>
          </section>
        )}

        {!loading && requests.length === 0 && <div style={{ textAlign: 'center', paddingTop: 64 }}><p style={{ fontSize: 13, color: fog, letterSpacing: '0.1em' }}>No records found.</p></div>}
        <div style={{ height: 60 }} />
      </div>
    </main>
  )
}
