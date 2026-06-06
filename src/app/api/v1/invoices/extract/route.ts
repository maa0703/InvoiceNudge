import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { extractInvoiceFields } from '@/lib/pdf-extractor'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 422 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
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
