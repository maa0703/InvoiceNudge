'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { toast } from 'sonner'
import { ReminderTimeline } from '@/components/reminder-timeline'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useLang } from '@/lib/lang-context'

const T = {
  en: {
    back: 'Dashboard', due: 'Due', reminderSchedule: 'Reminder schedule',
    markPaid: 'Mark paid', cancelSeq: 'Cancel sequence', cancelling: 'Cancelling…',
    exhaustedNote: 'All 4 reminders have been sent. No further action will be taken automatically.',
    confirmPaidTitle: 'Mark invoice as paid?', confirmPaidDesc: 'All remaining reminders will be cancelled.',
    confirm: 'Confirm', cancel: 'Cancel',
    cancelTitle: 'Cancel reminder sequence?', cancelDesc: 'All scheduled reminders will be stopped.',
    notFound: 'Invoice not found.', backToDash: 'Back to dashboard',
    statusLabels: { DRAFT: 'Draft', ACTIVE: 'Active', PAID: 'Paid', CANCELLED: 'Cancelled', EXHAUSTED: 'All reminders sent', FAILED: 'Failed' },
  },
  fr: {
    back: 'Tableau de bord', due: 'Échéance', reminderSchedule: 'Calendrier des relances',
    markPaid: 'Marquer payé', cancelSeq: 'Annuler la séquence', cancelling: 'Annulation…',
    exhaustedNote: 'Les 4 relances ont été envoyées. Aucune action supplémentaire ne sera prise automatiquement.',
    confirmPaidTitle: 'Marquer la facture comme payée ?', confirmPaidDesc: 'Toutes les relances restantes seront annulées.',
    confirm: 'Confirmer', cancel: 'Annuler',
    cancelTitle: 'Annuler la séquence de relances ?', cancelDesc: 'Toutes les relances planifiées seront arrêtées.',
    notFound: 'Facture introuvable.', backToDash: 'Retour au tableau de bord',
    statusLabels: { DRAFT: 'Brouillon', ACTIVE: 'Actif', PAID: 'Payé', CANCELLED: 'Annulé', EXHAUSTED: 'Toutes envoyées', FAILED: 'Échoué' },
  },
} as const

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type InvoiceStatus = 'DRAFT' | 'ACTIVE' | 'PAID' | 'CANCELLED' | 'EXHAUSTED' | 'FAILED'

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

function fmtDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { lang } = useLang()
  const t = T[lang]
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'

  const [markingPaid, setMarkingPaid] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data, isLoading, error, mutate } = useSWR(`/api/v1/invoices/${id}`, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })
  const invoice = data?.invoice

  async function handleMarkPaid() {
    setMarkingPaid(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}/paid`, { method: 'PATCH' })
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Could not mark as paid.'); return }
      await mutate(); setConfirmOpen(false); toast.success('Invoice marked as paid.')
    } catch { toast.error('Something went wrong.') }
    finally { setMarkingPaid(false) }
  }

  async function handleConfirmCancel() {
    setCancelling(true)
    try {
      const res = await fetch(`/api/v1/invoices/${id}/cancel`, { method: 'PATCH' })
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Could not cancel.'); return }
      await mutate(); setCancelOpen(false); toast.success('Reminder sequence cancelled.')
    } catch { toast.error('Something went wrong.') }
    finally { setCancelling(false) }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        {[56, 32, 56].map((h, i) => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: '#F3F0FF' }} />
        ))}
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: '#64748B' }}>
        {t.notFound}{' '}
        <Link href="/dashboard" className="font-semibold hover:underline" style={{ color: '#7C3AED' }}>
          {t.backToDash}
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
      <div className="max-w-lg mx-auto space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: '#64748B' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          {t.back}
        </Link>

        {/* Invoice card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#FFFFFF', border: '1px solid #F0EEFF', boxShadow: '0 2px 16px rgba(124,58,237,0.06)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold" style={{ color: '#64748B' }}>{invoice.client?.name}</p>
              <p className="text-3xl font-black mt-1" style={{ color: '#7C3AED' }}>
                {fmtAmount(invoice.amount, invoice.currency)}
              </p>
              <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>
                {t.due} {fmtDate(invoice.dueDate, locale)}{ref ? ` · ${ref}` : ''}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0" style={STATUS_STYLE[status]}>
              {t.statusLabels[status]}
            </span>
          </div>

          {(canMarkPaid || canCancel) && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5 pt-5" style={{ borderTop: '1px solid #F0EEFF' }}>
              {canMarkPaid && (
                <button
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', minHeight: 44 }}
                  onClick={() => setConfirmOpen(true)}
                  disabled={markingPaid || cancelling}
                >
                  {t.markPaid}
                </button>
              )}
              {canCancel && (
                <button
                  className="inline-flex items-center justify-center py-2.5 text-sm font-medium hover:underline disabled:opacity-50 transition-colors w-full sm:w-auto"
                  style={{ color: '#64748B', minHeight: 44 }}
                  onClick={() => setCancelOpen(true)}
                  disabled={markingPaid || cancelling}
                >
                  {cancelling ? t.cancelling : t.cancelSeq}
                </button>
              )}
            </div>
          )}
        </div>

        {status === 'EXHAUSTED' && (
          <div className="rounded-2xl px-5 py-4 text-sm" style={{ background: '#F3F0FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}>
            {t.exhaustedNote}
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: '#94A3B8' }}>
            {t.reminderSchedule}
          </p>
          <ReminderTimeline reminders={invoice.reminders ?? []} />
        </div>
      </div>

      {/* Mark paid dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t.confirmPaidTitle}</DialogTitle>
            <DialogDescription>{t.confirmPaidDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.cancel}</DialogClose>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
              onClick={handleMarkPaid}
              disabled={markingPaid}
            >
              {markingPaid ? <Spinner size={14} /> : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel sequence dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t.cancelTitle}</DialogTitle>
            <DialogDescription>{t.cancelDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.back}</DialogClose>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white border-transparent"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? <Spinner size={14} /> : t.cancelSeq}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
