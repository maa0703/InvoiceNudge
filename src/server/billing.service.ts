import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

if (!process.env.STRIPE_PRO_PRICE_ID) {
  throw new Error('STRIPE_PRO_PRICE_ID is not set')
}

export class BillingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'BillingError'
  }
}

export async function createCheckout(
  userId: string,
  stripeCustomerId: string | null,
  userEmail: string,
) {
  let customerId = stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({ email: userEmail })
    customerId = customer.id
    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?activated=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/settings`,
    metadata: { userId },
  })

  return { url: session.url }
}

export async function cancelSubscription(
  userId: string,
  stripeSubscriptionId: string | null,
) {
  if (!stripeSubscriptionId) {
    throw new BillingError('NO_SUBSCRIPTION', 'No active subscription found.')
  }

  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  // In Stripe API 2024-06-20+, current_period_end moved to SubscriptionItem
  const accessUntil = subscription.items.data[0]?.current_period_end ?? 0

  await db.user.update({
    where: { id: userId },
    data: { subscriptionCancelledAt: new Date() },
  })

  return { accessUntil }
}

export async function reactivateSubscription(
  userId: string,
  stripeSubscriptionId: string | null,
) {
  if (!stripeSubscriptionId) {
    throw new BillingError('NO_SUBSCRIPTION', 'No cancellation to revert.')
  }

  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  })

  await db.user.update({
    where: { id: userId },
    data: { subscriptionCancelledAt: null },
  })

  return { reactivated: true }
}

export async function getSubscriptionPeriodEnd(stripeSubscriptionId: string): Promise<number | null> {
  try {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    return sub.items.data[0]?.current_period_end ?? null
  } catch {
    return null
  }
}

export function isStripeError(
  error: unknown,
): error is InstanceType<typeof Stripe.errors.StripeError> {
  return error instanceof Stripe.errors.StripeError
}
