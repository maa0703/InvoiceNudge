import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import * as reminderRepo from '@/server/reminder.repo'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@invoicenudge.com'
const SVIX_TOLERANCE_SECONDS = 300

function verifyResendSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string,
): boolean {
  // Replay-attack guard: reject requests older than 5 minutes
  const ts = parseInt(svixTimestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > SVIX_TOLERANCE_SECONDS) return false

  const payload = `${svixId}.${svixTimestamp}.${rawBody}`
  // Resend secrets are prefixed with "whsec_" followed by the Base64 signing key
  const keyBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expectedHmac = createHmac('sha256', keyBytes).update(payload, 'utf8').digest('base64')
  const expectedSig = `v1,${expectedHmac}`
  const expectedBuf = Buffer.from(expectedSig, 'ascii')

  // Multiple signatures may be present (key rotation) — any match is valid
  return svixSignature.split(' ').some((sig) => {
    const sigBuf = Buffer.from(sig, 'ascii')
    if (sigBuf.length !== expectedBuf.length) return false
    try {
      return timingSafeEqual(sigBuf, expectedBuf)
    } catch {
      return false
    }
  })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (webhookSecret) {
    const svixId = req.headers.get('svix-id') ?? ''
    const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
    const svixSignature = req.headers.get('svix-signature') ?? ''

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 400 })
    }

    if (!verifyResendSignature(rawBody, svixId, svixTimestamp, svixSignature, webhookSecret)) {
      console.error('[webhooks/resend] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  let body: { type: string; data: { email_id: string } }
  try {
    body = JSON.parse(rawBody)
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
