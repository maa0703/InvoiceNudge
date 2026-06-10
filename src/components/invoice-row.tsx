'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  onCancel?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
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

export function InvoiceRow({ invoice, onMarkPaid, onCancel, onDelete }: Props) {
  const router = useRouter()
  const [markPaidPending, setMarkPaidPending] = useState(false)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [cancelPending, setCancelPending] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleConfirmPaid() {
    setMarkPaidPending(true)
    try {
      await onMarkPaid(invoice.id)
      setMarkPaidOpen(false)
    } finally {
      setMarkPaidPending(false)
    }
  }

  async function handleConfirmCancel() {
    if (!onCancel) return
    setCancelPending(true)
    try {
      await onCancel(invoice.id)
      setCancelOpen(false)
    } finally {
      setCancelPending(false)
    }
  }

  async function handleConfirmDelete() {
    if (!onDelete) return
    setDeletePending(true)
    try {
      await onDelete(invoice.id)
      setDeleteOpen(false)
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <>
      <tr
        onClick={() => router.push(`/invoices/${invoice.id}`)}
        style={{ borderBottom: '1px solid #F0EEFF', cursor: 'pointer' }}
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
          <div
            className="flex items-center gap-2 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {invoice.status === 'ACTIVE' && (
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
                onClick={() => setMarkPaidOpen(true)}
                disabled={markPaidPending}
              >
                Mark paid
              </button>
            )}
            {onCancel && invoice.status === 'ACTIVE' && (
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}
                onClick={() => setCancelOpen(true)}
                disabled={cancelPending}
              >
                Cancel
              </button>
            )}
            {onDelete && (
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Mark Paid dialog */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Mark invoice as paid?</DialogTitle>
            <DialogDescription>All remaining reminders will be cancelled.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
              onClick={handleConfirmPaid}
              disabled={markPaidPending}
            >
              {markPaidPending ? '…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cancel this invoice?</DialogTitle>
            <DialogDescription>All scheduled reminders will be stopped. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Back</DialogClose>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white border-transparent"
              onClick={handleConfirmCancel}
              disabled={cancelPending}
            >
              {cancelPending ? '…' : 'Cancel invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this invoice?</DialogTitle>
            <DialogDescription>This will permanently remove the invoice and cancel any scheduled reminders.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white border-transparent"
              onClick={handleConfirmDelete}
              disabled={deletePending}
            >
              {deletePending ? '…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
