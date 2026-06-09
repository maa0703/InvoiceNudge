'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmtUnix(ts: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(ts * 1000))
}

const inputStyle = {
  border: '1px solid #E8E8F0',
  borderRadius: 12,
  padding: '10px 14px',
  background: '#FFFFFF',
  color: '#1E1B4B',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const card = {
  background: '#FFFFFF',
  border: '1px solid #F0EEFF',
  borderRadius: 16,
  padding: 28,
  boxShadow: '0 2px 16px rgba(124,58,237,0.06)',
}

export default function SettingsPage() {
  const { data, mutate } = useSWR('/api/v1/users/me', fetcher)
  const user = data?.user

  const [displayName, setDisplayName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [hydrated, setHydrated] = useState(false)

  if (user && !hydrated) {
    setDisplayName(user.displayName ?? '')
    setReplyToEmail(user.replyToEmail ?? '')
    setHydrated(true)
  }

  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [accessUntil, setAccessUntil] = useState<number | null>(null)

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), replyToEmail: replyToEmail.trim() }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Could not save changes.'); return }
      await mutate(); toast.success('Settings saved.')
    } catch { toast.error('Something went wrong.') }
    finally { setSaving(false) }
  }

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/v1/billing/checkout', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? 'Could not start checkout.'); return }
      if (d.url) window.location.href = d.url
    } catch { toast.error('Something went wrong.') }
    finally { setUpgrading(false) }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch('/api/v1/billing/cancel', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? 'Could not cancel subscription.'); return }
      setAccessUntil(d.accessUntil); toast.success('Subscription cancellation scheduled.')
    } catch { toast.error('Something went wrong.') }
    finally { setCancelling(false) }
  }

  const isPro = user?.plan === 'PRO'

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>Settings</h1>

      {/* Profile */}
      <div style={card}>
        <p className="text-xs font-bold uppercase tracking-wide mb-5" style={{ color: '#94A3B8' }}>Profile</p>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              Display name
            </label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
              onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="replyToEmail" className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              Reply-to email
            </label>
            <input
              id="replyToEmail"
              type="email"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
              onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }}
            />
            <p className="text-xs" style={{ color: '#94A3B8' }}>Clients will reply to this address.</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !user}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Plan */}
      <div style={card}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Plan</p>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={isPro ? { background: '#F3F0FF', color: '#7C3AED' } : { background: '#F1F5F9', color: '#64748B' }}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        {!isPro && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#64748B' }}>
              Upgrade to Pro for unlimited active invoices and priority email delivery.
            </p>
            <button
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? 'Redirecting…' : 'Upgrade to Pro'}
            </button>
          </div>
        )}

        {isPro && (
          <div>
            {accessUntil ? (
              <p className="text-sm" style={{ color: '#64748B' }}>
                Your Pro access continues until{' '}
                <span className="font-semibold" style={{ color: '#1E1B4B' }}>{fmtUnix(accessUntil)}</span>.
              </p>
            ) : (
              <button
                className="text-sm hover:underline disabled:opacity-50"
                style={{ color: '#64748B' }}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
