'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import EnhancedFightCanvas from './EnhancedFightCanvas'
import FightCard from './FightCard'
import CommentaryBar from './CommentaryBar'
import TradingPanel, { BettingSlip } from './TradingPanel'
import LiveStatsOverlay from './LiveStatsOverlay'
import FightReplayViewer from './FightReplayViewer'
import BetSettlementOverlay, { SettledBet } from './BetSettlementOverlay'
import { FightEngine } from '@/lib/fight-engine'
import { MarketEngine } from '@/lib/market-engine'
import { FightRecording } from '@/lib/fight-recorder'
import { FightState, MarketState, Commentary, Fighter } from '@/types'
import { FighterEvolutionEngine } from '@/lib/evolution-engine'
import soundManager from '@/lib/sound-manager'
import { useGameStore } from '@/lib/store'

interface LiveFightSectionProps {
  onFightComplete?: (fighterId: string, fightData: any) => void
}

// Sample fighter data
const sampleFighters: Fighter[] = [
  {
    id: 'ironclad-7',
    name: 'IRONCLAD-7',
    emoji: '🤖',
    class: 'Heavyweight',
    record: { wins: 14, losses: 2, draws: 0 },
    elo: 1847,
    stats: {
      strength: 88,
      speed: 72,
      defense: 81,
      stamina: 75,
      fightIQ: 85,
      aggression: 79
    },
    owner: 'DarkMatter_Labs',
    isActive: true,
    trainingCost: 50,
    evolution: FighterEvolutionEngine.createNewEvolution(29)
  },
  {
    id: 'nexus-prime',
    name: 'NEXUS-PRIME',
    emoji: '⚡',
    class: 'Heavyweight',
    record: { wins: 11, losses: 4, draws: 0 },
    elo: 1723,
    stats: {
      strength: 85,
      speed: 78,
      defense: 73,
      stamina: 82,
      fightIQ: 91,
      aggression: 68
    },
    owner: 'SynthCorp',
    isActive: true,
    trainingCost: 50,
    evolution: FighterEvolutionEngine.createNewEvolution(32)
  }
]

export default function LiveFightSection({
  onFightComplete
}: LiveFightSectionProps) {
  const [fightState, setFightState] = useState<FightState | null>(null)
  const [marketState, setMarketState] = useState<MarketState | null>(null)
  const [commentary, setCommentary] = useState<Commentary[]>([])
  const [currentCommentary, setCurrentCommentary] = useState<Commentary | null>(null)
  const [fightEngine, setFightEngine] = useState<FightEngine | null>(null)
  const [marketEngine, setMarketEngine] = useState<MarketEngine | null>(null)
  const [showFightCard, setShowFightCard] = useState(true)
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [replayRecording, setReplayRecording] = useState<FightRecording | null>(null)
  const [showReplay, setShowReplay] = useState(false)
  const [activeBets, setActiveBets] = useState<Array<{
    id: string; marketTitle: string; side: string; amount: number; odds: number; optionId: string
  }>>([])
  const [settledBets, setSettledBets] = useState<SettledBet[]>([])
  const [showSettlement, setShowSettlement] = useState(false)

  // Connect to game store for reactive credits
  const credits = useGameStore(state => state.user.credits)
  const placeBetAndDeduct = useGameStore(state => state.placeBetAndDeduct)
  const fetchCredits = useGameStore(state => state.fetchCredits)

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  // Initialize fight and market engines
  useEffect(() => {
    const fighter1 = sampleFighters[0]
    const fighter2 = sampleFighters[1]

    // Create fight engine with recording enabled
    const fight = new FightEngine(
      fighter1,
      fighter2,
      (state: FightState) => {
        setFightState(state)
        
        // Update market based on fight state if market engine exists
        if (marketEngine && state.phase === 'fighting') {
          marketEngine.updateBasedOnFightState(state)
        }
        
        // Handle fight end
        if (state.result && marketEngine) {
          marketEngine.settleMarket(state.result.winner, {
            fighter1: fighter1.name,
            fighter2: fighter2.name
          })

          // Capture recording for replay
          const recording = fight.getRecording()
          if (recording) setReplayRecording(recording)

          // Settle active bets
          setActiveBets(currentBets => {
            if (currentBets.length > 0) {
              const winnerId = state.result!.winner
              const settled = currentBets.map(bet => {
                const won = (bet.optionId === 'fighter1' && winnerId === fighter1.id)
                  || (bet.optionId === 'fighter2' && winnerId === fighter2.id)
                  || (bet.optionId === fighter1.name && winnerId === fighter1.id)
                  || (bet.optionId === fighter2.name && winnerId === fighter2.id)
                return {
                  ...bet,
                  status: won ? 'WON' as const : 'LOST' as const,
                  payout: won ? Math.round(bet.amount * bet.odds) : 0,
                }
              })
              setSettledBets(settled)
              setTimeout(() => setShowSettlement(true), 2000)
            }
            return []
          })

          // Auto-restart after delay if enabled
          if (autoRestartEnabled) {
            setTimeout(() => {
              fight.restart()
              const newMarket = new MarketEngine(
                `Will ${fighter1.name} win?`,
                0.5 + (Math.random() - 0.5) * 0.2, // Slight random variation
                setMarketState
              )
              newMarket.start()
              setMarketEngine(newMarket)
              setShowFightCard(true)
              setTimeout(() => setShowFightCard(false), 3000)
            }, 5000)
          }
        }
      },
      (comment: Commentary) => {
        setCommentary(prev => [comment, ...prev.slice(0, 49)]) // Keep last 50 comments
        setCurrentCommentary(comment)
        
        // Play appropriate sound effects
        if (comment.text.includes('DEVASTATING') || comment.text.includes('BRUTAL')) {
          soundManager.play('punch-heavy', 0.8)
        } else if (comment.text.includes('connects') || comment.text.includes('lands')) {
          soundManager.play('punch-light', 0.6)
        } else if (comment.text.includes('dodge') || comment.text.includes('misses')) {
          soundManager.play('dodge', 0.4)
        } else if (comment.text.includes('K.O.') || comment.text.includes('TKO')) {
          soundManager.play('ko', 1.0)
          setTimeout(() => soundManager.play('crowd-cheer', 0.7), 500)
        }
      },
      true // enableRecording for replay
    )

    // Create market engine
    const market = new MarketEngine(
      `Will ${fighter1.name} win?`,
      0.5 + (Math.random() - 0.5) * 0.2, // Slight random variation in opening price
      setMarketState
    )

    setFightEngine(fight)
    setMarketEngine(market)

    // Start both engines
    fight.start()
    market.start()

    // Show fight card initially
    setShowFightCard(true)
    setTimeout(() => setShowFightCard(false), 3000)

    // Cleanup
    return () => {
      fight.stop()
      market.stop()
    }
  }, [autoRestartEnabled]) // Re-initialize if auto-restart setting changes

  const handleRestartFight = () => {
    if (fightEngine && marketEngine) {
      fightEngine.restart()
      
      // Create new market
      const fighter1 = sampleFighters[0]
      const newMarket = new MarketEngine(
        `Will ${fighter1.name} win?`,
        0.5 + (Math.random() - 0.5) * 0.2,
        setMarketState
      )
      newMarket.start()
      setMarketEngine(newMarket)
      
      setCommentary([])
      setCurrentCommentary(null)
      setShowFightCard(true)
      setTimeout(() => setShowFightCard(false), 3000)
      
      soundManager.play('bell', 0.8)
    }
  }

  const handleTrade = (side: 'yes' | 'no', price: number, quantity: number) => {
    const cost = price * quantity
    
    if (marketEngine) {
      const trade = marketEngine.placeTrade(side, price, quantity)
      
      if (trade.status === 'filled') {
        soundManager.play('notification', 0.6)
        // Simulate potential profit/loss (simplified)
        const outcome = Math.random()
        const won = (side === 'yes' && outcome > 0.5) || (side === 'no' && outcome <= 0.5)
        
        // For now, just play success sound - real credit integration would be added later
        if (won) {
          soundManager.play('bell', 0.5)
        }
      } else {
        soundManager.play('punch-light', 0.4)
      }
      
      return trade
    }
    
    soundManager.play('punch-light', 0.4)
    return null
  }

  if (!fightState || !marketState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="font-pixel text-2xl text-accent mb-4 animate-pulse">
            INITIALIZING FIGHT
          </div>
          <div className="text-text2">Loading championship bout...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Fight Card Overlay */}
      {showFightCard && (
        <FightCard 
          fighters={sampleFighters}
          onDismiss={() => setShowFightCard(false)}
        />
      )}

      {/* Main Fight Layout - Responsive: stacked on mobile, sidebar on desktop */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_380px] overflow-y-auto lg:overflow-hidden">
        {/* Fight Area */}
        <div className="flex flex-col min-h-[50vh] lg:min-h-0 lg:overflow-hidden">
          {/* Fight Header */}
          <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="font-pixel text-xs text-gold">
              ROUND {fightState.round} OF {fightState.maxRounds}
            </div>
            <div className="font-pixel text-sm text-text">
              {Math.floor(fightState.clock / 60)}:{(fightState.clock % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !soundEnabled
                  setSoundEnabled(next)
                  if (next) { soundManager.unmute() } else { soundManager.mute() }
                }}
                className="font-pixel text-[10px] text-text2 hover:text-text transition-colors"
                title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
              >
                {soundEnabled ? 'SND:ON' : 'SND:OFF'}
              </button>
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-green"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="font-pixel text-xs text-green">LIVE</span>
              </div>
            </div>
          </div>

          {/* Fight Canvas */}
          <div className="flex-1 bg-bg relative overflow-hidden">
            <EnhancedFightCanvas 
              fightState={fightState} 
              fighters={sampleFighters}
              onRoundStart={(round) => {
                setCommentary(prev => [{
                  id: Date.now().toString(),
                  text: `Round ${round} begins! Both fighters looking determined.`,
                  timestamp: Date.now(),
                  type: 'general',
                  priority: 'medium'
                }, ...prev])
                soundManager.play('bell', 0.8)
              }}
              onSignificantMoment={(moment, severity) => {
                let commentText = ""
                switch(moment) {
                  case 'knockdown':
                    commentText = "WHAT A DEVASTATING KNOCKDOWN! The crowd is on their feet!"
                    break
                  case 'fighter-hurt':
                    commentText = "One fighter is in serious trouble here!"
                    break
                  default:
                    commentText = "The intensity in the ring is building!"
                }
                
                setCommentary(prev => [{
                  id: Date.now().toString(),
                  text: commentText,
                  timestamp: Date.now(),
                  type: 'action',
                  priority: severity
                }, ...prev])
              }}
            />
            
            {/* KO Overlay */}
            {fightState.result && (
              <motion.div
                className="absolute inset-0 bg-black/85 flex items-center justify-center z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <motion.div
                    className="font-pixel text-6xl text-accent mb-4"
                    animate={{
                      scale: [1, 1.1, 1],
                      textShadow: [
                        '0 0 40px rgba(255,68,68,0.6)',
                        '0 0 60px rgba(255,68,68,0.8)',
                        '0 0 40px rgba(255,68,68,0.6)'
                      ]
                    }}
                    transition={{ duration: 0.5, repeat: 3 }}
                  >
                    {fightState.result.method}
                  </motion.div>
                  <div className="font-pixel text-lg text-gold mb-2">
                    {fightState.result.winner} WINS!
                  </div>
                  <div className="text-text2 mb-6">
                    Round {fightState.result.round} - {fightState.result.method} at {fightState.result.time}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <motion.button
                      onClick={handleRestartFight}
                      className="font-pixel text-sm bg-accent text-white px-6 py-3 hover:bg-accent/90 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      NEXT FIGHT
                    </motion.button>
                    {replayRecording && (
                      <motion.button
                        onClick={() => setShowReplay(true)}
                        className="font-pixel text-sm border border-gold text-gold px-6 py-3 hover:bg-gold/10 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        WATCH REPLAY
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fight Replay Viewer */}
            {showReplay && replayRecording && (
              <div className="absolute inset-0 z-30">
                <FightReplayViewer
                  recording={replayRecording}
                  fighters={sampleFighters}
                  onClose={() => setShowReplay(false)}
                />
              </div>
            )}
          </div>

          {/* Commentary Bar */}
          <CommentaryBar commentary={currentCommentary} />
        </div>

        {/* Right Sidebar - Unified Trading Panel */}
        <div className="flex flex-col overflow-hidden bg-surface lg:border-l border-t lg:border-t-0 border-border">
          {/* Live Stats Overlay */}
          <div className="border-b border-border">
            <LiveStatsOverlay fightState={fightState} fighters={sampleFighters} />
          </div>

          {/* Trading Panel */}
          <div className="flex-1 overflow-hidden">
            <TradingPanel
              marketState={marketState}
              fightState={fightState}
              fighters={sampleFighters}
              credits={credits}
              onPlaceBet={(bet: BettingSlip) => {
                const success = placeBetAndDeduct(bet.amount, `Bet on ${bet.marketId}`)
                if (success) {
                  setActiveBets(prev => [...prev, {
                    id: `bet-${Date.now()}`,
                    marketTitle: bet.marketId,
                    side: bet.optionId ?? bet.marketId,
                    amount: bet.amount,
                    odds: (bet.potentialPayout ?? bet.amount * 2) / bet.amount,
                    optionId: bet.optionId ?? 'fighter1',
                  }])
                } else {
                  soundManager.play('punch-light', 0.4)
                }
              }}
              onPlaceTrade={handleTrade}
              activeBets={activeBets}
            />
          </div>
        </div>

      </div>

      {/* Bet Settlement Overlay */}
      <BetSettlementOverlay
        settledBets={settledBets}
        newBalance={credits}
        isVisible={showSettlement}
        onDismiss={() => {
          setShowSettlement(false)
          setSettledBets([])
        }}
      />
    </div>
  )
}