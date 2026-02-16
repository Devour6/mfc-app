'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import EnhancedLeaderboard from './EnhancedLeaderboard'
import { Fighter } from '@/types'

interface RankingsSectionProps {
  fighters: Fighter[]
}

export default function RankingsSection({ fighters }: RankingsSectionProps) {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('allTime')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-pixel text-2xl text-accent mb-2">FIGHTER RANKINGS</h1>
        <p className="text-text2">
          Global leaderboard tracking the best fighters across all weight classes.
        </p>
      </motion.div>

      <EnhancedLeaderboard 
        fighters={fighters}
        timeframe={timeframe}
        onTimeframeChange={(newTimeframe) => setTimeframe(newTimeframe as any)}
      />
    </div>
  )
}