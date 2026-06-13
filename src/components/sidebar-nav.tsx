'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/lang-context'

const LABELS_FR: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/invoices':  'Factures',
  '/settings':  'Paramètres',
}

const NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Invoices',
    href: '/invoices',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

interface SidebarNavProps {
  isExpanded: boolean
}

export function SidebarNav({ isExpanded }: SidebarNavProps) {
  const pathname = usePathname()
  const { lang } = useLang()
  const collapsed = !isExpanded

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      {NAV.map(({ label, href, icon }) => {
        const active =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href))
        const displayLabel = lang === 'fr' ? (LABELS_FR[href] ?? label) : label
        return (
          <Link
            key={label}
            href={href}
            className={`nav-pill${collapsed ? ' collapsed' : ''}`}
            style={{
              padding: '10px 8px',
              color: active ? 'white' : '#64748B',
              backgroundColor: active ? '#7C3AED' : 'transparent',
            }}
          >
            <span className={`nav-icon${collapsed ? ' collapsed' : ''}`}>
              {icon}
            </span>
            <span
              className={`nav-label${collapsed ? ' collapsed' : ''}`}
              style={{ marginLeft: 12 }}
            >
              {displayLabel}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
