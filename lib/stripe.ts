import Stripe from 'stripe'

// Lazy-init: only throws when the client is actually used, not at import time.
// This prevents build failures when STRIPE_SECRET_KEY is not set.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  }
  return _stripe
}

// Re-export as `stripe` for backward compat — getter triggers lazy init
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Credit packages available for purchase
export const CREDIT_PACKAGES = [
  { id: 'credits-500', credits: 500, priceInCents: 499, label: '500 Credits' },
  { id: 'credits-1200', credits: 1200, priceInCents: 999, label: '1,200 Credits' },
  { id: 'credits-3000', credits: 3000, priceInCents: 1999, label: '3,000 Credits' },
  { id: 'credits-7500', credits: 7500, priceInCents: 4999, label: '7,500 Credits' },
] as const

export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]['id']

export function getCreditPackage(id: string) {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id)
}
