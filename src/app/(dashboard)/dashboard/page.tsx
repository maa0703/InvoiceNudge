'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { DashboardContent } from '@/components/dashboard-content'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    if (searchParams.get('activated') === 'true') {
      toast({
        title: 'Reminders activated.',
        description: "We'll check in before every send.",
      })
    }
  }, [])

  return <DashboardContent plan="FREE" />
}
