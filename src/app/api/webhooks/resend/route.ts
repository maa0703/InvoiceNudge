import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import * as reminderRepo from '@/server/reminder.repo'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@invoicenudge.com'

export async function POST(req: NextRequest) {
  let body: { type: string; data: { email_id: string } }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = body

  if (type !== 'email.bounced' && type !== 'email.delivery_delayed') {
    return NextResponse.json({ received: true })
  }

  const providerId = data?.email_id
  if (!providerId) {
    return NextResponse.json({ error: 'Missing email_id' }, { status: 400 })
  }

  try {
    const reminder = await reminderRepo.findByProviderId(providerId)
    if (!reminder) {
      return NextResponse.json({ received: true })
    }

    await reminderRepo.markFailed(reminder.id, reminder.userId, `resend:${type}`)

    const invoiceRef = reminder.invoice.invoiceRef ?? reminder.invoiceId
    const clientEmail = reminder.invoice.client.email

    await resend.emails.send({
      from: FROM_EMAIL,
      to: reminder.user.replyToEmail,
      subject: `Reminder delivery failed for invoice ${invoiceRef}`,
      html: `<p>Hi,</p>
<p>A reminder email for invoice <strong>${invoiceRef}</strong> could not be delivered to <strong>${clientEmail}</strong>.</p>
<p>Reason: <code>${type}</code>.</p>
<p>Please check your Resend dashboard and consider following up with your client directly.</p>`,
    })
  } catch (err) {
    console.error('[webhooks/resend]', { type, providerId }, err)
  }

  return NextResponse.json({ received: true })
}
