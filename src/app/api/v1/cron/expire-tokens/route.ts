import { NextRequest, NextResponse } from 'next/server'
import { expireTokens } from '@/server/reminder.service'

export async function POST(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const expired = await expireTokens()
    return NextResponse.json({ expired })
  } catch (err) {
    console.error('[cron/expire-tokens]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
