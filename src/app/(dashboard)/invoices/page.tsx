'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { toast } from 'sonner'
import { InvoiceRow, type InvoiceRowData } from '@/components/invoice-row'

type Tab = 'All' | 'Active' | 'Paid' | 'Overdue' | 'Cancelled'
const TABS: Tab[] = ['All', 'Active', 'Paid', 'Overdue', 'Cancelled']

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function InvoicesPage() {
  const [tab, setTab] = useState<Tab>('All')
  const { data, isLoading, mutate } = useSWR('/api/v1/invoices', fetcher)
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
    const res = await fetch(`/api/v1/invoices/${id}/paid`, { method: 'PATCH' })
    if (!res.ok) { toast.error('Could not mark as paid.'); return }
    await mutate()
    toast.success('Invoice marked as paid.')
  }

  async function handleCancel(id: string) {
    const res = await fetch(`/api/v1/invoices/${id}/cancel`, { method: 'PATCH' })
    if (!res.ok) { toast.error('Could not cancel invoice.'); return }
    await mutate()
    toast.success('Invoice cancelled.')
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/invoices/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Could not delete invoice.'); return }
    await mutate()
    toast.success('Invoice deleted.')
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>Invoices</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 0 }}>
            {all.length} invoice{all.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/invoices/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: 'white',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            textDecoration: 'none',
          }}
        >
          Add invoice
        </Link>
      </div>

      {/* ── Filter tabs ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #F0EEFF' }}>
        {TABS.map((t) => {
          const isActive = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#7C3AED' : '#64748B',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? '#7C3AED' : 'transparent'}`,
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* ── Table ───────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : invoices.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #F0EEFF',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(124,58,237,0.06)',
          }}
        >
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0EEFF', background: '#FAFAFF' }}>
                {['Client', 'Amount', 'Due date', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '12px 20px',
                      textAlign: h === 'Amount' ? 'right' : 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
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
          style={{
            display: 'flex',
            gap: 16,
            padding: '16px 20px',
            borderBottom: i < 4 ? '1px solid #F0EEFF' : undefined,
          }}
        >
          {[160, 80, 80, 60, 80].map((w, j) => (
            <div key={j} style={{ height: 14, width: w, borderRadius: 4, background: '#EDE9FE', flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
        borderRadius: 16,
        border: '2px dashed #DDD6FE',
        background: '#FFFFFF',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1B4B', margin: '0 0 4px' }}>
        {tab === 'All' ? 'No invoices yet' : `No ${tab.toLowerCase()} invoices`}
      </p>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
        {tab === 'All' ? 'Add your first invoice to get started.' : 'Try a different filter.'}
      </p>
      {tab === 'All' && (
        <Link
          href="/invoices/new"
          style={{
            display: 'inline-flex',
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: 'white',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            textDecoration: 'none',
          }}
        >
          Add your first invoice
        </Link>
      )}
    </div>
  )
}
