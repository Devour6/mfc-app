'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Zap, 
  Shield, 
  Target, 
  Activity, 
  Brain, 
  Flame, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Play,
  Dumbbell,
  Star,
  Crown
} from 'lucide-react'
import { Fighter } from '@/types'
import EnhancedTrainingInterface from './EnhancedTrainingInterface'

interface MobileFighterCardProps {
  fighter: Fighter
  creditBalance?: number
  onFightStart?: (fighterId: string) => void
  onTraining?: (fighterId: string, fighterName: string, cost: number) => boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export default function MobileFighterCard({
  fighter,
  creditBalance = 1000,
  onFightStart,
  onTraining,
  isExpanded,
  onToggleExpand
}: MobileFighterCardProps) {
  const [showTraining, setShowTraining] = useState(false)
  const [trainingInProgress, setTrainingInProgress] = useState(false)

  const getWinRate = () => {
    const total = fighter.record.wins + fighter.record.losses + fighter.record.draws
    return total > 0 ? Math.round((fighter.record.wins / total) * 100) : 0
  }

  const getEloTrend = () => {
    // Simplified ELO trend based on recent performance
    const winRate = getWinRate()
    if (winRate >= 70) return 'rising'
    if (winRate >= 50) return 'stable'
    return 'falling'
  }

  const getStatColor = (value: number) => {
    if (value >= 85) return 'text-gold'
    if (value >= 70) return 'text-green'
    if (value >= 55) return 'text-text'
    return 'text-text2'
  }

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'strength': return <Zap className="w-3 h-3" />
      case 'speed': return <Target className="w-3 h-3" />
      case 'defense': return <Shield className="w-3 h-3" />
      case 'stamina': return <Activity className="w-3 h-3" />
      case 'fightIQ': return <Brain className="w-3 h-3" />
      case 'aggression': return <Flame className="w-3 h-3" />
      default: return null
    }
  }

  return (
    <motion.div
      className="bg-surface border border-border rounded-lg overflow-hidden"
      layout
      initial={false}
    >
      {/* Card Header - Always visible */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          {/* Fighter Info */}
          <div className="flex items-start gap-3 flex-1">
            <div className="text-3xl">{fighter.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-pixel text-sm text-accent truncate">
                  {fighter.name}
                </h3>
                {fighter.elo >= 2000 && (
                  <Crown className="w-4 h-4 text-gold" />
                )}
              </div>
              <div className="text-xs text-text2 mb-1">
                by {fighter.owner}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-text">
                  {fighter.record.wins}W-{fighter.record.losses}L-{fighter.record.draws}D
                </span>
                <span className="text-gold">ELO {fighter.elo}</span>
                <div className="flex items-center gap-1">
                  {getEloTrend() === 'rising' ? (
                    <TrendingUp className="w-3 h-3 text-green" />
                  ) : getEloTrend() === 'falling' ? (
                    <TrendingDown className="w-3 h-3 text-red" />
                  ) : (
                    <div className="w-3 h-3 bg-text2 rounded-full" />
                  )}
                  <span className={
                    getEloTrend() === 'rising' ? 'text-green' : 
                    getEloTrend() === 'falling' ? 'text-red' : 'text-text2'
                  }>
                    {getWinRate()}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-text2" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text2" />
              )}
            </div>
            <div className="text-xs text-text2">
              {fighter.class}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mt-3">
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              onFightStart?.(fighter.id)
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white font-pixel text-xs rounded transition-colors hover:bg-accent/90 flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-3 h-3" />
            FIGHT
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              setShowTraining(!showTraining)
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-transparent border border-border text-text2 font-pixel text-xs rounded transition-colors hover:text-text hover:border-text2 flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Dumbbell className="w-3 h-3" />
            TRAIN
          </motion.button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border overflow-hidden"
          >
            {/* Stats Grid */}
            <div className="p-4 border-b border-border">
              <h4 className="font-pixel text-xs text-gold mb-3">COMBAT STATS</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(fighter.stats).map(([stat, value]) => (
                  <div key={stat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatIcon(stat)}
                      <span className="text-xs text-text2 capitalize">
                        {stat === 'fightIQ' ? 'Fight IQ' : stat}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-border rounded-full h-1">
                        <div 
                          className="bg-accent rounded-full h-1 transition-all duration-300"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className={`font-pixel text-xs ${getStatColor(value)}`}>
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Training Interface */}
            {showTraining && (
              <div className="p-4 border-b border-border bg-bg/50">
                <EnhancedTrainingInterface
                  fighter={fighter}
                  creditBalance={creditBalance}
                  onStartTraining={(session) => {
                    if (onTraining) {
                      const success = onTraining(fighter.id, fighter.name, session.cost)
                      if (success) {
                        setTrainingInProgress(true)
                        return true
                      }
                    }
                    return false
                  }}
                  onTrainingComplete={(session, results) => {
                    setTrainingInProgress(false)
                    // Handle training completion - could update fighter stats
                  }}
                />
              </div>
            )}

            {/* Fighter Details */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Recent Form */}
                <div>
                  <h5 className="font-pixel text-xs text-gold mb-2">RECENT FORM</h5>
                  <div className="flex gap-1">
                    {/* Mock recent fights - in real app this would come from fighter data */}
                    {[
                      Math.random() > 0.3 ? 'W' : 'L',
                      Math.random() > 0.4 ? 'W' : 'L',
                      Math.random() > 0.5 ? 'W' : 'L',
                      Math.random() > 0.3 ? 'W' : 'L',
                      Math.random() > 0.4 ? 'W' : 'L'
                    ].map((result, index) => (
                      <div
                        key={index}
                        className={`w-6 h-6 rounded flex items-center justify-center font-pixel text-xs ${
                          result === 'W' 
                            ? 'bg-green text-white' 
                            : 'bg-red text-white'
                        }`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evolution Status */}
                {fighter.evolution && (
                  <div>
                    <h5 className="font-pixel text-xs text-gold mb-2">EVOLUTION STATUS</h5>
                    <div className="flex items-center gap-2 text-xs text-text2">
                      <Star className="w-3 h-3 text-gold" />
                      <span>Age: {fighter.evolution.age}</span>
                      <span>•</span>
                      <span>Peak Years: {fighter.evolution.peakAgeStart}-{fighter.evolution.peakAgeEnd}</span>
                    </div>
                  </div>
                )}

                {/* Training Cost */}
                <div>
                  <h5 className="font-pixel text-xs text-gold mb-2">TRAINING COST</h5>
                  <div className="text-sm text-text">
                    {fighter.trainingCost} credits per session
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}