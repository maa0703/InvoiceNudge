import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function InvoicesPage() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
      <Link href="/invoices/new" className={buttonVariants()}>
        New Invoice
      </Link>
    </div>
  )
}
