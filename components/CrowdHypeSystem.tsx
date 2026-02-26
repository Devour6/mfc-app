'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FightState, Fighter } from '@/types'

interface CrowdReaction {
  id: string
  type: 'cheer' | 'boo' | 'gasp' | 'roar' | 'silence' | 'chant'
  intensity: number // 0-100
  duration: number
  message?: string
  timestamp: number
}

interface HypeLevel {
  current: number // 0-100
  peak: number
  trend: 'rising' | 'falling' | 'stable'
  crowdSize: number
}

interface CrowdHypeSystemProps {
  fightState: FightState
  fighters: Fighter[]
  userActions?: {
    cheers: number
    boos: number
    shakeIntensity?: number
  }
  onCrowdPeak?: (intensity: number) => void
  onCrowdSilence?: () => void
}

interface CrowdChant {
  id: string
  text: string
  participantCount: number
  intensity: number
  fighter: 1 | 2 | 'both'
}

export default function CrowdHypeSystem({
  fightState,
  fighters,
  userActions = { cheers: 0, boos: 0 },
  onCrowdPeak,
  onCrowdSilence
}: CrowdHypeSystemProps) {
  const [hypeLevel, setHypeLevel] = useState<HypeLevel>({
    current: 45,
    peak: 45,
    trend: 'stable',
    crowdSize: 12847
  })
  
  const [reactions, setReactions] = useState<CrowdReaction[]>([])
  const [activeChant, setActiveChant] = useState<CrowdChant | null>(null)
  const [crowdMood, setCrowdMood] = useState<'excited' | 'tense' | 'disappointed' | 'electric'>('excited')
  const [soundLevel, setSoundLevel] = useState(0)

  const lastHypeRef = useRef(45)
  const reactionTimeoutRef = useRef<NodeJS.Timeout>()

  // Crowd reaction generators
  const crowdReactionTemplates = {
    cheer: [
      "YEAH!", "WOOO!", "GET HIM!", "FINISH HIM!",
      "INCREDIBLE!", "AMAZING!", "LET'S GO!"
    ],
    boo: [
      "BOOOO!", "COME ON!", "WEAK!", "BORING!",
      "DO SOMETHING!", "FIGHT BACK!"
    ],
    gasp: [
      "OHHHHH!", "NO WAY!", "DID YOU SEE THAT?!",
      "BRUTAL!", "DEVASTATING!"
    ],
    roar: [
      "ROAAAAAAR!", "YEEEEEAH!", "INSANE!",
      "LEGENDARY!", "UNBELIEVABLE!"
    ],
    chant: [
      `${fighters[0]?.name.split('-')[0] || 'FIGHTER'}! ${fighters[0]?.name.split('-')[0] || 'FIGHTER'}!`,
      `${fighters[1]?.name.split('-')[0] || 'FIGHTER'}! ${fighters[1]?.name.split('-')[0] || 'FIGHTER'}!`,
      "FIGHT! FIGHT! FIGHT!",
      "K-O! K-O! K-O!"
    ]
  }

  // Calculate crowd hype based on fight state
  useEffect(() => {
    if (!fightState.fighter1 || !fightState.fighter2) return

    const fighter1Health = fightState.fighter1.hp / 100
    const fighter2Health = fightState.fighter2.hp / 100
    
    // Base excitement factors
    const averageHealth = (fighter1Health + fighter2Health) / 2
    const healthDifference = Math.abs(fighter1Health - fighter2Health)
    const closeFightBonus = (1 - healthDifference) * 30 // Closer fights = more exciting
    const lowHealthTension = (1 - averageHealth) * 40 // Low health = tension
    
    // Fight phase multiplier
    const phaseMultiplier = fightState.phase === 'fighting' ? 1.5 : 0.7
    
    // User interaction bonus
    const userBonus = (userActions.cheers + userActions.boos) * 2
    const shakeBonus = (userActions.shakeIntensity || 0) * 0.3
    
    // Calculate new hype level
    const baseHype = 30 + closeFightBonus + lowHealthTension + userBonus + shakeBonus
    const newHype = Math.min(100, Math.max(0, baseHype * phaseMultiplier))
    
    // Determine trend
    const hypeDiff = newHype - lastHypeRef.current
    const trend = Math.abs(hypeDiff) < 2 ? 'stable' : hypeDiff > 0 ? 'rising' : 'falling'
    
    setHypeLevel(prev => ({
      current: newHype,
      peak: Math.max(prev.peak, newHype),
      trend,
      crowdSize: prev.crowdSize + Math.floor((Math.random() - 0.5) * 100)
    }))
    
    // Update sound level for audio cues
    setSoundLevel(newHype)
    
    // Trigger crowd peak callback
    if (newHype > 85 && lastHypeRef.current < 85) {
      onCrowdPeak?.(newHype)
    }
    
    // Trigger crowd silence callback
    if (newHype < 20 && lastHypeRef.current > 20) {
      onCrowdSilence?.()
    }
    
    lastHypeRef.current = newHype
    
    // Generate crowd reactions based on hype changes
    generateCrowdReaction(newHype, hypeDiff)
    
  }, [fightState, userActions])

  // Generate appropriate crowd reaction
  const generateCrowdReaction = (hype: number, change: number) => {
    let reactionType: CrowdReaction['type'] = 'cheer'
    let intensity = hype
    let duration = 2000
    let message = ''

    if (change > 15) {
      // Big excitement increase
      reactionType = 'roar'
      intensity = Math.min(100, hype + 20)
      message = crowdReactionTemplates.roar[Math.floor(Math.random() * crowdReactionTemplates.roar.length)]
      duration = 3000
    } else if (change > 8) {
      // Moderate excitement
      reactionType = 'cheer'
      message = crowdReactionTemplates.cheer[Math.floor(Math.random() * crowdReactionTemplates.cheer.length)]
    } else if (change < -10) {
      // Disappointment
      reactionType = 'boo'
      message = crowdReactionTemplates.boo[Math.floor(Math.random() * crowdReactionTemplates.boo.length)]
      duration = 1500
    } else if (hype > 75 && Math.random() > 0.8) {
      // Random high-hype gasp
      reactionType = 'gasp'
      message = crowdReactionTemplates.gasp[Math.floor(Math.random() * crowdReactionTemplates.gasp.length)]
    }

    // Only generate reaction if significant or random chance
    if (Math.abs(change) > 5 || (hype > 60 && Math.random() > 0.9)) {
      const reaction: CrowdReaction = {
        id: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: reactionType,
        intensity,
        duration,
        message,
        timestamp: Date.now()
      }

      setReactions(prev => [reaction, ...prev.slice(0, 4)])

      // Remove reaction after duration
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reaction.id))
      }, duration)
    }

    // Generate chants at high hype levels
    if (hype > 70 && Math.random() > 0.85) {
      generateChant()
    }
  }

  // Generate crowd chant
  const generateChant = () => {
    if (activeChant) return // Don't overlap chants

    const chantText = crowdReactionTemplates.chant[Math.floor(Math.random() * crowdReactionTemplates.chant.length)]
    const participantCount = Math.floor(hypeLevel.crowdSize * (hypeLevel.current / 100) * (0.3 + Math.random() * 0.4))

    const chant: CrowdChant = {
      id: `chant_${Date.now()}`,
      text: chantText,
      participantCount,
      intensity: hypeLevel.current,
      fighter: Math.random() > 0.5 ? 1 : 2
    }

    setActiveChant(chant)

    // End chant after duration
    setTimeout(() => {
      setActiveChant(null)
    }, 4000 + Math.random() * 2000)
  }

  // Update crowd mood based on hype level and trend
  useEffect(() => {
    if (hypeLevel.current > 80) {
      setCrowdMood('electric')
    } else if (hypeLevel.current > 60 && hypeLevel.trend === 'rising') {
      setCrowdMood('excited')
    } else if (hypeLevel.current < 30) {
      setCrowdMood('disappointed')
    } else {
      setCrowdMood('tense')
    }
  }, [hypeLevel])

  const getMoodColor = () => {
    switch (crowdMood) {
      case 'electric': return '#8b5cf6'
      case 'excited': return '#10b981'
      case 'tense': return '#f59e0b'
      case 'disappointed': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getMoodEmoji = () => {
    switch (crowdMood) {
      case 'electric': return '⚡'
      case 'excited': return '🔥'
      case 'tense': return '😬'
      case 'disappointed': return '😴'
      default: return '👥'
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
      {/* Crowd Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getMoodEmoji()}</span>
          <div>
            <div className="text-sm font-bold text-white">CROWD ENERGY</div>
            <div className="text-xs text-gray-400">{hypeLevel.crowdSize.toLocaleString()} spectators</div>
          </div>
        </div>
        <div className="text-right">
          <div 
            className="text-lg font-bold"
            style={{ color: getMoodColor() }}
          >
            {hypeLevel.current.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400 capitalize">
            {crowdMood} • {hypeLevel.trend}
          </div>
        </div>
      </div>

      {/* Hype Level Visualization */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">ARENA ATMOSPHERE</span>
          <span className="text-xs text-gray-400">PEAK: {hypeLevel.peak.toFixed(0)}%</span>
        </div>
        
        <div className="relative bg-gray-800 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ 
              backgroundColor: getMoodColor(),
              width: `${hypeLevel.current}%`
            }}
            animate={{
              boxShadow: hypeLevel.current > 70 ? `0 0 15px ${getMoodColor()}` : 'none'
            }}
          >
            {/* Animated pulse effect for high energy */}
            {hypeLevel.current > 80 && (
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
          
          {/* Peak marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50"
            style={{ left: `${hypeLevel.peak}%` }}
          />
        </div>
      </div>

      {/* Sound Level Indicator */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xs text-gray-400">🔊</span>
        <div className="flex-1 flex space-x-1">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 h-2 rounded"
              style={{
                backgroundColor: soundLevel > (i * 10) ? getMoodColor() : '#374151'
              }}
              animate={{
                height: soundLevel > (i * 10) ? (4 + Math.random() * 4) : 2
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">{Math.round(soundLevel)}dB</span>
      </div>

      {/* Active Chant */}
      <AnimatePresence>
        {activeChant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300">CROWD CHANT</span>
              <span className="text-xs text-purple-400">
                {activeChant.participantCount.toLocaleString()} voices
              </span>
            </div>
            <motion.div
              className="text-white font-bold text-center text-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              "{activeChant.text}"
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Crowd Reactions */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400">CROWD REACTIONS</span>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          <AnimatePresence>
            {reactions.map((reaction) => (
              <motion.div
                key={reaction.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-2 bg-black/40 rounded px-2 py-1"
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: reaction.type === 'cheer' || reaction.type === 'roar' ? '#10b981' :
                                    reaction.type === 'boo' ? '#ef4444' :
                                    reaction.type === 'gasp' ? '#f59e0b' : '#6b7280'
                  }}
                />
                <div className="flex-1">
                  <div className="text-xs text-white font-medium">
                    {reaction.message || reaction.type.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {reaction.intensity.toFixed(0)}% intensity • {Math.floor((Date.now() - reaction.timestamp) / 1000)}s ago
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {reactions.length === 0 && (
            <div className="text-center text-gray-500 text-xs py-2">
              👥 Crowd is watching intently...
            </div>
          )}
        </div>
      </div>

      {/* Crowd Stats */}
      <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-green-400 font-mono text-sm">{userActions.cheers}</div>
          <div className="text-gray-400">Your Cheers</div>
        </div>
        <div>
          <div className="text-red-400 font-mono text-sm">{userActions.boos}</div>
          <div className="text-gray-400">Your Boos</div>
        </div>
        <div>
          <div className="text-yellow-400 font-mono text-sm">{(userActions.shakeIntensity || 0).toFixed(0)}</div>
          <div className="text-gray-400">Shake Power</div>
        </div>
      </div>
    </div>
  )
}