import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { InvoiceStatus } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { createInvoiceSchema } from '@/lib/validations'
import * as invoiceService from '@/server/invoice.service'
import { ServiceError } from '@/server/invoice.service'

async function getDbUser() {
  try {
    return await getCurrentUser()
  } catch (error) {
    console.error('[invoices] getCurrentUser failed', error)
    return null
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const statusParam = req.nextUrl.searchParams.get('status')
    const statusFilter =
      statusParam && Object.values(InvoiceStatus).includes(statusParam as InvoiceStatus)
        ? (statusParam as InvoiceStatus)
        : undefined

    const invoices = await invoiceService.getInvoices(user.id, statusFilter)
    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('[GET /api/v1/invoices]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 422 })
  }

  const parsed = createInvoiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }

  try {
    const invoice = await invoiceService.createInvoice(user.id, parsed.data, user.plan)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    if (error instanceof ServiceError) {
      if (error.code === 'PLAN_LIMIT') return NextResponse.json({ error: error.message }, { status: 403 })
      if (error.code === 'DUPLICATE_REF') return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[POST /api/v1/invoices]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
