import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getInvoices } from '@/server/invoice.service'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus } from '@prisma/client'

const STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT:      'secondary',
  ACTIVE:     'default',
  PAID:       'outline',
  CANCELLED:  'secondary',
  EXHAUSTED:  'secondary',
  FAILED:     'destructive',
}

function fmt(amount: { toFixed: (n: number) => string }, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    Number(amount.toFixed(2)),
  )
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date),
  )
}

export default async function InvoicesPage() {
  const user = await getCurrentUser()
  const invoices = user ? await getInvoices(user.id) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <Link href="/invoices/new" className={buttonVariants()}>
          New Invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 text-sm">No invoices yet.</p>
          <Link href="/invoices/new" className={buttonVariants({ variant: 'outline' })}>
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.client.name}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.invoiceRef ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {fmt(inv.amount, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
