import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/app-shell'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await getCurrentUser()
  const isPro = user?.plan === 'PRO'

  return <AppShell isPro={isPro}>{children}</AppShell>
}
