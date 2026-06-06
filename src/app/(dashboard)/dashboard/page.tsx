import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome to InvoiceNudge</h1>
      <p className="text-gray-500 text-sm">Create your first invoice and activate automated reminders.</p>
      <Link href="/invoices/new" className={buttonVariants()}>
        Create your first invoice
      </Link>
    </div>
  )
}
