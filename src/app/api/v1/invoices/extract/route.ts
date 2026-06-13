import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { extractInvoiceFields } from '@/lib/pdf-extractor'
import { rateLimit } from '@/lib/rate-limit'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(userId, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 })
  }

  const looksLikePdf =
    file.type === 'application/pdf' ||
    file.type === 'application/x-pdf' ||
    file.name.toLowerCase().endsWith('.pdf')

  if (!looksLikePdf) {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 422 })
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch (error) {
    console.error('[POST /api/v1/invoices/extract] arrayBuffer failed', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }

  // Quick magic-byte check — PDF files start with %PDF
  if (buffer.length < 4 || buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
    return NextResponse.json({ error: 'File does not appear to be a valid PDF' }, { status: 422 })
  }

  try {
    const fields = await extractInvoiceFields(buffer)
    return NextResponse.json(fields)
  } catch (error) {
    console.error('[POST /api/v1/invoices/extract]', error)
    return NextResponse.json(
      { error: "Couldn't read this PDF — please fill in the details manually." },
      { status: 422 },
    )
  }
}
