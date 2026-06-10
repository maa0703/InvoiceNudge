import { randomUUID } from 'crypto'
import { InvoiceStatus, Plan, ReminderStatus } from '@prisma/client'
import { db } from '@/lib/db'
import * as invoiceRepo from '@/server/invoice.repo'
import * as clientRepo from '@/server/client.repo'
import * as reminderRepo from '@/server/reminder.repo'
import type { CreateInvoiceInput } from '@/lib/validations'

export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function subHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000)
}

export async function getInvoices(userId: string, statusFilter?: InvoiceStatus) {
  return invoiceRepo.findAllByUser(userId, statusFilter)
}

export async function getInvoice(userId: string, invoiceId: string) {
  const invoice = await invoiceRepo.findById(userId, invoiceId)
  if (!invoice) throw new ServiceError('NOT_FOUND', 'Invoice not found.')
  return invoice
}

export async function createInvoice(
  userId: string,
  data: CreateInvoiceInput,
  plan: Plan,
) {
  if (plan === Plan.FREE) {
    const count = await invoiceRepo.countActive(userId)
    if (count >= 3) {
      throw new ServiceError('PLAN_LIMIT', "You've reached the free plan limit.")
    }
  }

  if (data.invoiceRef) {
    const duplicate = await invoiceRepo.findByRef(userId, data.invoiceRef)
    if (duplicate) {
      throw new ServiceError('DUPLICATE_REF', 'An invoice with this reference already exists.')
    }
  }

  const client = await clientRepo.upsertByEmail(userId, data.clientEmail, data.clientName)
  return invoiceRepo.create(userId, client.id, {
    amount: data.amount,
    currency: data.currency,
    dueDate: new Date(data.dueDate),
    invoiceRef: data.invoiceRef,
  })
}

export async function activateInvoice(userId: string, invoiceId: string) {
  const invoice = await invoiceRepo.findById(userId, invoiceId)
  if (!invoice) throw new ServiceError('NOT_FOUND', 'Invoice not found.')
  if (invoice.status !== InvoiceStatus.DRAFT) {
    throw new ServiceError('NOT_DRAFT', 'This invoice is already active or has been cancelled.')
  }

  const steps = ([1, 5, 10, 20] as const).map((days, index) => {
    const scheduledAt = addDays(invoice.dueDate, days)
    return {
      step: index + 1,
      scheduledAt,
      checkinAt: subHours(scheduledAt, 3),
      checkinToken: randomUUID(),
    }
  })

  const reminders = await reminderRepo.createBatch(invoiceId, userId, steps)
  const updated = await invoiceRepo.updateStatus(userId, invoiceId, InvoiceStatus.ACTIVE)
  return { invoice: updated, reminders }
}

export async function markPaid(userId: string, invoiceId: string) {
  const invoice = await invoiceRepo.findById(userId, invoiceId)
  if (!invoice) throw new ServiceError('NOT_FOUND', 'Invoice not found.')
  if (invoice.status === InvoiceStatus.PAID) {
    throw new ServiceError('ALREADY_PAID', 'Invoice is already marked as paid.')
  }

  // db.$transaction is used directly here because this update spans two models atomically
  const { updatedInvoice, cancelledCount } = await db.$transaction(async (tx) => {
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId, userId },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
    })
    const { count: cancelledCount } = await tx.reminder.updateMany({
      where: { invoiceId, status: ReminderStatus.SCHEDULED },
      data: { status: ReminderStatus.CANCELLED, cancelledReason: 'paid' },
    })
    return { updatedInvoice, cancelledCount }
  })

  return { invoice: updatedInvoice, cancelledCount }
}

export async function cancelInvoice(userId: string, invoiceId: string) {
  const invoice = await invoiceRepo.findById(userId, invoiceId)
  if (!invoice) throw new ServiceError('NOT_FOUND', 'Invoice not found.')
  if (([InvoiceStatus.PAID, InvoiceStatus.CANCELLED] as InvoiceStatus[]).includes(invoice.status)) {
    throw new ServiceError('INVALID_STATUS', 'Invoice cannot be cancelled in its current state.')
  }

  const cancelledCount = await reminderRepo.cancelByInvoice(invoiceId, 'manual')
  await invoiceRepo.updateStatus(userId, invoiceId, InvoiceStatus.CANCELLED)
  return { cancelledCount }
}

export async function deleteInvoice(userId: string, invoiceId: string) {
  const invoice = await invoiceRepo.findById(userId, invoiceId)
  if (!invoice) throw new ServiceError('NOT_FOUND', 'Invoice not found.')
  await reminderRepo.cancelByInvoice(invoiceId, 'manual')
  await invoiceRepo.softDelete(userId, invoiceId)
}
