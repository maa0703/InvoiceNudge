import { NextRequest, NextResponse } from 'next/server'
import { checkinCancelSchema } from '@/lib/validations'
import * as reminderRepo from '@/server/reminder.repo'

// No session auth — token-only route. Clerk is intentionally not called here.
export async function DELETE(req: NextRequest) {
  const tokenParam = req.nextUrl.searchParams.get('token')

  const parsed = checkinCancelSchema.safeParse({ token: tokenParam })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
  }

  try {
    const reminder = await reminderRepo.cancelByToken(parsed.data.token)

    if (!reminder) {
      return NextResponse.json({ error: 'This cancel link has expired.' }, { status: 401 })
    }

    return NextResponse.json({ reminder_id: reminder.id, cancelled: true })
  } catch (error) {
    console.error('[DELETE /api/v1/reminders/[id]/checkin-cancel]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
