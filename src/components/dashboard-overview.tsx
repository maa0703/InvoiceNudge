'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useLang } from '@/lib/lang-context'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Status = 'DRAFT' | 'ACTIVE' | 'PAID' | 'CANCELLED' | 'EXHAUSTED' | 'FAILED'

interface Invoice {
  id: string
  status: Status
  amount: string
  currency: string
  dueDate: string
  invoiceRef: string | null
  client: { name: string; email: string }
}

const T = {
  en: {
    greeting: (name: string) => name ? `Hello! ${name} 👋` : 'Hello! 👋',
    title: 'Dashboard',
    subtitle: 'Your invoice activity at a glance.',
    addInvoice: '+ Add invoice',
    active: 'Active',
    overdue: 'Overdue',
    paid: 'Paid',
    cancelled: 'Cancelled',
    recentInvoices: 'Recent Invoices',
    viewAll: 'View all →',
    noInvoices: 'No invoices yet.',
    addOne: 'Add one →',
    breakdown: 'Breakdown',
    noData: 'No data yet.',
    toastActivated: "Reminders activated! We'll check in before every send.",
    statuses: {
      ACTIVE: 'Active', DRAFT: 'Draft', PAID: 'Paid',
      FAILED: 'Failed', EXHAUSTED: 'Exhausted', CANCELLED: 'Cancelled',
    } as Record<Status, string>,
  },
  fr: {
    greeting: (name: string) => name ? `Bonjour ! ${name} 👋` : 'Bonjour ! 👋',
    title: 'Tableau de bord',
    subtitle: "Votre activité de facturation en un coup d'œil.",
    addInvoice: '+ Ajouter une facture',
    active: 'Actif',
    overdue: 'En retard',
    paid: 'Payé',
    cancelled: 'Annulé',
    recentInvoices: 'Factures récentes',
    viewAll: 'Tout voir →',
    noInvoices: 'Aucune facture.',
    addOne: 'Ajouter →',
    breakdown: 'Répartition',
    noData: 'Aucune donnée.',
    toastActivated: 'Relances activées ! Nous vérifierons avant chaque envoi.',
    statuses: {
      ACTIVE: 'Actif', DRAFT: 'Brouillon', PAID: 'Payé',
      FAILED: 'Échoué', EXHAUSTED: 'Terminé', CANCELLED: 'Annulé',
    } as Record<Status, string>,
  },
} as const

const STATUS_COLORS: Record<Status, { bg: string; fg: string }> = {
  ACTIVE:    { bg: '#F3F0FF', fg: '#7C3AED' },
  DRAFT:     { bg: '#EFF6FF', fg: '#2563EB' },
  PAID:      { bg: '#ECFDF5', fg: '#059669' },
  FAILED:    { bg: '#FEF2F2', fg: '#EF4444' },
  EXHAUSTED: { bg: '#F1F5F9', fg: '#64748B' },
  CANCELLED: { bg: '#F1F5F9', fg: '#64748B' },
}

function fmtFull(amount: string, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(parseFloat(amount))
}

function fmtDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function Bone({ w, h, r = 8 }: { w: string; h: number; r?: number }) {
  return <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: '#EDE9FE', flexShrink: 0 }} />
}

export function DashboardOverview() {
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const { data: userData } = useSWR('/api/v1/users/me', fetcher)
  const displayName: string = userData?.user?.displayName ?? ''
  const { data, isLoading, mutate } = useSWR('/api/v1/invoices', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })
  const invoices: Invoice[] = data?.invoices ?? []
  const t = T[lang]
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'

  const [markPaidId, setMarkPaidId] = useState<string | null>(null)
  const [markPaidPending, setMarkPaidPending] = useState(false)

  useEffect(() => {
    if (searchParams.get('activated') === 'true') {
      toast(t.toastActivated, { style: { background: '#7C3AED', color: '#FFFFFF' } })
    }
  }, [])

  async function handleMarkPaid() {
    if (!markPaidId) return
    setMarkPaidPending(true)
    try {
      const res = await fetch(`/api/v1/invoices/${markPaidId}/paid`, { method: 'PATCH' })
      if (!res.ok) { toast.error('Could not mark as paid.'); return }
      await mutate()
      setMarkPaidId(null)
      toast(lang === 'fr' ? 'Facture marquée comme payée.' : 'Invoice marked as paid.', {
        style: { background: '#7C3AED', color: '#FFFFFF' },
      })
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setMarkPaidPending(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeCount    = invoices.filter((i) => i.status === 'ACTIVE').length
  const overdueCount   = invoices.filter((i) => i.status === 'ACTIVE' && new Date(i.dueDate) < today).length
  const paidCount      = invoices.filter((i) => i.status === 'PAID').length
  const cancelledCount = invoices.filter((i) => i.status === 'CANCELLED').length
  const total          = invoices.length || 1

  const stats = [
    { label: t.active,    value: activeCount.toString(),    bg: '#F3F0FF', color: '#7C3AED' },
    { label: t.overdue,   value: overdueCount.toString(),   bg: '#FDF2FF', color: '#C026D3' },
    { label: t.paid,      value: paidCount.toString(),      bg: '#ECFDF5', color: '#059669' },
    { label: t.cancelled, value: cancelledCount.toString(), bg: '#F8F7FF', color: '#94A3B8' },
  ]

  const breakdown = [
    { label: t.statuses.ACTIVE,    count: activeCount,    color: '#7C3AED' },
    { label: t.statuses.PAID,      count: paidCount,      color: '#059669' },
    { label: t.statuses.CANCELLED, count: cancelledCount, color: '#94A3B8' },
    { label: t.overdue,            count: overdueCount,   color: '#EF4444' },
  ]

  const recent = [...invoices]
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 5)

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B', margin: '0 0 2px' }}>{t.greeting(displayName)}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 0 }}>{t.subtitle}</p>
        </div>
        <Link
          href="/invoices/new"
          data-tour="add-invoice"
          style={{
            display: 'inline-flex', alignItems: 'center', flexShrink: 0,
            padding: '9px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            color: '#fff', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          {t.addInvoice}
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 16, marginBottom: 24 }}>
        {isLoading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} style={{ background: '#F3F0FF', borderRadius: 20, padding: '24px 28px' }}>
                <Bone w="55%" h={14} r={4} />
                <div style={{ marginTop: 14 }}><Bone w="40%" h={44} r={8} /></div>
              </div>
            ))
          : stats.map((s) => (
              <div
                key={s.label}
                style={{ background: s.bg, borderRadius: 20, padding: '24px 28px' }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: s.color, margin: '0 0 14px' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 48, fontWeight: 900, color: '#1E1B4B', margin: 0, lineHeight: 1 }}>
                  {s.value}
                </p>
              </div>
            ))}
      </div>

      {/* ── Two-column sections ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>

        {/* Recent Invoices */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #F0EEFF', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>{t.recentInvoices}</span>
            <Link href="/invoices" style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}>
              {t.viewAll}
            </Link>
          </div>

          {isLoading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0, 1, 2, 3, 4].map((i) => <Bone key={i} w="100%" h={18} r={6} />)}
            </div>
          ) : recent.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              {t.noInvoices}{' '}
              <Link href="/invoices/new" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
                {t.addOne}
              </Link>
            </div>
          ) : (
            <>
              {(() => {
                const firstActiveIdx = recent.findIndex((i) => i.status === 'ACTIVE')
                return recent.map((inv, idx) => {
                  const s = STATUS_COLORS[inv.status]
                  const isFirst = idx === 0
                  const isFirstActive = idx === firstActiveIdx
                  return (
                    <div
                      key={inv.id}
                      data-tour={isFirst ? 'first-invoice-row' : undefined}
                      style={{ borderBottom: idx < recent.length - 1 ? '1px solid #F0EEFF' : undefined }}
                    >
                      <Link
                        href={`/invoices/${inv.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 20px', textDecoration: 'none', transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFE')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inv.client.name}
                          </p>
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 1 }}>{fmtDate(inv.dueDate, locale)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B' }}>
                            {fmtFull(inv.amount, inv.currency, locale)}
                          </span>
                          <span
                            data-tour={isFirst ? 'first-invoice-status' : undefined}
                            style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.fg }}
                          >
                            {t.statuses[inv.status]}
                          </span>
                        </div>
                      </Link>
                      {inv.status === 'ACTIVE' && (
                        <div style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            data-tour={isFirstActive ? 'first-invoice-paid' : undefined}
                            onClick={() => setMarkPaidId(inv.id)}
                            style={{
                              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8, cursor: 'pointer',
                              background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                            }}
                          >
                            Mark paid
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </>
          )}
        </div>

        {/* Breakdown */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #F0EEFF', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EEFF' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>{t.breakdown}</span>
          </div>
          {isLoading ? (
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[0, 1, 2, 3].map((i) => <Bone key={i} w="100%" h={10} r={4} />)}
            </div>
          ) : (
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {breakdown.map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 72, fontSize: 13, color: '#64748B', flexShrink: 0 }}>{item.label}</span>
                  <div style={{ flex: 1, height: 8, background: '#F3F0FF', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(item.count / total) * 100}%`,
                        background: item.color,
                        borderRadius: 4,
                        minWidth: item.count > 0 ? 6 : 0,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <span style={{ width: 24, fontSize: 13, fontWeight: 600, color: '#1E1B4B', textAlign: 'right', flexShrink: 0 }}>
                    {item.count}
                  </span>
                </div>
              ))}
              {invoices.length === 0 && (
                <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, margin: 0 }}>{t.noData}</p>
              )}
            </div>
          )}
        </div>

      </div>

      <Dialog open={!!markPaidId} onOpenChange={(open) => { if (!open) setMarkPaidId(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Mark invoice as paid?</DialogTitle>
            <DialogDescription>All remaining reminders will be cancelled.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
              onClick={handleMarkPaid}
              disabled={markPaidPending}
            >
              {markPaidPending ? <Spinner size={14} /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
