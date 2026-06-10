// pdf-parse v2: class-based API — new PDFParse({ data: buffer }).getText()
import { createRequire } from 'node:module'
const { PDFParse } = createRequire(import.meta.url)('pdf-parse') as {
  PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }>; destroy(): Promise<void> }
}

// ── Stopwords ─────────────────────────────────────────────────────────────────
// Short plain-English words that should never be treated as invoice refs or client names
const REF_STOPWORDS = new Set([
  'from','to','for','by','of','the','and','a','an','or','at','in','on',
  'is','are','was','be','been','this','that','with','your','our','my',
  'us','me','you','date','due','pay','total','amount','please','see',
  'note','page','email','phone','address','name','client','invoice',
  'bill','sent','received','attached','enclosed','below','above',
  'subject','re','dear','hi','hello','thank','thanks','regards',
  'sincerely','here','item','number','num','id','no','yes','tax',
  'vat','gst','hst','subtotal','balance','new','old','last','first',
  'next','ref','net','gross','fee','rate','qty','qty','description',
])

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
  // Most specific first — grand total, total amount due
  /grand\s+total[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /total\s+amount\s+(?:due|payable|outstanding|owed)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /amount\s+(?:due|payable|outstanding|owed)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /(?:balance|outstanding)\s+(?:due|payable)?[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /total\s+(?:due|payable)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /(?:net\s+)?(?:total|amount)\s+to\s+(?:pay|be\s+paid)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /payment\s+(?:due|amount|total)[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  /\bdue[\s:]+[$£€¥₹₽]\s*([\d,. ]+)/gi,
  // "Amount: 1200" or "Amount\n1200" (multiline via \s)
  /\bamount\s*[:\s]\s*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  // "Total" — not subtotal/tax/vat/discount
  /(?<![A-Za-z])total(?!\s*[-:]?\s*(?:tax|vat|gst|hst|discount|items|hours|qty|due\s*date|price|of\b))[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  // "Invoice Total" / "Net Total" / "Sub Total"
  /(?:invoice|net|sub)\s+total[\s:]*(?:[$£€¥₹₽]\s*)?([\d,. ]+)/gi,
  // Currency code followed by number: "USD 1,200.00" / "EUR 500"
  /\b(?:USD|EUR|GBP|CAD|AUD|CHF|JPY)\s+([\d,. ]+)/gi,
  // Number followed by currency code: "1,200.00 USD"
  /\b([\d,. ]+)\s+(?:USD|EUR|GBP|CAD|AUD|CHF|JPY)\b/gi,
  // Currency symbol immediately before a number (last occurrence = grand total)
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
  // Explicit labels (highest confidence) — many template name variants
  const labelRe = /(?:due\s+date|payment\s+due(?:\s+(?:by|on|date))?|due\s+(?:by|on|before)|pay(?:able)?(?:\s+(?:by|on|before))?|payment\s+(?:deadline|date|terms?)|payable\s+(?:by|on)|terms?\s+due|invoice\s+due|pay\s+by|remit(?:tance)?\s+(?:by|date)|must\s+be\s+paid\s+by|settle(?:ment)?\s+(?:by|date))[\s:]+([^\n]{4,50})/gi

  for (const m of text.matchAll(labelRe)) {
    const parsed = parseDate(m[1])
    if (parsed) return parsed
  }

  // "Due" keyword + date
  for (const m of text.matchAll(/\bdue[\s:]+([^\n]{4,30})/gi)) {
    const parsed = parseDate(m[1])
    if (parsed) return parsed
  }

  // "Net 30" / "Net 15" / "Net 60" — compute from any invoice/issue date we can find
  const netMatch = text.match(/\bnet\s*(\d+)\b/i)
  if (netMatch) {
    const days = parseInt(netMatch[1], 10)
    const issuedRe = /(?:invoice\s+date|date\s+of\s+invoice|issue(?:d)?\s+date|date\s+issued|billing\s+date|statement\s+date)[\s:]+([^\n]{4,40})/gi
    for (const m of text.matchAll(issuedRe)) {
      const baseDate = parseDate(m[1])
      if (baseDate) {
        const d = new Date(baseDate)
        d.setDate(d.getDate() + days)
        return d.toISOString().slice(0, 10)
      }
    }
  }

  return null
}

// ── Invoice reference ─────────────────────────────────────────────────────────

const REF_PATTERNS: RegExp[] = [
  // "Invoice No. 001" / "Invoice Number: 001" / "Invoice Ref: 001" — keyword required
  /invoice\s+(?:no\.?|number|num\.?|ref(?:erence)?\.?|id)\.?\s*[:#=]?\s*([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  // "Invoice: 001" / "Invoice #001" — colon or hash required (prevents matching "Invoice FROM")
  /invoice\s*[:#]\s*([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  // "Inv. No. 001" / "Inv#001" / "Inv: 001"
  /\binv\.?\s*(?:no\.?|#|id|ref\.?)?\s*[:#=]\s*([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  // "Bill No. 001" / "Bill #001"
  /\bbill\s*(?:no\.?|#)\s*[:#=]?\s*([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  // "Reference: ABC-001" / "Ref: ABC-001" — colon required
  /\b(?:reference|ref)\.?\s*[:#=]\s*([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  // "Transaction ID: 001"
  /\btransaction\s*(?:id|#|no\.?)?\s*[:#=]\s*([A-Za-z0-9][\w\-\/\.]{0,29})/gi,
  // "#001" standalone hash ref
  /\B#([A-Za-z0-9][\w\-]{0,29})/g,
]

function extractInvoiceRef(text: string): string | null {
  for (const re of REF_PATTERNS) {
    re.lastIndex = 0
    const m = re.exec(text)
    if (!m) continue
    const val = m[1].trim()
    if (/^\d{4}[\/\-\.]\d/.test(val)) continue
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]/.test(val)) continue
    if (val.length < 1 || val.length > 30) continue
    // Reject plain English words (the "FROM" problem)
    if (REF_STOPWORDS.has(val.toLowerCase())) continue
    // Reject pure short alphabetic tokens — real refs almost always contain a digit or hyphen
    if (/^[A-Za-z]{1,6}$/.test(val)) continue
    return val
  }
  return null
}

// ── Client name ───────────────────────────────────────────────────────────────
// Patterns in priority order — each group covers a different invoice template style.
// Same-line: "Bill to: Acme Corp"   Multi-line: "Bill to:\nAcme Corp"   etc.

const CLIENT_NAME_PATTERNS: RegExp[] = [
  // ── GROUP A: compound "…to" labels (same line, colon optional) ─────────────
  // Covers: "Bill to: X" / "Billed to: X" / "Invoice to: X" / "Pay to: X" /
  //         "Prepared for: X" / "Issued to: X" / "Made out to: X" / "Sold to: X" /
  //         "Ship to: X" / "Addressed to: X" / "Forwarded to: X" / "Care of: X"
  /(?:bill(?:ed|ing)?\s+to|invoice(?:d|ing)?\s+to|pay(?:able|ment)?\s+to|remit(?:ting)?\s+to|charge(?:d)?\s+to|sold\s+to|ship(?:ped)?\s+to|deliver(?:ed)?\s+to|prepared\s+for|issued\s+to|made\s+out\s+to|addressed\s+to|forwarded\s+to|care\s+of|send(?:ing)?\s+to)\s*:?\s*([^\n\r]{2,80})/gi,

  // ── GROUP B: single-word recipient labels (require colon separator) ─────────
  // Covers: "Client: X" / "Customer: X" / "Buyer: X" / "Payee: X" /
  //         "Account name: X" / "Company name: X" / "Firm: X"
  /\b(?:client|customer|buyer|purchaser|payee|recipient|addressee|account\s+(?:name|holder)|company\s+name|business\s+name|firm)\s*:\s*([^\n\r]{2,80})/gi,

  // ── GROUP C: attention labels ────────────────────────────────────────────────
  /\battn(?:ention)?\.?\s*(?:to)?\s*:\s*([^\n\r]{2,80})/gi,

  // ── GROUP D: "To: Name" anywhere in text ────────────────────────────────────
  /\bto\s*:\s*([^\n\r]{2,80})/gi,

  // ── GROUP E: multi-line — label on one line, name on the NEXT ───────────────
  // Handles "Bill To:\n  Acme Corp" / "Bill To:\n\nAcme Corp"
  /(?:bill(?:ed|ing)?\s+to|invoice(?:d)?\s+to|pay(?:able)?\s+to|client|customer|buyer|payee|recipient|sold\s+to|prepared\s+for|issued\s+to|ship\s+to|addressed\s+to)\s*:?\s*[\r\n]+\s*[\r\n]*\s*([A-Za-z0-9][^\n\r]{1,79})/gi,

  // ── GROUP F: standalone "TO" header, name on next line ──────────────────────
  /\bTO\b\s*[\r\n]+\s*([A-Za-z][^\n\r]{1,79})/g,
]

// Matches lines that are clearly not a company/person name
const ADDR_RE = /\b(?:street|avenue|road|boulevard|drive|lane|court|suite|floor|apt|p\.?o\.?\s*box|postal\s*code|zip\s*code|city|state|province|country)\b/i
const PHONE_RE = /^\+?[\d][\d\s\-().]{6,}$/

function extractClientName(text: string): string | null {
  for (const re of CLIENT_NAME_PATTERNS) {
    re.lastIndex = 0
    const m = re.exec(text)
    if (!m) continue

    // Take only the first non-empty line
    let raw = m[1].trim().split(/[\r\n]/)[0].trim()

    // Strip inline email addresses so "Jane Studio <jane@studio.co>" → "Jane Studio"
    raw = raw.replace(/<[^\s@>]+@[^\s@>]+>/g, '').trim()       // <email@host>
    raw = raw.replace(/\([^\s@)]+@[^\s@)]+\)/g, '').trim()     // (email@host)
    raw = raw.replace(/\s+[^\s@]+@[^\s@]+\.[^\s@]+\s*$/, '').trim()  // trailing email
    raw = raw.replace(/[,;:.]$/, '').trim()

    if (raw.length < 2 || raw.length > 80) continue
    if (/@/.test(raw)) continue                        // still has email
    if (/^https?:\/\//i.test(raw)) continue            // URL
    if (PHONE_RE.test(raw)) continue                   // phone number
    if (REF_STOPWORDS.has(raw.toLowerCase())) continue
    if (ADDR_RE.test(raw)) continue                    // address line
    if (/^\$[\d,.]/.test(raw)) continue                // amount
    if (/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(raw)) continue  // date
    return raw
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
  clientName: string | null
  clientEmail: string | null
  invoiceRef: string | null
  amount: number | null
  dueDate: string | null
  confidence: 'high' | 'low'
}

export async function extractInvoiceFields(buffer: Buffer): Promise<ExtractedInvoice> {
  const parser = new PDFParse({ data: buffer })
  const { text } = await parser.getText()
  await parser.destroy()

  const clientName = extractClientName(text)
  const clientEmail = extractEmail(text)
  const invoiceRef = extractInvoiceRef(text)
  const amount = extractAmount(text)
  const dueDate = extractDueDate(text)

  const nonNull = [amount, dueDate, clientEmail].filter(Boolean).length

  return {
    clientName,
    clientEmail,
    invoiceRef,
    amount,
    dueDate,
    confidence: nonNull >= 2 ? 'high' : 'low',
  }
}
