'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { SidebarNav } from './sidebar-nav'

function LogoIcon({ size = 30 }: { size?: number }) {
  const iconSize = Math.round(size * 0.57)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.38),
        background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 14 14" fill="white">
        <path d="M7 0.5L13 5.5L7 13.5L1 5.5L7 0.5Z" />
      </svg>
    </div>
  )
}

function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function SidebarContent({ isPro, onNavClick }: { isPro: boolean; onNavClick?: () => void }) {
  return (
    <>
      <Link
        href="/"
        onClick={onNavClick}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 32, textDecoration: 'none' }}
      >
        <LogoIcon />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>InvoiceNudge</span>
      </Link>

      <div onClick={onNavClick} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SidebarNav />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <div style={{ padding: '0 8px' }}>
          <span
            style={
              isPro
                ? { background: '#F3F0FF', color: '#7C3AED', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999, display: 'inline-block' }
                : { background: '#F1F5F9', color: '#64748B', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999, display: 'inline-block' }
            }
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>
        <SignOutButton>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              color: '#64748B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <SignOutIcon />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </>
  )
}

export function AppShell({ isPro, children }: { isPro: boolean; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F7FF' }}>
      {/* ── Desktop sidebar (md+) ───────────────────────── */}
      <aside
        className="hidden md:flex"
        style={{
          width: 220,
          flexShrink: 0,
          flexDirection: 'column',
          padding: '24px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: '#FFFFFF',
          borderRight: '1px solid #F0EEFF',
        }}
      >
        <SidebarContent isPro={isPro} />
      </aside>

      {/* ── Mobile drawer overlay ───────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}
        >
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <aside
            style={{
              position: 'relative',
              zIndex: 10,
              width: 260,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 16px',
              height: '100%',
              background: '#FFFFFF',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <SidebarContent isPro={isPro} onNavClick={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Content area ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar (hidden on md+) */}
        <header
          className="flex md:hidden items-center justify-between sticky top-0 z-40 px-4"
          style={{
            height: 56,
            background: '#FFFFFF',
            borderBottom: '1px solid #F0EEFF',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <LogoIcon size={26} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>InvoiceNudge</span>
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
