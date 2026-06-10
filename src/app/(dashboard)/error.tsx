'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: '#FEF2F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          fontSize: 24,
        }}
      >
        ⚠️
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B4B', margin: '0 0 8px' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', maxWidth: 360 }}>
        An unexpected error occurred loading this page. Try again or return to the dashboard.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          style={{
            border: '1.5px solid #DDD6FE',
            color: '#7C3AED',
            borderRadius: 12,
            padding: '9px 20px',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
