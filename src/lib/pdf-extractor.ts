// pdf-parse ships CJS only; require() avoids the ESM interop mismatch
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>

const patterns = {
  amount: /(?:total|amount due|balance due|amount)[^\d]*(\d{1,6}[.,]\d{2})/i,
  dueDate: /(?:due date|payment due|pay by|due)[^\d]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
  invoiceRef: /(?:invoice\s*(?:no|#|number)?|inv\s*(?:no|#)?)[^\w]*([\w\-]+)/i,
  email: /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
}

function normaliseDate(raw: string): string | null {
  const parts = raw.split(/[\/\-\.]/)
  if (parts.length !== 3) return null
  const [a, b, c] = parts
  if (c.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
  if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`
  return null
}

export type ExtractedInvoice = {
  amount: number | null
  dueDate: string | null
  invoiceRef: string | null
  clientEmail: string | null
  confidence: 'high' | 'low'
}

export async function extractInvoiceFields(buffer: Buffer): Promise<ExtractedInvoice> {
  const { text } = await pdfParse(buffer)

  const rawAmount = text.match(patterns.amount)?.[1]?.replace(',', '.') ?? null
  const rawDate = text.match(patterns.dueDate)?.[1] ?? null
  const invoiceRef = text.match(patterns.invoiceRef)?.[1] ?? null
  const clientEmail = text.match(patterns.email)?.[0] ?? null

  const amount = rawAmount ? parseFloat(rawAmount) : null
  const dueDate = rawDate ? normaliseDate(rawDate) : null

  const nonNull = [amount, dueDate, clientEmail].filter(Boolean).length

  return {
    amount,
    dueDate,
    invoiceRef,
    clientEmail,
    confidence: nonNull >= 2 ? 'high' : 'low',
  }
}
