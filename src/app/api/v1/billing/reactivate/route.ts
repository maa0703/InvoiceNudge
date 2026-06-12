import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import * as billingService from '@/server/billing.service'
import { BillingError } from '@/server/billing.service'

export async function POST(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error('[POST /api/v1/billing/reactivate] getCurrentUser failed', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.plan !== 'PRO' || !user.subscriptionCancelledAt) {
    return NextResponse.json({ error: 'No cancellation to revert.' }, { status: 409 })
  }

  try {
    const result = await billingService.reactivateSubscription(user.id, user.stripeSubscriptionId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[POST /api/v1/billing/reactivate]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
