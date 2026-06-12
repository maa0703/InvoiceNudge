'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { InvoicePreviewCard } from '@/components/invoice-preview-card'
import { reminder1 } from '@/lib/email-templates'
import { useLang } from '@/lib/lang-context'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const T = {
  en: { toastActivated: 'Reminders activated!', toastSaved: 'Invoice updated.' },
  fr: { toastActivated: 'Relances activées !', toastSaved: 'Facture mise à jour.' },
} as const

function fmtAmount(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount))
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

const inputStyle = {
  border: '1px solid #E8E8F0', borderRadius: 12, padding: '10px 14px',
  background: '#FFFFFF', color: '#1E1B4B', fontSize: 14, width: '100%',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
}

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#7C3AED'
  e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#E8E8F0'
  e.target.style.boxShadow = 'none'
}

interface EditFields {
  clientName: string
  clientEmail: string
  invoiceRef: string
  amount: string
  currency: 'USD' | 'EUR' | 'GBP'
  dueDate: string
}

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { lang } = useLang()
  const t = T[lang]
  const router = useRouter()
  const [activating, setActivating] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editFields, setEditFields] = useState<EditFields | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof EditFields, string>>>({})

  const { data, isLoading, error, mutate } = useSWR(`/api/v1/invoices/${id}`, fetcher)
  const invoice = data?.invoice
  const { data: userData } = useSWR('/api/v1/users/me', fetcher)

  function openEdit() {
    if (!invoice) return
    setEditFields({
      clientName: invoice.client?.name ?? '',
      clientEmail: invoice.client?.email ?? '',
      invoiceRef: invoice.invoiceRef ?? '',
      amount: String(invoice.amount),
      currency: invoice.currency ?? 'USD',
      dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
    })
    setFieldErrors({})
    setEditOpen(true)
  }

  function setField(key: keyof EditFields, value: string) {
    setEditFields((prev) => prev ? { ...prev, [key]: value } : prev)
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    if (!editFields) return false
    const errs: Partial<Record<keyof EditFields, string>> = {}
    if (!editFields.clientName.trim()) errs.clientName = 'Required'
    if (!editFields.clientEmail.trim()) errs.clientEmail = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFields.clientEmail)) errs.clientEmail = 'Enter a valid email'
    if (!editFields.amount.trim()) errs.amount = 'Required'
    else if (isNaN(Number(editFields.amount)) || Number(editFields.amount) <= 0) errs.amount = 'Enter a positive number'
    if (!editFields.dueDate) errs.dueDate = 'Required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSaveEdit() {
    if (!editFields || !validate()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: editFields.clientName.trim(),
          clientEmail: editFields.clientEmail.trim().toLowerCase(),
          invoiceRef: editFields.invoiceRef.trim() || undefined,
          amount: Number(editFields.amount),
          currency: editFields.currency,
          dueDate: editFields.dueDate,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error ?? 'Could not save changes.')
        return
      }
      await mutate()
      setEditOpen(false)
      toast(t.toastSaved, { style: { background: '#7C3AED', color: '#FFFFFF' } })
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    setActivating(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}/activate`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Could not activate reminders.')
        return
      }
      toast(t.toastActivated, { style: { background: '#7C3AED', color: '#FFFFFF' } })
      router.push('/dashboard')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setActivating(false)
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
    displayName: userData?.user?.displayName ?? '',
    signatureName: userData?.user?.emailSignatureName ?? '',
  })

  return (
    <>
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
              disabled={activating}
            >
              {activating ? 'Activating…' : 'Activate reminders'}
            </button>
            <button
              className="flex items-center justify-center rounded-lg font-medium px-5 py-2.5 text-sm transition-colors disabled:opacity-60 w-full sm:w-auto"
              style={{ border: '1px solid #E8E4DC', color: '#1C1917', background: 'transparent', minHeight: 44 }}
              onClick={openEdit}
              disabled={activating}
            >
              Edit details
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Edit invoice details</DialogTitle>
            <DialogDescription>Changes update the preview immediately.</DialogDescription>
          </DialogHeader>

          {editFields && (
            <div className="space-y-4 py-1">
              {([
                { id: 'clientName', label: 'Client name', type: 'text', placeholder: 'Acme Corp' },
                { id: 'clientEmail', label: 'Client email', type: 'email', placeholder: 'billing@acme.com' },
                { id: 'invoiceRef', label: 'Invoice ref', type: 'text', placeholder: 'INV-001', optional: true },
                { id: 'dueDate', label: 'Due date', type: 'date', placeholder: '' },
                { id: 'amount', label: 'Amount', type: 'number', placeholder: '1200.00' },
              ]).map(({ id: fid, label, type, placeholder, optional }) => (
                <div key={fid} className="space-y-1">
                  <label className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
                    {label}
                    {optional && <span className="ml-1 text-xs font-normal" style={{ color: '#94A3B8' }}>(optional)</span>}
                  </label>
                  <input
                    type={type}
                    value={editFields[fid as keyof EditFields]}
                    onChange={(e) => setField(fid as keyof EditFields, e.target.value)}
                    placeholder={placeholder}
                    min={type === 'number' ? '0.01' : undefined}
                    step={type === 'number' ? '0.01' : undefined}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  {fieldErrors[fid as keyof EditFields] && (
                    <p className="text-xs" style={{ color: '#EF4444' }}>{fieldErrors[fid as keyof EditFields]}</p>
                  )}
                </div>
              ))}

              <div className="space-y-1">
                <label className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>Currency</label>
                <select
                  value={editFields.currency}
                  onChange={(e) => setField('currency', e.target.value as 'USD' | 'EUR' | 'GBP')}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
