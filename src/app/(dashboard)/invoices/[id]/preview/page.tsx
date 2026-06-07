'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { InvoicePreviewCard } from '@/components/invoice-preview-card'
import { reminder1 } from '@/lib/email-templates'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

export default function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [activating, setActivating] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const { data, isLoading, error } = useSWR(`/api/v1/invoices/${id}`, fetcher)
  const invoice = data?.invoice

  async function handleActivate() {
    setActivating(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}/activate`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Could not activate reminders.')
        return
      }
      toast.success('Reminders activated!')
      router.push('/dashboard')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setActivating(false)
    }
  }

  async function handleEdit() {
    setCancelling(true)
    try {
      await fetch(`/api/v1/invoices/${id}/cancel`, { method: 'PATCH' })
    } finally {
      setCancelling(false)
      router.push('/invoices/new')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-7 w-56 bg-gray-100 rounded animate-pulse" />
        <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-9 w-48 bg-gray-100 rounded animate-pulse" />
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

  const ref = invoice.invoiceRef ?? `#${String(invoice.id).slice(-6).toUpperCase()}`
  const template = reminder1({
    clientName: invoice.client?.name ?? 'there',
    invoiceRef: ref,
    amount: fmtAmount(invoice.amount, invoice.currency),
    dueDate: fmtDate(invoice.dueDate),
    cancelUrl: '[cancel link]',
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Preview & Activate</h1>
        <p className="text-sm text-gray-500 mt-1">
          This is what Reminder 1 will look like when sent to your client.
        </p>
      </div>

      <InvoicePreviewCard subject={template.subject} htmlBody={template.html} />

      <div className="flex items-center gap-3">
        <Button
          className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent"
          onClick={handleActivate}
          disabled={activating || cancelling}
        >
          {activating ? 'Activating…' : 'Activate reminders'}
        </Button>
        <Button
          variant="outline"
          onClick={handleEdit}
          disabled={activating || cancelling}
        >
          {cancelling ? 'Cancelling…' : 'Edit details'}
        </Button>
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 ml-1"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
