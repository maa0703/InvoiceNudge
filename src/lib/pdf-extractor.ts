// pdf-parse is CJS-only and listed in serverExternalPackages so Turbopack never bundles it.
// Running unbundled in Node.js avoids the DOMMatrix (browser-only) initialisation error.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>

const MONTH_MAP: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: string): string {
  return n.padStart(2, '0')
}

// Parse a raw string that may contain a date in many formats → YYYY-MM-DD or null
function parseDate(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, ' ')

  // ISO: 2024-12-15
  let m = s.match(/\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`

  // "December 15, 2024" / "Dec 15, 2024" / "Dec. 15 2024"
  m = s.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})[,\s]+(\d{4})\b/)
  if (m) {
    const mo = MONTH_MAP[m[1].toLowerCase()]
    if (mo) return `${m[3]}-${mo}-${pad(m[2])}`
  }

  // "15 December 2024" / "15 Dec 2024"
  m = s.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/)
  if (m) {
    const mo = MONTH_MAP[m[2].toLowerCase()]
    if (mo) return `${m[3]}-${mo}-${pad(m[1])}`
  }

  // "15-Dec-2024" / "15.Dec.24"
  m = s.match(/\b(\d{1,2})[\/\-\.]([A-Za-z]{3,9})[\/\-\.](\d{2,4})\b/)
  if (m) {
    const mo = MONTH_MAP[m[2].toLowerCase()]
    if (mo) {
      const y = m[3].length === 2 ? `20${m[3]}` : m[3]
      return `${y}-${mo}-${pad(m[1])}`
    }
  }

  // Numeric: NN/NN/YYYY (handles MM/DD vs DD/MM ambiguity)
  m = s.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/)
  if (m) {
    const [, a, b, yr] = m
    const y = yr.length === 2 ? `20${yr}` : yr
    // If a > 12, it must be the day (DD/MM/YYYY)
    if (parseInt(a) > 12) return `${y}-${pad(b)}-${pad(a)}`
    // If b > 12, it must be the month part that is valid → MM/DD/YYYY
    if (parseInt(b) > 12) return `${y}-${pad(a)}-${pad(b)}`
    // Ambiguous: default MM/DD/YYYY (most common in US SaaS invoices)
    return `${y}-${pad(a)}-${pad(b)}`
  }

  return null
}

// Parse a numeric string in US (1,234.56) or European (1.234,56) format → number
function parseAmount(raw: string): number | null {
  const s = raw.replace(/\s/g, '')
  if (!s || !/\d/.test(s)) return null

  // European with thousands dots: 1.234,56 or 1.234
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || null
  }
  // European no-thousands: 1234,56
  if (/^\d+,\d{1,2}$/.test(s)) {
    return parseFloat(s.replace(',', '.')) || null
  }
  // US: 1,234.56 or plain 1234.56
  return parseFloat(s.replace(/,/g, '')) || null
}

// ── Amount ────────────────────────────────────────────────────────────────────
// Patterns in priority order; for each we take the LAST match in the text
// because the grand total summary always appears at the bottom of the invoice.

const AMOUNT_PATTERNS: RegExp[] = [
  /grand\s+total[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /total\s+amount\s+(?:due|payable|outstanding)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /amount\s+(?:due|payable|outstanding)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /(?:balance|outstanding)\s+(?:due|payable)?[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /total\s+(?:due|payable)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /\bdue[\s:]+[$£€¥₹₽]\s*([\d,. ]+)/gi,
  // "Total" but NOT Subtotal / Total Tax / Total VAT / Total Discount etc.
  /(?<![A-Za-z])total(?!\s*[-:]?\s*(?:tax|vat|gst|hst|discount|items|hours|qty|due\s*date|price|of\b))[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  // Currency symbol immediately before a number (last = grand total)
  /[$£€¥₹₽]\s*([\d,. ]+)/g,
]

function extractAmount(text: string): number | null {
  for (const re of AMOUNT_PATTERNS) {
    re.lastIndex = 0
    const matches = [...text.matchAll(re)]
    if (matches.length === 0) continue

    for (let i = matches.length - 1; i >= 0; i--) {
      const raw = matches[i][1]?.trim()
      if (!raw || raw.length > 20) continue
      const n = parseAmount(raw)
      if (n && n > 0 && n < 10_000_000) return n
    }
  }
  return null
}

// ── Due date ──────────────────────────────────────────────────────────────────

function extractDueDate(text: string): string | null {
  // Explicit labels first
  const labelRe = /(?:due\s+date|payment\s+due(?:\s+(?:by|on))?|due\s+(?:by|on|before)|pay(?:able)?(?:\s+(?:by|on|before))?|payment\s+deadline|payable\s+(?:by|on))[\s:]+([^\n]{4,40})/gi

  for (const m of text.matchAll(labelRe)) {
    const parsed = parseDate(m[1])
    if (parsed) return parsed
  }

  // Fallback: "due" keyword + date-looking value
  for (const m of text.matchAll(/\bdue[\s:]+([^\n]{4,25})/gi)) {
    const parsed = parseDate(m[1])
    if (parsed) return parsed
  }

  return null
}

// ── Invoice reference ─────────────────────────────────────────────────────────

const REF_PATTERNS: RegExp[] = [
  /invoice\s*(?:no\.?|number|num\.?|#|id)?[\s:=]+([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  /\binv\.?\s*(?:no\.?|#|id)?[\s:=]+([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  /\bbill\s*(?:no\.?|#|id)?[\s:=]+([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  /\b(?:reference|ref)\.?[\s:]+([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  /\btransaction\s*(?:id|#|no\.?)?[\s:=]+([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
]

function extractInvoiceRef(text: string): string | null {
  for (const re of REF_PATTERNS) {
    re.lastIndex = 0
    const m = re.exec(text)
    if (!m) continue
    const val = m[1].trim()
    // Skip if it looks like a date
    if (/^\d{4}[\/\-\.]\d/.test(val)) continue
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]/.test(val)) continue
    if (val.length < 1 || val.length > 30) continue
    return val
  }
  return null
}

// ── Email ─────────────────────────────────────────────────────────────────────

function extractEmail(text: string): string | null {
  const all = [...text.matchAll(/\b([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b/g)]
  if (all.length === 0) return null
  // Prefer real client addresses over generic/system ones
  const real = all.find(
    (m) => !/^(?:noreply|no-reply|donotreply|do-not-reply|info|support|help|admin|hello|contact|accounts|billing|invoice)@/i.test(m[1]),
  )
  return (real ?? all[0])[1]
}

// ── Main export ───────────────────────────────────────────────────────────────

export type ExtractedInvoice = {
  amount: number | null
  dueDate: string | null
  invoiceRef: string | null
  clientEmail: string | null
  confidence: 'high' | 'low'
}

export async function extractInvoiceFields(buffer: Buffer): Promise<ExtractedInvoice> {
  const { text } = await pdfParse(buffer)

  const amount = extractAmount(text)
  const dueDate = extractDueDate(text)
  const invoiceRef = extractInvoiceRef(text)
  const clientEmail = extractEmail(text)

  const nonNull = [amount, dueDate, clientEmail].filter(Boolean).length

  return {
    amount,
    dueDate,
    invoiceRef,
    clientEmail,
    confidence: nonNull >= 2 ? 'high' : 'low',
  }
}
