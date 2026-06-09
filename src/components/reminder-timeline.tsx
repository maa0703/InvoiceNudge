'use client'

import { useState } from 'react'

type ReminderStatus = 'SCHEDULED' | 'SENT' | 'CANCELLED' | 'FAILED'

interface ReminderStep {
  id: string
  step: number
  scheduledAt: string
  sentAt: string | null
  status: ReminderStatus
  cancelledReason: string | null
}

interface Props {
  reminders: ReminderStep[]
  onRetry?: (id: string) => Promise<void>
}

const STEP_LABEL = ['', 'Reminder 1 (day +1)', 'Reminder 2 (day +5)', 'Reminder 3 (day +10)', 'Reminder 4 (day +20)']

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 5h6" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function DotIcon() {
  return <div className="w-2 h-2 rounded-full" style={{ background: '#7C3AED' }} />
}

const CIRCLE: Record<ReminderStatus, { border: string; background: string; icon: React.ReactNode }> = {
  SCHEDULED: { border: '#A78BFA', background: '#FFFFFF',  icon: <DotIcon /> },
  SENT:      { border: '#34D399', background: '#ECFDF5',  icon: <CheckIcon /> },
  CANCELLED: { border: '#E2E8F0', background: '#F8FAFC',  icon: <DashIcon /> },
  FAILED:    { border: '#FCA5A5', background: '#FEF2F2',  icon: <XIcon /> },
}

const BADGE_STYLE: Record<ReminderStatus, { background: string; color: string }> = {
  SCHEDULED: { background: '#F3F0FF', color: '#7C3AED' },
  SENT:      { background: '#ECFDF5', color: '#059669' },
  CANCELLED: { background: '#F1F5F9', color: '#64748B' },
  FAILED:    { background: '#FEF2F2', color: '#EF4444' },
}

const STATUS_LABEL: Record<ReminderStatus, string> = {
  SCHEDULED: 'Scheduled', SENT: 'Sent', CANCELLED: 'Cancelled', FAILED: 'Failed',
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function ReminderTimeline({ reminders, onRetry }: Props) {
  const [retrying, setRetrying] = useState<string | null>(null)
  const steps = [1, 2, 3, 4].map((step) => ({ step, reminder: reminders.find((r) => r.step === step) ?? null }))

  return (
    <div>
      {steps.map(({ step, reminder }, idx) => {
        const status = reminder?.status ?? null
        const cfg = status ? CIRCLE[status] : { border: '#E2E8F0', background: '#F8FAFC', icon: null }
        const isLast = idx === steps.length - 1

        return (
          <div key={step} className="flex gap-4">
            {/* Circle + connecting line */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: cfg.border, background: cfg.background }}
              >
                {cfg.icon ?? (
                  <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{step}</span>
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 my-1" style={{ background: '#F0EEFF', minHeight: 24 }} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 flex items-start justify-between gap-2 ${isLast ? '' : 'pb-5'}`}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{STEP_LABEL[step]}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  {!reminder && 'Not yet scheduled'}
                  {reminder?.status === 'SENT' && reminder.sentAt && `Sent ${fmtDateTime(reminder.sentAt)}`}
                  {reminder?.status === 'SCHEDULED' && `Scheduled for ${fmtDate(reminder.scheduledAt)}`}
                  {reminder?.status === 'CANCELLED' && `Cancelled${reminder.cancelledReason ? ` — ${reminder.cancelledReason.replace(/_/g, ' ')}` : ''}`}
                  {reminder?.status === 'FAILED' && 'Failed to send'}
                </p>
              </div>

              {status && (
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full"
                    style={BADGE_STYLE[status]}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                  {status === 'FAILED' && onRetry && reminder && (
                    <button
                      className="text-xs font-semibold hover:underline disabled:opacity-50"
                      style={{ color: '#7C3AED' }}
                      disabled={retrying === reminder.id}
                      onClick={async () => {
                        setRetrying(reminder.id)
                        try { await onRetry(reminder.id) } finally { setRetrying(null) }
                      }}
                    >
                      {retrying === reminder.id ? 'Retrying…' : 'Retry'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
