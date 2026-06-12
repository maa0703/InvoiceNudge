import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { updateUserSchema } from '@/lib/validations'
import * as userService from '@/server/user.service'
import * as billingService from '@/server/billing.service'

function safeUser(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  subscriptionPeriodEnd: number | null = null,
) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailSignatureName: user.emailSignatureName,
    replyToEmail: user.replyToEmail,
    plan: user.plan,
    subscriptionCancelled: !!user.subscriptionCancelledAt,
    subscriptionPeriodEnd,
  }
}

export async function GET(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error('[GET /api/v1/users/me] getCurrentUser failed', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let subscriptionPeriodEnd: number | null = null
  if (user.subscriptionCancelledAt && user.stripeSubscriptionId) {
    subscriptionPeriodEnd = await billingService.getSubscriptionPeriodEnd(user.stripeSubscriptionId)
  }

  return NextResponse.json({ user: safeUser(user, subscriptionPeriodEnd) })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error('[PATCH /api/v1/users/me] getCurrentUser failed', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 422 })
  }

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const updated = await userService.updateUser(user.id, parsed.data)
    return NextResponse.json({ user: safeUser(updated) })
  } catch (error) {
    console.error('[PATCH /api/v1/users/me]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
