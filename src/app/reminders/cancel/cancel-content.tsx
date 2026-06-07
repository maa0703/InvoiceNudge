'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type State = 'loading' | 'success' | 'expired' | 'error'

export function CancelContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const reminderId = searchParams.get('id')
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    if (!token) {
      setState('expired')
      return
    }
    const path = reminderId
      ? `/api/v1/reminders/${reminderId}/checkin-cancel`
      : `/api/v1/reminders/_/checkin-cancel`

    fetch(`${path}?token=${encodeURIComponent(token)}`, { method: 'DELETE' })
      .then(async (res) => {
        if (res.ok) {
          setState('success')
        } else if (res.status === 401) {
          setState('expired')
        } else {
          setState('error')
        }
      })
      .catch(() => setState('error'))
  }, [token, reminderId])

  return (
    <div className="max-w-sm w-full text-center space-y-3">
      {state === 'loading' && (
        <p className="text-sm text-gray-500">Cancelling reminder…</p>
      )}

      {state === 'success' && (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Reminder cancelled</h1>
          <p className="text-sm text-gray-500">
            Your client won't receive anything today.
          </p>
        </>
      )}

      {state === 'expired' && (
        <>
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Link expired</h1>
          <p className="text-sm text-gray-500">
            This cancel link has expired. The reminder may have already been sent.
          </p>
        </>
      )}

      {state === 'error' && (
        <>
          <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-500">
            Unable to cancel this reminder. Please try again.
          </p>
        </>
      )}
    </div>
  )
}
