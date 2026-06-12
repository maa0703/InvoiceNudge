'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { useLang } from '@/lib/lang-context'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const T = {
  en: {
    title: 'Settings', profile: 'Profile', displayName: 'Display name',
    replyEmail: 'Reply-to email', replyHint: 'Clients will reply to this address.',
    emailSigLabel: 'Email signature name',
    emailSigHint: 'Shown at the sign-off of reminders. Leave blank to use your display name.',
    emailSigPreview: 'Preview',
    save: 'Save changes', saving: 'Saving…', plan: 'Plan',
    upgradeDesc: 'Upgrade to Pro for unlimited active invoices and priority email delivery.',
    upgradeCta: 'Upgrade to Pro', redirecting: 'Redirecting…',
    cancelSub: 'Cancel subscription', cancelling: 'Cancelling…',
    cancellationScheduled: 'Cancellation scheduled',
    cancelsSoon: 'Cancels soon',
    accessUntil: 'Your Pro access continues until',
    noFurtherCharges: 'No further charges will be made.',
    confirmCancelTitle: 'Cancel subscription?',
    confirmCancelDesc: "You'll keep Pro access until the end of your current billing period, then your plan returns to Free automatically.",
    keepPro: 'Keep Pro',
    keepMyPlan: 'Keep my Pro plan',
    reactivating: 'Reactivating…',
    confirmReactivateTitle: 'Changed your mind?',
    confirmReactivateDesc: "We'll reactivate your subscription and continue billing as normal.",
    confirmReactivate: 'Reactivate',
    noThanks: 'No thanks',
    toastSaved: 'Settings saved.',
    toastCancellationScheduled: 'Subscription cancellation scheduled.',
  },
  fr: {
    title: 'Paramètres', profile: 'Profil', displayName: 'Nom affiché',
    replyEmail: 'Email de réponse', replyHint: 'Les clients répondront à cette adresse.',
    emailSigLabel: 'Nom de signature email',
    emailSigHint: "Affiché en bas de chaque relance. Laissez vide pour utiliser votre nom affiché.",
    emailSigPreview: 'Aperçu',
    save: 'Enregistrer', saving: 'Enregistrement…', plan: 'Abonnement',
    upgradeDesc: 'Passez à Pro pour des factures actives illimitées et une livraison email prioritaire.',
    upgradeCta: 'Passer à Pro', redirecting: 'Redirection…',
    cancelSub: "Annuler l'abonnement", cancelling: 'Annulation…',
    cancellationScheduled: 'Annulation planifiée',
    cancelsSoon: 'Annule bientôt',
    accessUntil: "Votre accès Pro continue jusqu'au",
    noFurtherCharges: 'Aucun autre frais ne sera prélevé.',
    confirmCancelTitle: "Annuler l'abonnement ?",
    confirmCancelDesc: "Vous conserverez l'accès Pro jusqu'à la fin de votre période de facturation, puis votre forfait passera automatiquement à Gratuit.",
    keepPro: 'Conserver Pro',
    keepMyPlan: 'Conserver mon abonnement Pro',
    reactivating: 'Réactivation…',
    confirmReactivateTitle: 'Changé d\'avis ?',
    confirmReactivateDesc: "Nous réactiverons votre abonnement et la facturation continuera normalement.",
    confirmReactivate: 'Réactiver',
    noThanks: 'Non merci',
    toastSaved: 'Paramètres enregistrés.',
    toastCancellationScheduled: "Annulation de l'abonnement planifiée.",
  },
} as const

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmtUnix(ts: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(ts * 1000))
}

const inputStyle = {
  border: '1px solid #E8E8F0', borderRadius: 12, padding: '10px 14px',
  background: '#FFFFFF', color: '#1E1B4B', fontSize: 14, width: '100%',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
}

const card = {
  background: '#FFFFFF', border: '1px solid #F0EEFF', borderRadius: 16,
  padding: 28, boxShadow: '0 2px 16px rgba(124,58,237,0.06)',
}

export default function SettingsPage() {
  const router = useRouter()
  const { lang } = useLang()
  const t = T[lang]
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'

  const { data, mutate } = useSWR('/api/v1/users/me', fetcher, {
    refreshInterval: 30000, revalidateOnFocus: true, revalidateOnReconnect: true, dedupingInterval: 5000,
  })
  const user = data?.user

  const [displayName, setDisplayName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [emailSignatureName, setEmailSignatureName] = useState('')
  const [hydrated, setHydrated] = useState(false)

  if (user && !hydrated) {
    setDisplayName(user.displayName ?? '')
    setReplyToEmail(user.replyToEmail ?? '')
    setEmailSignatureName(user.emailSignatureName ?? '')
    setHydrated(true)
  }

  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), replyToEmail: replyToEmail.trim(), emailSignatureName: emailSignatureName.trim() }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Could not save changes.'); return }
      await mutate(); toast(t.toastSaved, { style: { background: '#7C3AED', color: '#FFFFFF' } })
    } catch { toast.error('Something went wrong.') }
    finally { setSaving(false) }
  }

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/v1/billing/checkout', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? 'Could not start checkout.'); return }
      if (d.url) window.location.href = d.url
    } catch { toast.error('Something went wrong.') }
    finally { setUpgrading(false) }
  }

  async function handleReactivate() {
    setReactivating(true)
    try {
      const res = await fetch('/api/v1/billing/reactivate', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        toast.error('Something went wrong', {
          description: d.error ?? "We couldn't reactivate your subscription. Please try again or contact support.",
        })
        return
      }
      setReactivateDialogOpen(false)
      await mutate()
      toast('Subscription reactivated', {
        description: 'Your Pro plan continues as normal. Thank you for staying!',
        style: { background: '#7C3AED', color: '#FFFFFF' },
      })
    } catch {
      toast.error('Something went wrong', {
        description: "We couldn't reactivate your subscription. Please try again or contact support.",
      })
    } finally {
      setReactivating(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch('/api/v1/billing/cancel', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? 'Could not cancel subscription.'); return }
      setCancelDialogOpen(false)
      await mutate()
      toast(t.toastCancellationScheduled, { style: { background: '#7C3AED', color: '#FFFFFF' } })
    } catch { toast.error('Something went wrong.') }
    finally { setCancelling(false) }
  }

  const isPro = user?.plan === 'PRO'
  const isCancelled = user?.subscriptionCancelled ?? false
  const accessUntil: number | null = user?.subscriptionPeriodEnd ?? null

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>{t.title}</h1>

      {/* Profile */}
      <div style={card}>
        <p className="text-xs font-bold uppercase tracking-wide mb-5" style={{ color: '#94A3B8' }}>{t.profile}</p>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              {t.displayName}
            </label>
            <input
              id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
              onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="replyToEmail" className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              {t.replyEmail}
            </label>
            <input
              id="replyToEmail" type="email" value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="you@example.com" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
              onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }}
            />
            <p className="text-xs" style={{ color: '#94A3B8' }}>{t.replyHint}</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="emailSignatureName" className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              {t.emailSigLabel}
            </label>
            <input
              id="emailSignatureName" value={emailSignatureName} onChange={(e) => setEmailSignatureName(e.target.value)}
              placeholder="e.g. Jane, Jane K., Jane — Studio K" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
              onBlur={(e) => { e.target.style.borderColor = '#E8E8F0'; e.target.style.boxShadow = 'none' }}
            />
            <p className="text-xs" style={{ color: '#94A3B8' }}>{t.emailSigHint}</p>
            <div
              className="mt-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: '#F5F3FF', border: '1px solid #EDE9FE', color: '#4C1D95' }}
            >
              <span className="font-semibold text-xs uppercase tracking-wide" style={{ color: '#7C3AED' }}>{t.emailSigPreview}</span>
              <p className="mt-1" style={{ color: '#374151' }}>
                Thanks,<br />
                <span className="font-semibold">{emailSignatureName.trim() || displayName.trim() || 'Your name'}</span>
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit" disabled={saving || !user}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', minHeight: 44 }}
            >
              {saving ? <><Spinner size={14} className="mr-1.5 inline-block" />{t.saving}</> : t.save}
            </button>
          </div>
        </form>
      </div>

      {/* Plan */}
      <div style={card}>
        {/* Header row: label + badges */}
        <div className="flex items-center gap-2 mb-5">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8' }}>{t.plan}</p>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={isPro ? { background: '#F3F0FF', color: '#7C3AED' } : { background: '#F1F5F9', color: '#64748B' }}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
          {isPro && isCancelled && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#D97706' }}>
              {t.cancelsSoon}
            </span>
          )}
        </div>

        {/* State A / D — FREE */}
        {!isPro && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#64748B' }}>{t.upgradeDesc}</p>
            <button
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', minHeight: 44 }}
              onClick={handleUpgrade} disabled={upgrading}
            >
              {upgrading ? <><Spinner size={14} className="mr-1.5 inline-block" />{t.redirecting}</> : t.upgradeCta}
            </button>
          </div>
        )}

        {/* State B — PRO, not yet cancelled */}
        {isPro && !isCancelled && (
          <button
            className="text-sm font-medium hover:underline disabled:opacity-50"
            style={{ color: '#EF4444' }}
            onClick={() => setCancelDialogOpen(true)}
            disabled={cancelling}
          >
            {t.cancelSub}
          </button>
        )}

        {/* State C — PRO, cancellation scheduled */}
        {isPro && isCancelled && (
          <div className="space-y-3">
            {accessUntil && (
              <p className="text-sm" style={{ color: '#64748B' }}>
                {t.accessUntil}{' '}
                <span className="font-semibold" style={{ color: '#1E1B4B' }}>{fmtUnix(accessUntil, locale)}</span>.
                {' '}{t.noFurtherCharges}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', minHeight: 44 }}
                onClick={() => setReactivateDialogOpen(true)}
                disabled={reactivating}
              >
                {reactivating ? <><Spinner size={14} className="mr-1.5 inline-block" />{t.reactivating}</> : t.keepMyPlan}
              </button>
              <button
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed w-full sm:w-auto"
                style={{ background: '#F1F5F9', color: '#94A3B8', minHeight: 44 }}
                disabled
              >
                {t.cancellationScheduled}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tour reset */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => {
            localStorage.removeItem('invoicenudge-tour-done')
            router.push('/dashboard')
          }}
          style={{ fontSize: 12, color: '#A8A29E', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
        >
          Replay the intro tour
        </button>
      </div>

      {/* Reactivate confirm dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t.confirmReactivateTitle}</DialogTitle>
            <DialogDescription>{t.confirmReactivateDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.noThanks}</DialogClose>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
              onClick={handleReactivate}
              disabled={reactivating}
            >
              {reactivating ? <Spinner size={14} /> : t.confirmReactivate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t.confirmCancelTitle}</DialogTitle>
            <DialogDescription>{t.confirmCancelDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t.keepPro}</DialogClose>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white border-transparent"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? <Spinner size={14} /> : t.cancelSub}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
