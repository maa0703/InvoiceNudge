import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import * as invoiceService from '@/server/invoice.service'
import { ServiceError } from '@/server/invoice.service'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error('[POST /api/v1/invoices/[id]/activate] getCurrentUser failed', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await invoiceService.activateInvoice(user.id, id)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ServiceError) {
      if (error.code === 'NOT_FOUND') return NextResponse.json({ error: error.message }, { status: 404 })
      if (error.code === 'NOT_DRAFT') return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[POST /api/v1/invoices/[id]/activate]', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
