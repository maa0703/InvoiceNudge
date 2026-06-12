import { NextRequest, NextResponse } from 'next/server'
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const uc = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (uc) {
          await db.user.update({
            where: { id: uc.id },
            data: { plan: Plan.PRO, stripeSubscriptionId: subscriptionId },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const us = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (us) {
          await db.user.update({
            where: { id: us.id },
            data: { plan: Plan.FREE, stripeSubscriptionId: null, subscriptionCancelledAt: null },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
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
        break
      }
    }
  } catch (err) {
    console.error('[stripe webhook] Handler error', err)
  }

  return NextResponse.json({ received: true })
}
