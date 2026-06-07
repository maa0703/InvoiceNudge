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

const STEP_LABEL = ['', 'Reminder 1 (day +5)', 'Reminder 2 (day +10)', 'Reminder 3 (day +15)', 'Reminder 4 (day +20)']

const STATUS_DOT: Record<ReminderStatus, string> = {
  SCHEDULED: 'bg-blue-400',
  SENT: 'bg-emerald-400',
  CANCELLED: 'bg-gray-300',
  FAILED: 'bg-red-400',
}

const STATUS_LABEL: Record<ReminderStatus, string> = {
  SCHEDULED: 'Scheduled',
  SENT: 'Sent',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function ReminderTimeline({ reminders, onRetry }: Props) {
  const [retrying, setRetrying] = useState<string | null>(null)

  const steps = [1, 2, 3, 4].map((step) => ({
    step,
    reminder: reminders.find((r) => r.step === step) ?? null,
  }))

  return (
    <div className="space-y-2">
      {steps.map(({ step, reminder }) => (
        <div
          key={step}
          className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg"
        >
          <div
            className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
              reminder ? STATUS_DOT[reminder.status] : 'bg-gray-200'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900">{STEP_LABEL[step]}</span>
              {reminder && (
                <span className="text-xs text-gray-400">{STATUS_LABEL[reminder.status]}</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {!reminder && 'Not yet scheduled'}
              {reminder?.status === 'SENT' && reminder.sentAt && `Sent ${fmtDateTime(reminder.sentAt)}`}
              {reminder?.status === 'SCHEDULED' && `Scheduled for ${fmtDate(reminder.scheduledAt)}`}
              {reminder?.status === 'CANCELLED' &&
                `Cancelled${reminder.cancelledReason ? ` — ${reminder.cancelledReason.replace(/_/g, ' ')}` : ''}`}
              {reminder?.status === 'FAILED' && (
                <span className="flex items-center gap-2">
                  Failed to send
                  {onRetry && (
                    <button
                      className="text-[#4F46E5] underline disabled:opacity-50"
                      disabled={retrying === reminder.id}
                      onClick={async () => {
                        setRetrying(reminder.id)
                        try {
                          await onRetry(reminder.id)
                        } finally {
                          setRetrying(null)
                        }
                      }}
                    >
                      {retrying === reminder.id ? 'Retrying…' : 'Retry'}
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
