'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EnhancedFightCanvas from './EnhancedFightCanvas'
import DramaticFightEffects, { useDramaticEffects } from './DramaticFightEffects'
import RealTimeFightMetrics, { useFightStatistics } from './RealTimeFightMetrics'
import EnhancedHealthSystem from './EnhancedHealthSystem'
import AIPredictionEngine from './AIPredictionEngine'
import CrowdHypeSystem from './CrowdHypeSystem'
import MobileEnhancements, { MobileFightControls, SwipeGestures, MobileBettingQuickActions } from './MobileEnhancements'
import MarketSidebar from './MarketSidebar'
import FightCard from './FightCard'
import CommentaryBar from './CommentaryBar'
import LiveBettingInterface from './LiveBettingInterface'
import { FightEngine } from '@/lib/fight-engine'
import { MarketEngine } from '@/lib/market-engine'
import { FightState, MarketState, Commentary, Fighter } from '@/types'
import { FighterEvolutionEngine } from '@/lib/evolution-engine'
import soundManager from '@/lib/sound-manager'

interface SuperEnhancedLiveFightProps {
  onFightComplete?: (fighterId: string, fightData: any) => void
}

// Enhanced sample fighters with more dramatic stats
const sampleFighters: Fighter[] = [
  {
    id: 'titanfall-destroyer',
    name: 'TITANFALL-DESTROYER',
    emoji: '🤖',
    class: 'Heavyweight',
    record: { wins: 18, losses: 1, draws: 0 },
    elo: 1987,
    stats: {
      strength: 95,
      speed: 78,
      defense: 88,
      stamina: 82,
      fightIQ: 91,
      aggression: 85
    },
    owner: 'DarkMatter_Labs',
    isActive: true,
    trainingCost: 75,
    evolution: FighterEvolutionEngine.createNewEvolution(28)
  },
  {
    id: 'ghost-protocol',
    name: 'GHOST-PROTOCOL',
    emoji: '👻',
    class: 'Heavyweight',
    record: { wins: 16, losses: 3, draws: 0 },
    elo: 1923,
    stats: {
      strength: 87,
      speed: 93,
      defense: 76,
      stamina: 89,
      fightIQ: 88,
      aggression: 92
    },
    owner: 'SynthCorp',
    isActive: true,
    trainingCost: 70,
    evolution: FighterEvolutionEngine.createNewEvolution(31)
  }
]

interface RoundEndData {
  round: number
  winner: 'fighter1' | 'fighter2' | 'draw'
  stats: {
    fighter1Strikes: number
    fighter2Strikes: number
    significantMoments: number
  }
}

export default function SuperEnhancedLiveFight({
  onFightComplete
}: SuperEnhancedLiveFightProps) {
  const [fightState, setFightState] = useState<FightState | null>(null)
  const [marketState, setMarketState] = useState<MarketState | null>(null)
  const [commentary, setCommentary] = useState<Commentary[]>([])
  const [currentCommentary, setCurrentCommentary] = useState<Commentary | null>(null)
  const [fightEngine, setFightEngine] = useState<FightEngine | null>(null)
  const [marketEngine, setMarketEngine] = useState<MarketEngine | null>(null)
  const [showFightCard, setShowFightCard] = useState(true)
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true)
  const [roundEndData, setRoundEndData] = useState<RoundEndData | null>(null)
  const [fightIntensity, setFightIntensity] = useState(0)
  const [crowdExcitement, setCrowdExcitement] = useState(0)
  const [userActions, setUserActions] = useState({ cheers: 0, boos: 0, shakeIntensity: 0 })
  const [currentMarketOdds, setCurrentMarketOdds] = useState({ fighter1: 1.8, fighter2: 2.1 })
  const [userBalance, setUserBalance] = useState(1000)

  // Dramatic effects hooks
  const { 
    effects, 
    addEffect, 
    triggerHeavyHit, 
    triggerKnockout, 
    triggerCriticalMoment 
  } = useDramaticEffects()
  
  const { 
    stats, 
    recordStrike, 
    recordKnockdown, 
    recordCombo, 
    resetStats 
  } = useFightStatistics()

  const audioContextRef = useRef<AudioContext | null>(null)
  const crowdNoiseRef = useRef<AudioBufferSourceNode | null>(null)

  // Initialize enhanced fight system
  useEffect(() => {
    const fighter1 = sampleFighters[0]
    const fighter2 = sampleFighters[1]

    // Initialize audio context for crowd effects
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Create enhanced fight engine with dramatic callbacks
    const fight = new FightEngine(
      fighter1,
      fighter2,
      (state: FightState) => {
        setFightState(state)
        
        // Analyze fight for dramatic moments (but check if fighters exist)
        if (state.fighter1 && state.fighter2) {
          analyzeFightForDrama(state)
        }
        
        // Update market based on fight state
        if (marketEngine && state.phase === 'fighting') {
          marketEngine.updateBasedOnFightState(state)
          
          // Update market odds for AI prediction
          const fighter1Health = state.fighter1.hp / 100
          const fighter2Health = state.fighter2.hp / 100
          const healthRatio = fighter1Health / fighter2Health
          
          setCurrentMarketOdds({
            fighter1: Math.max(1.1, 2.0 / Math.max(0.5, healthRatio)),
            fighter2: Math.max(1.1, 2.0 * Math.max(0.5, healthRatio))
          })
        }
        
        // Handle fight end with dramatic effects
        if (state.result && marketEngine) {
          handleFightEnd(state, fighter1, fighter2)
        }
      },
      (comment: Commentary) => {
        setCommentary(prev => [comment, ...prev.slice(0, 49)])
        setCurrentCommentary(comment)
        
        // Trigger dramatic effects based on commentary
        handleCommentaryEffects(comment)
      }
    )

    // Create enhanced market engine
    const market = new MarketEngine(
      `Will ${fighter1.name} defeat ${fighter2.name}?`,
      0.5 + (Math.random() - 0.5) * 0.2,
      setMarketState
    )

    setFightEngine(fight)
    setMarketEngine(market)

    // Start both engines with dramatic intro
    startFightWithIntro(fight, market)

    // Cleanup
    return () => {
      fight.stop()
      market.stop()
      stopCrowdNoise()
    }
  }, [autoRestartEnabled])

  const analyzeFightForDrama = (state: FightState) => {
    if (!state.fighter1 || !state.fighter2) return

    const fighter1Health = state.fighter1.hp / 100
    const fighter2Health = state.fighter2.hp / 100
    
    // Calculate fight intensity based on health states and action
    const averageHealth = (fighter1Health + fighter2Health) / 2
    const healthDifference = Math.abs(fighter1Health - fighter2Health)
    const actionIntensity = state.phase === 'fighting' ? 80 : 20
    
    const newIntensity = Math.min(100, 
      actionIntensity + 
      (1 - averageHealth) * 50 + 
      healthDifference * 30
    )
    
    setFightIntensity(newIntensity)
    setCrowdExcitement(Math.min(100, newIntensity + Math.random() * 20))

    // Trigger dramatic effects based on health states
    if (fighter1Health < 0.2 || fighter2Health < 0.2) {
      if (Math.random() < 0.3) { // 30% chance per update when critical
        triggerCriticalMoment()
      }
    }

    // Detect knockdown scenarios
    if (fighter1Health < 0.1 && fighter1Health > 0) {
      recordKnockdown(2) // Fighter 2 knocked down Fighter 1
      triggerHeavyHit({ x: 400, y: 300 })
    }
    
    if (fighter2Health < 0.1 && fighter2Health > 0) {
      recordKnockdown(1) // Fighter 1 knocked down Fighter 2
      triggerHeavyHit({ x: 200, y: 300 })
    }

    // Update crowd noise based on excitement
    updateCrowdNoise(crowdExcitement)
  }

  const handleCommentaryEffects = (comment: Commentary) => {
    const text = comment.text.toLowerCase()
    
    if (text.includes('devastating') || text.includes('brutal')) {
      triggerHeavyHit()
      soundManager.play('punch-heavy', 0.9)
      recordStrike(Math.random() > 0.5 ? 1 : 2, true)
    } else if (text.includes('combo') || text.includes('barrage')) {
      recordCombo(Math.random() > 0.5 ? 1 : 2)
      addEffect({
        type: 'impactRipple',
        intensity: 70,
        duration: 800,
        position: { x: 300 + Math.random() * 200, y: 250 + Math.random() * 100 }
      })
      soundManager.play('punch-light', 0.8)
    } else if (text.includes('k.o.') || text.includes('knockout')) {
      triggerKnockout()
      soundManager.play('ko', 1.0)
      setTimeout(() => soundManager.play('crowd-cheer', 0.8), 300)
    } else if (text.includes('connects') || text.includes('lands')) {
      recordStrike(Math.random() > 0.5 ? 1 : 2)
      soundManager.play('punch-light', 0.6)
    } else if (text.includes('critical') || text.includes('trouble')) {
      triggerCriticalMoment()
      soundManager.play('notification', 0.7)
    }
  }

  const handleFightEnd = (state: FightState, fighter1: Fighter, fighter2: Fighter) => {
    if (!marketEngine || !state.result) return

    // Settle market
    marketEngine.settleMarket(state.result.winner, {
      fighter1: fighter1.name,
      fighter2: fighter2.name
    })

    // Trigger knockout effect if KO finish
    if (state.result.method === 'KO' || state.result.method === 'TKO') {
      triggerKnockout()
    }

    // Auto-restart with dramatic pause
    if (autoRestartEnabled) {
      setTimeout(() => {
        restartFightWithDrama()
      }, 6000) // Longer pause for drama
    }
  }

  const startFightWithIntro = (fight: FightEngine, market: MarketEngine) => {
    // Show fight card with dramatic music
    setShowFightCard(true)
    resetStats()
    
    // Start engines after intro
    setTimeout(() => {
      fight.start()
      market.start()
      setShowFightCard(false)
      soundManager.play('bell', 0.8)
      startCrowdNoise()
    }, 4000)
  }

  const restartFightWithDrama = () => {
    if (!fightEngine || !marketEngine) return

    // Dramatic restart sequence
    stopCrowdNoise()
    
    fightEngine.restart()
    
    // Create new market with slight odds variation
    const fighter1 = sampleFighters[0]
    const newMarket = new MarketEngine(
      `Will ${fighter1.name} dominate again?`,
      0.5 + (Math.random() - 0.5) * 0.3, // More variation
      setMarketState
    )
    newMarket.start()
    setMarketEngine(newMarket)
    
    // Reset state
    setCommentary([])
    setCurrentCommentary(null)
    setRoundEndData(null)
    resetStats()
    
    // Dramatic restart intro
    setShowFightCard(true)
    setTimeout(() => {
      setShowFightCard(false)
      soundManager.play('bell', 0.8)
      startCrowdNoise()
    }, 3500)
  }

  const startCrowdNoise = () => {
    // This would integrate with a proper audio system
    // For now, just track that crowd should be active
  }

  const stopCrowdNoise = () => {
    if (crowdNoiseRef.current) {
      crowdNoiseRef.current.stop()
      crowdNoiseRef.current = null
    }
  }

  const updateCrowdNoise = (excitement: number) => {
    // Adjust crowd volume/intensity based on fight excitement
    const volume = Math.min(1, excitement / 100 * 0.4)
    // This would control actual crowd audio in a real implementation
  }

  const handleManualRestart = () => {
    restartFightWithDrama()
  }

  const handleTrade = (side: 'yes' | 'no', price: number, quantity: number) => {
    if (!marketEngine) return null

    const trade = marketEngine.placeTrade(side, price, quantity)
    
    if (trade.status === 'filled') {
      soundManager.play('notification', 0.6)
      
      // Add subtle visual effect for successful trade
      addEffect({
        type: 'screenFlash',
        intensity: 10,
        duration: 200
      })
    } else {
      soundManager.play('punch-light', 0.3)
    }

    return trade
  }

  const handleSignificantMoment = (type: string, intensity: number) => {
    // React to significant moments from metrics component
    if (type === 'momentum_shift' && intensity > 40) {
      triggerCriticalMoment()
      soundManager.play('notification', 0.8)
    }
  }

  const handleUserCheer = () => {
    setUserActions(prev => ({ ...prev, cheers: prev.cheers + 1 }))
    soundManager.play('crowd-cheer', 0.5)
  }

  const handleUserBoo = () => {
    setUserActions(prev => ({ ...prev, boos: prev.boos + 1 }))
    soundManager.play('punch-light', 0.3)
  }

  const handleUserShake = (intensity: number) => {
    setUserActions(prev => ({ ...prev, shakeIntensity: intensity }))
    if (intensity > 50) {
      triggerCriticalMoment()
      soundManager.play('notification', 0.6)
    }
  }

  const handleQuickBet = (amount: number, side: 'yes' | 'no') => {
    if (userBalance >= amount) {
      setUserBalance(prev => prev - amount)
      handleTrade(side, currentMarketOdds[side === 'yes' ? 'fighter1' : 'fighter2'], amount)
    }
  }

  const handlePlaceBet = (bet: any) => {
    // Convert bet slip to trade format
    const side = bet.prediction === sampleFighters[0].name ? 'yes' : 'no'
    const price = currentMarketOdds[side === 'yes' ? 'fighter1' : 'fighter2']
    const quantity = bet.amount || 10
    
    if (userBalance >= quantity) {
      setUserBalance(prev => prev - quantity)
      handleTrade(side, price, quantity)
    }
  }

  const handleSwipeLeft = () => {
    // Swipe left to boo
    handleUserBoo()
  }

  const handleSwipeRight = () => {
    // Swipe right to cheer
    handleUserCheer()
  }

  const handleSwipeUp = () => {
    // Swipe up for new fight
    handleManualRestart()
  }

  const handleCrowdPeak = (intensity: number) => {
    // When crowd reaches peak excitement, trigger dramatic effects
    triggerCriticalMoment()
    addEffect({
      type: 'screenFlash',
      intensity: 20,
      duration: 300
    })
  }

  if (!fightState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-4xl font-bold text-white mb-4">⚡ INITIALIZING FIGHT ⚡</div>
          <div className="text-lg text-gray-300">Loading championship arena...</div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mt-4 text-3xl"
          >
            🥊
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <MobileEnhancements>
      <DramaticFightEffects effects={effects}>
        <SwipeGestures
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSwipeUp={handleSwipeUp}
        >
          <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-900/20 to-black text-white overflow-hidden">
        
        {/* Fight Card Overlay */}
        <AnimatePresence>
          {showFightCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            >
              <FightCard 
                fighters={sampleFighters}
                onDismiss={() => setShowFightCard(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Fight Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen p-4">
          
          {/* Left Sidebar - Fight Metrics */}
          <div className="lg:col-span-1 space-y-4">
            <RealTimeFightMetrics
              fightState={fightState}
              fighters={sampleFighters}
              onSignificantMoment={handleSignificantMoment}
            />
            
            {/* Enhanced Health Displays */}
            <div className="space-y-3">
              <EnhancedHealthSystem
                fighter={sampleFighters[0]}
                currentHealth={fightState.fighter1?.hp || 100}
                maxHealth={100}
                position={{ x: 0, y: 0 }}
                isActive={fightState.phase === 'fighting'}
              />
              
              <EnhancedHealthSystem
                fighter={sampleFighters[1]}
                currentHealth={fightState.fighter2?.hp || 100}
                maxHealth={100}
                position={{ x: 0, y: 0 }}
                isActive={fightState.phase === 'fighting'}
              />
            </div>

            {/* Fight Controls */}
            <div className="bg-black/50 p-3 rounded-lg space-y-2">
              <motion.button
                onClick={handleManualRestart}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded font-bold transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 NEW FIGHT
              </motion.button>
              
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRestartEnabled}
                  onChange={(e) => setAutoRestartEnabled(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-restart fights</span>
              </label>

              <div className="text-xs text-gray-400 space-y-1">
                <div>Fight Intensity: {fightIntensity.toFixed(0)}/100</div>
                <div>Crowd Excitement: {crowdExcitement.toFixed(0)}/100</div>
              </div>
            </div>
          </div>

          {/* Center - Enhanced Fight Canvas */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex-1 relative bg-black/30 rounded-lg overflow-hidden border border-gray-700">
              <EnhancedFightCanvas
                fightState={fightState}
                fighters={sampleFighters}
                onRoundStart={(round) => {
                  soundManager.play('bell', 0.8)
                  triggerCriticalMoment()
                }}
                onSignificantMoment={(moment, severity) => {
                  if (severity === 'high') {
                    triggerHeavyHit()
                  } else if (severity === 'medium') {
                    addEffect({
                      type: 'impactRipple',
                      intensity: 60,
                      duration: 500,
                      position: { x: 300, y: 250 }
                    })
                  }
                }}
              />
            </div>

            {/* Commentary Bar */}
            <div className="mt-2">
              {currentCommentary && (
                <CommentaryBar commentary={currentCommentary} />
              )}
            </div>
          </div>

          {/* Right Sidebar - Market & Betting */}
          <div className="lg:col-span-1 space-y-4">
            {marketState && (
              <MarketSidebar 
                marketState={marketState}
                fighters={sampleFighters}
                onTrade={handleTrade}
              />
            )}
            
            {marketState && (
              <LiveBettingInterface
                fightState={fightState}
                onPlaceBet={handlePlaceBet}
              />
            )}

            {/* AI Prediction Engine */}
            <AIPredictionEngine
              fightState={fightState}
              fighters={sampleFighters}
              marketOdds={currentMarketOdds}
              onPredictionUpdate={(prediction) => {
                console.log('AI Prediction:', prediction)
              }}
              onBettingTip={(tip) => {
                console.log('Betting Tip:', tip)
                soundManager.play('notification', 0.4)
              }}
            />

            {/* Crowd Hype System */}
            <CrowdHypeSystem
              fightState={fightState}
              fighters={sampleFighters}
              userActions={userActions}
              onCrowdPeak={handleCrowdPeak}
              onCrowdSilence={() => {
                console.log('Crowd went silent!')
              }}
            />

            {/* Mobile Quick Betting */}
            <div className="md:hidden">
              <MobileBettingQuickActions
                onQuickBet={handleQuickBet}
                balance={userBalance}
              />
            </div>

            {/* Fight Statistics */}
            <div className="bg-black/50 p-3 rounded-lg">
              <div className="text-sm font-bold mb-2">📊 FIGHT STATS</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-green-400 font-mono text-lg">{stats.strikes.fighter1}</div>
                  <div className="text-gray-400">Strikes</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-mono text-lg">{stats.strikes.fighter2}</div>
                  <div className="text-gray-400">Strikes</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-mono text-lg">{stats.knockdowns.fighter1}</div>
                  <div className="text-gray-400">Knockdowns</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-mono text-lg">{stats.knockdowns.fighter2}</div>
                  <div className="text-gray-400">Knockdowns</div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-center">
                <div className="text-purple-400">Balance: ${userBalance}</div>
                <div className="text-gray-400">User Actions: {userActions.cheers + userActions.boos}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fight Controls */}
        <MobileFightControls
          onCheer={handleUserCheer}
          onBoo={handleUserBoo}
          onShake={handleUserShake}
          intensity={fightIntensity}
        />
      </div>
    </SwipeGestures>
  </DramaticFightEffects>
</MobileEnhancements>
  )
}