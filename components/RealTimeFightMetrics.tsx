'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FightState, Fighter } from '@/types'

interface FightMetrics {
  fighter1Strikes: number
  fighter2Strikes: number
  fighter1SignificantStrikes: number
  fighter2SignificantStrikes: number
  fighter1Damage: number
  fighter2Damage: number
  currentRound: number
  timeRemaining: number
  momentum: number // -100 to 100, positive favors fighter1
  intensity: number // 0-100
  pace: 'slow' | 'moderate' | 'fast' | 'frenzied'
  dominantFighter: 1 | 2 | null
  lastSignificantEvent?: {
    type: 'knockdown' | 'combo' | 'counter' | 'rally'
    fighter: 1 | 2
    timestamp: number
  }
}

interface RealTimeFightMetricsProps {
  fightState: FightState
  fighters: Fighter[]
  onSignificantMoment?: (type: string, intensity: number) => void
}

export default function RealTimeFightMetrics({
  fightState,
  fighters,
  onSignificantMoment
}: RealTimeFightMetricsProps) {
  const [metrics, setMetrics] = useState<FightMetrics>({
    fighter1Strikes: 0,
    fighter2Strikes: 0,
    fighter1SignificantStrikes: 0,
    fighter2SignificantStrikes: 0,
    fighter1Damage: 0,
    fighter2Damage: 0,
    currentRound: 1,
    timeRemaining: 180,
    momentum: 0,
    intensity: 0,
    pace: 'moderate',
    dominantFighter: null
  })

  const [showMomentumAlert, setShowMomentumAlert] = useState(false)
  const [momentumShift, setMomentumShift] = useState<'up' | 'down' | null>(null)

  // Update metrics based on fight state
  useEffect(() => {
    if (!fightState) return

    const fighter1Health = fightState.fighter1.hp / 100
    const fighter2Health = fightState.fighter2.hp / 100
    
    const fighter1Damage = (1 - fighter1Health) * 100
    const fighter2Damage = (1 - fighter2Health) * 100

    // Calculate momentum based on health difference and recent events
    const healthDifference = fighter1Health - fighter2Health
    const momentumFromHealth = healthDifference * 50
    
    // Add some randomness for more dynamic momentum
    const momentumVariation = (Math.random() - 0.5) * 20
    const newMomentum = Math.max(-100, Math.min(100, momentumFromHealth + momentumVariation))
    
    // Calculate intensity based on how close the fight is and damage
    const averageDamage = (fighter1Damage + fighter2Damage) / 2
    const closeness = 100 - Math.abs(healthDifference * 100)
    const intensity = Math.min(100, (averageDamage * 0.7) + (closeness * 0.3))

    // Determine pace based on intensity and phase
    let pace: 'slow' | 'moderate' | 'fast' | 'frenzied' = 'moderate'
    if (intensity > 80) pace = 'frenzied'
    else if (intensity > 60) pace = 'fast'
    else if (intensity < 30) pace = 'slow'

    // Detect momentum shifts
    const momentumChange = newMomentum - metrics.momentum
    if (Math.abs(momentumChange) > 25) {
      setMomentumShift(momentumChange > 0 ? 'up' : 'down')
      setShowMomentumAlert(true)
      setTimeout(() => {
        setShowMomentumAlert(false)
        setMomentumShift(null)
      }, 2000)

      onSignificantMoment?.('momentum_shift', Math.abs(momentumChange))
    }

    setMetrics(prev => ({
      ...prev,
      fighter1Damage,
      fighter2Damage,
      currentRound: fightState.round || 1,
      timeRemaining: fightState.clock || 180,
      momentum: newMomentum,
      intensity,
      pace,
      dominantFighter: Math.abs(newMomentum) > 30 ? (newMomentum > 0 ? 1 : 2) : null
    }))
  }, [fightState])

  const getMomentumColor = (momentum: number) => {
    const abs = Math.abs(momentum)
    if (abs > 70) return momentum > 0 ? '#10b981' : '#ef4444' // Strong green/red
    if (abs > 40) return momentum > 0 ? '#22c55e' : '#f87171' // Medium green/red
    if (abs > 20) return momentum > 0 ? '#84cc16' : '#fb923c' // Light green/orange
    return '#6b7280' // Neutral gray
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity > 80) return '#dc2626' // Red
    if (intensity > 60) return '#ea580c' // Orange
    if (intensity > 40) return '#d97706' // Yellow-orange
    if (intensity > 20) return '#84cc16' // Yellow-green
    return '#6b7280' // Gray
  }

  const getPaceIcon = (pace: string) => {
    switch (pace) {
      case 'slow': return '🐌'
      case 'moderate': return '🚶'
      case 'fast': return '🏃'
      case 'frenzied': return '💨'
      default: return '🚶'
    }
  }

  return (
    <div className="bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg space-y-4">
      {/* Fight Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-mono text-gray-400">
          ROUND {metrics.currentRound} • {Math.floor(metrics.timeRemaining / 60)}:{(metrics.timeRemaining % 60).toString().padStart(2, '0')}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">PACE</span>
          <span className="text-lg">{getPaceIcon(metrics.pace)}</span>
          <span className="text-xs font-mono text-gray-300 uppercase">{metrics.pace}</span>
        </div>
      </div>

      {/* Fighter Health Bars */}
      <div className="space-y-2">
        {/* Fighter 1 */}
        <div className="flex items-center space-x-3">
          <div className="w-20 text-sm font-mono text-right truncate">
            {fighters[0]?.name || 'Fighter 1'}
          </div>
          <div className="flex-1 relative">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full"
                style={{ 
                  width: `${Math.max(0, (fightState?.fighter1?.hp || 100))}%` 
                }}
                animate={{ 
                  boxShadow: (fightState?.fighter1?.hp || 100) < 30 ? '0 0 10px #ef4444' : 'none' 
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {(fightState?.fighter1?.hp || 100) < 30 && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -bottom-1 left-0 right-0 bg-red-500/20 rounded-full"
              />
            )}
          </div>
          <div className="text-xs font-mono text-gray-400 w-12 text-right">
            {Math.round(fightState?.fighter1?.hp || 100)}%
          </div>
        </div>

        {/* Fighter 2 */}
        <div className="flex items-center space-x-3">
          <div className="w-20 text-sm font-mono text-right truncate">
            {fighters[1]?.name || 'Fighter 2'}
          </div>
          <div className="flex-1 relative">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full"
                style={{ 
                  width: `${Math.max(0, (fightState?.fighter2?.hp || 100))}%` 
                }}
                animate={{ 
                  boxShadow: (fightState?.fighter2?.hp || 100) < 30 ? '0 0 10px #ef4444' : 'none' 
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {(fightState?.fighter2?.hp || 100) < 30 && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -bottom-1 left-0 right-0 bg-red-500/20 rounded-full"
              />
            )}
          </div>
          <div className="text-xs font-mono text-gray-400 w-12 text-right">
            {Math.round(fightState?.fighter2?.hp || 100)}%
          </div>
        </div>
      </div>

      {/* Momentum Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">MOMENTUM</span>
          {metrics.dominantFighter && (
            <span className="text-xs font-mono text-yellow-400">
              {fighters[metrics.dominantFighter - 1]?.name || `Fighter ${metrics.dominantFighter}`} DOMINATING
            </span>
          )}
        </div>
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="absolute top-0 left-1/2 h-2 rounded-full"
              style={{
                backgroundColor: getMomentumColor(metrics.momentum),
                width: `${Math.abs(metrics.momentum) / 2}%`,
                left: metrics.momentum > 0 ? '50%' : `${50 - Math.abs(metrics.momentum) / 2}%`
              }}
              animate={{ 
                boxShadow: Math.abs(metrics.momentum) > 50 ? `0 0 8px ${getMomentumColor(metrics.momentum)}` : 'none'
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Center line */}
          <div className="absolute top-0 left-1/2 w-px h-2 bg-white/50 transform -translate-x-px" />
        </div>
      </div>

      {/* Fight Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">INTENSITY</span>
          <span className="text-xs font-mono" style={{ color: getIntensityColor(metrics.intensity) }}>
            {metrics.intensity.toFixed(0)}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ 
              backgroundColor: getIntensityColor(metrics.intensity),
              width: `${metrics.intensity}%`
            }}
            animate={{ 
              boxShadow: metrics.intensity > 70 ? `0 0 8px ${getIntensityColor(metrics.intensity)}` : 'none'
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Strike Counters */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-600">
        <div className="text-center">
          <div className="text-xs text-gray-400">STRIKES</div>
          <div className="text-lg font-mono text-green-400">{metrics.fighter1Strikes}</div>
          <div className="text-xs text-gray-400">
            {fighters[0]?.name?.split('-')[0] || 'F1'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">STRIKES</div>
          <div className="text-lg font-mono text-blue-400">{metrics.fighter2Strikes}</div>
          <div className="text-xs text-gray-400">
            {fighters[1]?.name?.split('-')[0] || 'F2'}
          </div>
        </div>
      </div>

      {/* Momentum Shift Alert */}
      <AnimatePresence>
        {showMomentumAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-black p-2 rounded-lg text-center font-bold"
          >
            🔥 MOMENTUM SHIFT! 🔥
            <div className="text-xs">
              {momentumShift === 'up' ? fighters[0]?.name : fighters[1]?.name} is rallying!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook for tracking fight statistics
export function useFightStatistics() {
  const [stats, setStats] = useState({
    strikes: { fighter1: 0, fighter2: 0 },
    significantStrikes: { fighter1: 0, fighter2: 0 },
    knockdowns: { fighter1: 0, fighter2: 0 },
    combos: { fighter1: 0, fighter2: 0 }
  })

  const recordStrike = (fighter: 1 | 2, isSignificant = false) => {
    setStats(prev => ({
      ...prev,
      strikes: {
        ...prev.strikes,
        [`fighter${fighter}`]: prev.strikes[`fighter${fighter}` as keyof typeof prev.strikes] + 1
      },
      ...(isSignificant && {
        significantStrikes: {
          ...prev.significantStrikes,
          [`fighter${fighter}`]: prev.significantStrikes[`fighter${fighter}` as keyof typeof prev.significantStrikes] + 1
        }
      })
    }))
  }

  const recordKnockdown = (fighter: 1 | 2) => {
    setStats(prev => ({
      ...prev,
      knockdowns: {
        ...prev.knockdowns,
        [`fighter${fighter}`]: prev.knockdowns[`fighter${fighter}` as keyof typeof prev.knockdowns] + 1
      }
    }))
  }

  const recordCombo = (fighter: 1 | 2) => {
    setStats(prev => ({
      ...prev,
      combos: {
        ...prev.combos,
        [`fighter${fighter}`]: prev.combos[`fighter${fighter}` as keyof typeof prev.combos] + 1
      }
    }))
  }

  const resetStats = () => {
    setStats({
      strikes: { fighter1: 0, fighter2: 0 },
      significantStrikes: { fighter1: 0, fighter2: 0 },
      knockdowns: { fighter1: 0, fighter2: 0 },
      combos: { fighter1: 0, fighter2: 0 }
    })
  }

  return {
    stats,
    recordStrike,
    recordKnockdown,
    recordCombo,
    resetStats
  }
}