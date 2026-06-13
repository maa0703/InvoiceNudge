import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
) {
  throw new Error('Using Stripe test key in production')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
})
