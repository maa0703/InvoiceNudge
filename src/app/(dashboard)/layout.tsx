import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-semibold text-gray-900 text-lg">
              InvoiceNudge
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/invoices"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Invoices
              </Link>
              <Link
                href="/settings"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user?.plan === 'PRO' ? 'default' : 'secondary'}>
              {user?.plan ?? 'FREE'}
            </Badge>
            <Link href="/invoices/new" className={buttonVariants({ size: 'sm' })}>
              New Invoice
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
