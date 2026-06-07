'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UpgradeModal } from '@/components/upgrade-modal'

interface Props {
  isBlocked?: boolean
}

interface Fields {
  clientName: string
  clientEmail: string
  invoiceRef: string
  amount: string
  currency: 'USD' | 'EUR' | 'GBP'
  dueDate: string
}

const EMPTY: Fields = {
  clientName: '',
  clientEmail: '',
  invoiceRef: '',
  amount: '',
  currency: 'USD',
  dueDate: '',
}

export function InvoiceForm({ isBlocked = false }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [autoFilled, setAutoFilled] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(isBlocked)

  if (isBlocked) {
    return (
      <>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 text-sm">
            You've reached the free plan limit of 3 active invoices.
          </p>
          <Button
            className="bg-[#10B981] hover:bg-[#059669] text-white border-transparent"
            onClick={() => setUpgradeOpen(true)}
          >
            Upgrade to Pro
          </Button>
        </div>
      </>
    )
  }

  function setField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setExtractError('Please upload a PDF file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setExtractError('File must be under 5 MB.')
      return
    }
    setExtracting(true)
    setExtractError(null)
    setAutoFilled(false)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/v1/invoices/extract', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(
          data.error ?? "Couldn't read this PDF — please fill in the details manually.",
        )
        return
      }
      setFields((prev) => ({
        ...prev,
        ...(data.clientEmail ? { clientEmail: data.clientEmail } : {}),
        ...(data.invoiceRef ? { invoiceRef: data.invoiceRef } : {}),
        ...(data.amount ? { amount: String(data.amount) } : {}),
        ...(data.dueDate ? { dueDate: data.dueDate } : {}),
      }))
      setAutoFilled(true)
    } catch {
      setExtractError("Couldn't read this PDF — please fill in the details manually.")
    } finally {
      setExtracting(false)
    }
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof Fields, string>> = {}
    if (!fields.clientName.trim()) errs.clientName = 'Required'
    if (!fields.clientEmail.trim()) {
      errs.clientEmail = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.clientEmail)) {
      errs.clientEmail = 'Enter a valid email'
    }
    if (!fields.amount.trim()) {
      errs.amount = 'Required'
    } else if (isNaN(Number(fields.amount)) || Number(fields.amount) <= 0) {
      errs.amount = 'Enter a positive number'
    }
    if (!fields.dueDate) errs.dueDate = 'Required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: fields.clientName.trim(),
          clientEmail: fields.clientEmail.trim().toLowerCase(),
          invoiceRef: fields.invoiceRef.trim() || undefined,
          amount: Number(fields.amount),
          currency: fields.currency,
          dueDate: fields.dueDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong.')
        return
      }
      router.push(`/invoices/${data.invoice.id}/preview`)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PDF Upload Zone */}
      <div
        role="button"
        tabIndex={0}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-[#4F46E5] bg-indigo-50'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
        } ${extracting ? 'opacity-60 pointer-events-none' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        {extracting ? (
          <p className="text-sm text-gray-500">Reading PDF…</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Drop a PDF invoice here, or click to select
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF up to 5 MB</p>
          </>
        )}
      </div>

      {autoFilled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          We've filled in the details — please confirm before continuing.
        </div>
      )}

      {extractError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          {extractError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="clientName">Client name</Label>
          <Input
            id="clientName"
            value={fields.clientName}
            onChange={(e) => setField('clientName', e.target.value)}
            placeholder="Acme Corp"
          />
          {fieldErrors.clientName && (
            <p className="text-xs text-red-600">{fieldErrors.clientName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="clientEmail">Client email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={fields.clientEmail}
            onChange={(e) => setField('clientEmail', e.target.value)}
            placeholder="billing@acme.com"
          />
          {fieldErrors.clientEmail && (
            <p className="text-xs text-red-600">{fieldErrors.clientEmail}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invoiceRef">
            Invoice ref{' '}
            <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </Label>
          <Input
            id="invoiceRef"
            value={fields.invoiceRef}
            onChange={(e) => setField('invoiceRef', e.target.value)}
            placeholder="INV-001"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            type="date"
            value={fields.dueDate}
            onChange={(e) => setField('dueDate', e.target.value)}
          />
          {fieldErrors.dueDate && (
            <p className="text-xs text-red-600">{fieldErrors.dueDate}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={fields.amount}
            onChange={(e) => setField('amount', e.target.value)}
            placeholder="1200.00"
          />
          {fieldErrors.amount && (
            <p className="text-xs text-red-600">{fieldErrors.amount}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            value={fields.currency}
            onChange={(e) => setField('currency', e.target.value as 'USD' | 'EUR' | 'GBP')}
            className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Continue →'}
        </Button>
      </div>
    </form>
  )
}
