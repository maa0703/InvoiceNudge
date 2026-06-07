'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { toast } from 'sonner'
import { buttonVariants } from '@/components/ui/button'
import { InvoiceRow, type InvoiceRowData } from '@/components/invoice-row'

type Plan = 'FREE' | 'PRO'

interface Props {
  plan: Plan
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DashboardContent({ plan }: Props) {
  const { data, isLoading, mutate } = useSWR('/api/v1/invoices', fetcher, {
    refreshInterval: 30000,
  })

  const invoices: InvoiceRowData[] = data?.invoices ?? []
  const activeCount = invoices.filter(
    (inv) => inv.status === 'ACTIVE' || inv.status === 'DRAFT',
  ).length
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
      toast.success('Invoice marked as paid.')
    } catch {
      toast.error('Something went wrong.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link href="/invoices/new" className={buttonVariants()}>
          Add invoice
        </Link>
      </div>

      {showUpgradeBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            You've reached the free plan limit of 3 active invoices.
          </p>
          <Link href="/settings" className="text-sm font-medium text-amber-900 underline ml-4 shrink-0">
            Upgrade →
          </Link>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onMarkPaid={handleMarkPaid}
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
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[140, 80, 80].map((w, i) => (
            <tr key={i}>
              {[w, 80, 80, 60, 100].map((cw, j) => (
                <td key={j} className="px-4 py-4">
                  <div
                    className="h-3 bg-gray-100 rounded animate-pulse"
                    style={{ width: cw }}
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
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed border-gray-200 rounded-xl">
      <p className="text-gray-500 text-sm">No invoices yet. Add your first one.</p>
      <Link href="/invoices/new" className={buttonVariants({ variant: 'outline' })}>
        Add invoice
      </Link>
    </div>
  )
}
