import Image from 'next/image'
import { SignUp } from '@clerk/nextjs'

const appearance = {
  variables: {
    colorPrimary: '#7C3AED',
    colorText: '#1E1B4B',
    colorTextSecondary: '#64748B',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#1E1B4B',
    borderRadius: '12px',
    fontFamily: 'Inter, sans-serif',
  },
  elements: {
    rootBox: 'mx-auto',
    card: 'shadow-sm rounded-2xl',
    formButtonPrimary: 'rounded-xl font-semibold text-sm',
    formFieldInput: 'rounded-xl border-slate-200 text-sm',
    footerActionLink: 'text-purple-600 hover:text-purple-700 font-semibold',
    identityPreviewEditButton: 'text-purple-600',
    formResendCodeLink: 'text-purple-600',
    socialButtonsBlockButton: 'rounded-xl border-slate-200 hover:bg-slate-50 text-sm font-medium',
    alertText: 'text-sm text-red-600',
    badge: 'bg-purple-50 text-purple-700',
  },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 sm:justify-center sm:pt-0" style={{ background: '#F8F7FF' }}>
      <div className="text-center mb-8 w-full max-w-sm px-4 sm:px-0">
        <a href="/" className="inline-flex flex-col items-center gap-3">
          <Image src="/favicon.svg" alt="InvoiceNudge" width={160} height={40} unoptimized />
          <p className="text-sm" style={{ color: '#64748B' }}>Get paid. Skip the awkward part.</p>
        </a>
      </div>
      <SignUp appearance={appearance} />
    </div>
  )
}
