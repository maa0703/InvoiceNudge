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
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  EXHAUSTED: 'Exhausted',
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
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
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 font-medium text-gray-900">{invoice.client.name}</td>
        <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
          {fmtAmount(invoice.amount, invoice.currency)}
        </td>
        <td className="px-4 py-3 text-gray-500">{fmtDate(invoice.dueDate)}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[invoice.status]}`}
          >
            {STATUS_LABEL[invoice.status]}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            {invoice.status === 'ACTIVE' && (
              <Button
                size="sm"
                className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent h-7 text-xs px-2.5"
                onClick={() => setOpen(true)}
                disabled={pending}
              >
                Mark paid
              </Button>
            )}
            <Link
              href={`/invoices/${invoice.id}`}
              className="text-sm text-[#4F46E5] hover:underline"
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
            <DialogDescription>
              All remaining reminders will be cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent"
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
