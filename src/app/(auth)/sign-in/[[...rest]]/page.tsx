import { SignIn } from '@clerk/nextjs'

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
  },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F8F7FF' }}>
      <div className="text-center mb-8">
        <a href="/" className="inline-flex flex-col items-center gap-2">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="white">
              <path d="M7 0.5L13 5.5L7 13.5L1 5.5L7 0.5Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>InvoiceNudge</span>
          <p className="text-sm" style={{ color: '#64748B' }}>Get paid. Skip the awkward part.</p>
        </a>
      </div>
      <SignIn appearance={appearance} />
    </div>
  )
}
