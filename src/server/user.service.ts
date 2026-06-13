import { db } from '@/lib/db'

export async function getUser(userId: string) {
  return db.user.findFirst({ where: { id: userId, deletedAt: null } })
}

export async function updateUser(
  userId: string,
  data: { displayName?: string; replyToEmail?: string; emailSignatureName?: string },
) {
  return db.user.update({
    where: { id: userId },
    data,
  })
}

export async function completeTour(userId: string): Promise<void> {
  await db.user.updateMany({
    where: { id: userId, tourCompletedAt: null },
    data: { tourCompletedAt: new Date() },
  })
}

export async function resetTour(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { tourCompletedAt: null },
  })
}
