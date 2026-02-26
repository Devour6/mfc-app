'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FightState } from '@/types'

interface LiveBettingInterfaceProps {
  fightState: FightState
  onPlaceBet: (bet: any) => void
}

export default function LiveBettingInterface({
  fightState,
  onPlaceBet
}: LiveBettingInterfaceProps) {
  const [betAmount, setBetAmount] = useState(100)
  const [selectedFighter, setSelectedFighter] = useState<string>('')

  const handlePlaceBet = () => {
    if (!selectedFighter) return
    
    onPlaceBet({
      fighter: selectedFighter,
      amount: betAmount,
      odds: 1.8, // Default odds
      round: fightState.round
    })
  }

  const isActive = fightState.phase === 'fighting' || fightState.phase === 'repricing'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 backdrop-blur-lg rounded-lg p-4 border border-gray-700"
    >
      <h3 className="text-lg font-bold text-white mb-4">Live Betting</h3>
      
      {isActive ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Select Fighter</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedFighter('fighter1')}
                className={`p-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedFighter === 'fighter1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Fighter 1
              </button>
              <button
                onClick={() => setSelectedFighter('fighter2')}
                className={`p-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedFighter === 'fighter2'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Fighter 2
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Bet Amount</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              min="1"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlaceBet}
            disabled={!selectedFighter}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Place Bet
          </motion.button>
          
          <div className="text-xs text-gray-400">
            Round {fightState.round} of {fightState.maxRounds}
            {fightState.repricingTimeLeft && (
              <div className="text-yellow-400 font-semibold">
                Repricing: {fightState.repricingTimeLeft}s
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <div className="text-lg mb-2">🔒</div>
          <div className="text-sm">
            Betting is {fightState.phase === 'ended' ? 'closed' : 'paused'}
          </div>
        </div>
      )}
    </motion.div>
  )
}