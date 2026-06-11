import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

export default async function HomePage() {
  const { userId } = await auth()
  return (
    <div className="min-h-screen" style={{ background: '#F8F7FF', color: '#1E1B4B' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Image src="/favicon.svg" alt="InvoiceNudge" width={144} height={36} unoptimized />
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium" style={{ color: '#1E1B4B' }}>Home</a>
          <a href="#how-it-works" className="text-sm font-medium" style={{ color: '#64748B' }}>How it works</a>
          <a href="#pricing" className="text-sm font-medium" style={{ color: '#64748B' }}>Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          {userId ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:block text-sm font-medium" style={{ color: '#1E1B4B' }}>
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
              >
                Try it Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex items-center min-h-[520px] lg:min-h-[600px]">
        {/* Desktop-only purple right panel */}
        <div
          className="hidden lg:block absolute top-0 right-0 pointer-events-none"
          style={{
            width: '50%', height: '100%',
            background: 'linear-gradient(140deg, #7C3AED 0%, #9333EA 35%, #C026D3 65%, #EC4899 100%)',
            borderBottomLeftRadius: '44% 55%',
          }}
        />
        {/* Mobile-only soft bottom gradient */}
        <div
          className="lg:hidden absolute bottom-0 inset-x-0 pointer-events-none"
          style={{ height: '35%', background: 'linear-gradient(to top, rgba(124,58,237,0.07), transparent)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-14 lg:py-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left — text */}
          <div className="w-full min-w-0 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-5"
              style={{ background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
            >
              Built for freelancers · Free to start
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5" style={{ color: '#1E1B4B' }}>
              Get paid.{' '}
              <span style={{ color: '#7C3AED' }}>Skip the</span>
              <br />
              <span style={{ color: '#7C3AED' }}>awkward part.</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-8 max-w-sm sm:max-w-md lg:max-w-none" style={{ color: '#64748B' }}>
              InvoiceNudge automatically follows up on your unpaid invoices — so you never have to
              write another &ldquo;just following up…&rdquo; email again.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-auto">
              {userId ? (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 w-full sm:w-auto"
                  style={{ background: '#4F46E5', minHeight: 44 }}
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="flex items-center justify-center px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 w-full sm:w-auto"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', minHeight: 44 }}
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/sign-in"
                    className="flex items-center justify-center px-7 py-3.5 rounded-xl text-sm font-semibold transition-colors hover:bg-white w-full sm:w-auto"
                    style={{ border: '2px solid #7C3AED', color: '#7C3AED', background: 'transparent', minHeight: 44 }}
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>

            {!userId && (
              <div className="flex flex-col items-center lg:items-start sm:flex-row sm:items-center gap-2 text-sm" style={{ color: '#64748B' }}>
                <span>
                  Already using InvoiceNudge?{' '}
                  <Link href="/sign-in" className="font-bold" style={{ color: '#7C3AED' }}>SIGN IN</Link>
                </span>
                <span className="hidden sm:block" style={{ color: '#CBD5E1' }}>·</span>
                <span>Free to start · No card required</span>
              </div>
            )}
          </div>

          {/* Right — app preview (desktop only) */}
          <div className="hidden lg:flex justify-end">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl w-full"
              style={{ maxWidth: 420, background: 'white', border: '1px solid #E8E8F0' }}
            >
              <div className="flex" style={{ height: 300 }}>
                <div
                  className="flex flex-col py-4 px-3 gap-1"
                  style={{ width: 148, background: '#FAFAF8', borderRight: '1px solid #F1F0FF', flexShrink: 0 }}
                >
                  <div className="flex items-center px-2 py-1 mb-3">
                    <Image src="/favicon.svg" alt="InvoiceNudge" width={88} height={22} unoptimized />
                  </div>
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'Invoices', active: false },
                    { label: 'Settings', active: false },
                  ].map(({ label, active }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                      style={active ? { background: '#7C3AED', color: 'white' } : { color: '#64748B' }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 overflow-hidden">
                  <p className="text-sm font-bold mb-3" style={{ color: '#1E1B4B' }}>Hello! Alex 👋</p>
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 rounded-xl p-3" style={{ background: '#F3F0FF' }}>
                      <p className="text-xs font-medium" style={{ color: '#7C3AED' }}>Invoiced</p>
                      <p className="text-2xl font-black" style={{ color: '#1E1B4B' }}>5</p>
                    </div>
                    <div className="flex-1 rounded-xl p-3" style={{ background: '#FDF2FF' }}>
                      <p className="text-xs font-medium" style={{ color: '#C026D3' }}>Overdue</p>
                      <p className="text-2xl font-black" style={{ color: '#1E1B4B' }}>2</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#1E1B4B' }}>Recent invoices</p>
                  {[
                    { name: 'Acme Corp', amount: '$2,400', status: 'Active', c: { bg: '#F3F0FF', fg: '#7C3AED' } },
                    { name: 'TechFlow', amount: '$850', status: 'Paid', c: { bg: '#ECFDF5', fg: '#059669' } },
                    { name: 'Studio XY', amount: '$3,200', status: 'Active', c: { bg: '#F3F0FF', fg: '#7C3AED' } },
                  ].map(({ name, amount, status, c }) => (
                    <div
                      key={name}
                      className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: '1px solid #F1F0FF' }}
                    >
                      <span className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums" style={{ color: '#1E1B4B' }}>{amount}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: c.bg, color: c.fg }}>{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid #F1F0FF', background: '#FAFAF8' }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>Amount</p>
                  <p className="text-sm font-bold" style={{ color: '#1E1B4B' }}>$2,400.00</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#F3F0FF', color: '#7C3AED' }}>ACTIVE</span>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>Client</p>
                  <p className="text-sm font-medium" style={{ color: '#1E1B4B' }}>Acme Corp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY IT EXISTS ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-5" style={{ color: '#1E1B4B' }}>
            Why InvoiceNudge exists
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#64748B' }}>
            71% of freelancers experience late payment. The problem isn&rsquo;t that clients are bad —
            it&rsquo;s that chasing them feels uncomfortable. So we delay. We let invoices sit. We lose
            money quietly. InvoiceNudge removes the discomfort entirely. You add the invoice. We send
            the reminders. You stay professional without lifting a finger.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-8" style={{ background: '#F8F7FF' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: '#1E1B4B' }}>
            Here&rsquo;s exactly what happens
          </h2>
          <p className="text-center mb-12 text-base" style={{ color: '#64748B' }}>
            No surprises. You&rsquo;re always in control.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div
              className="absolute top-10 bottom-10 hidden sm:block"
              style={{ left: '1.875rem', width: '2px', background: '#E8E8F0' }}
            />

            <div className="space-y-6">
              {[
                {
                  n: '01',
                  title: 'Add your invoice',
                  body: "Upload a PDF or type 3 fields: client name, amount, and due date. That's it. No new invoicing tool required — works with whatever you already use.",
                },
                {
                  n: '02',
                  title: "We wait until it's overdue",
                  body: "We don't send reminders before the due date — that's presumptuous. We start only after the due date passes, when following up is legitimate and expected.",
                },
                {
                  n: '03',
                  title: 'We check in with you first',
                  body: "3 hours before every reminder goes out, we email YOU first. 'About to send to Acme Studio — still on?' One click to cancel if they've already paid. You're always in control.",
                },
                {
                  n: '04',
                  title: 'Your client gets a professional email',
                  body: '4 reminders on a smart schedule: Day +1, +5, +10, +20 after the due date. Tone escalates gradually — warm first, firm last. Signed with your name. Feels like you wrote it.',
                },
              ].map(({ n, title, body }) => (
                <div key={n} className="relative flex gap-4 sm:gap-6 sm:pl-16">
                  <div className="hidden sm:flex absolute left-0 w-15 items-center justify-center" style={{ zIndex: 1 }}>
                    <span className="text-4xl font-black select-none" style={{ color: '#E8E8F0', lineHeight: 1 }}>{n}</span>
                  </div>
                  <div
                    className="flex-1 rounded-2xl p-5 sm:p-6 relative overflow-hidden"
                    style={{ border: '1px solid #E8E8F0', background: '#FFFFFF', boxShadow: '0 2px 16px rgba(124,58,237,0.06)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[#7C3AED] sm:hidden">{n}</span>
                      <h3 className="text-base font-bold" style={{ color: '#1E1B4B' }}>{title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OBJECTION BUSTERS ────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-14" style={{ color: '#1E1B4B' }}>
            Your concerns, answered
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                q: 'Will it make me look pushy?',
                a: 'No. The first reminder is warm and friendly. Tone only escalates if the client keeps ignoring it. Most clients pay after reminder 1.',
              },
              {
                q: 'What if they already paid?',
                a: "That's exactly what the Check-in is for. We warn you 3 hours before every send. Cancel with one click — no login required, works from your phone.",
              },
              {
                q: 'Do I need to change how I invoice?',
                a: "Not at all. InvoiceNudge doesn't replace your invoicing tool. Upload any PDF or just type the 3 fields manually. It works with FreshBooks, Wave, a Word doc — anything.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl p-6 sm:p-8"
                style={{ border: '1px solid #E8E8F0', boxShadow: '0 2px 16px rgba(124,58,237,0.06)' }}
              >
                <h3 className="text-base font-bold mb-3" style={{ color: '#1E1B4B' }}>{q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REMINDER SCHEDULE ────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-8" style={{ background: '#F8F7FF' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: '#1E1B4B' }}>
            The reminder schedule
          </h2>
          <p className="text-center mb-12 text-base" style={{ color: '#64748B' }}>
            Professional, escalating, automatic.
          </p>

          <div className="relative max-w-lg mx-auto">
            <div
              className="absolute top-4 bottom-4"
              style={{ left: '0.9375rem', width: '2px', background: '#E8E8F0' }}
            />

            <div className="space-y-5 sm:space-y-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: '#E8E8F0', border: '2px solid #CBD5E1', zIndex: 1 }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Due date</p>
                  <p className="text-sm font-medium" style={{ color: '#1E1B4B' }}>Invoice due</p>
                </div>
              </div>

              {[
                { day: 'Day +1', label: 'Reminder 1', desc: 'Warm and friendly check-in', tone: 'Warm', badge: { bg: '#D1FAE5', fg: '#065F46' } },
                { day: 'Day +5', label: 'Reminder 2', desc: 'Neutral follow-up with amount', tone: 'Neutral', badge: { bg: '#DBEAFE', fg: '#1E40AF' } },
                { day: 'Day +10', label: 'Reminder 3', desc: 'Firm but professional', tone: 'Firm', badge: { bg: '#FEF3C7', fg: '#92400E' } },
                { day: 'Day +20', label: 'Reminder 4', desc: 'Final notice', tone: 'Final', badge: { bg: '#FEE2E2', fg: '#991B1B' } },
              ].map(({ day, label, desc, tone, badge }) => (
                <div key={day} className="flex items-center gap-4 sm:gap-5">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: '#7C3AED', border: '3px solid #F3F0FF', zIndex: 1 }} />
                  <div
                    className="flex-1 flex items-center justify-between gap-3 rounded-2xl px-3 sm:px-5 py-3 sm:py-4"
                    style={{ border: '1px solid #E8E8F0', background: '#FFFFFF', boxShadow: '0 2px 16px rgba(124,58,237,0.06)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold font-mono" style={{ color: '#7C3AED' }}>{day}</p>
                      <p className="text-sm font-medium" style={{ color: '#1E1B4B' }}>
                        {label}:{' '}
                        <span className="hidden sm:inline" style={{ color: '#64748B', fontWeight: 400 }}>{desc}</span>
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: badge.bg, color: badge.fg }}
                    >
                      {tone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 px-4 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: '#1E1B4B' }}>
            Simple pricing
          </h2>
          <p className="text-center mb-12 text-base" style={{ color: '#64748B' }}>
            Start free. Upgrade when you&rsquo;re ready.
          </p>
          {/* On mobile: flex-col with Pro first (order-1). On sm+: flex-row with Free left (sm:order-1) */}
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
            {/* Free */}
            <div
              className="flex-1 rounded-2xl p-6 sm:p-8 flex flex-col order-2 sm:order-1"
              style={{ border: '1px solid #E8E8F0', background: '#FFFFFF' }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: '#64748B' }}>Free</p>
              <p className="text-4xl font-black mb-1" style={{ color: '#1E1B4B' }}>
                $0<span className="text-lg font-normal" style={{ color: '#64748B' }}>/mo</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm flex-1" style={{ color: '#64748B' }}>
                {[
                  'Up to 3 active invoices',
                  'Full reminder sequence (all 4 emails)',
                  'Check-in before every send',
                  'PDF upload',
                  'No credit card required',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ color: '#7C3AED', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 flex items-center justify-center rounded-xl py-3 font-semibold text-sm transition-colors hover:bg-purple-50 min-h-[44px]"
                style={{ border: '2px solid #7C3AED', color: '#7C3AED' }}
              >
                Start free
              </Link>
            </div>

            {/* Pro — first on mobile */}
            <div
              className="flex-1 rounded-2xl p-6 sm:p-8 flex flex-col text-white relative overflow-hidden order-1 sm:order-2"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            >
              <div
                className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                Most popular
              </div>
              <p className="text-sm font-semibold mb-2 opacity-80">Pro</p>
              <p className="text-4xl font-black mb-1">
                $12<span className="text-lg font-normal opacity-80">/mo</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm flex-1 opacity-90">
                {[
                  'Everything in Free',
                  'Unlimited active invoices',
                  'Reminder history',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 flex items-center justify-center rounded-xl py-3 font-semibold text-sm bg-white transition-opacity hover:opacity-90 min-h-[44px]"
                style={{ color: '#7C3AED' }}
              >
                Get Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="px-4 sm:px-8 py-6 sm:py-8" style={{ borderTop: '1px solid #E8E8F0', background: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-center sm:text-left" style={{ color: '#64748B' }}>
          <div className="flex items-center justify-center sm:justify-start">
            <Image src="/favicon.svg" alt="InvoiceNudge" width={112} height={28} unoptimized />
          </div>
          <span className="hidden sm:block">Get paid. Skip the awkward part.</span>
          <span>Made for freelancers</span>
        </div>
      </footer>
    </div>
  )
}
