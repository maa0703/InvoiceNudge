import { db } from '@/lib/db'

export async function getUser(userId: string) {
  return db.user.findFirst({ where: { id: userId, deletedAt: null } })
}

export async function updateUser(
  userId: string,
  data: { displayName?: string; replyToEmail?: string },
) {
  return db.user.update({
    where: { id: userId },
    data,
  })
}
