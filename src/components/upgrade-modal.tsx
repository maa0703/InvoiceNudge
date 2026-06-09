'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/billing/checkout', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ color: '#1E1B4B' }}>Upgrade to Pro</DialogTitle>
          <DialogDescription style={{ color: '#64748B' }}>
            You&apos;ve reached the free plan limit of 3 active invoices.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-sm space-y-2 mt-2" style={{ color: '#64748B' }}>
          {['Unlimited active invoices', 'Priority email delivery', 'Custom sender name'].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span style={{ color: '#7C3AED' }}>✓</span> {f}
            </li>
          ))}
        </ul>
        <div className="flex gap-3 justify-end mt-4">
          <button
            className="inline-flex items-center justify-center rounded-xl font-semibold px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
            style={{ border: '1px solid #E8E8F0', color: '#64748B' }}
            onClick={() => onOpenChange(false)}
          >
            Not now
          </button>
          <button
            className="inline-flex items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 px-5 py-2.5"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Redirecting…' : 'Upgrade to Pro'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
