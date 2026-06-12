'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { toast } from 'sonner'
import { InvoiceRow, type InvoiceRowData } from '@/components/invoice-row'
import { useLang } from '@/lib/lang-context'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const T = {
  en: { toastPaid: 'Invoice marked as paid.', toastDeleted: 'Invoice deleted.' },
  fr: { toastPaid: 'Facture marquée comme payée.', toastDeleted: 'Facture supprimée.' },
} as const

export function DashboardContent({ plan: _propPlan }: { plan?: string }) {
  const { lang } = useLang()
  const t = T[lang]
  const { data, isLoading, mutate } = useSWR('/api/v1/invoices', fetcher, { refreshInterval: 30000 })
  const { data: meData } = useSWR('/api/v1/users/me', fetcher)

  const invoices: InvoiceRowData[] = data?.invoices ?? []
  const plan: string = meData?.user?.plan ?? _propPlan ?? 'FREE'
  const activeCount = invoices.filter((inv) => inv.status === 'ACTIVE' || inv.status === 'DRAFT').length
  const showUpgradeBanner = plan === 'FREE' && activeCount >= 3

  async function handleMarkPaid(id: string) {
    try {
      const res = await fetch(`/api/v1/invoices/${id}/paid`, { method: 'PATCH' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Could not mark as paid.')
        return
      }
      await mutate()
      toast(t.toastPaid, { style: { background: '#7C3AED', color: '#FFFFFF' } })
    } catch {
      toast.error('Something went wrong.')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/v1/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Could not delete invoice.')
        return
      }
      await mutate()
      toast(t.toastDeleted, { style: { background: '#7C3AED', color: '#FFFFFF' } })
    } catch {
      toast.error('Something went wrong.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>Your Invoices</h1>
        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
        >
          Add invoice
        </Link>
      </div>

      {showUpgradeBanner && (
        <div
          className="rounded-xl px-5 py-3 flex items-center justify-between"
          style={{ background: '#F3F0FF', border: '1px solid #DDD6FE' }}
        >
          <p className="text-sm" style={{ color: '#5B21B6' }}>
            You&apos;ve reached the free limit — upgrade to add more.
          </p>
          <a
            href="/settings"
            className="text-sm font-semibold underline ml-4 shrink-0"
            style={{ color: '#7C3AED' }}
          >
            Upgrade →
          </a>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid #F0EEFF', boxShadow: '0 2px 16px rgba(124,58,237,0.06)' }}
        >
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid #F0EEFF' }}>
              <tr>
                {['Client', 'Amount', 'Due date', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    style={{ color: '#94A3B8' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} onMarkPaid={handleMarkPaid} onDelete={handleDelete} />
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #F0EEFF' }}
    >
      <table className="w-full text-sm">
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F0EEFF' }}>
              {[140, 80, 80, 60, 80].map((w, j) => (
                <td key={j} className="px-5 py-4">
                  <div
                    className="h-3 rounded-full animate-pulse"
                    style={{ width: w, background: '#F3F0FF' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-28 gap-4 text-center rounded-2xl"
      style={{ border: '2px dashed #DDD6FE', background: '#FFFFFF' }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: '#F3F0FF' }}
      >
        📄
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: '#1E1B4B' }}>No invoices yet</p>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Add your first invoice to get started.</p>
      </div>
      <Link
        href="/invoices/new"
        className="mt-2 inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
      >
        Add your first invoice
      </Link>
    </div>
  )
}
