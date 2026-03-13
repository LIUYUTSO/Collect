'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatCAD, formatDate } from '@/lib/utils'

type Request = {
  id: string; slug: string; title: string; amount: number
  note?: string; method: string; status: string; fromName?: string
  paidAt?: string; createdAt: string
}
type Payee = { id: string; name: string }
type View = 'login' | 'list' | 'create' | 'contacts'
type Recipient = { payeeId: string; amount: string }

// ─── Styles ────────────────────────────────────────────────────────────────
const washi = '#F2EDE4'
const sumi = '#1A1714'
const ash = '#8C8880'
const fog = '#D4CFC8'
const rust = '#8B4A3C'
const moss = '#4A5240'

const capsule: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  borderRadius: 999,
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
  borderRadius: 999,
  background: sumi,
  color: washi,
  fontFamily: 'inherit',
  fontSize: 14,
  letterSpacing: '0.1em',
  border: 'none',
  cursor: 'pointer',
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
  borderRadius: 999,
  border: `1px solid ${fog}`,
  background: 'rgba(255,255,255,0.4)',
  fontFamily: 'inherit',
  fontSize: 12,
  color: sumi,
  cursor: 'pointer',
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function RequestCard({ r, onShare, onCopy, onPaid, onDelete, copied, paid }: any) {
  return (
    <div style={{ padding: '16px 20px', border: `1px solid ${fog}`, borderRadius: 16, background: paid ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)', opacity: paid ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          {r.fromName && <p style={{ fontSize: 15, fontWeight: 600, color: sumi, marginBottom: 2 }}>{r.fromName}</p>}
          <p style={{ fontSize: 13, color: ash }}>{r.title}</p>
          <p style={{ fontSize: 11, color: fog, marginTop: 4 }}>{formatDate(r.createdAt)} · {r.method?.toUpperCase?.()}</p>
        </div>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: paid ? ash : rust, fontWeight: 300, flexShrink: 0, marginLeft: 12 }}>{formatCAD(r.amount)}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => onCopy(r.slug)} style={{ ...pill, fontSize: 11 }}>{copied === r.slug ? '✓ 已複製' : '複製'}</button>
        <a href={`/request/${r.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...pill, fontSize: 11, textDecoration: 'none' }}>預覽</a>
        <button onClick={() => onShare(r.slug, r.title, r.amount)} style={{ ...pill, fontSize: 11, background: sumi, color: washi, border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ShareIcon size={11} /> 分享
        </button>
        <button onClick={() => onPaid(r.id, r.status)} style={{ ...pill, fontSize: 11, marginLeft: 'auto' }}>
          {r.status === 'paid' ? '取消收款' : '標記已收'}
        </button>
        <button onClick={() => onDelete(r.id)} style={{ ...btnGhost, fontSize: 11, color: rust }}>刪除</button>
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
      setRequests(await res.json())
      fetchData(password)
      setView('list')
    } else setError('密碼錯誤')
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentTitle = titleRef.current?.textContent?.trim() || ''
    const currentNote = noteRef.current?.textContent?.trim() || ''
    if (!currentTitle) { setError('請填寫事由'); return }
    const isMultiple = recipients.length > 1
    const validRecipients = recipients.filter(r => r.payeeId)
    if (validRecipients.length === 0) { setError('請選擇至少一位收款人'); return }
    setCreating(true); setError('')

    let payload: any;
    if (groupRequest && isMultiple) {
      const recipientItems = validRecipients.map(r => {
        const payee = payees.find(p => p.id === r.payeeId)
        const amt = splitEqually
          ? (parseFloat(totalAmount) / validRecipients.length).toFixed(2)
          : r.amount
        return { name: payee?.name || '', amount: parseFloat(amt as string) }
      })
      const totalAmt = recipientItems.reduce((sum, item) => sum + item.amount, 0)
      payload = { title: currentTitle, amount: totalAmt, note: currentNote, method: 'all', payees: recipientItems }
    } else {
      payload = validRecipients.map(r => {
        const payee = payees.find(p => p.id === r.payeeId)
        const amt = isMultiple && splitEqually
          ? (parseFloat(totalAmount) / validRecipients.length).toFixed(2)
          : r.amount
        return { title: currentTitle, amount: amt, note: currentNote, method: 'all', fromName: payee?.name || '' }
      })
    }

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      setNewRequests(Array.isArray(data) ? data : [data])
      fetchData(adminKey)
      // Reset
      if (titleRef.current) titleRef.current.textContent = ''
      if (noteRef.current) noteRef.current.textContent = ''
      setTitle(''); setNote('')
      setRecipients([{ payeeId: '', amount: '' }])
      setSplitEqually(false); setGroupRequest(false); setTotalAmount('')
    } else setError('建立失敗')
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
    if (!confirm('確定刪除此聯絡人？')) return
    await fetch(`/api/payees/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
    setPayees(prev => prev.filter(p => p.id !== id))
  }

  const markPaid = async (id: string, current: string) => {
    const newStatus = current === 'paid' ? 'pending' : 'paid'
    await fetch(`/api/requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ status: newStatus }) })
    fetchData(adminKey)
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/requests/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
    fetchData(adminKey)
  }

  const getUrl = (slug: string) => `${window.location.origin}/request/${slug}`
  const copyLink = (slug: string) => { navigator.clipboard.writeText(getUrl(slug)); setCopied(slug); setTimeout(() => setCopied(''), 2000) }
  const shareLink = async (slug: string, title?: string, amount?: number) => {
    const url = getUrl(slug)
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title: `請款 · ${title}`, text: `請支付 ${formatCAD(amount || 0)}`, url }) } catch {}
    } else copyLink(slug)
  }

  // WebAuthn helpers
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
      if (result.success) { setAdminKey(result.token); fetchData(result.token); setView('list') } else setError('認證失敗')
    } catch { setError('不支援生物辨識或已取消') }
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
      alert('FaceID / TouchID 設定成功！')
    } catch { alert('設定失敗') }
    setCreating(false)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const paid = requests.filter(r => r.status === 'paid')
  const totalPending = pending.reduce((s, r) => s + r.amount, 0)
  const filteredPending = pending.filter(r => {
    const matchTitle = r.title.toLowerCase().includes(searchTitle.toLowerCase())
    const matchName = searchName ? (r.fromName || '') === searchName : true
    return matchTitle && matchName
  })

  const isMultiRecipient = recipients.length > 1

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  if (view === 'login') return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.3em', color: ash, marginBottom: 8 }}>管理後台</p>
        <h1 style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 32, fontWeight: 700, color: sumi, marginBottom: 48 }}>請款系統</h1>
        <form onSubmit={handleLogin} autoComplete="off">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密碼" style={{ ...capsule, marginBottom: 12 }} autoFocus />
          {error && <p style={{ fontSize: 12, color: rust, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnPrimary}>{loading ? '驗證中…' : '進入'}</button>
          <button type="button" onClick={handleWebAuthnLogin} style={{ ...btnGhost, width: '100%', marginTop: 16, textAlign: 'center' }}>使用 FaceID / TouchID 登入</button>
        </form>
      </div>
    </main>
  )

  // ─── CONTACTS ────────────────────────────────────────────────────────────
  if (view === 'contacts') return (
    <main style={{ minHeight: '100dvh', padding: '0 24px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 32 }}>
          <button onClick={() => setView('list')} style={btnGhost}>← 返回</button>
          <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.2em', color: ash }}>聯絡人管理</p>
          <div style={{ width: 48 }} />
        </div>

        <form onSubmit={handleAddContact} autoComplete="off" style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            type="text"
            value={newContactName}
            onChange={e => setNewContactName(e.target.value)}
            placeholder="輸入姓名"
            autoComplete="off"
            style={{ ...capsule, flex: 1 }}
          />
          <button type="submit" disabled={savingContact || !newContactName.trim()} style={{ ...btnPrimary, width: 'auto', padding: '14px 24px', flexShrink: 0 }}>
            {savingContact ? '…' : '+ 新增'}
          </button>
        </form>

        {payees.length === 0 ? (
          <p style={{ fontSize: 13, color: fog, textAlign: 'center', paddingTop: 32 }}>尚無聯絡人，請新增</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payees.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: `1px solid ${fog}`, borderRadius: 16, background: 'rgba(255,255,255,0.4)' }}>
                <p style={{ fontSize: 15, color: sumi }}>{p.name}</p>
                <button onClick={() => handleDeleteContact(p.id)} style={{ ...btnGhost, color: rust, fontSize: 12 }}>刪除</button>
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
          <button onClick={() => { setView('list'); setNewRequests([]) }} style={btnGhost}>← 返回</button>
          <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.2em', color: ash }}>新增請款</p>
          <div style={{ width: 48 }} />
        </div>

        {newRequests.length > 0 ? (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: moss, marginBottom: 20 }}>請款連結已建立 ✓</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {newRequests.map((req, idx) => (
                <div key={idx} style={{ padding: '16px 20px', border: `1px solid ${fog}`, borderRadius: 16, background: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                    <div>
                      {req.fromName && <p style={{ fontSize: 15, fontWeight: 600, color: sumi }}>{req.fromName}</p>}
                      <p style={{ fontSize: 13, color: ash }}>{req.title}</p>
                    </div>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: moss }}>{formatCAD(Number(req.amount))}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => copyLink(req.slug)} style={pill}>{copied === req.slug ? '✓ 已複製' : '複製'}</button>
                    <a href={`/request/${req.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...pill, textDecoration: 'none' }}>預覽</a>
                    <button onClick={() => shareLink(req.slug, req.title, req.amount)} style={{ ...pill, background: sumi, color: washi, border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShareIcon size={11} /> 分享
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setNewRequests([])} style={{ ...btnPrimary, marginTop: 28 }}>再新增一筆</button>
          </div>
        ) : (
          <form onSubmit={handleCreate} autoComplete="off">
            {/* Section: 事由 */}
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>事由</p>
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="聚餐費用、電影票…"
              onInput={e => setTitle((e.target as HTMLElement).textContent || '')}
              style={capsuleDiv}
            />

            <div style={{ height: 16 }} />

            {/* Section: 備註 */}
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>備註（選填）</p>
            <div
              ref={noteRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="補充說明…"
              onInput={e => setNote((e.target as HTMLElement).textContent || '')}
              style={{ ...capsuleDiv, borderRadius: 20, minHeight: 80 }}
            />

            <div style={{ height: 24 }} />

            {/* Section: 收款人 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash }}>收款人</p>
              {isMultiRecipient && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ash, cursor: 'pointer' }}>
                    <input type="checkbox" checked={groupRequest} onChange={e => setGroupRequest(e.target.checked)} />
                    整合為一個連結
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ash, cursor: 'pointer' }}>
                    <input type="checkbox" checked={splitEqually} onChange={e => setSplitEqually(e.target.checked)} />
                    平均分配
                  </label>
                </div>
              )}
            </div>

            {payees.length === 0 ? (
              <div style={{ padding: '20px', border: `1.5px dashed ${fog}`, borderRadius: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: ash, marginBottom: 12 }}>尚無聯絡人可選擇</p>
                <button type="button" onClick={() => setView('contacts')} style={{ ...pill, background: sumi, color: washi, border: 'none', padding: '8px 20px' }}>
                  → 前往新增聯絡人
                </button>
              </div>
            ) : (
              <>
                {isMultiRecipient && splitEqually && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10, letterSpacing: '0.2em', color: ash, marginBottom: 8 }}>總金額（CAD）</p>
                    <input
                      type="number" step="0.01" min="0.01"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      placeholder="0.00"
                      style={{ ...capsule, fontFamily: 'DM Mono, monospace', fontSize: 22 }}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recipients.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <select
                        value={r.payeeId}
                        onChange={e => {
                          const next = [...recipients]
                          next[i] = { ...next[i], payeeId: e.target.value }
                          setRecipients(next)
                        }}
                        style={{ ...capsule, flex: 1, color: r.payeeId ? sumi : ash }}
                        required
                      >
                        <option value="">選擇聯絡人</option>
                        {payees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>

                      {!(isMultiRecipient && splitEqually) && (
                        <input
                          type="number" step="0.01" min="0.01"
                          value={r.amount}
                          onChange={e => {
                            const next = [...recipients]
                            next[i] = { ...next[i], amount: e.target.value }
                            setRecipients(next)
                          }}
                          placeholder="金額"
                          style={{ ...capsule, width: 100, fontFamily: 'DM Mono, monospace', fontSize: 14 }}
                          required
                        />
                      )}

                      {recipients.length > 1 && (
                        <button type="button" onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))} style={{ ...btnGhost, color: rust, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setRecipients([...recipients, { payeeId: '', amount: '' }])}
                  style={{ ...btnGhost, color: moss, marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  + 新增人數
                </button>
              </>
            )}

            {error && <p style={{ fontSize: 12, color: rust, marginTop: 16 }}>{error}</p>}

            <button type="submit" disabled={creating || payees.length === 0} style={{ ...btnPrimary, marginTop: 32, opacity: payees.length === 0 ? 0.4 : 1 }}>
              {creating ? '建立中…' : '建立請款連結'}
            </button>
          </form>
        )}

        <div style={{ height: 60 }} />
      </div>
    </main>
  )

  // ─── LIST ────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', padding: '0 24px', background: washi }}>
      <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ paddingTop: 56, paddingBottom: 8 }}>
          <div className="brush-line" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 24 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 11, letterSpacing: '0.25em', color: ash, marginBottom: 4 }}>管理後台</p>
            <h1 style={{ fontFamily: 'var(--font-zen,serif)', fontSize: 26, fontWeight: 700, color: sumi }}>請款紀錄</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setView('contacts')} style={{ ...pill, fontSize: 12 }}>👥 聯絡人</button>
            <button onClick={handleRegisterPasskey} style={{ ...pill, fontSize: 12 }}>🔒 FaceID</button>
            <button onClick={() => setView('create')} style={{ ...pill, background: sumi, color: washi, border: 'none', padding: '8px 16px' }}>+ 新增</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            value={searchTitle}
            onChange={e => setSearchTitle(e.target.value)}
            placeholder="搜尋事由…"
            style={{ ...capsule, flex: 1, padding: '10px 16px', fontSize: 13 }}
          />
          <select
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ ...capsule, flex: 1, padding: '10px 16px', fontSize: 13, color: searchName ? sumi : ash }}
          >
            <option value="">全部朋友</option>
            {payees.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        {/* Summary */}
        {pending.length > 0 && (
          <div style={{ padding: '20px 24px', border: `1px solid ${fog}`, borderRadius: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.3)' }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', color: ash, marginBottom: 4 }}>待收款</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, color: rust, fontWeight: 300 }}>{formatCAD(totalPending)}</p>
            </div>
            <p style={{ fontSize: 12, color: ash }}>{pending.length} 筆</p>
          </div>
        )}

        {/* Pending */}
        {filteredPending.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: ash, marginBottom: 14 }}>待收 · PENDING ({filteredPending.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredPending.map(r => <RequestCard key={r.id} r={r} onShare={shareLink} onCopy={copyLink} onPaid={markPaid} onDelete={deleteRequest} copied={copied} />)}
            </div>
          </section>
        )}

        {/* Paid */}
        {paid.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: ash, marginBottom: 14 }}>已收 · RECEIVED</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paid.map(r => <RequestCard key={r.id} r={r} onShare={shareLink} onCopy={copyLink} onPaid={markPaid} onDelete={deleteRequest} copied={copied} paid />)}
            </div>
          </section>
        )}

        {!loading && requests.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 64 }}>
            <p style={{ fontSize: 13, color: fog, letterSpacing: '0.1em' }}>尚無請款紀錄</p>
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>
    </main>
  )
}
