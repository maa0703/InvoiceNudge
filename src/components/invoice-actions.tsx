'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  invoiceId: string
}

export function InvoiceActions({ invoiceId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Invoice deleted')
      router.refresh()
    } catch {
      toast.error('Could not delete invoice')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
      <Link
        href={`/invoices/${invoiceId}`}
        style={{ fontSize: 14, fontWeight: 600, color: '#7C3AED', textDecoration: 'none' }}
      >
        View
      </Link>

      {confirming ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>Delete?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#EF4444',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '3px 10px',
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? '…' : 'Yes'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#64748B',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '3px 10px',
              cursor: 'pointer',
            }}
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#EF4444',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      )}
    </div>
  )
}
