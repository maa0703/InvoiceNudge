import { type Client } from '@prisma/client'
import { db } from '@/lib/db'

export async function upsertByEmail(
  userId: string,
  email: string,
  name: string,
): Promise<Client> {
  const existing = await db.client.findFirst({
    where: { userId, email, deletedAt: null },
  })

  if (existing) {
    return db.client.update({
      where: { id: existing.id },
      data: { name },
    })
  }

  // Restore soft-deleted client if one exists with the same email — avoids @@unique([userId, email]) conflict
  const deleted = await db.client.findFirst({
    where: { userId, email, deletedAt: { not: null } },
  })

  if (deleted) {
    return db.client.update({
      where: { id: deleted.id },
      data: { name, deletedAt: null },
    })
  }

  return db.client.create({
    data: { userId, email, name },
  })
}
