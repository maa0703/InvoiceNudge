// pdf-parse ships CJS only; require() avoids the ESM interop mismatch
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buf: Buffer,
) => Promise<{ text: string; numpages: number }>

export type ExtractedInvoice = {
  amount?: string
  dueDate?: string
  invoiceRef?: string
  clientEmail?: string
  confidence: number // 0–1 fraction of fields successfully extracted
}

// TODO: Implement regex extraction per field — no AI, pure pattern matching
export async function extractInvoiceFields(buffer: Buffer): Promise<ExtractedInvoice> {
  const data = await pdfParse(buffer)
  const text = data.text

  const amount = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/)?.[1]?.replace(',', '')
  const dueDate = text.match(/due\s*(?:date)?[:\s]+([\d]{4}-[\d]{2}-[\d]{2})/i)?.[1]
  const invoiceRef = text.match(/invoice\s*(?:#|no\.?|number)?[:\s]+([A-Z0-9-]+)/i)?.[1]
  const clientEmail = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]

  const fields = [amount, dueDate, invoiceRef, clientEmail]
  const confidence = fields.filter(Boolean).length / fields.length

  return { amount, dueDate, invoiceRef, clientEmail, confidence }
}
