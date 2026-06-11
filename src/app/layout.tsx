import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InvoiceNudge',
  description: 'Automated invoice follow-up reminders for freelancers',
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/invoices/new"
    >
      <html lang="en" className="scroll-smooth">
        {/* React 19 hoists <link> from body to <head> automatically */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <body className={`${inter.className} antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
