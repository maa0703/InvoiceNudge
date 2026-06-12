import { type Invoice, type Prisma, InvoiceStatus } from '@prisma/client'
import { db } from '@/lib/db'

export type InvoiceWithClient = Prisma.InvoiceGetPayload<{
  include: { client: true }
}>

export type InvoiceWithReminders = Prisma.InvoiceGetPayload<{
  include: { reminders: { orderBy: { step: 'asc' } } }
}>

export type InvoiceWithDetails = Prisma.InvoiceGetPayload<{
  include: {
    client: true
    reminders: { orderBy: { step: 'asc' } }
  }
}>

export type CreateInvoiceData = {
  amount: Prisma.Decimal | string | number
  currency?: 'USD' | 'EUR' | 'GBP'
  dueDate: Date
  invoiceRef?: string
}

export async function findAllByUser(
  userId: string,
  statusFilter?: InvoiceStatus,
): Promise<InvoiceWithClient[]> {
  return db.invoice.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(statusFilter !== undefined ? { status: statusFilter } : {}),
    },
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findById(
  userId: string,
  invoiceId: string,
): Promise<InvoiceWithDetails | null> {
  return db.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    include: {
      client: true,
      reminders: { orderBy: { step: 'asc' } },
    },
  })
}

export async function countActive(userId: string): Promise<number> {
  return db.invoice.count({
    where: {
      userId,
      status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.ACTIVE] },
      deletedAt: null,
    },
  })
}

export async function create(
  userId: string,
  clientId: string,
  data: CreateInvoiceData,
): Promise<Invoice> {
  return db.invoice.create({
    data: {
      userId,
      clientId,
      amount: data.amount,
      currency: data.currency ?? 'USD',
      dueDate: data.dueDate,
      invoiceRef: data.invoiceRef,
    },
  })
}

export async function findByRef(userId: string, invoiceRef: string): Promise<Invoice | null> {
  return db.invoice.findFirst({
    where: { userId, invoiceRef, deletedAt: null },
  })
}

export async function updateStatus(
  userId: string,
  invoiceId: string,
  status: InvoiceStatus,
  extra?: { paidAt?: Date },
): Promise<Invoice> {
  return db.invoice.update({
    where: { id: invoiceId, userId },
    data: { status, ...extra },
  })
}

export async function updateDraft(
  userId: string,
  invoiceId: string,
  clientId: string,
  data: { amount: number; currency: 'USD' | 'EUR' | 'GBP'; dueDate: Date; invoiceRef?: string },
): Promise<Invoice> {
  return db.invoice.update({
    where: { id: invoiceId, userId },
    data: {
      clientId,
      amount: data.amount,
      currency: data.currency,
      dueDate: data.dueDate,
      invoiceRef: data.invoiceRef ?? null,
    },
  })
}

export async function softDelete(userId: string, invoiceId: string): Promise<void> {
  await db.invoice.update({
    where: { id: invoiceId, userId },
    data: { deletedAt: new Date() },
  })
}
