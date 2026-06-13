'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'

const STORAGE_KEY = 'invoicenudge-tour-done'
const W = 256

interface Step {
  target: string | null
  title: string
  text: string
  position: 'below' | 'above' | 'center'
}

const STEPS: Step[] = [
  {
    target: 'add-invoice',
    title: 'Add more invoices',
    text: "Want to add another? It's always here.",
    position: 'below',
  },
  {
    target: 'first-invoice-row',
    title: 'Your active invoice',
    text: "We'll follow up automatically after the due date. Up to 4 reminders, tone escalates gradually.",
    position: 'below',
  },
  {
    target: 'first-invoice-status',
    title: 'Track every reminder',
    text: 'Track every reminder here — sent, scheduled, or cancelled.',
    position: 'above',
  },
  {
    target: 'first-invoice-paid',
    title: 'Close the loop',
    text: 'When your client pays, close it here. All reminders stop.',
    position: 'above',
  },
]

interface Coords {
  top: number
  left: number
  arrow: 'up' | 'down' | 'none'
}

const CARD_H = 168
const GAP = 12

function calcCoords(step: Step): Coords {
  const centered: Coords = {
    top: Math.round(window.innerHeight * 0.33),
    left: Math.max(16, Math.round((window.innerWidth - W) / 2)),
    arrow: 'none',
  }
  if (!step.target) return centered

  const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
  if (!el) return centered

  const r = el.getBoundingClientRect()
  const safeLeft = Math.max(16, Math.min(Math.round(r.left), window.innerWidth - W - 16))

  if (step.position === 'below') {
    return { top: Math.round(r.bottom + GAP), left: safeLeft, arrow: 'up' }
  }
  if (step.position === 'above') {
    return { top: Math.round(r.top - CARD_H - GAP), left: safeLeft, arrow: 'down' }
  }
  return centered
}

function ArrowUp() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', top: -9, left: 18 }}>
      <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '9px solid #E8E4DC' }} />
      <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #fff', marginTop: -8, marginLeft: 1 }} />
    </div>
  )
}

function ArrowDown() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', bottom: -9, left: 18 }}>
      <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '9px solid #E8E4DC' }} />
      <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #fff', marginTop: -9, marginLeft: 1 }} />
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Tour() {
  // Fast path: if localStorage already says done, skip all API calls
  const [localDone] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
  )

  const { data: userData } = useSWR(!localDone ? '/api/v1/users/me' : null, fetcher)
  const { data: invoiceData } = useSWR(!localDone ? '/api/v1/invoices' : null, fetcher)

  const [dismissed, setDismissed] = useState(false)
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0, arrow: 'none' })
  const [hlRect, setHlRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  // Determine whether to show the tour once all data is loaded
  useEffect(() => {
    if (localDone || dismissed) return
    if (!userData || !invoiceData) return

    // DB says tour already done — cache it and stop
    if (userData.user?.tourCompleted) {
      localStorage.setItem(STORAGE_KEY, 'true')
      return
    }

    // Only show after at least one invoice has been activated
    const invoices: { status: string }[] = invoiceData.invoices ?? []
    const hasActive = invoices.some((inv) => inv.status === 'ACTIVE')
    if (!hasActive) return

    const id = setTimeout(() => setVisible(true), 700)
    return () => clearTimeout(id)
  }, [localDone, dismissed, userData, invoiceData])

  // Recompute tooltip position and highlight rect on step change
  useEffect(() => {
    if (!visible) return
    const s = STEPS[step]
    setCoords(calcCoords(s))
    if (s.target) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${s.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setHlRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      } else {
        setHlRect(null)
      }
    } else {
      setHlRect(null)
    }
  }, [visible, step])

  const finish = useCallback(() => {
    fetch('/api/v1/users/tour-complete', { method: 'PATCH' }).catch(() => {})
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
    setVisible(false)
    setHlRect(null)
  }, [setDismissed])

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) finish()
    else setStep((s) => s + 1)
  }, [step, finish])

  if (!visible) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <>
      <style>{`
        @keyframes _tn_pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.55); }
          50%      { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
        }
      `}</style>

      {hlRect && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: hlRect.top - 4,
            left: hlRect.left - 4,
            width: hlRect.width + 8,
            height: hlRect.height + 8,
            borderRadius: 10,
            border: '2px solid #818cf8',
            pointerEvents: 'none',
            animation: '_tn_pulse 1.4s ease-in-out 3',
            zIndex: 9998,
          }}
        />
      )}

      <div
        role="dialog"
        aria-modal="false"
        aria-label={`Intro tour, step ${step + 1} of ${STEPS.length}`}
        style={{ position: 'fixed', top: coords.top, left: coords.left, width: W, zIndex: 9999 }}
      >
        {coords.arrow === 'up'   && <ArrowUp />}
        {coords.arrow === 'down' && <ArrowDown />}

        <div
          style={{
            background: '#fff',
            border: '1px solid #E8E4DC',
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            padding: '14px 16px',
          }}
        >
          <p style={{ fontSize: 11, color: '#A8A29E', margin: 0, userSelect: 'none' }}>
            {step + 1} of {STEPS.length}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1917', margin: '4px 0 0' }}>
            {s.title}
          </p>
          <p style={{ fontSize: 13, color: '#78716C', lineHeight: 1.55, margin: '6px 0 0' }}>
            {s.text}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <button
              onClick={finish}
              style={{
                fontSize: 12, color: '#A8A29E', background: 'none', border: 'none',
                cursor: 'pointer', padding: 0, textDecoration: 'underline',
              }}
            >
              Skip tour
            </button>
            <button
              onClick={next}
              style={{
                fontSize: 13, fontWeight: 600, color: '#4F46E5', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {isLast ? 'Got it ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
