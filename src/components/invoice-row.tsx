'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

type InvoiceStatus = 'DRAFT' | 'ACTIVE' | 'PAID' | 'CANCELLED' | 'EXHAUSTED' | 'FAILED'

export interface InvoiceRowData {
  id: string
  status: InvoiceStatus
  amount: string
  currency: 'USD' | 'EUR' | 'GBP'
  dueDate: string
  invoiceRef: string | null
  client: { name: string; email: string }
}

interface Props {
  invoice: InvoiceRowData
  onMarkPaid: (id: string) => Promise<void>
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  ACTIVE: 'Active', DRAFT: 'Draft', PAID: 'Paid',
  CANCELLED: 'Cancelled', EXHAUSTED: 'Exhausted', FAILED: 'Failed',
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
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export function InvoiceRow({ invoice, onMarkPaid }: Props) {
  const [pending, setPending] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    setPending(true)
    try {
      await onMarkPaid(invoice.id)
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <tr
        className="transition-colors"
        style={{ borderBottom: '1px solid #F0EEFF' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFE')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#1E1B4B' }}>
          {invoice.client.name}
        </td>
        <td className="px-5 py-4 text-right font-bold text-sm tabular-nums" style={{ color: '#1E1B4B' }}>
          {fmtAmount(invoice.amount, invoice.currency)}
        </td>
        <td className="px-5 py-4 text-sm" style={{ color: '#64748B' }}>
          {fmtDate(invoice.dueDate)}
        </td>
        <td className="px-5 py-4">
          <span
            className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
            style={STATUS_STYLE[invoice.status]}
          >
            {STATUS_LABEL[invoice.status]}
          </span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3 justify-end">
            {invoice.status === 'ACTIVE' && (
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
                onClick={() => setOpen(true)}
                disabled={pending}
              >
                Mark paid
              </button>
            )}
            <Link
              href={`/invoices/${invoice.id}`}
              className="text-sm font-semibold transition-colors hover:underline"
              style={{ color: '#7C3AED' }}
            >
              View
            </Link>
          </div>
        </td>
      </tr>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Mark invoice as paid?</DialogTitle>
            <DialogDescription>All remaining reminders will be cancelled.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending ? '…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
