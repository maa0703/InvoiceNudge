import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  const existing = await db.user.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
  })

  if (existing) return existing

  // First sign-in — provision the user row from Clerk profile
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''

  return db.user.create({
    data: {
      clerkUserId: userId,
      email,
      replyToEmail: email,
    },
  })
}
