'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CreditCard, X, Loader, Star } from 'lucide-react'
import { createCheckoutSession } from '@/lib/api-client'

// Mirror CREDIT_PACKAGES from lib/stripe.ts (keep frontend decoupled from server module)
const CREDIT_PACKAGES = [
  { id: 'credits-500', credits: 500, priceInCents: 499, label: '500 Credits' },
  { id: 'credits-1200', credits: 1200, priceInCents: 999, label: '1,200 Credits', popular: true },
  { id: 'credits-3000', credits: 3000, priceInCents: 1999, label: '3,000 Credits' },
  { id: 'credits-7500', credits: 7500, priceInCents: 4999, label: '7,500 Credits', bestValue: true },
] as const

interface CreditPurchaseProps {
  onClose: () => void
}

export default function CreditPurchase({ onClose }: CreditPurchaseProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId)
    setError(null)
    try {
      const { url } = await createCheckoutSession(packageId)
      if (url) {
        window.location.href = url
      } else {
        setError('Failed to create checkout session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-surface border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-pixel text-sm text-text">BUY CREDITS</h2>
                <p className="text-text2 text-xs font-ui">Secure checkout via Stripe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text2 hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red/10 border border-red/30 px-4 py-2 mb-4 text-xs text-red font-ui"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Packages */}
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKAGES.map((pkg) => {
              const priceUsd = (pkg.priceInCents / 100).toFixed(2)
              const isLoading = loading === pkg.id
              const perCredit = (pkg.priceInCents / pkg.credits).toFixed(2)

              return (
                <motion.button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  className={`relative border p-4 text-left transition-all ${
                    'popular' in pkg && pkg.popular
                      ? 'border-accent bg-accent/5'
                      : 'bestValue' in pkg && pkg.bestValue
                        ? 'border-green bg-green/5'
                        : 'border-border bg-surface2 hover:border-text2'
                  } ${loading !== null && !isLoading ? 'opacity-50' : ''}`}
                  whileHover={loading === null ? { scale: 1.02 } : {}}
                  whileTap={loading === null ? { scale: 0.98 } : {}}
                >
                  {/* Badge */}
                  {'popular' in pkg && pkg.popular && (
                    <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-accent text-bg text-[8px] font-pixel">
                      POPULAR
                    </div>
                  )}
                  {'bestValue' in pkg && pkg.bestValue && (
                    <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-green text-bg text-[8px] font-pixel flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> BEST VALUE
                    </div>
                  )}

                  {/* Price */}
                  <div className="font-ui text-xl font-bold text-text mb-1">
                    ${priceUsd}
                  </div>

                  {/* Credits */}
                  <div className="font-pixel text-xs text-gold mb-2">
                    {pkg.credits.toLocaleString()} CREDITS
                  </div>

                  {/* Per credit */}
                  <div className="text-[10px] text-text2 font-ui">
                    {perCredit}&cent; per credit
                  </div>

                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-surface/80 flex items-center justify-center">
                      <Loader className="w-5 h-5 text-accent animate-spin" />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-[10px] text-text2 font-ui">
            You&apos;ll be redirected to Stripe for secure payment
          </div>
        </div>
      </motion.div>
    </div>
  )
}
