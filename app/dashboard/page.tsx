'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCAD, formatDate } from '@/lib/utils'

type Request = {
  id: string
  slug: string
  title: string
  amount: number
  note?: string
  method: string
  status: string
  fromName?: string
  paidAt?: string
  createdAt: string
}

type Payee = {
  id: string
  name: string
}

type View = 'login' | 'list' | 'create'

export default function Dashboard() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [payees, setPayees] = useState<Payee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  
  // Search states
  const [searchTitle, setSearchTitle] = useState('')
  const [searchName, setSearchName] = useState('')

  // Create form state
  const [mode, setMode] = useState<'single' | 'split'>('single')
  const [totalAmount, setTotalAmount] = useState('')
  const [splitEqually, setSplitEqually] = useState(true)
  const [recipients, setRecipients] = useState([{ name: '', amount: '' }])
  
  const [form, setForm] = useState({
    title: '',
    amount: '',
    note: '',
    method: 'td',
    fromName: '',
  })
  
  // Manage explicit selected payee vs typed payee
  const [selectedPayeeId, setSelectedPayeeId] = useState<string>('')
  
  const [creating, setCreating] = useState(false)
  const [newRequests, setNewRequests] = useState<any[]>([])

  const fetchRequests = useCallback(async (key: string) => {
    setLoading(true)
    const [reqRes, payeeRes] = await Promise.all([
      fetch('/api/requests', { headers: { 'x-admin-key': key } }),
      fetch('/api/payees', { headers: { 'x-admin-key': key } })
    ])
    
    if (reqRes.ok) {
      const data = await reqRes.json()
      setRequests(data)
    }
    if (payeeRes.ok) {
      const data = await payeeRes.json()
      setPayees(data)
    }
    setLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/requests', {
      headers: { 'x-admin-key': password },
    })
    if (res.ok) {
      setAdminKey(password)
      const data = await res.json()
      setRequests(data)
      setView('list')
    } else {
      setError('密碼錯誤')
    }
    setLoading(false)
  }

  const addRecipient = () => setRecipients([...recipients, { name: '', amount: '' }])
  const removeRecipient = (i: number) => setRecipients(recipients.filter((_, idx) => idx !== i))
  const updateRecipient = (i: number, field: string, val: string) => {
    const next = [...recipients]
    next[i] = { ...next[i], [field]: val }
    setRecipients(next)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    let payload: any = []
    
    // Determine the actual fromName
    let finalFromName = form.fromName
    if (selectedPayeeId) {
      const p = payees.find(p => p.id === selectedPayeeId)
      if (p) finalFromName = p.name
    }

    if (mode === 'single') {
      payload = [{ ...form, fromName: finalFromName }]
    } else {
      payload = recipients.map(r => ({
        title: form.title,
        amount: splitEqually ? (parseFloat(totalAmount) / recipients.length).toFixed(2) : r.amount,
        note: form.note,
        method: form.method,
        fromName: r.name
      }))
    }

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      setNewRequests(Array.isArray(data) ? data : [data])
      fetchRequests(adminKey)
      setForm({ title: '', amount: '', note: '', method: 'td', fromName: '' })
      setSelectedPayeeId('')
      setRecipients([{ name: '', amount: '' }])
      setTotalAmount('')
    } else {
      setError('建立失敗')
    }
    setCreating(false)
  }

  const markPaid = async (id: string, current: string) => {
    const newStatus = current === 'paid' ? 'pending' : 'paid'
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchRequests(adminKey)
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/requests/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    })
    fetchRequests(adminKey)
  }

  const getUrl = (slug: string) => `${window.location.origin}/request/${slug}`

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(getUrl(slug))
    setCopied(slug)
    setTimeout(() => setCopied(''), 2000)
  }

  const shareLink = async (slug: string, title?: string, amount?: number) => {
    const url = getUrl(slug)
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `請款 · ${title}`,
          text: `請支付 ${formatCAD(amount || 0)} 給我，謝謝！`,
          url: url,
        })
      } catch (err) {
        console.error('Share failed', err)
      }
    } else {
      copyLink(slug)
    }
  }

  const handleSavePayee = async (name: string) => {
    if (!name) return
    const res = await fetch('/api/payees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const data = await res.json()
      setPayees(prev => {
        if (prev.find(p => p.id === data.id)) return prev
        return [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const paid = requests.filter((r) => r.status === 'paid')
  const totalPending = pending.reduce((s, r) => s + r.amount, 0)

  const filteredPending = pending.filter(r => {
    const matchTitle = r.title.toLowerCase().includes(searchTitle.toLowerCase())
    const matchName = (r.fromName || '').toLowerCase().includes(searchName.toLowerCase())
    return matchTitle && matchName
  })

  const toBase64Url = (buf: ArrayBuffer) => {
    return btoa(Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  const fromBase64Url = (str: string) => {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(base64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    return buf.buffer
  }

  const handleWebAuthnLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const optsRes = await fetch('/api/auth/webauthn', {
        method: 'POST',
        body: JSON.stringify({ action: 'login-options' }),
      })
      const options = await optsRes.json()
      
      options.challenge = fromBase64Url(options.challenge)
      options.allowCredentials = options.allowCredentials.map((c: any) => ({
        ...c,
        id: fromBase64Url(c.id),
      }))

      const assertion = await navigator.credentials.get({ publicKey: options }) as any
      
      const verifyRes = await fetch('/api/auth/webauthn', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login-verify',
          data: {
            id: assertion.id,
            rawId: toBase64Url(assertion.rawId),
            response: {
              authenticatorData: toBase64Url(assertion.response.authenticatorData),
              clientDataJSON: toBase64Url(assertion.response.clientDataJSON),
              signature: toBase64Url(assertion.response.signature),
              userHandle: assertion.response.userHandle ? toBase64Url(assertion.response.userHandle) : null,
            },
          },
        }),
      })

      const result = await verifyRes.json()
      if (result.success) {
        setAdminKey(result.token)
        fetchRequests(result.token)
        setView('list')
      } else {
        setError('認證失敗')
      }
    } catch (err: any) {
      console.error(err)
      setError('不支援生物辨識或已取消')
    }
    setLoading(false)
  }

  const handleRegisterPasskey = async () => {
    setCreating(true)
    try {
      const optsRes = await fetch('/api/auth/webauthn', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: JSON.stringify({ action: 'register-options' }),
      })
      const options = await optsRes.json()

      options.challenge = fromBase64Url(options.challenge)
      options.user.id = fromBase64Url(options.user.id)

      const credential = await navigator.credentials.create({ publicKey: options }) as any
      
      await fetch('/api/auth/webauthn', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: JSON.stringify({
          action: 'register-verify',
          data: {
            id: credential.id,
            rawId: toBase64Url(credential.rawId),
            response: {
              attestationObject: toBase64Url(credential.response.attestationObject),
              clientDataJSON: toBase64Url(credential.response.clientDataJSON),
            },
          },
        }),
      })
      alert('FaceID / TouchID 設定成功！')
    } catch (err) {
      console.error(err)
      alert('設定失敗')
    }
    setCreating(false)
  }

  // ─── LOGIN ─────────────────────────────────────────────────────────
  if (view === 'login') {
    return (
      <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'var(--washi)' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <p style={{ fontFamily: 'var(--font-zen, serif)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--ash)', marginBottom: 8 }}>管理後台</p>
          <h1 style={{ fontFamily: 'var(--font-zen, serif)', fontSize: 32, fontWeight: 700, color: 'var(--sumi)', marginBottom: 48 }}>請款系統</h1>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密碼"
              style={inputStyle}
              autoFocus
            />
            {error && <p style={{ fontSize: 12, color: 'var(--rust)', marginTop: 8 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: 24, width: '100%' }}>
              {loading ? '驗證中…' : '進入'}
            </button>
            
            <button 
              type="button" 
              onClick={handleWebAuthnLogin} 
              style={{ ...ghostBtn, width: '100%', marginTop: 16, fontSize: 12, color: 'var(--sumi)' }}
            >
              使用 FaceID / TouchID 登入
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ─── CREATE FORM ───────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <main style={{ minHeight: '100dvh', padding: '0 24px', background: 'var(--washi)' }}>
        <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 32 }}>
            <button onClick={() => { setView('list'); setNewRequests([]) }} style={ghostBtn}>← 返回</button>
            <p style={{ fontFamily: 'var(--font-zen, serif)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--ash)' }}>新增請款</p>
            <div style={{ width: 48 }} />
          </div>

          {/* Success state */}
          {newRequests.length > 0 ? (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--moss)', marginBottom: 20 }}>請款連結已建立 ✓</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {newRequests.map((req, idx) => (
                  <div key={idx} style={{ padding: '16px 20px', border: '1px solid rgba(74,82,64,0.2)', borderRadius: 3, background: 'rgba(255,255,255,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                      <p style={{ fontSize: 13, color: 'var(--sumi)', fontWeight: 500 }}>
                        {req.fromName || '朋友'} · {req.title}
                      </p>
                      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--moss)' }}>
                        {formatCAD(Number(req.amount))}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => copyLink(req.slug)} style={smallBtn}>
                        {copied === req.slug ? '✓ 已複製' : '複製'}
                      </button>
                      <a href={`/request/${req.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...smallBtn, textDecoration: 'none' }}>
                        預覽
                      </a>
                      <button onClick={() => shareLink(req.slug, req.title, req.amount)} style={{ ...smallBtn, background: 'var(--sumi)', color: 'var(--washi)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ShareIcon size={12} /> 分享
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setNewRequests([])} style={{ ...btnStyle, width: '100%', marginTop: 32 }}>
                再新增一筆
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {['single', 'split'].map(v => (
                  <button key={v} type="button" onClick={() => setMode(v as any)} style={{ ...smallBtn, flex: 1, padding: '10px', background: mode === v ? 'var(--sumi)' : 'transparent', color: mode === v ? 'var(--washi)' : 'var(--ash)', borderColor: mode === v ? 'var(--sumi)' : 'var(--fog)' }}>
                    {v === 'single' ? '單人模式' : '多人平分'}
                  </button>
                ))}
              </div>

              <FieldLabel>事由</FieldLabel>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="聚餐費用、電影票…" style={inputStyle} required />

              {mode === 'single' ? (
                <>
                  <FieldLabel style={{ marginTop: 20 }}>金額（CAD）</FieldLabel>
                  <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={{ ...inputStyle, fontFamily: 'DM Mono, monospace', fontSize: 22 }} required />

                  <FieldLabel style={{ marginTop: 20 }}>給誰（選填 · 紀錄或新增）</FieldLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {payees.length > 0 && (
                      <select
                        value={selectedPayeeId}
                        onChange={(e) => {
                          setSelectedPayeeId(e.target.value);
                          setForm({ ...form, fromName: '' }); // Clear manual input
                        }}
                        style={{ 
                          ...inputStyle, 
                          padding: '12px 16px',
                          appearance: 'none', 
                          background: 'rgba(255,255,255,0.4) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3Axmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232C3A2E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 12px top 50%', 
                          backgroundSize: '10px auto',
                          cursor: 'pointer',
                          color: selectedPayeeId ? 'var(--sumi)' : 'var(--ash)'
                        }}
                      >
                        <option value="">-- 由紀錄帶入朋友姓名 --</option>
                        {payees.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {payees.length > 0 && <span style={{ fontSize: 13, color: 'var(--ash)', whiteSpace: 'nowrap' }}>或手動輸入：</span>}
                      <input 
                        value={form.fromName} 
                        onChange={(e) => {
                          setForm({ ...form, fromName: e.target.value });
                          setSelectedPayeeId(''); // Clear dropdown selection
                        }} 
                        placeholder={payees.length > 0 ? "新朋友名字…" : "朋友名字"} 
                        style={{ ...inputStyle, flex: 1 }} 
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      {form.fromName && !payees.find(p => p.name === form.fromName) && (
                        <button type="button" onClick={() => handleSavePayee(form.fromName)} style={{ ...smallBtn, padding: '0 16px', whiteSpace: 'nowrap' }}>
                          保存姓名
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <FieldLabel style={{ marginTop: 20 }}>總金額（CAD）</FieldLabel>
                  <input type="number" step="0.01" min="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontFamily: 'DM Mono, monospace', fontSize: 22 }} required />
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                    <FieldLabel style={{ marginBottom: 0 }}>名單</FieldLabel>
                    <label style={{ fontSize: 11, color: 'var(--ash)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={splitEqually} onChange={e => setSplitEqually(e.target.checked)} /> 平均分配
                    </label>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recipients.map((r, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 10, borderBottom: i === recipients.length - 1 ? 'none' : '1px solid var(--fog)' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                              list={`payee-list-split-${i}`}
                              value={r.name} 
                              onChange={e => updateRecipient(i, 'name', e.target.value)} 
                              placeholder="名字" 
                              style={{ ...inputStyle, padding: '10px 12px' }} 
                              required 
                              autoComplete="off" 
                              autoCorrect="off" 
                              spellCheck={false} 
                            />
                            <datalist id={`payee-list-split-${i}`}>
                              {payees.map(p => <option key={p.id} value={p.name} />)}
                            </datalist>
                          </div>
                          {!splitEqually && (
                            <input type="number" step="0.01" value={r.amount} onChange={e => updateRecipient(i, 'amount', e.target.value)} placeholder="金額" style={{ ...inputStyle, width: 80, padding: '10px 8px', fontFamily: 'DM Mono, monospace' }} required />
                          )}
                          {recipients.length > 1 && (
                            <button type="button" onClick={() => removeRecipient(i)} style={{ ...ghostBtn, color: 'var(--rust)', padding: '0 4px' }}>✕</button>
                          )}
                        </div>
                        {r.name && !payees.find(p => p.name === r.name) && (
                          <button 
                            type="button" 
                            onClick={() => handleSavePayee(r.name)} 
                            style={{ ...smallBtn, alignSelf: 'flex-start', fontSize: 10, padding: '4px 8px', background: 'rgba(74,82,64,0.1)', color: 'var(--moss)' }}
                          >
                            + 保存「{r.name}」到名單
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addRecipient} style={{ ...ghostBtn, textAlign: 'left', color: 'var(--moss)', marginTop: 4 }}>+ 增加人數</button>
                  </div>
                </>
              )}

              <FieldLabel style={{ marginTop: 24 }}>備註（選填）</FieldLabel>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="補充說明…" rows={3} style={{ ...inputStyle, resize: 'none' }} />


              {error && <p style={{ fontSize: 12, color: 'var(--rust)', marginTop: 12 }}>{error}</p>}

              <button type="submit" disabled={creating} style={{ ...btnStyle, width: '100%', marginTop: 32 }}>
                {creating ? '建立中…' : '建立請款連結'}
              </button>
            </form>
          )}

          <div style={{ height: 60 }} />
        </div>
      </main>
    )
  }

  // ─── LIST ──────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', padding: '0 24px', background: 'var(--washi)' }}>
      <div style={{ width: '100%', maxWidth: 390, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ paddingTop: 56, paddingBottom: 8 }}>
          <div className="brush-line" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 32 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-zen, serif)', fontSize: 11, letterSpacing: '0.25em', color: 'var(--ash)', marginBottom: 4 }}>管理後台</p>
            <h1 style={{ fontFamily: 'var(--font-zen, serif)', fontSize: 26, fontWeight: 700, color: 'var(--sumi)' }}>請款紀錄</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleRegisterPasskey} style={{ ...smallBtn, padding: '10px 12px' }}>🔒 設定 FaceID</button>
            <button onClick={() => setView('create')} style={btnStyle}>+ 新增</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: 'var(--ash)', marginBottom: 4 }}>篩選事由</p>
            <input 
              value={searchTitle} 
              onChange={e => setSearchTitle(e.target.value)} 
              placeholder="搜尋標題…" 
              style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: 'var(--ash)', marginBottom: 4 }}>篩選收款人</p>
            <select
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              style={{ 
                ...inputStyle, 
                padding: '8px 12px', 
                fontSize: 13, 
                appearance: 'none', 
                background: 'rgba(255,255,255,0.4) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3Axmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232C3A2E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 12px top 50%', 
                backgroundSize: '10px auto',
                cursor: 'pointer'
              }}
            >
              <option value="">全部朋友</option>
              {payees.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        {pending.length > 0 && (
          <div style={{ padding: '20px 24px', border: '1px solid var(--fog)', borderRadius: 3, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--ash)', marginBottom: 4 }}>待收款</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, color: 'var(--rust)', fontWeight: 300 }}>{formatCAD(totalPending)}</p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ash)' }}>{pending.length} 筆</p>
          </div>
        )}

        {/* Pending */}
        {filteredPending.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--ash)', marginBottom: 14 }}>待收 · PENDING ({filteredPending.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredPending.map((r) => (
                <RequestCard key={r.id} r={r} onShare={shareLink} onCopy={copyLink} onPaid={markPaid} onDelete={deleteRequest} copied={copied} />
              ))}
            </div>
          </section>
        )}

        {/* Paid */}
        {paid.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--ash)', marginBottom: 14 }}>已收 · RECEIVED</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paid.map((r) => (
                <RequestCard key={r.id} r={r} onShare={shareLink} onCopy={copyLink} onPaid={markPaid} onDelete={deleteRequest} copied={copied} paid />
              ))}
            </div>
          </section>
        )}

        {!loading && requests.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 64 }}>
            <p style={{ fontSize: 13, color: 'var(--fog)', letterSpacing: '0.1em' }}>尚無請款紀錄</p>
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>
    </main>
  )
}

// ─── Sub-components ────────────────────────────────────────────────

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--ash)', marginBottom: 8, ...style }}>
      {children}
    </p>
  )
}

function RequestCard({
  r, onShare, onCopy, onPaid, onDelete, copied, paid = false,
}: {
  r: Request
  onShare: (slug: string, title?: string, amount?: number) => void
  onCopy: (slug: string) => void
  onPaid: (id: string, status: string) => void
  onDelete: (id: string) => void
  copied: string
  paid?: boolean
}) {
  return (
    <div
      style={{
        padding: '18px 20px',
        border: `1px solid ${paid ? 'var(--fog)' : 'rgba(139,74,60,0.15)'}`,
        borderRadius: 3,
        background: paid ? 'transparent' : 'rgba(255,255,255,0.25)',
        opacity: paid ? 0.65 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, color: 'var(--sumi)', fontWeight: 500, marginBottom: 2 }}>
            {r.fromName || '未命名'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--ash)' }}>{r.title}</p>
        </div>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: paid ? 'var(--moss)' : 'var(--sumi)', marginLeft: 12, whiteSpace: 'nowrap' }}>
          {formatCAD(r.amount)}
        </p>
      </div>

      <p style={{ fontSize: 10, color: 'var(--fog)', marginTop: 6, letterSpacing: '0.05em' }}>
        {formatDate(r.createdAt)} · {r.method === 'td' ? 'TD' : 'WS'}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={() => onCopy(r.slug)} style={smallBtn}>
          {copied === r.slug ? '✓ 已複製' : '複製'}
        </button>
        <a 
          href={`/request/${r.slug}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ ...smallBtn, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          預覽
        </a>
        <button onClick={() => onShare(r.slug, r.title, r.amount)} style={{ ...smallBtn, background: paid ? 'transparent' : 'var(--sumi)', color: paid ? 'var(--sumi)' : 'var(--washi)', display: 'flex', alignItems: 'center', gap: 6, border: paid ? '1px solid var(--fog)' : 'none' }}>
          <ShareIcon size={12} /> 分享
        </button>
        <button
          onClick={() => onPaid(r.id, r.status)}
          style={{ ...smallBtn, background: paid ? 'transparent' : 'rgba(74,82,64,0.1)', color: paid ? 'var(--ash)' : 'var(--moss)', borderColor: paid ? 'var(--fog)' : 'rgba(74,82,64,0.2)' }}
        >
          {paid ? '取消已收' : '標記已收'}
        </button>
        <button onClick={() => onDelete(r.id)} style={{ ...smallBtn, color: 'var(--rust)', borderColor: 'transparent', background: 'transparent', marginLeft: 'auto' }}>
          刪除
        </button>
      </div>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '1px solid var(--fog)',
  borderRadius: 3,
  background: 'rgba(255,255,255,0.4)',
  color: 'var(--sumi)',
  fontSize: 15,
  outline: 'none',
  letterSpacing: '0.02em',
  transition: 'border-color 0.2s',
}

const btnStyle: React.CSSProperties = {
  padding: '12px 24px',
  background: 'var(--sumi)',
  color: 'var(--washi)',
  border: 'none',
  borderRadius: 3,
  fontSize: 13,
  letterSpacing: '0.1em',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 0',
  background: 'transparent',
  border: 'none',
  color: 'var(--ash)',
  fontSize: 13,
  cursor: 'pointer',
  letterSpacing: '0.05em',
}

const smallBtn: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--fog)',
  borderRadius: 2,
  background: 'transparent',
  color: 'var(--sumi)',
  fontSize: 11,
  letterSpacing: '0.08em',
  cursor: 'pointer',
}

const smallTag: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid var(--fog)',
  borderRadius: 2,
  fontSize: 10,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
      <polyline points="16 6 12 2 8 6"></polyline>
      <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
  )
}
