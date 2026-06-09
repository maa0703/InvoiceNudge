import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { SignOutButton } from '@clerk/nextjs'
import { getCurrentUser } from '@/lib/auth'
import { SidebarNav } from '@/components/sidebar-nav'

function LogoIcon() {
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="white">
        <path d="M7 0.5L13 5.5L7 13.5L1 5.5L7 0.5Z" />
      </svg>
    </div>
  )
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await getCurrentUser()
  const isPro = user?.plan === 'PRO'

  return (
    <div className="flex min-h-screen" style={{ background: '#F8F7FF' }}>
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className="flex flex-col py-6 px-4 sticky top-0 h-screen flex-shrink-0"
        style={{ width: 220, background: '#FFFFFF', borderRight: '1px solid #F0EEFF' }}
      >
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 px-2 mb-8">
          <LogoIcon />
          <span className="text-sm font-bold" style={{ color: '#1E1B4B' }}>InvoiceNudge</span>
        </a>

        {/* Nav — client component for active state */}
        <SidebarNav />

        {/* Bottom */}
        <div className="space-y-2 mt-4">
          <div className="px-2">
            <span
              className="inline-flex text-xs font-semibold px-3 py-1 rounded-full"
              style={
                isPro
                  ? { background: '#F3F0FF', color: '#7C3AED' }
                  : { background: '#F1F5F9', color: '#64748B' }
              }
            >
              {isPro ? 'Pro' : 'Free'}
            </span>
          </div>
          <SignOutButton>
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-slate-50 cursor-pointer"
              style={{ color: '#64748B' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
