'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { InvoicePreviewCard } from '@/components/invoice-preview-card'
import { reminder1 } from '@/lib/email-templates'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmtAmount(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount))
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="max-w-lg mx-auto space-y-6">
        <div className="h-7 w-56 rounded animate-pulse" style={{ background: '#F5F3EE' }} />
        <div className="h-52 rounded-xl animate-pulse" style={{ background: '#F5F3EE' }} />
        <div className="h-9 w-48 rounded animate-pulse" style={{ background: '#F5F3EE' }} />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: '#78716C' }}>
        Invoice not found.{' '}
        <Link href="/dashboard" className="text-indigo-600 hover:underline">Back to dashboard</Link>
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
    freelancerName: '[Your name]',
  })

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1C1917' }}>Preview — Reminder 1</h1>
        <p className="text-sm mt-1" style={{ color: '#78716C' }}>
          This is what the first reminder will look like when sent to your client.
        </p>
      </div>

      <InvoicePreviewCard
        subject={template.subject}
        htmlBody={template.html}
        from="You via InvoiceNudge"
        to={`${invoice.client?.name ?? ''} <${invoice.client?.email ?? ''}>`}
      />

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            className="flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 text-sm shadow-sm transition-colors w-full sm:w-auto"
            style={{ minHeight: 44 }}
            onClick={handleActivate}
            disabled={activating || cancelling}
          >
            {activating ? 'Activating…' : 'Activate reminders'}
          </button>
          <button
            className="flex items-center justify-center rounded-lg font-medium px-5 py-2.5 text-sm transition-colors disabled:opacity-60 w-full sm:w-auto"
            style={{ border: '1px solid #E8E4DC', color: '#1C1917', background: 'transparent', minHeight: 44 }}
            onClick={handleEdit}
            disabled={activating || cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Edit details'}
          </button>
          <Link href="/dashboard" className="text-sm text-center sm:text-left sm:ml-1 hover:underline py-2" style={{ color: '#78716C' }}>
            Cancel
          </Link>
        </div>
        <p className="text-xs italic text-center" style={{ color: '#A8A29E' }}>
          We&apos;ll check in 3 hours before every send.
        </p>
      </div>
    </div>
  )
}
