import { type Prisma, type Reminder, ReminderStatus } from '@prisma/client'
import { db } from '@/lib/db'

export type CreateReminderData = {
  step: number
  scheduledAt: Date
  checkinAt: Date
  checkinToken: string
}

export type ReminderWithInvoiceAndUser = Prisma.ReminderGetPayload<{
  include: {
    invoice: {
      select: {
        amount: true
        currency: true
        dueDate: true
        invoiceRef: true
        client: { select: { name: true; email: true } }
      }
    }
    user: { select: { displayName: true; emailSignatureName: true; replyToEmail: true } }
  }
}>

export async function createBatch(
  invoiceId: string,
  userId: string,
  reminders: CreateReminderData[],
): Promise<Reminder[]> {
  return db.$transaction(
    reminders.map((r) =>
      db.reminder.create({
        data: { invoiceId, userId, ...r },
      }),
    ),
  )
}

export async function findByInvoice(invoiceId: string): Promise<Reminder[]> {
  return db.reminder.findMany({
    where: { invoiceId },
    orderBy: { step: 'asc' },
  })
}

const dueInclude = {
  invoice: {
    select: {
      amount: true,
      currency: true,
      dueDate: true,
      invoiceRef: true,
      client: { select: { name: true, email: true } },
    },
  },
  user: { select: { displayName: true, emailSignatureName: true, replyToEmail: true } },
} satisfies Prisma.ReminderInclude

export async function findDueCheckins(): Promise<ReminderWithInvoiceAndUser[]> {
  return db.reminder.findMany({
    where: {
      status: ReminderStatus.SCHEDULED,
      checkinAt: { lte: new Date() },
      checkinSentAt: null,
    },
    include: dueInclude,
    orderBy: { checkinAt: 'asc' },
    take: 100,
  })
}

export async function findDueReminders(): Promise<ReminderWithInvoiceAndUser[]> {
  return db.reminder.findMany({
    where: {
      status: ReminderStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
    include: dueInclude,
    orderBy: { scheduledAt: 'asc' },
    take: 100,
  })
}

export async function markCheckinSent(reminderId: string): Promise<void> {
  await db.reminder.update({
    where: { id: reminderId },
    data: { checkinSentAt: new Date() },
  })
}

export async function markSent(reminderId: string, providerId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const { userId } = await tx.reminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.SENT, sentAt: new Date() },
      select: { userId: true },
    })
    await tx.reminderLog.create({
      data: { reminderId, userId, event: 'reminder_sent', providerId },
    })
  })
}

export async function markFailed(
  reminderId: string,
  userId: string,
  errorMsg: string,
): Promise<void> {
  await db.$transaction([
    db.reminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.FAILED },
    }),
    db.reminderLog.create({
      data: { reminderId, userId, event: 'failed', errorMsg },
    }),
  ])
}

export async function cancelByInvoice(invoiceId: string, reason: string): Promise<number> {
  const result = await db.reminder.updateMany({
    where: { invoiceId, status: ReminderStatus.SCHEDULED },
    data: { status: ReminderStatus.CANCELLED, cancelledReason: reason },
  })
  return result.count
}

export async function cancelByToken(token: string): Promise<Reminder | null> {
  const reminder = await db.reminder.findFirst({
    where: { checkinToken: token, status: ReminderStatus.SCHEDULED },
  })

  if (!reminder) return null

  // Token is valid only until the reminder fires (checkinAt + 3 hours)
  const expiresAt = new Date(reminder.checkinAt.getTime() + 3 * 60 * 60 * 1000)
  if (expiresAt < new Date()) return null

  return db.reminder.update({
    where: { id: reminder.id },
    data: { status: ReminderStatus.CANCELLED, cancelledReason: 'checkin_cancelled' },
  })
}

export async function findExpiredTokens(): Promise<Reminder[]> {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
  return db.reminder.findMany({
    where: {
      status: ReminderStatus.SENT,
      checkinAt: { lt: fourHoursAgo },
      checkinToken: { not: null },
    },
  })
}

export async function clearCheckinTokens(ids: string[]): Promise<void> {
  await db.reminder.updateMany({
    where: { id: { in: ids } },
    data: { checkinToken: null },
  })
}

export async function findByProviderId(
  providerId: string,
): Promise<ReminderWithInvoiceAndUser | null> {
  const log = await db.reminderLog.findFirst({
    where: { providerId },
    select: { reminderId: true },
  })
  if (!log) return null
  return db.reminder.findUnique({
    where: { id: log.reminderId },
    include: dueInclude,
  })
}
