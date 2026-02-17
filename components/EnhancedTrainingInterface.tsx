'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Shield, 
  Target, 
  Activity, 
  Brain, 
  Flame, 
  Clock,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Star,
  Trophy,
  Dumbbell
} from 'lucide-react'
import { Fighter } from '@/types'
import soundManager from '@/lib/sound-manager'

interface TrainingSession {
  id: string
  type: 'strength' | 'speed' | 'defense' | 'stamina' | 'fightIQ' | 'aggression'
  duration: number // in seconds
  intensity: 'low' | 'medium' | 'high' | 'extreme'
  cost: number
  expectedGain: number
  description: string
  requirements?: {
    minElo?: number
    minWins?: number
    requiredStats?: Record<string, number>
  }
}

interface EnhancedTrainingInterfaceProps {
  fighter: Fighter
  creditBalance: number
  onStartTraining: (session: TrainingSession) => boolean
  onTrainingComplete: (session: TrainingSession, results: TrainingResults) => void
}

interface TrainingResults {
  statGains: Record<string, number>
  experienceGained: number
  specialAbilityUnlocked?: string
  totalCost: number
}

const TRAINING_SESSIONS: Record<string, TrainingSession[]> = {
  strength: [
    {
      id: 'str-basic',
      type: 'strength',
      duration: 30,
      intensity: 'low',
      cost: 50,
      expectedGain: 2,
      description: 'Basic strength conditioning with weights and resistance training.'
    },
    {
      id: 'str-power',
      type: 'strength',
      duration: 45,
      intensity: 'high',
      cost: 150,
      expectedGain: 4,
      description: 'High-intensity power lifting and explosive movement training.'
    },
    {
      id: 'str-extreme',
      type: 'strength',
      duration: 60,
      intensity: 'extreme',
      cost: 300,
      expectedGain: 6,
      description: 'Elite-level strength training with advanced biomechanics.',
      requirements: { minElo: 1800, requiredStats: { strength: 75 } }
    }
  ],
  speed: [
    {
      id: 'spd-basic',
      type: 'speed',
      duration: 25,
      intensity: 'medium',
      cost: 75,
      expectedGain: 3,
      description: 'Sprint intervals and agility ladder drills.'
    },
    {
      id: 'spd-reaction',
      type: 'speed',
      duration: 40,
      intensity: 'high',
      cost: 200,
      expectedGain: 5,
      description: 'Reaction training with light sensors and neural conditioning.'
    }
  ],
  defense: [
    {
      id: 'def-basic',
      type: 'defense',
      duration: 35,
      intensity: 'medium',
      cost: 100,
      expectedGain: 3,
      description: 'Defensive positioning and blocking technique refinement.'
    },
    {
      id: 'def-counter',
      type: 'defense',
      duration: 50,
      intensity: 'high',
      cost: 250,
      expectedGain: 5,
      description: 'Advanced counter-attack training with multiple opponents.'
    }
  ],
  stamina: [
    {
      id: 'sta-cardio',
      type: 'stamina',
      duration: 45,
      intensity: 'medium',
      cost: 80,
      expectedGain: 3,
      description: 'Cardiovascular endurance training with fight simulation.'
    },
    {
      id: 'sta-extreme',
      type: 'stamina',
      duration: 90,
      intensity: 'extreme',
      cost: 350,
      expectedGain: 7,
      description: 'Ultra-endurance training with oxygen deprivation chambers.'
    }
  ],
  fightIQ: [
    {
      id: 'iq-study',
      type: 'fightIQ',
      duration: 60,
      intensity: 'low',
      cost: 120,
      expectedGain: 4,
      description: 'Video analysis of top fighters and strategic planning.'
    },
    {
      id: 'iq-simulation',
      type: 'fightIQ',
      duration: 75,
      intensity: 'high',
      cost: 300,
      expectedGain: 6,
      description: 'AI-powered fight simulation with adaptive scenarios.'
    }
  ],
  aggression: [
    {
      id: 'agg-intensity',
      type: 'aggression',
      duration: 30,
      intensity: 'high',
      cost: 100,
      expectedGain: 3,
      description: 'Controlled aggression training with heavy bag work.'
    },
    {
      id: 'agg-killer',
      type: 'aggression',
      duration: 45,
      intensity: 'extreme',
      cost: 200,
      expectedGain: 5,
      description: 'Killer instinct development with psychological conditioning.'
    }
  ]
}

export default function EnhancedTrainingInterface({
  fighter,
  creditBalance,
  onStartTraining,
  onTrainingComplete
}: EnhancedTrainingInterfaceProps) {
  const [selectedStat, setSelectedStat] = useState<keyof typeof fighter.stats>('strength')
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionResults, setSessionResults] = useState<TrainingResults | null>(null)

  // Training timer
  useEffect(() => {
    if (!activeSession || isPaused) return

    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        const newProgress = prev + (100 / activeSession.duration)
        
        if (newProgress >= 100) {
          // Training complete
          const results: TrainingResults = {
            statGains: {
              [activeSession.type]: Math.floor(activeSession.expectedGain + (Math.random() - 0.5) * 2)
            },
            experienceGained: activeSession.intensity === 'extreme' ? 100 : 
                            activeSession.intensity === 'high' ? 75 : 
                            activeSession.intensity === 'medium' ? 50 : 25,
            totalCost: activeSession.cost
          }
          
          // Random chance for special ability unlock
          if (Math.random() < 0.1 && activeSession.intensity === 'extreme') {
            results.specialAbilityUnlocked = getRandomSpecialAbility(activeSession.type)
          }
          
          setSessionResults(results)
          onTrainingComplete(activeSession, results)
          soundManager.play('bell', 0.8)
          
          // Clear active session after showing results
          setTimeout(() => {
            setActiveSession(null)
            setTrainingProgress(0)
            setSessionResults(null)
          }, 3000)
          
          return 100
        }
        
        return newProgress
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession, isPaused, onTrainingComplete])

  const getRandomSpecialAbility = (statType: string): string => {
    const abilities = {
      strength: 'Iron Fist',
      speed: 'Lightning Strike',
      defense: 'Fortress Mode',
      stamina: 'Endless Energy',
      fightIQ: 'Mind Reader',
      aggression: 'Berserker Rage'
    }
    return abilities[statType as keyof typeof abilities] || 'Unknown Ability'
  }

  const handleStartTraining = (session: TrainingSession) => {
    if (creditBalance < session.cost) {
      soundManager.play('punch-light', 0.4)
      return
    }

    // Check requirements
    if (session.requirements) {
      if (session.requirements.minElo && fighter.elo < session.requirements.minElo) {
        soundManager.play('punch-light', 0.4)
        return
      }
      if (session.requirements.requiredStats) {
        const hasRequiredStats = Object.entries(session.requirements.requiredStats)
          .every(([stat, value]) => fighter.stats[stat as keyof typeof fighter.stats] >= value)
        if (!hasRequiredStats) {
          soundManager.play('punch-light', 0.4)
          return
        }
      }
    }

    const success = onStartTraining(session)
    if (success) {
      setActiveSession(session)
      setTrainingProgress(0)
      setSessionResults(null)
      soundManager.play('notification', 0.7)
    } else {
      soundManager.play('punch-light', 0.4)
    }
  }

  const getStatIcon = (stat: keyof typeof fighter.stats) => {
    const icons = {
      strength: Zap,
      speed: Target,
      defense: Shield,
      stamina: Activity,
      fightIQ: Brain,
      aggression: Flame
    }
    const Icon = icons[stat]
    return <Icon className="w-5 h-5" />
  }

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'text-green'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange'
      case 'extreme': return 'text-red'
      default: return 'text-text'
    }
  }

  return (
    <div className="p-6 bg-surface border border-border">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Dumbbell className="w-6 h-6 text-accent" />
          <h2 className="font-pixel text-xl text-accent">TRAINING CENTER</h2>
        </div>
        <p className="text-text2 text-sm">
          Enhance your fighter&apos;s abilities through specialized training programs.
        </p>
        <div className="mt-2 text-sm text-gold">
          Credits Available: {creditBalance.toLocaleString()}
        </div>
      </div>

      {/* Active Training Session */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            className="mb-6 p-4 bg-bg border border-accent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatIcon(activeSession.type)}
                <span className="font-pixel text-accent">
                  {activeSession.type.toUpperCase()} TRAINING
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="text-text2 hover:text-text transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <Clock className="w-4 h-4 text-text2" />
                <span className="font-pixel text-xs text-text2">
                  {Math.ceil((activeSession.duration * (100 - trainingProgress)) / 100)}s
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-text2 mb-1">
                <span>Progress</span>
                <span>{Math.floor(trainingProgress)}%</span>
              </div>
              <div className="w-full bg-border h-2">
                <motion.div
                  className="bg-accent h-2"
                  style={{ width: `${trainingProgress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${trainingProgress}%` }}
                />
              </div>
            </div>

            <p className="text-sm text-text2">{activeSession.description}</p>

            {/* Training Results */}
            {sessionResults && (
              <motion.div
                className="mt-4 p-3 bg-accent/10 border border-accent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-gold" />
                  <span className="font-pixel text-sm text-gold">TRAINING COMPLETE!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text2">Stat Gain:</span>
                    <span className="text-green ml-1">
                      +{Object.values(sessionResults.statGains)[0]} {activeSession.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-text2">XP:</span>
                    <span className="text-green ml-1">+{sessionResults.experienceGained}</span>
                  </div>
                  {sessionResults.specialAbilityUnlocked && (
                    <div className="col-span-2">
                      <span className="text-text2">Unlocked:</span>
                      <span className="text-gold ml-1">{sessionResults.specialAbilityUnlocked}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!activeSession && (
        <>
          {/* Stat Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(fighter.stats).map(([stat, value]) => (
                <motion.button
                  key={stat}
                  onClick={() => setSelectedStat(stat as keyof typeof fighter.stats)}
                  className={`p-3 border transition-all ${
                    selectedStat === stat
                      ? 'bg-accent text-white border-accent'
                      : 'bg-transparent text-text2 border-border hover:text-text hover:border-text2'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {getStatIcon(stat as keyof typeof fighter.stats)}
                    <span className="font-pixel text-xs">{stat.toUpperCase()}</span>
                    <span className="font-pixel text-xs text-gold">{value}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Training Sessions */}
          <div className="space-y-3">
            <h3 className="font-pixel text-sm text-gold">
              {selectedStat.toUpperCase()} TRAINING PROGRAMS
            </h3>
            
            {TRAINING_SESSIONS[selectedStat]?.map((session) => {
              const canAfford = creditBalance >= session.cost
              const meetsRequirements = !session.requirements || (
                (!session.requirements.minElo || fighter.elo >= session.requirements.minElo) &&
                (!session.requirements.requiredStats || 
                  Object.entries(session.requirements.requiredStats).every(
                    ([stat, value]) => fighter.stats[stat as keyof typeof fighter.stats] >= value
                  )
                )
              )

              return (
                <motion.div
                  key={session.id}
                  className={`p-4 border transition-all ${
                    canAfford && meetsRequirements
                      ? 'border-border hover:border-text2 cursor-pointer'
                      : 'border-border opacity-60'
                  }`}
                  whileHover={canAfford && meetsRequirements ? { scale: 1.01 } : {}}
                  onClick={() => canAfford && meetsRequirements && handleStartTraining(session)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-sm text-accent">
                        {session.intensity.toUpperCase()} INTENSITY
                      </span>
                      <span className={`font-pixel text-xs ${getIntensityColor(session.intensity)}`}>
                        ●
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-pixel text-sm text-gold">{session.cost} credits</div>
                      <div className="text-xs text-text2">{session.duration}s</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-text2 mb-3">{session.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green" />
                      <span className="text-sm text-green">+{session.expectedGain} {session.type}</span>
                    </div>
                    
                    {session.requirements && (
                      <div className="text-xs text-text2">
                        Requirements: 
                        {session.requirements.minElo && ` ELO ${session.requirements.minElo}+`}
                        {session.requirements.requiredStats && 
                          Object.entries(session.requirements.requiredStats).map(
                            ([stat, value]) => ` ${stat} ${value}+`
                          ).join(',')
                        }
                      </div>
                    )}
                  </div>
                  
                  {!canAfford && (
                    <div className="mt-2 text-xs text-red">Insufficient credits</div>
                  )}
                  {!meetsRequirements && (
                    <div className="mt-2 text-xs text-red">Requirements not met</div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}