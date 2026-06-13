import { cache } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { User } from '@prisma/client'

export function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { clerkUserId, stripeCustomerId, stripeSubscriptionId, deletedAt, ...rest } = user
  return rest
}

export const getCurrentUser = cache(async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  const existing = await db.user.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
  })
  if (existing) return existing

  // First visit — provision user row from Clerk profile
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const firstName = clerkUser.firstName ?? ''
  const lastName = clerkUser.lastName ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  try {
    return await db.user.create({
      data: { clerkUserId: userId, email, replyToEmail: email, emailSignatureName: fullName },
    })
  } catch (e) {
    // Concurrent request already created the row — just fetch it
    if ((e as { code?: string }).code === 'P2002') {
      return db.user.findFirst({ where: { clerkUserId: userId, deletedAt: null } })
    }
    throw e
  }
})
