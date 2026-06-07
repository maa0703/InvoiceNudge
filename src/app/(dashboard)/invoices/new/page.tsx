import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getInvoices } from '@/server/invoice.service'
import { InvoiceForm } from '@/components/invoice-form'

export default async function NewInvoicePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  let isBlocked = false
  if (user.plan === 'FREE') {
    const invoices = await getInvoices(user.id)
    const activeCount = invoices.filter(
      (inv) => inv.status === 'DRAFT' || inv.status === 'ACTIVE',
    ).length
    isBlocked = activeCount >= 3
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">New Invoice</h1>
      <InvoiceForm isBlocked={isBlocked} />
    </div>
  )
}
