import { Suspense } from 'react'
import { CancelContent } from './cancel-content'

export default function ReminderCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense
        fallback={
          <p className="text-sm text-gray-500 text-center">Loading…</p>
        }
      >
        <CancelContent />
      </Suspense>
    </div>
  )
}
