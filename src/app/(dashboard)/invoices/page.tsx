import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getInvoices } from '@/server/invoice.service'
import type { InvoiceStatus } from '@prisma/client'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft', ACTIVE: 'Active', PAID: 'Paid',
  CANCELLED: 'Cancelled', EXHAUSTED: 'Exhausted', FAILED: 'Failed',
}

const STATUS_STYLE: Record<InvoiceStatus, { background: string; color: string }> = {
  ACTIVE:    { background: '#F3F0FF', color: '#7C3AED' },
  DRAFT:     { background: '#EFF6FF', color: '#2563EB' },
  PAID:      { background: '#ECFDF5', color: '#059669' },
  FAILED:    { background: '#FEF2F2', color: '#EF4444' },
  EXHAUSTED: { background: '#F1F5F9', color: '#64748B' },
  CANCELLED: { background: '#F1F5F9', color: '#64748B' },
}

function fmt(amount: { toFixed: (n: number) => string }, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount.toFixed(2)))
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export default async function InvoicesPage() {
  const user = await getCurrentUser()
  const invoices = user ? await getInvoices(user.id) : []

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

      {invoices.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-28 gap-4 text-center rounded-2xl"
          style={{ border: '2px dashed #DDD6FE', background: '#FFFFFF' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#F3F0FF' }}>
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
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid #F0EEFF', boxShadow: '0 2px 16px rgba(124,58,237,0.06)' }}
        >
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid #F0EEFF' }}>
              <tr>
                {['Client', 'Ref', 'Due date', 'Amount', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    style={{ color: '#94A3B8' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #F0EEFF' }}>
                  <td className="px-5 py-4 font-semibold" style={{ color: '#1E1B4B' }}>{inv.client.name}</td>
                  <td className="px-5 py-4" style={{ color: '#64748B' }}>{inv.invoiceRef ?? '—'}</td>
                  <td className="px-5 py-4" style={{ color: '#64748B' }}>{fmtDate(inv.dueDate)}</td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums" style={{ color: '#1E1B4B' }}>
                    {fmt(inv.amount, inv.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
                      style={STATUS_STYLE[inv.status]}
                    >
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/invoices/${inv.id}`} className="text-sm font-semibold hover:underline" style={{ color: '#7C3AED' }}>
                      View
                    </Link>
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
