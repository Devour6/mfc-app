'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, TrendingUp, Clock, Target, Flame, DollarSign } from 'lucide-react'
import { FightState } from '@/types'

interface BettingMarket {
  id: string
  type: 'next_strike' | 'round_winner' | 'knockout' | 'combo_count' | 'stamina_first' | 'round_duration'
  title: string
  description: string
  options: BettingOption[]
  timeWindow: number // seconds remaining to bet
  multiplier?: number
  active: boolean
  volume: number // total betting volume
}

interface BettingOption {
  id: string
  label: string
  odds: number
  probability: number
  color: string
}

interface BettingSlip {
  marketId: string
  optionId: string
  amount: number
  potentialPayout: number
  timestamp: number
}

interface LiveBettingInterfaceProps {
  fightState: FightState | null
  fighters?: any[] // Fighter names and info
  creditBalance?: number
  onPlaceBet?: (bet: BettingSlip) => void
  onMarketUpdate?: (marketId: string) => void
}

export default function LiveBettingInterface({ 
  fightState, 
  fighters = [],
  creditBalance = 1000,
  onPlaceBet,
  onMarketUpdate
}: LiveBettingInterfaceProps) {
  const [activeMarkets, setActiveMarkets] = useState<BettingMarket[]>([])
  const [bettingSlips, setBettingSlips] = useState<BettingSlip[]>([])
  const [selectedAmount, setSelectedAmount] = useState<number>(10)
  const [showBettingSlip, setShowBettingSlip] = useState(false)
  const [recentWin, setRecentWin] = useState<{ amount: number; market: string } | null>(null)

  // Generate dynamic markets based on fight state
  useEffect(() => {
    if (!fightState) return

    const markets: BettingMarket[] = []

    // Next Strike Market (fast-paced, 15-second windows)
    if (fightState.phase === 'fighting') {
      markets.push({
        id: 'next_strike',
        type: 'next_strike',
        title: 'Next Strike Lands',
        description: 'Who will land the next significant strike?',
        options: [
          {
            id: 'fighter1',
            label: fighters[0]?.name || 'Fighter 1',
            odds: 1.8,
            probability: 55,
            color: 'text-red-400'
          },
          {
            id: 'fighter2', 
            label: fighters[1]?.name || 'Fighter 2',
            odds: 2.2,
            probability: 45,
            color: 'text-blue-400'
          },
          {
            id: 'miss',
            label: 'Both Miss',
            odds: 4.5,
            probability: 15,
            color: 'text-yellow-400'
          }
        ],
        timeWindow: 15,
        active: true,
        volume: Math.floor(Math.random() * 5000) + 1000
      })

      // Combo Count Market
      markets.push({
        id: 'combo_count',
        type: 'combo_count',
        title: 'Next Combo Size',
        description: 'How many strikes in the next combo?',
        options: [
          { id: '1-2', label: '1-2 Strikes', odds: 1.4, probability: 70, color: 'text-green-400' },
          { id: '3-4', label: '3-4 Strikes', odds: 3.2, probability: 25, color: 'text-orange-400' },
          { id: '5+', label: '5+ Strikes', odds: 8.0, probability: 5, color: 'text-purple-400' }
        ],
        timeWindow: 20,
        active: true,
        volume: Math.floor(Math.random() * 3000) + 500
      })

      // Stamina First Market
      if (fightState.round && fightState.round >= 2) {
        markets.push({
          id: 'stamina_first',
          type: 'stamina_first',
          title: 'First to 50% Stamina',
          description: 'Who will drop to 50% stamina first?',
          options: [
            {
              id: 'fighter1',
              label: fighters[0]?.name || 'Fighter 1',
              odds: 2.1,
              probability: 48,
              color: 'text-red-400'
            },
            {
              id: 'fighter2',
              label: fighters[1]?.name || 'Fighter 2', 
              odds: 1.9,
              probability: 52,
              color: 'text-blue-400'
            }
          ],
          timeWindow: 30,
          active: true,
          volume: Math.floor(Math.random() * 2000) + 800
        })
      }
    }

    // Round Winner Market
    if (fightState.phase === 'fighting') {
      markets.push({
        id: 'round_winner',
        type: 'round_winner',
        title: `Round ${fightState.round} Winner`,
        description: 'Who will win this round on points?',
        options: [
          {
            id: 'fighter1',
            label: fighters[0]?.name || 'Fighter 1',
            odds: 1.7,
            probability: 58,
            color: 'text-red-400'
          },
          {
            id: 'fighter2',
            label: fighters[1]?.name || 'Fighter 2',
            odds: 2.3,
            probability: 42,
            color: 'text-blue-400'
          }
        ],
        timeWindow: 45,
        active: fightState.phase === 'fighting',
        volume: Math.floor(Math.random() * 8000) + 2000
      })
    }

    setActiveMarkets(markets)
  }, [fightState])

  // Market countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMarkets(prev => prev.map(market => ({
        ...market,
        timeWindow: Math.max(0, market.timeWindow - 1),
        active: market.timeWindow > 1
      })))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Simulate betting outcomes
  useEffect(() => {
    if (fightState?.fighter1?.animation?.state === 'punching' && Math.random() > 0.7) {
      // Check for winning bets
      const winningBets = bettingSlips.filter(bet => {
        const market = activeMarkets.find(m => m.id === bet.marketId)
        return market?.type === 'next_strike' && bet.optionId === 'fighter1'
      })

      if (winningBets.length > 0) {
        const totalWin = winningBets.reduce((sum, bet) => sum + bet.potentialPayout, 0)
        setRecentWin({ amount: totalWin, market: 'Next Strike' })
        setBettingSlips(prev => prev.filter(bet => !winningBets.includes(bet)))
        setTimeout(() => setRecentWin(null), 3000)
      }
    }
  }, [fightState?.fighter1?.animation?.state])

  const placeBet = (marketId: string, optionId: string) => {
    const market = activeMarkets.find(m => m.id === marketId)
    const option = market?.options.find(o => o.id === optionId)
    
    if (!market || !option || !market.active) return
    if (selectedAmount > creditBalance) return

    const bet: BettingSlip = {
      marketId,
      optionId,
      amount: selectedAmount,
      potentialPayout: selectedAmount * option.odds,
      timestamp: Date.now()
    }

    setBettingSlips(prev => [...prev, bet])
    onPlaceBet?.(bet)
    
    // Visual feedback
    setShowBettingSlip(true)
    setTimeout(() => setShowBettingSlip(false), 2000)
  }

  const getTimeWindowColor = (timeWindow: number) => {
    if (timeWindow > 20) return 'text-green-400'
    if (timeWindow > 10) return 'text-yellow-400'
    return 'text-red-400'
  }

  const quickAmounts = [5, 10, 25, 50, 100]

  return (
    <div className="bg-surface border border-border rounded-lg p-4 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          <h3 className="font-pixel text-sm text-accent">LIVE BETTING</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <DollarSign className="w-4 h-4 text-gold" />
          <span className="text-gold font-pixel">{creditBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* Quick Amount Selection */}
      <div className="mb-4">
        <div className="text-xs text-text2 mb-2 font-pixel">BET AMOUNT:</div>
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map(amount => (
            <motion.button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`px-3 py-1 text-xs font-pixel border transition-all ${
                selectedAmount === amount
                  ? 'bg-accent text-white border-accent'
                  : 'bg-transparent text-text2 border-border hover:text-text hover:border-text2'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {amount}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Active Markets */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {activeMarkets.filter(market => market.active).map(market => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-bg border border-border rounded p-3"
            >
              {/* Market Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-pixel text-text mb-1">{market.title}</div>
                  <div className="text-xs text-text2">{market.description}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-pixel ${getTimeWindowColor(market.timeWindow)}`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {market.timeWindow}s
                  </div>
                  <div className="text-xs text-text2">
                    Vol: {market.volume.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Betting Options */}
              <div className="space-y-2">
                {market.options.map(option => (
                  <motion.button
                    key={option.id}
                    onClick={() => placeBet(market.id, option.id)}
                    className={`w-full flex justify-between items-center p-2 border rounded transition-all ${
                      market.active 
                        ? 'border-border hover:border-accent hover:bg-accent/5' 
                        : 'border-surface2 opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={market.active ? { scale: 1.02 } : {}}
                    whileTap={market.active ? { scale: 0.98 } : {}}
                    disabled={!market.active || selectedAmount > creditBalance}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`text-xs font-pixel ${option.color}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-text2">
                        {option.probability}%
                      </div>
                    </div>
                    <div className="text-xs font-pixel text-gold">
                      {option.odds}x
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* No Active Markets */}
        {activeMarkets.filter(market => market.active).length === 0 && (
          <div className="text-center py-8 text-text2">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-xs font-pixel">No live markets available</div>
            <div className="text-xs">Markets will appear during fights</div>
          </div>
        )}
      </div>

      {/* Active Betting Slips */}
      {bettingSlips.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="text-xs text-text2 mb-2 font-pixel">ACTIVE BETS:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {bettingSlips.map((bet, index) => {
              const market = activeMarkets.find(m => m.id === bet.marketId)
              const option = market?.options.find(o => o.id === bet.optionId)
              return (
                <div key={index} className="flex justify-between text-xs bg-surface2 p-1 rounded">
                  <span className="text-text2">{option?.label}</span>
                  <span className="text-gold font-pixel">+{bet.potentialPayout}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Win Notification */}
      <AnimatePresence>
        {recentWin && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <div>
                <div className="font-pixel text-sm">BET WON!</div>
                <div className="text-xs">+{recentWin.amount} credits</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Betting Slip Confirmation */}
      <AnimatePresence>
        {showBettingSlip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-surface border border-accent rounded-lg p-6 text-center">
              <Flame className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="font-pixel text-accent mb-2">BET PLACED!</div>
              <div className="text-xs text-text2">Good luck!</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}