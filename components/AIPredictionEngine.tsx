'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FightState, Fighter } from '@/types'

interface PredictionData {
  winner: 1 | 2 | null
  confidence: number // 0-100
  method: 'KO' | 'TKO' | 'Decision' | 'Submission'
  round: number
  reasoning: string
  timestamp: number
}

interface BettingTip {
  id: string
  type: 'value_bet' | 'momentum_play' | 'upset_alert' | 'safe_bet'
  message: string
  confidence: number
  urgency: 'low' | 'medium' | 'high'
  expectedValue: number
  timestamp: number
}

interface MarketAnalysis {
  currentOdds: { fighter1: number; fighter2: number }
  impliedProbability: { fighter1: number; fighter2: number }
  trueOdds: { fighter1: number; fighter2: number }
  valueOpportunity: number // -100 to 100
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
}

interface AIPredictionEngineProps {
  fightState: FightState
  fighters: Fighter[]
  marketOdds?: { fighter1: number; fighter2: number }
  onPredictionUpdate?: (prediction: PredictionData) => void
  onBettingTip?: (tip: BettingTip) => void
}

export default function AIPredictionEngine({
  fightState,
  fighters,
  marketOdds,
  onPredictionUpdate,
  onBettingTip
}: AIPredictionEngineProps) {
  const [currentPrediction, setCurrentPrediction] = useState<PredictionData | null>(null)
  const [bettingTips, setBettingTips] = useState<BettingTip[]>([])
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null)
  const [aiPersonality] = useState(() => {
    const personalities = [
      { name: 'The Analyst', emoji: '🤖', style: 'analytical' },
      { name: 'Vegas Veteran', emoji: '🎰', style: 'betting_focused' },
      { name: 'Fight Prophet', emoji: '🔮', style: 'dramatic' },
      { name: 'The Calculator', emoji: '📊', style: 'statistical' }
    ]
    return personalities[Math.floor(Math.random() * personalities.length)]
  })

  // AI prediction algorithm
  const generatePrediction = (): PredictionData => {
    if (!fightState.fighter1 || !fightState.fighter2) {
      return {
        winner: null,
        confidence: 50,
        method: 'Decision',
        round: 3,
        reasoning: 'Analyzing fight data...',
        timestamp: Date.now()
      }
    }

    const fighter1 = fightState.fighter1
    const fighter2 = fightState.fighter2
    
    // Calculate health advantage - using hp and assuming max of 100
    const f1HealthPercent = fighter1.hp / 100
    const f2HealthPercent = fighter2.hp / 100
    const healthDiff = f1HealthPercent - f2HealthPercent
    
    // Factor in fighter stats
    const f1Stats = fighters[0].stats
    const f2Stats = fighters[1].stats
    
    const f1Power = (f1Stats.strength + f1Stats.aggression) / 2
    const f2Power = (f2Stats.strength + f2Stats.aggression) / 2
    const f1Defense = (f1Stats.defense + f1Stats.speed) / 2
    const f2Defense = (f2Stats.defense + f2Stats.speed) / 2
    
    // Calculate momentum (simplified)
    const momentum = healthDiff * 0.6 + (f1Power - f2Power) * 0.002 + (f1Defense - f2Defense) * 0.001
    
    // Determine winner
    let winner: 1 | 2 | null = null
    let confidence = 50
    
    if (momentum > 0.1) {
      winner = 1
      confidence = Math.min(95, 50 + momentum * 200)
    } else if (momentum < -0.1) {
      winner = 2
      confidence = Math.min(95, 50 + Math.abs(momentum) * 200)
    }
    
    // Predict method based on current state
    let method: 'KO' | 'TKO' | 'Decision' | 'Submission' = 'Decision'
    if (f1HealthPercent < 0.3 || f2HealthPercent < 0.3) {
      method = Math.random() > 0.5 ? 'KO' : 'TKO'
      confidence += 10
    } else if (confidence > 80) {
      method = 'TKO'
    }
    
    // Predict round
    const currentRound = fightState.round || 1
    let round = currentRound
    if (method === 'KO' || method === 'TKO') {
      round = Math.min(5, currentRound + Math.floor(Math.random() * 2))
    } else {
      round = 5 // Goes to decision
    }
    
    // Generate reasoning based on AI personality
    let reasoning = ''
    switch (aiPersonality.style) {
      case 'analytical':
        reasoning = `Health differential: ${(healthDiff * 100).toFixed(1)}%. Statistical model shows ${confidence.toFixed(0)}% confidence.`
        break
      case 'betting_focused':
        reasoning = `Market inefficiency detected. True odds suggest ${winner ? `Fighter ${winner}` : 'even match'}.`
        break
      case 'dramatic':
        reasoning = `The tide is turning! ${winner ? fighters[winner - 1].name : 'Both fighters'} ${winner ? 'emerges as the dominant force' : 'are locked in epic battle'}.`
        break
      case 'statistical':
        reasoning = `Power index: F1(${f1Power.toFixed(1)}) vs F2(${f2Power.toFixed(1)}). Defense rating: F1(${f1Defense.toFixed(1)}) vs F2(${f2Defense.toFixed(1)}).`
        break
    }
    
    return {
      winner,
      confidence,
      method,
      round,
      reasoning,
      timestamp: Date.now()
    }
  }

  // Generate betting tips
  const generateBettingTip = (prediction: PredictionData, marketOdds?: { fighter1: number; fighter2: number }): BettingTip | null => {
    if (!marketOdds) return null

    const tips: Omit<BettingTip, 'id' | 'timestamp'>[] = []

    // Value betting opportunities
    if (prediction.confidence > 70) {
      const favoredFighter = prediction.winner
      const marketImpliedProb = favoredFighter === 1 
        ? 1 / (marketOdds.fighter1 + 1)
        : 1 / (marketOdds.fighter2 + 1)
      
      const aiProbability = prediction.confidence / 100
      
      if (aiProbability > marketImpliedProb + 0.15) {
        tips.push({
          type: 'value_bet',
          message: `🎯 Value Alert: ${favoredFighter ? fighters[favoredFighter - 1].name : 'Unknown'} is undervalued by ${((aiProbability - marketImpliedProb) * 100).toFixed(0)}%`,
          confidence: prediction.confidence,
          urgency: 'high',
          expectedValue: (aiProbability - marketImpliedProb) * 100
        })
      }
    }

    // Momentum plays
    if (fightState.fighter1 && fightState.fighter2) {
      const healthDiff = (fightState.fighter1.hp - fightState.fighter2.hp) / 100
      if (Math.abs(healthDiff) > 0.3) {
        tips.push({
          type: 'momentum_play',
          message: `🚀 Momentum Play: ${healthDiff > 0 ? fighters[0].name : fighters[1].name} building serious advantage`,
          confidence: Math.min(90, 50 + Math.abs(healthDiff) * 100),
          urgency: 'medium',
          expectedValue: Math.abs(healthDiff) * 50
        })
      }
    }

    // Upset alerts
    if (prediction.confidence > 75 && marketOdds.fighter2 > 2.5 && prediction.winner === 2) {
      tips.push({
        type: 'upset_alert',
        message: `⚡ UPSET ALERT: ${fighters[1].name} could shock the world! High payout potential.`,
        confidence: prediction.confidence,
        urgency: 'high',
        expectedValue: marketOdds.fighter2 * (prediction.confidence / 100) - 1
      })
    }

    // Return random tip or most valuable
    if (tips.length === 0) return null
    
    const bestTip = tips.reduce((best, current) => 
      current.expectedValue > best.expectedValue ? current : best
    )

    return {
      id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...bestTip
    }
  }

  // Update predictions based on fight state
  useEffect(() => {
    if (!fightState) return

    const newPrediction = generatePrediction()
    setCurrentPrediction(newPrediction)
    onPredictionUpdate?.(newPrediction)

    // Generate betting tip
    const tip = generateBettingTip(newPrediction, marketOdds)
    if (tip && Math.random() > 0.7) { // 30% chance to show tip
      setBettingTips(prev => [tip, ...prev.slice(0, 4)]) // Keep last 5 tips
      onBettingTip?.(tip)
      
      // Auto-remove tip after duration
      setTimeout(() => {
        setBettingTips(prev => prev.filter(t => t.id !== tip.id))
      }, 8000)
    }
  }, [fightState, marketOdds])

  // Update market analysis
  useEffect(() => {
    if (!marketOdds) return

    const f1ImpliedProb = 1 / (marketOdds.fighter1 + 1)
    const f2ImpliedProb = 1 / (marketOdds.fighter2 + 1)

    // Simple true odds calculation based on fighter stats
    const f1TrueProb = currentPrediction ? currentPrediction.confidence / 100 : 0.5
    const f2TrueProb = 1 - f1TrueProb

    setMarketAnalysis({
      currentOdds: marketOdds,
      impliedProbability: { fighter1: f1ImpliedProb, fighter2: f2ImpliedProb },
      trueOdds: { fighter1: f1TrueProb, fighter2: f2TrueProb },
      valueOpportunity: (f1TrueProb - f1ImpliedProb) * 100,
      marketSentiment: f1ImpliedProb > 0.6 ? 'bullish' : f1ImpliedProb < 0.4 ? 'bearish' : 'neutral'
    })
  }, [marketOdds, currentPrediction])

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 80) return '#10b981'
    if (confidence > 60) return '#f59e0b'
    return '#ef4444'
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#dc2626'
      case 'medium': return '#d97706'
      case 'low': return '#059669'
      default: return '#6b7280'
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
      {/* AI Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{aiPersonality.emoji}</span>
          <div>
            <div className="text-sm font-bold text-white">{aiPersonality.name}</div>
            <div className="text-xs text-purple-300">AI Fight Oracle</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-purple-400"
        >
          ⚡
        </motion.div>
      </div>

      {/* Current Prediction */}
      {currentPrediction && (
        <div className="bg-black/40 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">PREDICTION</span>
            <span 
              className="text-xs font-mono"
              style={{ color: getConfidenceColor(currentPrediction.confidence) }}
            >
              {currentPrediction.confidence.toFixed(0)}% CONFIDENT
            </span>
          </div>

          {currentPrediction.winner && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏆</span>
                <span className="font-bold text-white">
                  {fighters[currentPrediction.winner - 1]?.name || `Fighter ${currentPrediction.winner}`}
                </span>
              </div>
              
              <div className="text-sm text-gray-300">
                Via {currentPrediction.method} in Round {currentPrediction.round}
              </div>
              
              <div className="text-xs text-purple-300 leading-relaxed">
                {currentPrediction.reasoning}
              </div>
            </div>
          )}

          {!currentPrediction.winner && (
            <div className="text-center text-gray-300">
              <span className="text-lg">⚔️</span>
              <div className="text-sm">Too close to call</div>
              <div className="text-xs text-gray-400">Both fighters evenly matched</div>
            </div>
          )}
        </div>
      )}

      {/* Market Analysis */}
      {marketAnalysis && (
        <div className="bg-black/40 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-400 mb-2">MARKET ANALYSIS</div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-300">Implied Odds</div>
              <div className="font-mono text-white">
                {(marketAnalysis.impliedProbability.fighter1 * 100).toFixed(0)}% / {(marketAnalysis.impliedProbability.fighter2 * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-gray-300">AI True Odds</div>
              <div className="font-mono text-purple-300">
                {(marketAnalysis.trueOdds.fighter1 * 100).toFixed(0)}% / {(marketAnalysis.trueOdds.fighter2 * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">VALUE OPPORTUNITY</span>
              <span 
                className="text-xs font-bold"
                style={{ 
                  color: marketAnalysis.valueOpportunity > 5 ? '#10b981' : 
                         marketAnalysis.valueOpportunity < -5 ? '#ef4444' : '#6b7280'
                }}
              >
                {marketAnalysis.valueOpportunity > 0 ? '+' : ''}{marketAnalysis.valueOpportunity.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Betting Tips */}
      <div className="space-y-2">
        <AnimatePresence>
          {bettingTips.slice(0, 2).map((tip) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className="bg-black/60 rounded-lg p-3 border-l-3"
              style={{ borderLeftColor: getUrgencyColor(tip.urgency) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-white font-medium mb-1">
                    {tip.message}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>Confidence: {tip.confidence.toFixed(0)}%</span>
                    <span>•</span>
                    <span>EV: +{tip.expectedValue.toFixed(1)}%</span>
                  </div>
                </div>
                <div 
                  className="text-xs px-2 py-1 rounded uppercase font-bold"
                  style={{ 
                    backgroundColor: getUrgencyColor(tip.urgency),
                    color: 'white'
                  }}
                >
                  {tip.urgency}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {bettingTips.length === 0 && (
          <div className="text-center text-gray-500 text-xs py-4">
            🤖 Analyzing market for opportunities...
          </div>
        )}
      </div>
    </div>
  )
}