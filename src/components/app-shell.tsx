'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { Pin, PinOff } from 'lucide-react'
import { SidebarNav } from './sidebar-nav'
import { LangProvider, useLang } from '@/lib/lang-context'

function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

const topBtnStyle: React.CSSProperties = {
  border: '1px solid #E8E4DC',
  color: '#78716C',
  background: '#FFFFFF',
  fontSize: 14,
  borderRadius: 8,
  padding: '6px 12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  cursor: 'pointer',
  fontWeight: 500,
}

function FixedTopRight() {
  const { lang, setLang } = useLang()
  return (
    <div
      className="hidden lg:flex"
      style={{ position: 'fixed', top: 12, right: 16, zIndex: 50, gap: 8, alignItems: 'center' }}
    >
      <SignOutButton>
        <button style={topBtnStyle}>Sign out</button>
      </SignOutButton>
      <button style={topBtnStyle} onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}>
        {lang === 'en' ? 'FR' : 'EN'}
      </button>
    </div>
  )
}

function SidebarContent({ isPro, isExpanded, onNavClick }: { isPro: boolean; isExpanded: boolean; onNavClick?: () => void }) {
  const { lang } = useLang()
  const signOutLabel = lang === 'fr' ? 'Déconnexion' : 'Sign out'
  const collapsed = !isExpanded

  return (
    <>
      {/* Logo — both marks always in DOM, crossfade via CSS class opacity */}
      <Link
        href="/"
        onClick={onNavClick}
        style={{
          display: 'block',
          position: 'relative',
          height: 32,
          marginBottom: 32,
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        <span
          className={`nav-logo-full${collapsed ? ' collapsed' : ''}`}
          style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
        >
          <Image src="/favicon.svg" alt="InvoiceNudge" width={120} height={30} unoptimized />
        </span>
        <span
          className={`nav-logo-icon${!collapsed ? ' expanded' : ''}`}
          style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
        >
          <Image src="/icon.svg" alt="InvoiceNudge" width={28} height={28} unoptimized />
        </span>
      </Link>

      {/* Nav */}
      <div onClick={onNavClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <SidebarNav isExpanded={isExpanded} />
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, overflow: 'hidden' }}>
        {/* Plan badge */}
        <div style={{ padding: '0 8px' }}>
          <span
            className={`nav-label${collapsed ? ' collapsed' : ''}`}
            style={{ display: 'inline-block' }}
          >
            <span style={isPro
              ? { background: '#F3F0FF', color: '#7C3AED', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999, display: 'inline-block' }
              : { background: '#F1F5F9', color: '#64748B', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999, display: 'inline-block' }
            }>
              {isPro ? 'Pro' : 'Free'}
            </span>
          </span>
        </div>

        {/* Sign out */}
        <SignOutButton>
          <button style={{
            width: '100%', display: 'flex', alignItems: 'center',
            padding: '10px 8px',
            borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#64748B',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'background 150ms ease, color 150ms ease',
          }}>
            <SignOutIcon />
            <span className={`nav-label${collapsed ? ' collapsed' : ''}`} style={{ marginLeft: 8 }}>
              {signOutLabel}
            </span>
          </button>
        </SignOutButton>
      </div>
    </>
  )
}

export function AppShell({ isPro, children }: { isPro: boolean; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  useEffect(() => {
    const saved = localStorage.getItem('navbar-pinned')
    if (saved === 'true') {
      setIsPinned(true)
      const savedExp = localStorage.getItem('navbar-expanded')
      setIsExpanded(savedExp !== 'false')
    }
  }, [])

  function handleMouseEnter() {
    if (isPinned) return
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setIsExpanded(true)
  }

  function handleMouseLeave() {
    if (isPinned) return
    collapseTimer.current = setTimeout(() => setIsExpanded(false), 300)
  }

  function handleToggle() {
    const newPinned = !isPinned
    const newExpanded = !isExpanded
    setIsPinned(newPinned)
    setIsExpanded(newExpanded)
    localStorage.setItem('navbar-pinned', String(newPinned))
    localStorage.setItem('navbar-expanded', String(newExpanded))
  }

  const sidebarWidth = isExpanded ? 240 : 64

  return (
    <LangProvider>
      {/* Fixed top-right: language + sign out (desktop only) */}
      <FixedTopRight />

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F7FF' }}>
        {/* ── Desktop sidebar ─────────────────────────── */}
        <aside
          className={`hidden lg:flex nav-sidebar${!isExpanded ? ' collapsed' : ''}`}
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            flexDirection: 'column',
            padding: '24px 16px',
            position: 'sticky',
            top: 0,
            height: '100vh',
            background: '#FFFFFF',
            borderRight: '1px solid #F0EEFF',
            overflow: 'hidden',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SidebarContent isPro={isPro} isExpanded={isExpanded} />
        </aside>

        {/* ── Pin / Unpin button — straddling sidebar's right edge ── */}
        <div
          className={`hidden lg:block group nav-pin-btn${!isExpanded ? ' collapsed' : ''}`}
          style={{
            position: 'fixed',
            left: sidebarWidth - 14,
            top: '50vh',
            transform: 'translateY(-50%)',
            zIndex: 50,
          }}
        >
          <div className="relative w-7 h-7">
            {/* Inline label — inside sidebar, fades in on hover when expanded */}
            <span
              className={[
                'absolute right-full mr-2 top-1/2 -translate-y-1/2',
                'text-xs whitespace-nowrap pointer-events-none select-none',
                'transition-opacity duration-150 opacity-0',
                isExpanded ? 'group-hover:opacity-100' : '',
                isPinned ? 'text-indigo-600' : 'text-[#A8A29E]',
              ].join(' ')}
            >
              {isPinned ? 'Pinned' : 'Pin open'}
            </span>

            {/* Button circle */}
            <button
              onClick={handleToggle}
              aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              className={[
                'w-7 h-7 rounded-full bg-white',
                'flex items-center justify-center cursor-pointer',
                'shadow-sm transition-colors',
                'border hover:border-indigo-300',
                isPinned ? 'border-indigo-300' : 'border-[#E8E4DC]',
              ].join(' ')}
            >
              {isPinned
                ? <Pin size={14} className="text-indigo-600" />
                : <PinOff size={14} className="text-[#A8A29E]" />
              }
            </button>

            {/* Tooltip — right of button, 400 ms show delay, instant hide */}
            <span
              className={[
                'absolute left-full top-1/2 -translate-y-1/2 ml-2',
                'bg-[#1C1917] text-white text-xs px-2 py-1 rounded-md',
                'whitespace-nowrap pointer-events-none select-none',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                'group-hover:delay-[400ms]',
              ].join(' ')}
            >
              {isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            </span>
          </div>
        </div>

        {/* ── Mobile drawer overlay ────────────────────── */}
        {drawerOpen && (
          <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDrawerOpen(false)} />
            <aside style={{ position: 'relative', zIndex: 10, width: 260, display: 'flex', flexDirection: 'column', padding: '24px 16px', height: '100%', background: '#FFFFFF' }}>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <SidebarContent isPro={isPro} isExpanded={true} onNavClick={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        {/* ── Content area ────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Mobile top bar */}
          <header
            className="flex lg:hidden items-center justify-between sticky top-0 z-40 px-4"
            style={{ height: 56, background: '#FFFFFF', borderBottom: '1px solid #F0EEFF' }}
          >
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Image src="/favicon.svg" alt="InvoiceNudge" width={104} height={26} unoptimized />
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
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
            <div className="p-4 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </LangProvider>
  )
}
