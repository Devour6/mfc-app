'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ContractConceptCardProps {
  fighterName: string
  fighterColor: 'accent' | 'accent2'
  yesPrice: number // 0-1
  visible: boolean
  onGotIt: () => void
  onDismiss: () => void
}

export default function ContractConceptCard({
  fighterName,
  fighterColor,
  yesPrice,
  visible,
  onGotIt,
  onDismiss,
}: ContractConceptCardProps) {
  const [exiting, setExiting] = useState<'gotit' | 'dismiss' | null>(null)

  const priceDisplay = yesPrice.toFixed(2)
  const profit = (1 - yesPrice).toFixed(2)

  const nameColorClass = fighterColor === 'accent' ? 'text-accent' : 'text-accent2'

  const handleGotIt = () => {
    setExiting('gotit')
    setTimeout(() => onGotIt(), 300)
  }

  const handleDismiss = () => {
    setExiting('dismiss')
    setTimeout(() => onDismiss(), 200)
  }

  return (
    <AnimatePresence>
      {visible && !exiting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
          className="bg-surface border-y border-border py-5 px-4"
        >
          <div className="max-w-[520px] mx-auto">
            {/* Opening text */}
            <div className="mb-4">
              <p className="font-ui text-base text-text">
                You think <span className={nameColorClass}>{fighterName}</span> wins.
              </p>
              <p className="font-ui text-base text-text mt-1">
                On MFC, that&apos;s a <span className="text-green font-semibold">YES</span> contract.
              </p>
            </div>

            {/* Explanation box */}
            <div className="bg-surface2 border border-border p-4 mb-5">
              <div className="font-ui text-sm text-green font-semibold">
                Buy YES at {priceDisplay}
              </div>
              <div className="font-ui text-sm text-text mt-1">
                If he wins → contract pays <span className="text-green">1.00</span>
              </div>
              <div className="font-ui text-sm text-gold font-semibold mt-1">
                Your profit: {profit} per contract
              </div>
              <div className="mt-3">
                <span className="font-ui text-xs text-text2 italic">
                  It&apos;s like buying a share in the outcome.
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={handleGotIt}
                className="flex-1 font-pixel text-xs tracking-wider text-green border-2 border-green px-5 py-3 min-h-[44px] hover:bg-green/10 active:bg-green/20 transition-colors focus-visible:ring-2 focus-visible:ring-green focus-visible:outline-none"
                whileTap={{ scale: 0.98 }}
              >
                GOT IT — SHOW ME THE MARKET
              </motion.button>
              <button
                onClick={handleDismiss}
                className="font-ui text-sm text-text2 px-4 py-3 min-h-[44px] hover:text-text hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-text2 focus-visible:outline-none"
              >
                Just watching
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
