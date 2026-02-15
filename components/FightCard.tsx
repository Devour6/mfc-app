'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Fighter } from '@/types'

interface FightCardProps {
  fighters: Fighter[]
  onDismiss: () => void
}

export default function FightCard({ fighters, onDismiss }: FightCardProps) {
  const [fighter1, fighter2] = fighters

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-surface border border-border rounded-lg p-8 max-w-2xl w-full relative"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-text2 hover:text-accent transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Fight Card Header */}
        <div className="text-center mb-8">
          <div className="font-pixel text-xs text-accent mb-2 tracking-widest">
            MAIN EVENT
          </div>
          <div className="font-pixel text-lg text-gold mb-1">
            HEAVYWEIGHT CHAMPIONSHIP
          </div>
          <div className="text-text2">
            The Octagon • Live from MFC Arena
          </div>
        </div>

        {/* Fighters Display */}
        <div className="flex items-center justify-between mb-8">
          {/* Fighter 1 */}
          <motion.div
            className="text-center flex-1"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-6xl mb-4">{fighter1.emoji}</div>
            <div className="font-pixel text-lg text-accent mb-2">{fighter1.name}</div>
            <div className="text-text2 mb-2">{fighter1.owner}</div>
            <div className="font-semibold text-text">
              {fighter1.record.wins}-{fighter1.record.losses}-{fighter1.record.draws}
            </div>
            <div className="text-gold font-bold">ELO {fighter1.elo}</div>
            
            {/* Stats Preview */}
            <div className="mt-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text2">STR</span>
                <span className="text-accent">{fighter1.stats.strength}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text2">SPD</span>
                <span className="text-accent">{fighter1.stats.speed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text2">DEF</span>
                <span className="text-accent">{fighter1.stats.defense}</span>
              </div>
            </div>
          </motion.div>

          {/* VS Divider */}
          <motion.div
            className="px-8 text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="font-pixel text-2xl text-text2 mb-2">VS</div>
            <div className="w-16 h-px bg-border"></div>
          </motion.div>

          {/* Fighter 2 */}
          <motion.div
            className="text-center flex-1"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-6xl mb-4">{fighter2.emoji}</div>
            <div className="font-pixel text-lg text-accent2 mb-2">{fighter2.name}</div>
            <div className="text-text2 mb-2">{fighter2.owner}</div>
            <div className="font-semibold text-text">
              {fighter2.record.wins}-{fighter2.record.losses}-{fighter2.record.draws}
            </div>
            <div className="text-gold font-bold">ELO {fighter2.elo}</div>
            
            {/* Stats Preview */}
            <div className="mt-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text2">STR</span>
                <span className="text-accent2">{fighter2.stats.strength}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text2">SPD</span>
                <span className="text-accent2">{fighter2.stats.speed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text2">DEF</span>
                <span className="text-accent2">{fighter2.stats.defense}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fight Details */}
        <motion.div
          className="border-t border-border pt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-text2">Format</div>
              <div className="font-semibold">3 Rounds</div>
            </div>
            <div>
              <div className="text-text2">Weight Class</div>
              <div className="font-semibold">{fighter1.class}</div>
            </div>
            <div>
              <div className="text-text2">Method</div>
              <div className="font-semibold">KO/TKO/Decision</div>
            </div>
          </div>
        </motion.div>

        {/* Auto-dismiss timer */}
        <motion.div
          className="mt-6 h-1 bg-surface2 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="h-full bg-accent"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        </motion.div>

        <div className="text-center text-xs text-text2 mt-2">
          Fight starting in 3 seconds...
        </div>
      </motion.div>
    </motion.div>
  )
}