'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/lang-context'

const T = {
  en: { toastDeleted: 'Invoice deleted.' },
  fr: { toastDeleted: 'Facture supprimée.' },
} as const
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

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft', ACTIVE: 'Active', PAID: 'Paid',
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

interface Props {
  id: string
  clientName: string
  invoiceRef: string | null
  dueDate: string
  amount: string
  status: InvoiceStatus
}

export function InvoiceListRow({ id, clientName, invoiceRef, dueDate, amount, status }: Props) {
  const { lang } = useLang()
  const t = T[lang]
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Could not delete invoice.'); return }
      toast(t.toastDeleted, { style: { background: '#7C3AED', color: '#FFFFFF' } })
      router.refresh()
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <tr
        onClick={() => router.push(`/invoices/${id}`)}
        style={{ borderBottom: '1px solid #F0EEFF', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFE')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#1E1B4B' }}>{clientName}</td>
        <td className="px-5 py-4 text-sm" style={{ color: '#64748B' }}>{invoiceRef ?? '—'}</td>
        <td className="px-5 py-4 text-sm" style={{ color: '#64748B' }}>{dueDate}</td>
        <td className="px-5 py-4 text-right font-bold text-sm tabular-nums" style={{ color: '#1E1B4B' }}>{amount}</td>
        <td className="px-5 py-4">
          <span
            className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
            style={STATUS_STYLE[status]}
          >
            {STATUS_LABEL[status]}
          </span>
        </td>
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 justify-end">
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this invoice?</DialogTitle>
            <DialogDescription>
              This will permanently remove the invoice and cancel any scheduled reminders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white border-transparent"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
