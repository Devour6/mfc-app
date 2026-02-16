'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Shield, 
  Target, 
  Activity, 
  Calendar, 
  Award,
  BarChart3,
  Eye,
  Brain,
  Flame,
  Clock,
  Star
} from 'lucide-react'

interface FighterProfile {
  id: string
  name: string
  emoji: string
  class: string
  owner: string
  record: { wins: number; losses: number; draws: number }
  elo: number
  stats: {
    strength: number
    speed: number
    defense: number
    stamina: number
    fightIQ: number
    aggression: number
  }
  evolution: any
  recentForm: ('W' | 'L' | 'D')[]
  fightHistory: FightRecord[]
  trainingHistory: TrainingSession[]
  specialties: string[]
  weaknesses: string[]
  analytics: FighterAnalytics
}

interface FightRecord {
  id: string
  date: number
  opponent: string
  result: 'W' | 'L' | 'D'
  method: 'KO' | 'TKO' | 'Decision' | 'Submission'
  round: number
  duration: number
  damageDealt: number
  damageTaken: number
  strikesLanded: number
  strikesAttempted: number
  significance: 'low' | 'medium' | 'high' // Based on opponent ranking
}

interface TrainingSession {
  id: string
  date: number
  type: 'strength' | 'speed' | 'defense' | 'stamina' | 'technique'
  intensity: number
  improvement: number
  cost: number
  notes: string
}

interface FighterAnalytics {
  averageFightDuration: number
  koPercentage: number
  winStreakRecord: number
  favoriteAttackStyle: string
  peakPerformanceRound: number
  staminaDecay: number
  injuryRisk: number
  marketValue: number
  predictions: {
    nextFightWinProbability: number
    careerTrajectory: 'rising' | 'peak' | 'declining'
    retirementForecast: number // fights remaining
  }
}

interface FighterProfileModalProps {
  fighter: FighterProfile | null
  isOpen: boolean
  onClose: () => void
  onTrainFighter?: (fighterId: string, statType: string) => void
  onChallengeFighter?: (fighterId: string) => void
}

export default function FighterProfileModal({
  fighter,
  isOpen,
  onClose,
  onTrainFighter,
  onChallengeFighter
}: FighterProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history' | 'analytics'>('overview')
  const [statComparison, setStatComparison] = useState<boolean>(false)

  if (!fighter) return null

  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-400'
    if (value >= 60) return 'text-yellow-400'
    if (value >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStatBar = (value: number, maxValue: number = 100) => (
    <div className="w-full bg-surface2 rounded-full h-2">
      <motion.div
        className="h-full bg-gradient-to-r from-accent to-accent2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${(value / maxValue) * 100}%` }}
        transition={{ duration: 1, delay: 0.2 }}
      />
    </div>
  )

  const getFormColor = (result: 'W' | 'L' | 'D') => {
    switch (result) {
      case 'W': return 'bg-green-500'
      case 'L': return 'bg-red-500'
      case 'D': return 'bg-yellow-500'
    }
  }

  const winPercentage = Math.round((fighter.record.wins / (fighter.record.wins + fighter.record.losses + fighter.record.draws)) * 100)
  const totalFights = fighter.record.wins + fighter.record.losses + fighter.record.draws

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-bg border-b border-border p-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{fighter.emoji}</div>
                <div>
                  <h2 className="font-pixel text-2xl text-text mb-1">{fighter.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-text2">
                    <span>{fighter.class}</span>
                    <span>•</span>
                    <span>ELO: {fighter.elo}</span>
                    <span>•</span>
                    <span>Owner: {fighter.owner}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-pixel text-text">
                      {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
                    </span>
                    <span className="text-text2">({winPercentage}% win rate)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => onChallengeFighter?.(fighter.id)}
                  className="px-4 py-2 bg-accent text-white font-pixel text-xs rounded hover:bg-accent/80"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  CHALLENGE
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-text2 hover:text-text"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex">
                {[
                  { id: 'overview', label: 'OVERVIEW', icon: Eye },
                  { id: 'stats', label: 'STATS', icon: BarChart3 },
                  { id: 'history', label: 'HISTORY', icon: Calendar },
                  { id: 'analytics', label: 'ANALYTICS', icon: Brain }
                ].map(tab => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 border-r border-border transition-all ${
                        activeTab === tab.id
                          ? 'bg-accent text-white'
                          : 'bg-surface text-text2 hover:text-text hover:bg-surface2'
                      }`}
                      whileHover={{ y: -1 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-pixel text-xs">{tab.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Stats */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      QUICK STATS
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-text2">KO Rate:</span>
                        <span className="text-text font-pixel">{fighter.analytics.koPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text2">Avg Fight Duration:</span>
                        <span className="text-text font-pixel">{Math.round(fighter.analytics.averageFightDuration)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text2">Win Streak Record:</span>
                        <span className="text-text font-pixel">{fighter.analytics.winStreakRecord}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text2">Market Value:</span>
                        <span className="text-gold font-pixel">{fighter.analytics.marketValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Form */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      RECENT FORM
                    </h3>
                    <div className="flex gap-2 mb-4">
                      {fighter.recentForm.map((result, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded ${getFormColor(result)} flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-text2">
                      Last {fighter.recentForm.length} fights • {fighter.recentForm.filter(f => f === 'W').length} wins
                    </div>
                  </div>

                  {/* Specialties & Weaknesses */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      SPECIALTIES
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {fighter.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-pixel text-xs text-red-400 mb-2">WEAKNESSES:</h4>
                    <div className="flex flex-wrap gap-2">
                      {fighter.weaknesses.map((weakness, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30"
                        >
                          {weakness}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Training Options */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      TRAINING
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(fighter.stats).map(([stat, value]) => (
                        <motion.button
                          key={stat}
                          onClick={() => onTrainFighter?.(fighter.id, stat)}
                          className="p-2 bg-surface2 hover:bg-accent/20 border border-border hover:border-accent transition-all rounded text-left"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="font-pixel text-xs text-accent capitalize">{stat}</div>
                          <div className="text-xs text-text2">Level {value}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-6">
                  {/* Core Stats */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4">CORE ATTRIBUTES</h3>
                    <div className="space-y-4">
                      {Object.entries(fighter.stats).map(([stat, value]) => (
                        <div key={stat} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="capitalize text-text font-pixel text-xs">{stat}</span>
                            <span className={`font-pixel text-sm ${getStatColor(value)}`}>{value}/100</span>
                          </div>
                          {getStatBar(value)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evolution Progress */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      EVOLUTION PROGRESS
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-pixel text-text">{fighter.evolution?.age || 25}</div>
                        <div className="text-xs text-text2">Age</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-pixel text-gold">{fighter.evolution?.evolutionLevel || 1}</div>
                        <div className="text-xs text-text2">Evolution Level</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Fight History */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4">FIGHT HISTORY</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {fighter.fightHistory.map((fight, index) => (
                        <div key={fight.id} className="flex justify-between items-center p-2 bg-surface2 rounded text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded ${getFormColor(fight.result)} flex items-center justify-center text-white text-xs font-bold`}>
                              {fight.result}
                            </div>
                            <div>
                              <div className="text-text">{fight.opponent}</div>
                              <div className="text-text2">{fight.method} • Round {fight.round}</div>
                            </div>
                          </div>
                          <div className="text-right text-text2">
                            <div>{new Date(fight.date).toLocaleDateString()}</div>
                            <div>{Math.round(fight.duration / 60)}:{(fight.duration % 60).toString().padStart(2, '0')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Training History */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4">RECENT TRAINING</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {fighter.trainingHistory.slice(0, 5).map((session, index) => (
                        <div key={session.id} className="flex justify-between items-center p-2 bg-surface2 rounded text-xs">
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-accent" />
                            <div>
                              <div className="text-text capitalize">{session.type} Training</div>
                              <div className="text-text2">Intensity: {session.intensity}%</div>
                            </div>
                          </div>
                          <div className="text-right text-text2">
                            <div className="text-gold">+{session.improvement}</div>
                            <div>{new Date(session.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Performance Predictions */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI PREDICTIONS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-surface2 rounded">
                        <div className="text-2xl font-pixel text-gold mb-1">
                          {fighter.analytics.predictions.nextFightWinProbability}%
                        </div>
                        <div className="text-xs text-text2">Next Fight Win Chance</div>
                      </div>
                      <div className="text-center p-3 bg-surface2 rounded">
                        <div className="text-xl font-pixel text-text mb-1 capitalize">
                          {fighter.analytics.predictions.careerTrajectory}
                        </div>
                        <div className="text-xs text-text2">Career Trajectory</div>
                      </div>
                      <div className="text-center p-3 bg-surface2 rounded">
                        <div className="text-2xl font-pixel text-text mb-1">
                          {fighter.analytics.predictions.retirementForecast}
                        </div>
                        <div className="text-xs text-text2">Fights Until Retirement</div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Metrics */}
                  <div className="bg-bg border border-border rounded p-4">
                    <h3 className="font-pixel text-sm text-accent mb-4">ADVANCED METRICS</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-text2">Peak Performance Round:</span>
                        <span className="text-text font-pixel">Round {fighter.analytics.peakPerformanceRound}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text2">Stamina Decay Rate:</span>
                        <span className="text-yellow-400 font-pixel">{fighter.analytics.staminaDecay}%/round</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text2">Injury Risk:</span>
                        <span className={`font-pixel ${fighter.analytics.injuryRisk > 50 ? 'text-red-400' : 'text-green-400'}`}>
                          {fighter.analytics.injuryRisk}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text2">Favorite Attack Style:</span>
                        <span className="text-text font-pixel">{fighter.analytics.favoriteAttackStyle}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Mock data generator
export const generateMockFighterProfile = (baseFighter: any): FighterProfile => {
  const fightHistory: FightRecord[] = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
    id: `fight-${i}`,
    date: Date.now() - (i * 7 * 24 * 60 * 60 * 1000), // Weekly fights going back
    opponent: ['CRUSHER-X', 'BOLT-9', 'PHANTOM-STRIKE', 'IRON-FIST', 'LIGHTNING-ROD'][Math.floor(Math.random() * 5)],
    result: Math.random() > 0.3 ? 'W' : Math.random() > 0.7 ? 'D' : 'L',
    method: ['KO', 'TKO', 'Decision', 'Decision', 'Decision'][Math.floor(Math.random() * 5)] as any,
    round: Math.floor(Math.random() * 5) + 1,
    duration: Math.floor(Math.random() * 300) + 120,
    damageDealt: Math.floor(Math.random() * 200) + 100,
    damageTaken: Math.floor(Math.random() * 150) + 50,
    strikesLanded: Math.floor(Math.random() * 50) + 20,
    strikesAttempted: Math.floor(Math.random() * 80) + 40,
    significance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
  }))

  const trainingHistory: TrainingSession[] = Array.from({ length: Math.floor(Math.random() * 15) + 10 }, (_, i) => ({
    id: `training-${i}`,
    date: Date.now() - (i * 2 * 24 * 60 * 60 * 1000), // Every 2 days
    type: ['strength', 'speed', 'defense', 'stamina', 'technique'][Math.floor(Math.random() * 5)] as any,
    intensity: Math.floor(Math.random() * 40) + 60,
    improvement: Math.floor(Math.random() * 5) + 1,
    cost: Math.floor(Math.random() * 100) + 50,
    notes: ['Excellent session', 'Good progress', 'Pushed hard today', 'Recovery day', 'Breakthrough!'][Math.floor(Math.random() * 5)]
  }))

  return {
    ...baseFighter,
    recentForm: Array.from({ length: 8 }, () => Math.random() > 0.4 ? 'W' : Math.random() > 0.8 ? 'D' : 'L'),
    fightHistory,
    trainingHistory,
    specialties: ['Heavy Hitter', 'Counter Puncher', 'Speed Demon'][Math.floor(Math.random() * 3)] === 'Heavy Hitter' 
      ? ['Knockout Power', 'Body Shots'] 
      : ['Lightning Fast', 'Precise Strikes'],
    weaknesses: ['Stamina Management', 'Defensive Lapses', 'Predictable Patterns'][Math.floor(Math.random() * 3)] === 'Stamina Management'
      ? ['Gets Tired Late', 'Drops Guard']
      : ['Telegraphs Punches', 'Poor Clinch Work'],
    analytics: {
      averageFightDuration: 180 + Math.random() * 120,
      koPercentage: Math.floor(Math.random() * 40) + 20,
      winStreakRecord: Math.floor(Math.random() * 8) + 3,
      favoriteAttackStyle: ['Aggressive Pressure', 'Technical Boxing', 'Counter Striking'][Math.floor(Math.random() * 3)],
      peakPerformanceRound: Math.floor(Math.random() * 3) + 2,
      staminaDecay: Math.floor(Math.random() * 15) + 10,
      injuryRisk: Math.floor(Math.random() * 60) + 20,
      marketValue: Math.floor(Math.random() * 50000) + 10000,
      predictions: {
        nextFightWinProbability: Math.floor(Math.random() * 40) + 40,
        careerTrajectory: ['rising', 'peak', 'declining'][Math.floor(Math.random() * 3)] as any,
        retirementForecast: Math.floor(Math.random() * 20) + 5
      }
    }
  }
}