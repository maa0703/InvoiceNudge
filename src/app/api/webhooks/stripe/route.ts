import { NextRequest, NextResponse, after } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { resend } from '@/lib/resend'
import { db } from '@/lib/db'
import { Plan } from '@prisma/client'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret)
  } catch (err) {
    console.error('[stripe webhook] Invalid signature', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  after(async () => {
    switch (event.type) {
      case 'checkout.session.completed': {
        try {
          const session = event.data.object as Stripe.Checkout.Session
          const customerId = session.customer as string
          const subscriptionId = session.subscription as string
          const uc = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
          if (uc && uc.plan !== Plan.PRO) {
            await db.user.update({
              where: { id: uc.id },
              data: { plan: Plan.PRO, stripeSubscriptionId: subscriptionId },
            })
          }
        } catch (err) {
          console.error('[stripe webhook] checkout.session.completed failed', err)
        }
        break
      }

      case 'customer.subscription.updated': {
        try {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string
          const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
          if (user) {
            if (sub.status === 'active') {
              await db.user.update({
                where: { id: user.id },
                data: {
                  plan: Plan.PRO,
                  stripeSubscriptionId: sub.id,
                  // Clear cancelled flag only if Stripe shows the sub is no longer set to cancel
                  subscriptionCancelledAt: sub.cancel_at_period_end
                    ? user.subscriptionCancelledAt
                    : null,
                },
              })
            } else if (sub.status === 'past_due' || sub.status === 'unpaid') {
              await db.user.update({
                where: { id: user.id },
                data: { plan: Plan.FREE, stripeSubscriptionId: null, subscriptionCancelledAt: null },
              })
            }
          }
        } catch (err) {
          console.error('[stripe webhook] customer.subscription.updated failed', err)
        }
        break
      }

      case 'customer.subscription.deleted': {
        try {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string
          const us = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
          if (us) {
            await db.user.update({
              where: { id: us.id },
              data: { plan: Plan.FREE, stripeSubscriptionId: null, subscriptionCancelledAt: null },
            })
          }
        } catch (err) {
          console.error('[stripe webhook] customer.subscription.deleted failed', err)
        }
        break
      }

      case 'invoice.payment_failed': {
        try {
          const inv = event.data.object as Stripe.Invoice
          const customerId = inv.customer as string
          const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
          if (user) {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL ?? 'noreply@invoicenudge.com',
              to: user.email,
              subject: 'Action required: subscription payment failed',
              html: `<p>Hi,</p>
<p>We were unable to process your InvoiceNudge Pro subscription payment.</p>
<p>Please update your payment method to keep your Pro features active.</p>
<p>If you need help, reply to this email.</p>`,
            })
          }
        } catch (err) {
          console.error('[stripe webhook] invoice.payment_failed failed', err)
        }
        break
      }
    }
  })

  return NextResponse.json({ received: true })
}
