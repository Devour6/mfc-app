'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign } from 'lucide-react'

interface SettledBet {
  id: string
  marketTitle: string
  side: string
  amount: number
  odds: number
  status: 'WON' | 'LOST'
  payout: number
}

interface BetSettlementOverlayProps {
  settledBets: SettledBet[]
  newBalance: number
  isVisible: boolean
  onDismiss: () => void
}

export default function BetSettlementOverlay({
  settledBets,
  newBalance,
  isVisible,
  onDismiss,
}: BetSettlementOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  const totalWon = settledBets.filter(b => b.status === 'WON').reduce((s, b) => s + b.payout, 0)
  const totalLost = settledBets.filter(b => b.status === 'LOST').reduce((s, b) => s + b.amount, 0)
  const netResult = totalWon - totalLost

  useEffect(() => {
    if (!isVisible) {
      setCurrentIndex(0)
      setShowSummary(false)
      return
    }
    if (currentIndex < settledBets.length) {
      const timer = setTimeout(() => setCurrentIndex(prev => prev + 1), 1500)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setShowSummary(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, currentIndex, settledBets.length])

  if (!isVisible || settledBets.length === 0) return null

  const currentBet = settledBets[currentIndex]
  const isWin = currentBet?.status === 'WON'

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      <AnimatePresence mode="wait">
        {!showSummary && currentBet && (
          <motion.div
            key={`bet-${currentIndex}`}
            className="text-center p-8 relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {isWin ? (
              <>
                {/* Gold particle burst */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gold"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos((i / 12) * Math.PI * 2) * 120,
                      y: Math.sin((i / 12) * Math.PI * 2) * 120,
                      opacity: 0,
                    }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{ left: '50%', top: '50%' }}
                  />
                ))}
                <motion.div
                  className="font-pixel text-4xl text-gold mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    textShadow: [
                      '0 0 20px rgba(255,215,0,0.5)',
                      '0 0 40px rgba(255,215,0,0.8)',
                      '0 0 20px rgba(255,215,0,0.5)'
                    ]
                  }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  BET WON!
                </motion.div>
                <div className="font-pixel text-2xl text-green mb-2">
                  +{currentBet.payout.toLocaleString()}
                </div>
              </>
            ) : (
              <>
                <motion.div
                  className="font-pixel text-3xl text-text2 mb-4"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0.6 }}
                >
                  BET LOST
                </motion.div>
                <div className="font-pixel text-xl text-accent mb-2">
                  -{currentBet.amount.toLocaleString()}
                </div>
              </>
            )}
            <div className="text-text2 text-sm font-ui mt-2">
              {currentBet.marketTitle} &mdash; {currentBet.side}
            </div>
          </motion.div>
        )}

        {showSummary && (
          <motion.div
            key="summary"
            className="bg-surface border border-border p-8 text-center max-w-sm"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-pixel text-sm text-accent mb-4 tracking-wider">BETTING SUMMARY</div>
            <div className={`font-pixel text-3xl mb-2 ${netResult >= 0 ? 'text-green' : 'text-accent'}`}>
              {netResult >= 0 ? '+' : ''}{netResult.toLocaleString()}
            </div>
            <div className="text-text2 text-sm font-ui mb-4">
              {settledBets.filter(b => b.status === 'WON').length} won / {settledBets.filter(b => b.status === 'LOST').length} lost
            </div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <DollarSign className="w-4 h-4 text-gold" />
              <span className="font-pixel text-gold">{newBalance.toLocaleString()}</span>
            </div>
            <motion.button
              onClick={onDismiss}
              className="font-pixel text-xs bg-accent text-white px-6 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              CONTINUE
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export type { SettledBet }
