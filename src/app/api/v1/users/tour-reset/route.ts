import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    user = await getCurrentUser()
  } catch (err) {
    console.error('[PATCH /api/v1/users/tour-reset] getCurrentUser failed', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await db.user.update({
      where: { id: user.id },
      data: { tourCompletedAt: null },
    })
    return NextResponse.json({ reset: true })
  } catch (err) {
    console.error('[PATCH /api/v1/users/tour-reset]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
