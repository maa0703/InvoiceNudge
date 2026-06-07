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
    console.error('[POST /api/v1/billing/cancel] getCurrentUser failed', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await billingService.cancelSubscription(
      user.id,
      user.stripeSubscriptionId,
    )
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof BillingError && error.code === 'NO_SUBSCRIPTION') {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[POST /api/v1/billing/cancel]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
