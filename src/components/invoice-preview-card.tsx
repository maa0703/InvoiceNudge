interface Props {
  subject: string
  htmlBody: string
}

export function InvoicePreviewCard({ subject, htmlBody }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          Email preview — Reminder 1
        </p>
        <p className="text-sm font-medium text-gray-900 mt-1">{subject}</p>
      </div>
      <div
        className="px-4 py-4 text-sm text-gray-700 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_a]:text-[#4F46E5] [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: htmlBody }}
      />
    </div>
  )
}
