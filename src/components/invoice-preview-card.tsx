interface Props {
  subject: string
  htmlBody: string
  from?: string
  to?: string
}

export function InvoicePreviewCard({ subject, htmlBody, from, to }: Props) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8E4DC', background: '#FFFFFF' }}>
      {/* Header rows */}
      <div>
        {from && (
          <div className="flex items-baseline gap-4 px-6 py-3" style={{ borderBottom: '1px solid #E8E4DC' }}>
            <span className="text-xs uppercase tracking-wide font-medium w-14 shrink-0" style={{ color: '#A8A29E' }}>From</span>
            <span className="text-sm" style={{ color: '#1C1917' }}>{from}</span>
          </div>
        )}
        {to && (
          <div className="flex items-baseline gap-4 px-6 py-3" style={{ borderBottom: '1px solid #E8E4DC' }}>
            <span className="text-xs uppercase tracking-wide font-medium w-14 shrink-0" style={{ color: '#A8A29E' }}>To</span>
            <span className="text-sm" style={{ color: '#1C1917' }}>{to}</span>
          </div>
        )}
        <div className="flex items-baseline gap-4 px-6 py-3" style={{ borderBottom: '1px solid #E8E4DC' }}>
          <span className="text-xs uppercase tracking-wide font-medium w-14 shrink-0" style={{ color: '#A8A29E' }}>Subject</span>
          <span className="text-sm font-medium" style={{ color: '#1C1917' }}>{subject}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <div
          className="rounded-lg p-4 text-sm leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_a]:text-indigo-600 [&_a]:underline"
          style={{ background: '#FAFAF8', color: '#1C1917' }}
          dangerouslySetInnerHTML={{ __html: htmlBody }}
        />
      </div>
    </div>
  )
}
