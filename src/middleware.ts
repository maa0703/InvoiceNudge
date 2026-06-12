import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/reminders/cancel(.*)',
  '/api/webhooks/(.*)',
  '/api/v1/cron/(.*)',
  '/api/v1/reminders/(.*)/checkin-cancel',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId } = await auth()
    if (!userId) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|icon\\.svg).*)'],
}
