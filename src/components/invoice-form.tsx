'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UpgradeModal } from '@/components/upgrade-modal'

interface Props { isBlocked?: boolean }

interface Fields {
  clientName: string; clientEmail: string; invoiceRef: string
  amount: string; currency: 'USD' | 'EUR' | 'GBP'; dueDate: string
}

const EMPTY: Fields = { clientName: '', clientEmail: '', invoiceRef: '', amount: '', currency: 'USD', dueDate: '' }

const inputStyle = {
  border: '1px solid #E8E8F0', borderRadius: 12, padding: '10px 14px',
  background: '#FFFFFF', color: '#1E1B4B', fontSize: 14, width: '100%',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
}

function Field({ id, label, optional, error, children }: {
  id: string; label: string; optional?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
        {label}
        {optional && <span className="ml-1 text-xs font-normal" style={{ color: '#94A3B8' }}>(optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
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
        <div
          className="flex flex-col items-center justify-center py-24 gap-4 text-center rounded-2xl"
          style={{ border: '2px dashed #DDD6FE' }}
        >
          <p className="text-sm" style={{ color: '#64748B' }}>
            You&apos;ve reached the free plan limit of 3 active invoices.
          </p>
          <button
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            onClick={() => setUpgradeOpen(true)}
          >
            Upgrade to Pro
          </button>
        </div>
      </>
    )
  }

  function setField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { setExtractError('Please upload a PDF file.'); return }
    if (file.size > 5 * 1024 * 1024) { setExtractError('File must be under 5 MB.'); return }
    setExtracting(true); setExtractError(null); setAutoFilled(false)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/v1/invoices/extract', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setExtractError(data.error ?? "Couldn't read this PDF — please fill in manually."); return }
      setFields((prev) => ({
        ...prev,
        ...(data.clientEmail ? { clientEmail: data.clientEmail } : {}),
        ...(data.invoiceRef  ? { invoiceRef:  data.invoiceRef  } : {}),
        ...(data.amount      ? { amount:      String(data.amount) } : {}),
        ...(data.dueDate     ? { dueDate:     data.dueDate     } : {}),
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
    if (!fields.clientEmail.trim()) { errs.clientEmail = 'Required' }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.clientEmail)) { errs.clientEmail = 'Enter a valid email' }
    if (!fields.amount.trim()) { errs.amount = 'Required' }
    else if (isNaN(Number(fields.amount)) || Number(fields.amount) <= 0) { errs.amount = 'Enter a positive number' }
    if (!fields.dueDate) errs.dueDate = 'Required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true); setSubmitError(null)
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
      if (!res.ok) { setSubmitError(data.error ?? 'Something went wrong.'); return }
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
        className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? '#7C3AED' : '#DDD6FE',
          background: dragOver ? 'rgba(124,58,237,0.04)' : '#FAFAFE',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        onMouseEnter={(e) => { if (!dragOver) { (e.currentTarget as HTMLDivElement).style.borderColor = '#7C3AED'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,0.04)' } }}
        onMouseLeave={(e) => { if (!dragOver) { (e.currentTarget as HTMLDivElement).style.borderColor = '#DDD6FE'; (e.currentTarget as HTMLDivElement).style.background = '#FAFAFE' } }}
      >
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
        {extracting ? (
          <p className="text-sm" style={{ color: '#7C3AED' }}>Reading PDF…</p>
        ) : (
          <>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F3F0FF' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="#7C3AED" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Drop your invoice PDF here or click to browse</p>
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>PDF up to 5 MB</p>
          </>
        )}
      </div>

      {autoFilled && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#F3F0FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}>
          We&apos;ve filled in the details — please confirm before continuing.
        </div>
      )}
      {extractError && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#FEF9C3', border: '1px solid #FDE68A', color: '#92400E' }}>
          {extractError}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: '#F0EEFF' }} />
        <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>or fill in manually</span>
        <div className="flex-1 h-px" style={{ background: '#F0EEFF' }} />
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <Field id="clientName" label="Client name" error={fieldErrors.clientName}>
          <input id="clientName" value={fields.clientName} onChange={(e) => setField('clientName', e.target.value)}
            placeholder="Acme Corp" style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }} />
        </Field>

        <Field id="clientEmail" label="Client email" error={fieldErrors.clientEmail}>
          <input id="clientEmail" type="email" value={fields.clientEmail} onChange={(e) => setField('clientEmail', e.target.value)}
            placeholder="billing@acme.com" style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }} />
        </Field>

        <Field id="invoiceRef" label="Invoice ref" optional error={fieldErrors.invoiceRef}>
          <input id="invoiceRef" value={fields.invoiceRef} onChange={(e) => setField('invoiceRef', e.target.value)}
            placeholder="INV-001" style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }} />
        </Field>

        <Field id="dueDate" label="Due date" error={fieldErrors.dueDate}>
          <input id="dueDate" type="date" value={fields.dueDate} onChange={(e) => setField('dueDate', e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }} />
        </Field>

        <Field id="amount" label="Amount" error={fieldErrors.amount}>
          <input id="amount" type="number" min="0.01" step="0.01" value={fields.amount}
            onChange={(e) => setField('amount', e.target.value)} placeholder="1200.00" style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }} />
        </Field>

        <Field id="currency" label="Currency">
          <select id="currency" value={fields.currency} onChange={(e) => setField('currency', e.target.value as 'USD' | 'EUR' | 'GBP')}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }}>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
        </Field>
      </div>

      {submitError && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444' }}>
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', padding: '12px 20px' }}
      >
        {submitting ? 'Creating…' : 'Continue to preview'}
      </button>
    </form>
  )
}
