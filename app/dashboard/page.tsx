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

type View = 'login' | 'list' | 'create'

export default function Dashboard() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  // Create form state
  const [form, setForm] = useState({
    title: '',
    amount: '',
    note: '',
    method: 'td',
    fromName: '',
  })
  const [creating, setCreating] = useState(false)
  const [newSlug, setNewSlug] = useState('')

  const fetchRequests = useCallback(async (key: string) => {
    setLoading(true)
    const res = await fetch('/api/requests', {
      headers: { 'x-admin-key': key },
    })
    if (res.ok) {
      const data = await res.json()
      setRequests(data)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setNewSlug(data.slug)
      fetchRequests(adminKey)
      setForm({ title: '', amount: '', note: '', method: 'td', fromName: '' })
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

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/request/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(''), 2000)
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const paid = requests.filter((r) => r.status === 'paid')
  const totalPending = pending.reduce((s, r) => s + r.amount, 0)

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
            <button onClick={() => { setView('list'); setNewSlug('') }} style={ghostBtn}>← 返回</button>
            <p style={{ fontFamily: 'var(--font-zen, serif)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--ash)' }}>新增請款</p>
            <div style={{ width: 48 }} />
          </div>

          {/* Success state */}
          {newSlug ? (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ padding: '28px 24px', border: '1px solid rgba(74,82,64,0.3)', borderRadius: 3, background: 'rgba(74,82,64,0.05)', marginBottom: 24 }}>
                <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--moss)', marginBottom: 12 }}>請款連結已建立 ✓</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--sumi)', wordBreak: 'break-all', marginBottom: 16 }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/request/${newSlug}` : `/request/${newSlug}`}
                </p>
                <button onClick={() => copyLink(newSlug)} style={{ ...btnStyle, width: '100%' }}>
                  {copied === newSlug ? '已複製 ✓' : '複製連結'}
                </button>
              </div>
              <button onClick={() => setNewSlug('')} style={{ ...ghostBtn, width: '100%', textAlign: 'center' }}>
                再新增一筆
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              <FieldLabel>事由</FieldLabel>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="聚餐費用、電影票…" style={inputStyle} required />

              <FieldLabel style={{ marginTop: 20 }}>金額（CAD）</FieldLabel>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={{ ...inputStyle, fontFamily: 'DM Mono, monospace', fontSize: 22 }} required />

              <FieldLabel style={{ marginTop: 20 }}>給誰（選填）</FieldLabel>
              <input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="朋友名字" style={inputStyle} />

              <FieldLabel style={{ marginTop: 20 }}>備註（選填）</FieldLabel>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="補充說明…" rows={3} style={{ ...inputStyle, resize: 'none' }} />

              <FieldLabel style={{ marginTop: 20 }}>收款方式</FieldLabel>
              <div style={{ display: 'flex', gap: 10 }}>
                {['td', 'wealthsimple'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, method: m })}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      border: `1px solid ${form.method === m ? 'var(--sumi)' : 'var(--fog)'}`,
                      borderRadius: 3,
                      background: form.method === m ? 'var(--sumi)' : 'transparent',
                      color: form.method === m ? 'var(--washi)' : 'var(--ash)',
                      fontSize: 12,
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {m === 'td' ? 'TD' : 'WealthSimple'}
                  </button>
                ))}
              </div>

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
          <button onClick={() => setView('create')} style={btnStyle}>+ 新增</button>
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
        {pending.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--ash)', marginBottom: 14 }}>待收 · PENDING</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map((r) => (
                <RequestCard key={r.id} r={r} onCopy={copyLink} onPaid={markPaid} onDelete={deleteRequest} copied={copied} />
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
                <RequestCard key={r.id} r={r} onCopy={copyLink} onPaid={markPaid} onDelete={deleteRequest} copied={copied} paid />
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
  r, onCopy, onPaid, onDelete, copied, paid = false,
}: {
  r: Request
  onCopy: (slug: string) => void
  onPaid: (id: string, status: string) => void
  onDelete: (id: string) => void
  copied: string
  paid?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

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
          <p style={{ fontSize: 14, color: 'var(--sumi)', fontWeight: 400, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.title}
          </p>
          {r.fromName && <p style={{ fontSize: 11, color: 'var(--ash)' }}>給 {r.fromName}</p>}
        </div>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: paid ? 'var(--moss)' : 'var(--sumi)', marginLeft: 12, whiteSpace: 'nowrap' }}>
          {formatCAD(r.amount)}
        </p>
      </div>

      <p style={{ fontSize: 11, color: 'var(--ash)', marginTop: 6 }}>
        {formatDate(r.createdAt)} · {r.method === 'td' ? 'TD' : 'WS'}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={() => onCopy(r.slug)} style={smallBtn}>
          {copied === r.slug ? '✓ 已複製' : '複製連結'}
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
