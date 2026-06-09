'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { toast } from 'sonner'
import { ReminderTimeline } from '@/components/reminder-timeline'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type InvoiceStatus = 'DRAFT' | 'ACTIVE' | 'PAID' | 'CANCELLED' | 'EXHAUSTED' | 'FAILED'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft', ACTIVE: 'Active', PAID: 'Paid',
  CANCELLED: 'Cancelled', EXHAUSTED: 'All reminders sent', FAILED: 'Failed',
}

const STATUS_STYLE: Record<InvoiceStatus, { background: string; color: string }> = {
  ACTIVE:    { background: '#F3F0FF', color: '#7C3AED' },
  DRAFT:     { background: '#EFF6FF', color: '#2563EB' },
  PAID:      { background: '#ECFDF5', color: '#059669' },
  FAILED:    { background: '#FEF2F2', color: '#EF4444' },
  EXHAUSTED: { background: '#F1F5F9', color: '#64748B' },
  CANCELLED: { background: '#F1F5F9', color: '#64748B' },
}

function fmtAmount(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount))
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data, isLoading, error, mutate } = useSWR(`/api/v1/invoices/${id}`, fetcher)
  const invoice = data?.invoice

  async function handleMarkPaid() {
    setMarkingPaid(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}/paid`, { method: 'PATCH' })
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Could not mark as paid.'); return }
      await mutate(); setConfirmOpen(false); toast.success('Invoice marked as paid.')
    } catch { toast.error('Something went wrong.') }
    finally { setMarkingPaid(false) }
  }

  async function handleCancel() {
    if (!confirm('Cancel the reminder sequence? Scheduled reminders will be stopped.')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}/cancel`, { method: 'PATCH' })
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Could not cancel.'); return }
      await mutate(); toast.success('Reminder sequence cancelled.')
    } catch { toast.error('Something went wrong.') }
    finally { setCancelling(false) }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        {[56, 32, 56].map((h, i) => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: '#F3F0FF' }} />
        ))}
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: '#64748B' }}>
        Invoice not found.{' '}
        <Link href="/dashboard" className="font-semibold hover:underline" style={{ color: '#7C3AED' }}>
          Back to dashboard
        </Link>
      </div>
    )
  }

  const status = invoice.status as InvoiceStatus
  const canMarkPaid = status === 'ACTIVE'
  const canCancel = status === 'ACTIVE' || status === 'DRAFT'
  const ref = invoice.invoiceRef ?? `#${String(invoice.id).slice(-6).toUpperCase()}`

  return (
    <>
      <div className="max-w-lg mx-auto space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: '#64748B' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Dashboard
        </Link>

        {/* Invoice card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#FFFFFF', border: '1px solid #F0EEFF', boxShadow: '0 2px 16px rgba(124,58,237,0.06)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold" style={{ color: '#64748B' }}>{invoice.client?.name}</p>
              <p className="text-3xl font-black mt-1" style={{ color: '#7C3AED' }}>
                {fmtAmount(invoice.amount, invoice.currency)}
              </p>
              <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>
                Due {fmtDate(invoice.dueDate)}{ref ? ` · ${ref}` : ''}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
              style={STATUS_STYLE[status]}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>

          {(canMarkPaid || canCancel) && (
            <div className="flex items-center gap-3 mt-5 pt-5" style={{ borderTop: '1px solid #F0EEFF' }}>
              {canMarkPaid && (
                <button
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                  onClick={() => setConfirmOpen(true)}
                  disabled={markingPaid || cancelling}
                >
                  Mark paid
                </button>
              )}
              {canCancel && (
                <button
                  className="text-sm font-medium hover:underline disabled:opacity-50 transition-colors"
                  style={{ color: '#64748B' }}
                  onClick={handleCancel}
                  disabled={markingPaid || cancelling}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel sequence'}
                </button>
              )}
            </div>
          )}
        </div>

        {status === 'EXHAUSTED' && (
          <div
            className="rounded-2xl px-5 py-4 text-sm"
            style={{ background: '#F3F0FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}
          >
            All 4 reminders have been sent. No further action will be taken automatically.
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: '#94A3B8' }}>
            Reminder schedule
          </p>
          <ReminderTimeline reminders={invoice.reminders ?? []} />
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Mark invoice as paid?</DialogTitle>
            <DialogDescription>All remaining reminders will be cancelled.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
              onClick={handleMarkPaid}
              disabled={markingPaid}
            >
              {markingPaid ? '…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
