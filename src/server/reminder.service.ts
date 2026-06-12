import { InvoiceStatus } from '@prisma/client'
import { resend } from '@/lib/resend'
import * as reminderRepo from '@/server/reminder.repo'
import * as invoiceRepo from '@/server/invoice.repo'
import { checkin, reminder1, reminder2, reminder3, reminder4 } from '@/lib/email-templates'
import type { ReminderTemplateVars } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@invoicenudge.com'
const CHECKIN_FROM = process.env.RESEND_CHECKIN_FROM ?? 'noreply@invoicenudge.com'

const reminderTemplates = [reminder1, reminder2, reminder3, reminder4] as const

export async function processCheckins(): Promise<number> {
  const due = await reminderRepo.findDueCheckins()
  let processed = 0

  for (const reminder of due) {
    const { invoice, user } = reminder
    const client = invoice.client
    const amount = `${invoice.currency} ${Number(invoice.amount).toFixed(2)}`
    const invoiceRef = invoice.invoiceRef ?? 'your invoice'
    const dueDate = invoice.dueDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const cancelUrl = `${APP_URL}/reminders/cancel?token=${reminder.checkinToken}&id=${reminder.id}`

    const vars: ReminderTemplateVars = { clientName: client.name, invoiceRef, amount, dueDate, cancelUrl, displayName: user.displayName, signatureName: user.emailSignatureName || user.displayName }

    try {
      await resend.emails.send({
        from: CHECKIN_FROM,
        to: user.replyToEmail,
        ...checkin(vars),
      })
      await reminderRepo.markCheckinSent(reminder.id)
      processed++
    } catch (err) {
      console.error('[processCheckins] send failed', { reminderId: reminder.id }, err)
      // Do not mark checkinSentAt — retry on next cron cycle
    }
  }

  return processed
}

export async function processReminders(): Promise<number> {
  const due = await reminderRepo.findDueReminders()
  let processed = 0

  for (const reminder of due) {
    const { invoice, user } = reminder
    const client = invoice.client
    const amount = `${invoice.currency} ${Number(invoice.amount).toFixed(2)}`
    const dueDate = invoice.dueDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const invoiceRef = invoice.invoiceRef ?? ''

    const templateFn = reminderTemplates[reminder.step - 1]
    if (!templateFn) {
      console.error('[processReminders] invalid step', reminder.step, reminder.id)
      continue
    }

    const vars: ReminderTemplateVars = {
      clientName: client.name,
      invoiceRef,
      amount,
      dueDate,
      cancelUrl: '',
      displayName: user.displayName,
      signatureName: user.emailSignatureName || user.displayName,
    }
    const email = templateFn(vars)

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: user.replyToEmail,
        to: client.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      })
      if (error || !data) throw error ?? new Error('No data returned from Resend')

      await reminderRepo.markSent(reminder.id, data.id)

      if (reminder.step === 4) {
        await invoiceRepo.updateStatus(reminder.userId, reminder.invoiceId, InvoiceStatus.EXHAUSTED)
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.replyToEmail,
          subject: `All reminders sent for invoice ${invoiceRef || reminder.invoiceId}`,
          html: `<p>Hi,</p>
<p>All 4 reminders have been sent to <strong>${client.name}</strong> for invoice <strong>${invoiceRef || reminder.invoiceId}</strong> (${amount}).</p>
<p>No further automated emails will be sent. If the invoice is still unpaid, you may want to follow up directly.</p>`,
        })
      }

      processed++
    } catch (err) {
      console.error('[processReminders] send failed', { reminderId: reminder.id }, err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      await reminderRepo.markFailed(reminder.id, reminder.userId, errorMsg)
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.replyToEmail,
        subject: `Reminder delivery failed for ${client.name}`,
        html: `<p>Hi,</p>
<p>A reminder for invoice <strong>${invoiceRef || reminder.invoiceId}</strong> could not be delivered to <strong>${client.email}</strong>.</p>
<p>Please check your Resend dashboard for details, or send the reminder manually.</p>`,
      }).catch((e) => console.error('[processReminders] failure notification failed', e))
    }
  }

  return processed
}

export async function expireTokens(): Promise<number> {
  const expired = await reminderRepo.findExpiredTokens()
  if (expired.length === 0) return 0
  await reminderRepo.clearCheckinTokens(expired.map((r) => r.id))
  return expired.length
}
