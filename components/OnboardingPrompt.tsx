'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface OnboardingPromptProps {
  fighter1Name: string
  fighter2Name: string
  yesPrice: number // fighter1 win probability (0-1)
  visible: boolean
  onPick: (fighterId: 'fighter1' | 'fighter2') => void
}

export default function OnboardingPrompt({
  fighter1Name,
  fighter2Name,
  yesPrice,
  visible,
  onPick,
}: OnboardingPromptProps) {
  const [picked, setPicked] = useState<'fighter1' | 'fighter2' | null>(null)

  const f1Sentiment = Math.round(yesPrice * 100)
  const f2Sentiment = 100 - f1Sentiment

  const handlePick = (fighter: 'fighter1' | 'fighter2') => {
    if (picked) return
    setPicked(fighter)
    // Brief flash, then callback
    setTimeout(() => onPick(fighter), 300)
  }

  return (
    <AnimatePresence>
      {visible && !picked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, height: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-surface border-y border-border py-5 px-4 text-center"
        >
          <div className="font-pixel text-xs text-text2 tracking-wider mb-4">
            WHO DO YOU THINK WINS?
          </div>

          <div className="flex gap-4 justify-center max-w-[480px] mx-auto w-full">
            {/* Fighter 1 button */}
            <motion.button
              onClick={() => handlePick('fighter1')}
              className={`flex-1 border-2 border-accent px-6 py-4 min-h-[64px] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                picked === 'fighter1' ? 'bg-accent/30' : 'hover:bg-accent/10 active:bg-accent/20'
              }`}
              whileTap={{ scale: 0.98 }}
              aria-label={`Pick ${fighter1Name} to win`}
            >
              <div className="font-pixel text-xs text-text">{fighter1Name}</div>
              <div className="font-ui text-xs text-accent mt-1">
                {f1Sentiment}% say yes
              </div>
            </motion.button>

            {/* Fighter 2 button */}
            <motion.button
              onClick={() => handlePick('fighter2')}
              className={`flex-1 border-2 border-accent2 px-6 py-4 min-h-[64px] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent2 focus-visible:outline-none ${
                picked === 'fighter2' ? 'bg-accent2/30' : 'hover:bg-accent2/10 active:bg-accent2/20'
              }`}
              whileTap={{ scale: 0.98 }}
              aria-label={`Pick ${fighter2Name} to win`}
            >
              <div className="font-pixel text-xs text-text">{fighter2Name}</div>
              <div className="font-ui text-xs text-accent2 mt-1">
                {f2Sentiment}% say yes
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
