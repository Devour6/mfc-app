'use client'

import { motion } from 'framer-motion'
import { Fighter, SignatureMove } from '@/types'
import { FighterEvolutionEngine } from '@/lib/evolution-engine'
import { 
  Trophy, 
  Sword, 
  Shield, 
  Sparkles, 
  Brain, 
  Calendar,
  TrendingUp,
  Award,
  Flame
} from 'lucide-react'

interface FighterEvolutionProps {
  fighter: Fighter
  expanded?: boolean
  onToggleExpanded?: () => void
}

export default function FighterEvolution({ 
  fighter, 
  expanded = false, 
  onToggleExpanded 
}: FighterEvolutionProps) {
  const evolution = fighter.evolution
  const careerStage = FighterEvolutionEngine.getCareerStage(fighter)
  const isPrime = FighterEvolutionEngine.isPrimeAge(fighter)
  const modifiedStats = FighterEvolutionEngine.getModifiedStats(fighter)
  
  const traitIcons = {
    aggressive: <Sword className="w-4 h-4" />,
    defensive: <Shield className="w-4 h-4" />,
    showboat: <Sparkles className="w-4 h-4" />,
    technical: <Brain className="w-4 h-4" />
  }

  const traitColors = {
    aggressive: 'text-red-400 bg-red-400/20',
    defensive: 'text-blue-400 bg-blue-400/20', 
    showboat: 'text-yellow-400 bg-yellow-400/20',
    technical: 'text-purple-400 bg-purple-400/20'
  }

  const stageColors = {
    rising: 'text-green-400 bg-green-400/20',
    prime: 'text-orange-400 bg-orange-400/20',
    veteran: 'text-blue-400 bg-blue-400/20',
    declining: 'text-gray-400 bg-gray-400/20'
  }

  const TraitBar = ({ trait, value }: { trait: keyof typeof traitIcons; value: number }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-text2">
          {traitIcons[trait]}
          <span className="capitalize">{trait}</span>
        </div>
        <span className="text-text1 font-ui">{value}</span>
      </div>
      <div className="w-full bg-surface2 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${traitColors[trait].split(' ')[1]}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
      </div>
    </div>
  )

  const SignatureMoveCard = ({ move }: { move: SignatureMove }) => (
    <motion.div
      className="bg-surface2 border border-border rounded-lg p-3 space-y-2"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-text1 font-pixel text-sm">{move.name}</h4>
        <div className="flex items-center gap-1 text-xs text-accent">
          {move.type === 'offensive' && <Sword className="w-3 h-3" />}
          {move.type === 'defensive' && <Shield className="w-3 h-3" />}
          {move.type === 'combo' && <Sparkles className="w-3 h-3" />}
          <span className="capitalize">{move.type}</span>
        </div>
      </div>
      <p className="text-text2 text-xs leading-relaxed">{move.description}</p>
      <div className="flex justify-between text-xs">
        <span className="text-red-400">
          {Math.round((move.damageMultiplier - 1) * 100)}% damage
        </span>
        <span className="text-blue-400">
          {move.staminaCost} stamina
        </span>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-4">
      {/* Header with Age and Stage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-text2">
            <Calendar className="w-4 h-4" />
            <span className="font-ui">{evolution.age} years old</span>
          </div>
          {isPrime && (
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-pixel">PRIME</span>
            </div>
          )}
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-pixel ${stageColors[careerStage]}`}>
          {careerStage.toUpperCase()}
        </div>
      </div>

      {/* Evolution Level and Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface2 border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="font-pixel text-sm text-text1">Evolution</span>
          </div>
          <div className="text-2xl font-ui text-accent mb-1">
            Level {evolution.evolutionLevel}
          </div>
          <div className="text-xs text-text2">
            {evolution.totalFights} total fights
          </div>
        </div>

        <div className="bg-surface2 border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="font-pixel text-sm text-text1">Win Streak</span>
          </div>
          <div className="text-2xl font-ui text-accent mb-1">
            {evolution.winStreak}
          </div>
          <div className="text-xs text-text2">
            {fighter.record.wins}W-{fighter.record.losses}L-{fighter.record.draws}D
          </div>
        </div>
      </div>

      {/* Personality Traits */}
      <div className="space-y-3">
        <h3 className="font-pixel text-text1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Fighting Style
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(evolution.traits).map(([trait, value]) => (
            <TraitBar 
              key={trait} 
              trait={trait as keyof typeof traitIcons} 
              value={value} 
            />
          ))}
        </div>
      </div>

      {/* Signature Moves */}
      {evolution.signatureMoves.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-pixel text-text1 flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" />
            Signature Moves ({evolution.signatureMoves.length})
          </h3>
          <div className="grid gap-2">
            {evolution.signatureMoves.map(move => (
              <SignatureMoveCard key={move.id} move={move} />
            ))}
          </div>
        </div>
      )}

      {/* Career Highlights */}
      {evolution.careerHighlights.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-pixel text-text1 text-sm">Career Highlights</h3>
          <div className="space-y-1">
            {evolution.careerHighlights.slice(-3).map((highlight, index) => (
              <motion.div
                key={index}
                className="bg-accent/10 border border-accent/20 rounded px-2 py-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-xs text-accent font-pixel">{highlight}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Age-Modified Stats Preview */}
      {expanded && (
        <motion.div
          className="space-y-2 pt-3 border-t border-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h3 className="font-pixel text-text1 text-sm">Age-Adjusted Stats</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(modifiedStats).map(([stat, value]) => (
              <div key={stat} className="text-center">
                <div className="text-text2 capitalize">{stat}</div>
                <div className="text-text1 font-ui">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Toggle Expanded Button */}
      {onToggleExpanded && (
        <button
          onClick={onToggleExpanded}
          className="w-full py-2 text-xs text-text2 hover:text-accent transition-colors font-pixel"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  )
}