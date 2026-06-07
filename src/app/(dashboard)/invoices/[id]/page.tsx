'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ReminderTimeline } from '@/components/reminder-timeline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type InvoiceStatus = 'DRAFT' | 'ACTIVE' | 'PAID' | 'CANCELLED' | 'EXHAUSTED' | 'FAILED'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  EXHAUSTED: 'All reminders sent',
  FAILED: 'Failed',
}

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-700',
  PAID: 'bg-gray-100 text-gray-600',
  EXHAUSTED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

function fmtAmount(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount))
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Could not mark as paid.')
        return
      }
      await mutate()
      setConfirmOpen(false)
      toast.success('Invoice marked as paid.')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setMarkingPaid(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel the reminder sequence? Scheduled reminders will be stopped.')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}/cancel`, { method: 'PATCH' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Could not cancel.')
        return
      }
      await mutate()
      toast.success('Reminder sequence cancelled.')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-7 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Invoice not found.{' '}
        <Link href="/dashboard" className="text-[#4F46E5] underline">
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{ref}</h1>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${STATUS_CLASS[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'EXHAUSTED' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
          All 4 reminders have been sent. No further action will be taken automatically.
        </div>
      )}

      <div className="border border-gray-200 rounded-lg p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-400">Client</dt>
            <dd className="font-medium text-gray-900 mt-0.5">{invoice.client?.name}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Email</dt>
            <dd className="font-medium text-gray-900 mt-0.5 truncate">{invoice.client?.email}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Amount</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {fmtAmount(invoice.amount, invoice.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Due date</dt>
            <dd className="font-medium text-gray-900 mt-0.5">{fmtDate(invoice.dueDate)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="text-base font-medium text-gray-900 mb-3">Reminder schedule</h2>
        <ReminderTimeline reminders={invoice.reminders ?? []} />
      </div>

      {(canMarkPaid || canCancel) && (
        <div className="flex items-center gap-4 pt-2">
          {canMarkPaid && (
            <Button
              className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent"
              onClick={() => setConfirmOpen(true)}
              disabled={markingPaid || cancelling}
            >
              Mark paid
            </Button>
          )}
          {canCancel && (
            <button
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
              onClick={handleCancel}
              disabled={markingPaid || cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Cancel sequence'}
            </button>
          )}
        </div>
      )}
    </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Mark invoice as paid?</DialogTitle>
            <DialogDescription>
              All remaining reminders will be cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent"
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

