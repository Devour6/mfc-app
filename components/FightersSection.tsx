'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Zap, Shield, Heart, Brain, Swords, Target } from 'lucide-react'
import { Fighter } from '@/types'
import soundManager from '@/lib/sound-manager'

const playTradeSound = (success: boolean, volume?: number) => {
  soundManager.playTradeSound(success, volume)
}

interface FightersSectionProps {
  userCredits: number
  onSpendCredits: (amount: number) => boolean
}

// Mock user fighters data
const userFighters: Fighter[] = [
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
    owner: 'You',
    isActive: true,
    trainingCost: 50
  },
  {
    id: 'volt-x',
    name: 'VOLT-X',
    emoji: '⚡',
    class: 'Middleweight',
    record: { wins: 9, losses: 3, draws: 0 },
    elo: 1654,
    stats: {
      strength: 65,
      speed: 92,
      defense: 70,
      stamina: 88,
      fightIQ: 78,
      aggression: 85
    },
    owner: 'You',
    isActive: true,
    trainingCost: 35
  },
  {
    id: 'ghost-shell',
    name: 'GHOST-SHELL',
    emoji: '👻',
    class: 'Lightweight',
    record: { wins: 6, losses: 1, draws: 0 },
    elo: 1580,
    stats: {
      strength: 58,
      speed: 86,
      defense: 90,
      stamina: 82,
      fightIQ: 91,
      aggression: 45
    },
    owner: 'You',
    isActive: false,
    trainingCost: 25
  }
]

export default function FightersSection({ userCredits, onSpendCredits }: FightersSectionProps) {
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [trainingInProgress, setTrainingInProgress] = useState<string | null>(null)

  const handleTraining = (fighterId: string, cost: number) => {
    if (onSpendCredits(cost)) {
      setTrainingInProgress(fighterId)
      playTradeSound(true, 0.8)
      
      // Simulate training duration
      setTimeout(() => {
        setTrainingInProgress(null)
        playTradeSound(true, 0.6)
      }, 3000)
    } else {
      playTradeSound(false, 0.5)
    }
  }

  const handleEnterFight = (fighterId: string) => {
    playTradeSound(true, 0.7)
    // In a real app, this would add the fighter to the matchmaking queue
  }

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'strength': return <Zap className="w-4 h-4" />
      case 'speed': return <Target className="w-4 h-4" />
      case 'defense': return <Shield className="w-4 h-4" />
      case 'stamina': return <Heart className="w-4 h-4" />
      case 'fightIQ': return <Brain className="w-4 h-4" />
      case 'aggression': return <Swords className="w-4 h-4" />
      default: return null
    }
  }

  const getStatColor = (value: number) => {
    if (value >= 85) return 'text-gold'
    if (value >= 70) return 'text-green'
    if (value >= 55) return 'text-text'
    return 'text-text2'
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-pixel text-2xl text-accent mb-2">MY FIGHTERS</h1>
        <p className="text-text2">Manage your roster, train stats, and enter ranked fights.</p>
      </motion.div>

      {/* Fighters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {userFighters.map((fighter, index) => (
          <motion.div
            key={fighter.id}
            className={`
              bg-surface border-2 rounded-lg p-6 transition-all duration-300 cursor-pointer
              ${selectedFighter === fighter.id 
                ? 'border-accent shadow-lg shadow-accent/20 transform -translate-y-1' 
                : 'border-border hover:border-accent/50'
              }
              ${!fighter.isActive ? 'opacity-60' : ''}
            `}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedFighter(selectedFighter === fighter.id ? null : fighter.id)}
          >
            {/* Fighter Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{fighter.emoji}</div>
              <div className="flex-1">
                <div className="font-pixel text-sm text-accent mb-1">{fighter.name}</div>
                <div className="text-xs text-gold mb-1">{fighter.class}</div>
                <div className="text-sm text-text2">
                  {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
                </div>
              </div>
              <div className="text-right">
                <div className="font-pixel text-lg text-gold">{fighter.elo}</div>
                <div className="text-xs text-text2">ELO</div>
              </div>
            </div>

            {/* Fighter Stats */}
            <div className="space-y-3 mb-6">
              {Object.entries(fighter.stats).map(([statName, value]) => {
                const displayName = {
                  strength: 'Strength',
                  speed: 'Speed',
                  defense: 'Defense',
                  stamina: 'Stamina',
                  fightIQ: 'Fight IQ',
                  aggression: 'Aggression'
                }[statName] || statName

                return (
                  <div key={statName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text2">{getStatIcon(statName)}</span>
                      <span className="text-text2">{displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getStatColor(value)}`}>{value}</span>
                      <div className="w-16 h-1 bg-surface2 rounded-full">
                        <div 
                          className={`h-full rounded-full ${
                            value >= 85 ? 'bg-gold' :
                            value >= 70 ? 'bg-green' :
                            value >= 55 ? 'bg-text' : 'bg-text2'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Fighter Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  handleTraining(fighter.id, fighter.trainingCost)
                }}
                disabled={trainingInProgress === fighter.id || userCredits < fighter.trainingCost}
                className={`
                  flex-1 py-2 px-3 text-sm font-semibold rounded transition-all duration-200
                  ${trainingInProgress === fighter.id 
                    ? 'bg-gold/20 text-gold cursor-not-allowed' 
                    : userCredits >= fighter.trainingCost
                      ? 'bg-accent text-white hover:bg-accent/90 hover:shadow-lg' 
                      : 'bg-accent/30 text-accent/50 cursor-not-allowed'
                  }
                `}
                whileHover={userCredits >= fighter.trainingCost && trainingInProgress !== fighter.id ? { scale: 1.02 } : {}}
                whileTap={userCredits >= fighter.trainingCost && trainingInProgress !== fighter.id ? { scale: 0.98 } : {}}
              >
                {trainingInProgress === fighter.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Training...
                  </div>
                ) : (
                  `Train (${fighter.trainingCost} MFC)`
                )}
              </motion.button>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEnterFight(fighter.id)
                }}
                disabled={!fighter.isActive}
                className={`
                  flex-1 py-2 px-3 text-sm font-semibold rounded transition-all duration-200
                  ${fighter.isActive 
                    ? 'bg-surface2 border border-border text-text hover:border-accent hover:text-accent' 
                    : 'bg-surface2/50 border border-border/50 text-text2/50 cursor-not-allowed'
                  }
                `}
                whileHover={fighter.isActive ? { scale: 1.02 } : {}}
                whileTap={fighter.isActive ? { scale: 0.98 } : {}}
              >
                Enter Fight
              </motion.button>
            </div>

            {/* Status Badge */}
            <div className="mt-3 text-center">
              <span className={`
                px-2 py-1 text-xs font-pixel rounded
                ${fighter.isActive 
                  ? 'bg-green/20 text-green' 
                  : 'bg-text2/20 text-text2'
                }
              `}>
                {fighter.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Add Fighter Card */}
        <motion.div
          className="bg-surface border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-accent/50 transition-colors cursor-pointer"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: userFighters.length * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <Plus className="w-12 h-12 text-text2/50 mb-4" />
          <div className="font-pixel text-sm text-text2 mb-2">RECRUIT FIGHTER</div>
          <div className="text-xs text-text2/70">
            Add a new AI agent to your roster
          </div>
          <motion.button
            className="mt-4 bg-accent/10 border border-accent text-accent px-4 py-2 text-sm font-semibold rounded hover:bg-accent/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Coming Soon
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}