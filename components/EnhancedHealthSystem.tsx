'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fighter } from '@/types'

interface DamageIndicator {
  id: string
  amount: number
  type: 'normal' | 'heavy' | 'critical'
  x: number
  y: number
  timestamp: number
}

interface HealthVisualization {
  currentHealth: number
  maxHealth: number
  recentDamage: DamageIndicator[]
  isStunned: boolean
  isCritical: boolean
  recoveryRate: number
}

interface EnhancedHealthSystemProps {
  fighter: Fighter
  currentHealth: number
  maxHealth: number
  position: { x: number; y: number }
  isActive?: boolean
  onHealthCritical?: () => void
  onHealthRecovered?: () => void
}

export default function EnhancedHealthSystem({
  fighter,
  currentHealth,
  maxHealth,
  position,
  isActive = true,
  onHealthCritical,
  onHealthRecovered
}: EnhancedHealthSystemProps) {
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([])
  const [previousHealth, setPreviousHealth] = useState(currentHealth)
  const [isStunned, setIsStunned] = useState(false)
  const [pulseEffect, setPulseEffect] = useState(false)

  const healthPercentage = (currentHealth / maxHealth) * 100
  const isCritical = healthPercentage < 25
  const isLow = healthPercentage < 50

  // Detect damage and create indicators
  useEffect(() => {
    if (currentHealth < previousHealth) {
      const damage = previousHealth - currentHealth
      const damageType = damage > 15 ? 'critical' : damage > 8 ? 'heavy' : 'normal'
      
      // Create damage indicator
      const indicator: DamageIndicator = {
        id: `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: damage,
        type: damageType,
        x: position.x + (Math.random() - 0.5) * 60,
        y: position.y + (Math.random() - 0.5) * 40,
        timestamp: Date.now()
      }

      setDamageIndicators(prev => [...prev, indicator])

      // Remove indicator after animation
      setTimeout(() => {
        setDamageIndicators(prev => prev.filter(d => d.id !== indicator.id))
      }, 2000)

      // Trigger stun effect for heavy damage
      if (damageType === 'critical' || damageType === 'heavy') {
        setIsStunned(true)
        setPulseEffect(true)
        setTimeout(() => setIsStunned(false), 1000)
        setTimeout(() => setPulseEffect(false), 500)
      }
    }

    // Check for critical health state
    if (isCritical && !isLow) {
      onHealthCritical?.()
    } else if (!isCritical && previousHealth < maxHealth * 0.25) {
      onHealthRecovered?.()
    }

    setPreviousHealth(currentHealth)
  }, [currentHealth, previousHealth, isCritical, onHealthCritical, onHealthRecovered])

  const getDamageColor = (type: string) => {
    switch (type) {
      case 'critical': return '#dc2626'
      case 'heavy': return '#ea580c'
      case 'normal': return '#f59e0b'
      default: return '#f59e0b'
    }
  }

  const getHealthBarColor = () => {
    if (isCritical) return 'from-red-600 to-red-500'
    if (isLow) return 'from-yellow-500 to-orange-500'
    return 'from-green-500 to-green-400'
  }

  const getHealthBarGlow = () => {
    if (isCritical) return 'shadow-red-500/50'
    if (isLow) return 'shadow-yellow-500/30'
    return 'shadow-green-500/20'
  }

  return (
    <div className="relative">
      {/* Main Health Bar */}
      <div className="relative w-full max-w-xs">
        {/* Fighter Name */}
        <div className="text-xs font-mono text-white/70 mb-1 text-center">
          {fighter.name}
        </div>

        {/* Health Bar Container */}
        <div className={`relative bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-600 ${getHealthBarGlow()}`}>
          {/* Health Bar Fill */}
          <motion.div
            className={`h-full bg-gradient-to-r ${getHealthBarColor()} relative`}
            style={{ width: `${Math.max(0, healthPercentage)}%` }}
            animate={{
              opacity: pulseEffect ? [1, 0.6, 1] : 1,
              scale: pulseEffect ? [1, 1.02, 1] : 1
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ width: '50%' }}
            />
          </motion.div>

          {/* Critical Health Pulse */}
          {isCritical && (
            <motion.div
              className="absolute inset-0 bg-red-500/30"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}

          {/* Health Segments */}
          <div className="absolute inset-0 flex">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-black/20 last:border-r-0"
              />
            ))}
          </div>
        </div>

        {/* Health Percentage */}
        <div className="flex justify-between items-center mt-1">
          <div className={`text-xs font-mono ${isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-green-400'}`}>
            {Math.round(healthPercentage)}%
          </div>
          <div className="text-xs font-mono text-gray-400">
            {Math.round(currentHealth)}/{Math.round(maxHealth)}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center mt-1 space-x-2">
          <AnimatePresence>
            {isCritical && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: 1
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold"
              >
                CRITICAL
              </motion.div>
            )}

            {isStunned && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full font-bold"
              >
                STUNNED
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Damage Indicators */}
      <AnimatePresence>
        {damageIndicators.map(indicator => (
          <motion.div
            key={indicator.id}
            initial={{
              opacity: 1,
              scale: 0.5,
              x: indicator.x,
              y: indicator.y
            }}
            animate={{
              opacity: 0,
              scale: 1.5,
              y: indicator.y - 60
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute pointer-events-none z-50"
            style={{
              color: getDamageColor(indicator.type),
              fontSize: indicator.type === 'critical' ? '18px' : indicator.type === 'heavy' ? '16px' : '14px',
              fontWeight: 'bold',
              textShadow: `0 0 8px ${getDamageColor(indicator.type)}`
            }}
          >
            -{Math.round(indicator.amount)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Breathing/Exhaustion Effect */}
      {isLow && isActive && (
        <motion.div
          className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-yellow-500/50 rounded-lg pointer-events-none"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.98, 1.02, 0.98]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Blood/Sweat Effects */}
      {isLow && (
        <div className="absolute top-0 left-0 pointer-events-none">
          <motion.div
            className="w-1 h-1 bg-red-500 rounded-full"
            animate={{
              opacity: [0, 1, 0],
              y: [0, 20, 40]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        </div>
      )}

      {/* Recovery Animation */}
      {currentHealth > previousHealth && (
        <motion.div
          className="absolute -inset-2 bg-green-500/20 rounded-lg pointer-events-none"
          animate={{
            opacity: [0.5, 0],
            scale: [1, 1.1]
          }}
          transition={{ duration: 1 }}
        />
      )}
    </div>
  )
}

// Hook for managing health effects
export function useHealthEffects() {
  const [effects, setEffects] = useState<{
    isDamaged: boolean
    isRecovering: boolean
    isCritical: boolean
    lastDamageTime: number
  }>({
    isDamaged: false,
    isRecovering: false,
    isCritical: false,
    lastDamageTime: 0
  })

  const triggerDamage = (amount: number) => {
    setEffects(prev => ({
      ...prev,
      isDamaged: true,
      lastDamageTime: Date.now(),
      isCritical: amount > 20
    }))

    setTimeout(() => {
      setEffects(prev => ({ ...prev, isDamaged: false, isCritical: false }))
    }, 1000)
  }

  const triggerRecovery = () => {
    setEffects(prev => ({ ...prev, isRecovering: true }))
    setTimeout(() => {
      setEffects(prev => ({ ...prev, isRecovering: false }))
    }, 2000)
  }

  return {
    effects,
    triggerDamage,
    triggerRecovery
  }
}