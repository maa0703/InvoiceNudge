'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmtUnix(ts: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

export default function SettingsPage() {
  const { data, mutate } = useSWR('/api/v1/users/me', fetcher)
  const user = data?.user

  const [displayName, setDisplayName] = useState<string>('')
  const [replyToEmail, setReplyToEmail] = useState<string>('')
  const [hydrated, setHydrated] = useState(false)

  // Populate form once user data arrives
  if (user && !hydrated) {
    setDisplayName(user.displayName ?? '')
    setReplyToEmail(user.replyToEmail ?? '')
    setHydrated(true)
  }

  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [accessUntil, setAccessUntil] = useState<number | null>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), replyToEmail: replyToEmail.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Could not save changes.')
        return
      }
      await mutate()
      toast.success('Settings saved.')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/v1/billing/checkout', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error ?? 'Could not start checkout.')
        return
      }
      if (d.url) window.location.href = d.url
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setUpgrading(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch('/api/v1/billing/cancel', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error ?? 'Could not cancel subscription.')
        return
      }
      setAccessUntil(d.accessUntil)
      toast.success('Subscription cancellation scheduled.')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setCancelling(false)
    }
  }

  const isPro = user?.plan === 'PRO'

  return (
    <div className="space-y-10 max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* Profile */}
      <section className="space-y-5">
        <h2 className="text-base font-medium text-gray-900">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="replyToEmail">Reply-to email</Label>
            <Input
              id="replyToEmail"
              type="email"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <p className="text-xs text-gray-400">
              Clients will reply to this address.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || !user}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </section>

      <hr className="border-gray-100" />

      {/* Billing */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Plan</h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              isPro
                ? 'bg-[#4F46E5]/10 text-[#4F46E5]'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        {!isPro && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Upgrade to Pro for unlimited active invoices and priority email delivery.
            </p>
            <Button
              className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent"
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? 'Redirecting…' : 'Upgrade to Pro'}
            </Button>
          </div>
        )}

        {isPro && (
          <div className="space-y-2">
            {accessUntil ? (
              <p className="text-sm text-gray-500">
                Your Pro access continues until{' '}
                <span className="font-medium text-gray-900">{fmtUnix(accessUntil)}</span>.
              </p>
            ) : (
              <button
                className="text-sm text-gray-400 hover:text-gray-600 underline disabled:opacity-50"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
