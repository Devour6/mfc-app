'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface ConvertPromptProps {
  visible: boolean
  onCreateAccount: () => void
  onDismiss: () => void
}

const steps = [
  { text: 'You placed your first trade', completed: true },
  { text: 'You understand how contracts work', completed: true },
  { text: 'Next step: create an account', completed: false },
]

export default function ConvertPrompt({
  visible,
  onCreateAccount,
  onDismiss,
}: ConvertPromptProps) {
  const prefersReducedMotion = useReducedMotion()
  const [exiting, setExiting] = useState<'account' | 'dismiss' | null>(null)

  const handleCreateAccount = () => {
    setExiting('account')
    setTimeout(() => {
      onCreateAccount()
      setExiting(null)
    }, prefersReducedMotion ? 0 : 200)
  }

  const handleDismiss = () => {
    setExiting('dismiss')
    setTimeout(() => {
      onDismiss()
      setExiting(null)
    }, prefersReducedMotion ? 0 : 200)
  }

  const cardAnimate = exiting === 'account'
    ? { scale: 0.95, opacity: 0 }
    : exiting === 'dismiss'
    ? { opacity: 0, y: 10 }
    : prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0 }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="convert-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            className="fixed inset-0 bg-bg/60 z-50"
            onClick={handleDismiss}
          />

          {/* Card wrapper */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              key="convert-card"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={cardAnimate}
              transition={{
                duration: prefersReducedMotion ? 0 : exiting ? 0.2 : 0.4,
                delay: prefersReducedMotion || exiting ? 0 : 0.1,
                ease: 'easeOut',
              }}
              className="max-w-[420px] w-full mx-4 bg-surface border-2 border-border p-8 text-center shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto"
            >
              {/* Heading */}
              <h2 className="font-pixel text-sm text-text mb-6">
                Ready to trade for real?
              </h2>

              {/* Progress checkmarks */}
              <div className="space-y-3 text-left max-w-[280px] mx-auto mb-8">
                {steps.map((step) => (
                  <div key={step.text} className="flex items-center gap-3">
                    {step.completed ? (
                      <div className="w-5 h-5 border-2 border-green bg-green/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-green text-xs">{'\u2713'}</span>
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-text2 flex-shrink-0" />
                    )}
                    <span className={`font-ui text-sm ${step.completed ? 'text-text' : 'text-text2'}`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={handleCreateAccount}
                className="w-full bg-green text-white font-pixel text-xs tracking-wider px-6 py-4 min-h-[48px] hover:bg-green/90 active:bg-green/80 transition-all duration-150 mb-4"
                whileTap={{ scale: 0.98 }}
              >
                CREATE ACCOUNT — TAKES 30 SECONDS
              </motion.button>

              {/* Trust signals */}
              <p className="font-ui text-xs text-text2 mb-4">
                No credit card required{' '}
                <span className="text-text2">{'\u00B7'}</span>{' '}
                <span className="text-gold">100 free credits</span>
              </p>

              {/* Dismiss link */}
              <button
                onClick={handleDismiss}
                className="font-ui text-xs text-text2 hover:text-text hover:underline cursor-pointer"
              >
                or continue watching
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
