'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { SidebarNav } from './sidebar-nav'
import { LangProvider, useLang } from '@/lib/lang-context'

function LogoIcon({ size = 30 }: { size?: number }) {
  const iconSize = Math.round(size * 0.57)
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.38),
      background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 14 14" fill="white">
        <path d="M7 0.5L13 5.5L7 13.5L1 5.5L7 0.5Z" />
      </svg>
    </div>
  )
}

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

  // Text elements share the same transition curve.
  // Collapsing: fade out fast (no delay), then width shrinks.
  // Expanding:  width grows first, then fade in (80ms delay).
  const textShow: React.CSSProperties = {
    maxWidth: 200,
    opacity: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'max-width 200ms ease-in-out, opacity 120ms ease-in-out 80ms, margin-left 200ms ease-in-out',
  }
  const textHide: React.CSSProperties = {
    maxWidth: 0,
    opacity: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    transition: 'max-width 200ms ease-in-out, opacity 80ms ease-in-out, margin-left 200ms ease-in-out',
  }
  const textStyle = isExpanded ? textShow : textHide

  // Padding shifts items to stay visually centered as width changes.
  // Collapsed: sidebar has no horizontal padding, items use 24px padding to center 16px icon in 64px.
  // Expanded:  sidebar has 16px padding, items use 16px padding for the standard inset.
  const itemPad = isExpanded ? '10px 16px' : '10px 24px'
  const itemTransition = 'padding 200ms ease-in-out, background 150ms ease, color 150ms ease'

  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        onClick={onNavClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          // Same centering math as nav items: padding transitions with sidebar padding
          padding: isExpanded ? '0 8px' : '0 17px',
          marginBottom: 32,
          textDecoration: 'none',
          flexShrink: 0,
          transition: 'padding 200ms ease-in-out',
        }}
      >
        <LogoIcon />
        <span style={{ ...textStyle, marginLeft: isExpanded ? 10 : 0, fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>
          InvoiceNudge
        </span>
      </Link>

      {/* Nav */}
      <div onClick={onNavClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <SidebarNav isExpanded={isExpanded} itemPad={itemPad} itemTransition={itemTransition} textStyle={textStyle} />
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, overflow: 'hidden' }}>
        {/* Plan badge — height collapses instead of unmounting */}
        <div style={{
          padding: '0 8px',
          maxHeight: isExpanded ? 40 : 0,
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 200ms ease-in-out, opacity 150ms ease-in-out',
        }}>
          <span style={isPro
            ? { background: '#F3F0FF', color: '#7C3AED', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999, display: 'inline-block' }
            : { background: '#F1F5F9', color: '#64748B', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999, display: 'inline-block' }
          }>
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        {/* Sign out */}
        <SignOutButton>
          <button style={{
            width: '100%', display: 'flex', alignItems: 'center',
            padding: itemPad,
            borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#64748B',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: itemTransition,
          }}>
            <SignOutIcon />
            <span style={{ ...textStyle, marginLeft: isExpanded ? 8 : 0 }}>
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
          className="hidden lg:flex"
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            flexDirection: 'column',
            // Horizontal padding transitions in sync with width:
            // expanded=16px, collapsed=0px so items can use their own padding for centering
            padding: isExpanded ? '24px 16px' : '24px 0',
            position: 'sticky',
            top: 0,
            height: '100vh',
            background: '#FFFFFF',
            borderRight: '1px solid #F0EEFF',
            overflow: 'hidden',
            transition: 'width 200ms ease-in-out, padding 200ms ease-in-out',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SidebarContent isPro={isPro} isExpanded={isExpanded} />
        </aside>

        {/* Toggle button — fixed at sidebar's right edge */}
        <div
          className="hidden lg:flex items-center justify-center"
          onClick={handleToggle}
          style={{
            position: 'fixed',
            left: sidebarWidth - 12,
            top: '50vh',
            transform: 'translateY(-50%)',
            zIndex: 50,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid #E8E4DC',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            transition: 'left 200ms ease-in-out',
          }}
        >
          {isExpanded ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          )}
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
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <LogoIcon size={26} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>InvoiceNudge</span>
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
