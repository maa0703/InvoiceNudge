import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import * as billingService from '@/server/billing.service'
import { isStripeError } from '@/server/billing.service'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(userId, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let user: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error('[POST /api/v1/billing/checkout] getCurrentUser failed', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await billingService.createCheckout(
      user.id,
      user.stripeCustomerId,
      user.email,
    )
    return NextResponse.json(result)
  } catch (error) {
    if (isStripeError(error)) {
      console.error('[POST /api/v1/billing/checkout] Stripe error', {
        type: error.type,
        code: error.code,
        message: error.message,
      })
      return NextResponse.json(
        { error: 'Payment service error. Please try again.' },
        { status: 502 },
      )
    }
    console.error('[POST /api/v1/billing/checkout]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
