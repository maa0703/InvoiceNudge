'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { toast } from 'sonner'
import { InvoiceRow, InvoiceCard, type InvoiceRowData } from '@/components/invoice-row'
import { useLang } from '@/lib/lang-context'

type Tab = 'All' | 'Active' | 'Paid' | 'Overdue' | 'Cancelled'
const TABS: Tab[] = ['All', 'Active', 'Paid', 'Overdue', 'Cancelled']

const T = {
  en: {
    title: 'Invoices', addInvoice: 'Add invoice',
    total: (n: number) => `${n} invoice${n !== 1 ? 's' : ''} total`,
    tabs: { All: 'All', Active: 'Active', Paid: 'Paid', Overdue: 'Overdue', Cancelled: 'Cancelled' } as Record<Tab, string>,
    client: 'Client', amount: 'Amount', dueDate: 'Due date', status: 'Status',
    emptyAll: 'No invoices yet', emptyAllDesc: 'Add your first invoice to get started.',
    emptyFiltered: (tab: Tab) => `No ${tab.toLowerCase()} invoices`,
    emptyDesc: 'Try a different filter.',
    addFirst: 'Add your first invoice',
    toastPaid: 'Invoice marked as paid.',
    toastCancelled: 'Invoice cancelled.',
    toastDeleted: 'Invoice deleted.',
  },
  fr: {
    title: 'Factures', addInvoice: 'Ajouter une facture',
    total: (n: number) => `${n} facture${n !== 1 ? 's' : ''} au total`,
    tabs: { All: 'Tout', Active: 'Actif', Paid: 'Payé', Overdue: 'En retard', Cancelled: 'Annulé' } as Record<Tab, string>,
    client: 'Client', amount: 'Montant', dueDate: "Date d'échéance", status: 'Statut',
    emptyAll: 'Aucune facture', emptyAllDesc: 'Ajoutez votre première facture pour commencer.',
    emptyFiltered: (tab: Tab) => `Aucune facture ${({ All: '', Active: 'active', Paid: 'payée', Overdue: 'en retard', Cancelled: 'annulée' } as Record<Tab, string>)[tab]}`,
    emptyDesc: 'Essayez un autre filtre.',
    addFirst: 'Ajouter votre première facture',
    toastPaid: 'Facture marquée comme payée.',
    toastCancelled: 'Facture annulée.',
    toastDeleted: 'Facture supprimée.',
  },
} as const

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function InvoicesPage() {
  const [tab, setTab] = useState<Tab>('All')
  const { lang } = useLang()
  const s = T[lang]
  const { data, isLoading, mutate } = useSWR('/api/v1/invoices', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })
  const all: InvoiceRowData[] = data?.invoices ?? []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const invoices = all.filter((inv) => {
    if (tab === 'All')       return true
    if (tab === 'Active')    return inv.status === 'ACTIVE'
    if (tab === 'Paid')      return inv.status === 'PAID'
    if (tab === 'Overdue')   return inv.status === 'ACTIVE' && new Date(inv.dueDate) < today
    if (tab === 'Cancelled') return inv.status === 'CANCELLED'
    return true
  })

  async function handleMarkPaid(id: string) {
    mutate(
      (cur: { invoices: InvoiceRowData[] } | undefined) => ({
        ...cur,
        invoices: (cur?.invoices ?? []).map((inv) =>
          inv.id === id ? { ...inv, status: 'PAID' as const } : inv
        ),
      }),
      { revalidate: false }
    )
    const res = await fetch(`/api/v1/invoices/${id}/paid`, { method: 'PATCH' })
    if (!res.ok) { await mutate(); toast.error('Could not mark as paid.'); return }
    await mutate()
    toast(s.toastPaid, { style: { background: '#7C3AED', color: '#FFFFFF' } })
  }

  async function handleCancel(id: string) {
    const res = await fetch(`/api/v1/invoices/${id}/cancel`, { method: 'PATCH' })
    if (!res.ok) { toast.error('Could not cancel invoice.'); return }
    await mutate()
    toast(s.toastCancelled, { style: { background: '#7C3AED', color: '#FFFFFF' } })
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/invoices/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Could not delete invoice.'); return }
    await mutate()
    toast(s.toastDeleted, { style: { background: '#7C3AED', color: '#FFFFFF' } })
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>{s.title}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 0 }}>{s.total(all.length)}</p>
        </div>
        <Link
          href="/invoices/new"
          style={{
            display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
            borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'white',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', textDecoration: 'none',
          }}
        >
          {s.addInvoice}
        </Link>
      </div>

      {/* ── Filter tabs ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #F0EEFF' }}>
        {TABS.map((tabKey) => {
          const isActive = tab === tabKey
          return (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              style={{
                padding: '8px 16px', fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#7C3AED' : '#64748B',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? '#7C3AED' : 'transparent'}`,
                cursor: 'pointer', marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {s.tabs[tabKey]}
            </button>
          )
        })}
      </div>

      {/* ── Table ───────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : invoices.length === 0 ? (
        <EmptyState tab={tab} s={s} />
      ) : (
        <>
          {/* Desktop table */}
          <div
            className="hidden sm:block"
            style={{
              background: '#FFFFFF', borderRadius: 16, border: '1px solid #F0EEFF',
              overflow: 'hidden', boxShadow: '0 2px 16px rgba(124,58,237,0.06)',
            }}
          >
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F0EEFF', background: '#FAFAFF' }}>
                  {[s.client, s.amount, s.dueDate, s.status, ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '12px 20px', textAlign: h === s.amount ? 'right' : 'left',
                        fontSize: 11, fontWeight: 600, color: '#94A3B8',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    onMarkPaid={handleMarkPaid}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div
            className="sm:hidden"
            style={{
              background: '#FFFFFF', borderRadius: 16, border: '1px solid #F0EEFF',
              overflow: 'hidden', boxShadow: '0 2px 16px rgba(124,58,237,0.06)',
            }}
          >
            {invoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #F0EEFF', overflow: 'hidden' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: i < 4 ? '1px solid #F0EEFF' : undefined }}
        >
          {[160, 80, 80, 60, 80].map((w, j) => (
            <div key={j} style={{ height: 14, width: w, borderRadius: 4, background: '#EDE9FE', flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ tab, s }: { tab: Tab; s: typeof T[keyof typeof T] }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '64px 32px', textAlign: 'center', borderRadius: 16,
        border: '2px dashed #DDD6FE', background: '#FFFFFF',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1B4B', margin: '0 0 4px' }}>
        {tab === 'All' ? s.emptyAll : s.emptyFiltered(tab)}
      </p>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
        {tab === 'All' ? s.emptyAllDesc : s.emptyDesc}
      </p>
      {tab === 'All' && (
        <Link
          href="/invoices/new"
          style={{
            display: 'inline-flex', padding: '10px 20px', borderRadius: 12,
            fontSize: 14, fontWeight: 600, color: 'white',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', textDecoration: 'none',
          }}
        >
          {s.addFirst}
        </Link>
      )}
    </div>
  )
}
