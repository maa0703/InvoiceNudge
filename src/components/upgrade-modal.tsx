'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            You've reached the free plan limit of 3 active invoices.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-sm text-gray-600 space-y-1.5 mt-2">
          <li>Unlimited active invoices</li>
          <li>Priority email delivery</li>
          <li>Custom sender name</li>
        </ul>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Redirecting…' : 'Upgrade to Pro'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
