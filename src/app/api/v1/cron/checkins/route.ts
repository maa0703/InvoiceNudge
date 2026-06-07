import { NextRequest, NextResponse } from 'next/server'
import { processCheckins } from '@/server/reminder.service'

export async function POST(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const processed = await processCheckins()
    return NextResponse.json({ processed })
  } catch (err) {
    console.error('[cron/checkins]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
