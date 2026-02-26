'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DramaticEffect {
  id: string
  type: 'cameraShake' | 'screenFlash' | 'slowMotion' | 'impactRipple' | 'knockout' | 'momentum'
  intensity: number
  duration: number
  position?: { x: number; y: number }
  data?: any
}

interface DramaticFightEffectsProps {
  effects: DramaticEffect[]
  onEffectComplete?: (effectId: string) => void
  children: React.ReactNode
}

interface MomentumData {
  fighter1: number // -100 to 100, where positive favors fighter1
  intensity: number // 0-100 fight intensity
}

interface FightMetrics {
  fighter1Strikes: number
  fighter2Strikes: number
  fighter1Damage: number
  fighter2Damage: number
  currentRound: number
  momentum: number // -100 to 100
  intensity: number // 0-100
}

export default function DramaticFightEffects({ 
  effects, 
  onEffectComplete, 
  children 
}: DramaticFightEffectsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeEffects, setActiveEffects] = useState<DramaticEffect[]>([])
  const [cameraShake, setCameraShake] = useState(0)
  const [screenFlash, setScreenFlash] = useState(0)
  const [slowMotion, setSlowMotion] = useState(false)

  // Process new effects
  useEffect(() => {
    const newEffects = effects.filter(effect => 
      !activeEffects.find(active => active.id === effect.id)
    )
    
    newEffects.forEach(effect => {
      processEffect(effect)
    })
    
    setActiveEffects(prev => [...prev, ...newEffects])
  }, [effects])

  const processEffect = (effect: DramaticEffect) => {
    switch (effect.type) {
      case 'cameraShake':
        triggerCameraShake(effect.intensity, effect.duration)
        break
      case 'screenFlash':
        triggerScreenFlash(effect.intensity, effect.duration)
        break
      case 'slowMotion':
        triggerSlowMotion(effect.duration)
        break
      case 'impactRipple':
        // Will be handled in render
        break
      case 'knockout':
        triggerKnockoutEffect(effect)
        break
    }

    // Auto-complete effect after duration
    setTimeout(() => {
      setActiveEffects(prev => prev.filter(e => e.id !== effect.id))
      onEffectComplete?.(effect.id)
    }, effect.duration)
  }

  const triggerCameraShake = (intensity: number, duration: number) => {
    setCameraShake(intensity)
    
    const shakeAnimation = () => {
      const container = containerRef.current
      if (!container) return

      const maxOffset = intensity * 10
      const offsetX = (Math.random() - 0.5) * maxOffset
      const offsetY = (Math.random() - 0.5) * maxOffset
      
      container.style.transform = `translate(${offsetX}px, ${offsetY}px)`
      
      setTimeout(() => {
        container.style.transform = 'translate(0, 0)'
      }, 50)
    }

    const interval = setInterval(shakeAnimation, 50)
    
    setTimeout(() => {
      clearInterval(interval)
      setCameraShake(0)
      if (containerRef.current) {
        containerRef.current.style.transform = 'translate(0, 0)'
      }
    }, duration)
  }

  const triggerScreenFlash = (intensity: number, duration: number) => {
    setScreenFlash(intensity)
    setTimeout(() => setScreenFlash(0), duration)
  }

  const triggerSlowMotion = (duration: number) => {
    setSlowMotion(true)
    setTimeout(() => setSlowMotion(false), duration)
  }

  const triggerKnockoutEffect = (effect: DramaticEffect) => {
    // Combination of screen flash, camera shake, and slow motion
    triggerScreenFlash(100, 200)
    setTimeout(() => triggerCameraShake(80, 500), 100)
    setTimeout(() => triggerSlowMotion(2000), 300)
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${slowMotion ? 'slow-motion' : ''}`}
      style={{
        transition: slowMotion ? 'all 0.5s ease-out' : 'none',
        filter: slowMotion ? 'brightness(1.2) contrast(1.1)' : 'none'
      }}
    >
      {/* Screen Flash Overlay */}
      <AnimatePresence>
        {screenFlash > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: screenFlash / 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              background: `radial-gradient(circle, rgba(255,255,255,${screenFlash/200}) 0%, rgba(255,255,255,${screenFlash/300}) 100%)`,
              mixBlendMode: 'screen'
            }}
          />
        )}
      </AnimatePresence>

      {/* Impact Ripples */}
      <AnimatePresence>
        {activeEffects
          .filter(effect => effect.type === 'impactRipple')
          .map(effect => (
            <motion.div
              key={effect.id}
              initial={{ 
                scale: 0,
                opacity: 0.8,
                x: effect.position?.x || 0,
                y: effect.position?.y || 0
              }}
              animate={{ 
                scale: 3,
                opacity: 0
              }}
              transition={{ 
                duration: effect.duration / 1000,
                ease: 'easeOut'
              }}
              className="absolute pointer-events-none z-40"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: `2px solid rgba(255, ${255 - effect.intensity * 2}, 0, 0.8)`,
                left: '50%',
                top: '50%',
                marginLeft: '-50px',
                marginTop: '-50px'
              }}
            />
          ))}
      </AnimatePresence>

      {/* Knockout Screen Effect */}
      <AnimatePresence>
        {activeEffects.some(effect => effect.type === 'knockout') && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              scale: [1, 1.05, 1.02, 1]
            }}
            transition={{ 
              duration: 3,
              times: [0, 0.1, 0.8, 1],
              ease: 'easeInOut'
            }}
            className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(255,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ delay: 0.2, duration: 1, ease: 'easeOut' }}
              className="text-6xl font-bold text-white text-center"
              style={{ textShadow: '0 0 20px rgba(255,0,0,0.8)' }}
            >
              K.O.!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={slowMotion ? 'slow-motion-content' : ''}>
        {children}
      </div>

      {/* Slow Motion Indicator */}
      <AnimatePresence>
        {slowMotion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded z-50 font-mono text-sm"
          >
            SLOW MOTION
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slow-motion {
          animation: slowMotionPulse 2s ease-in-out;
        }

        .slow-motion-content {
          animation: slowMotionContent 2s ease-in-out;
        }

        @keyframes slowMotionPulse {
          0% { filter: brightness(1) contrast(1) saturate(1); }
          50% { filter: brightness(1.3) contrast(1.2) saturate(1.3); }
          100% { filter: brightness(1) contrast(1) saturate(1); }
        }

        @keyframes slowMotionContent {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// Hook for managing dramatic effects
export function useDramaticEffects() {
  const [effects, setEffects] = useState<DramaticEffect[]>([])
  
  const addEffect = (effect: Omit<DramaticEffect, 'id'>) => {
    const newEffect: DramaticEffect = {
      ...effect,
      id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    setEffects(prev => [...prev, newEffect])
  }

  const clearEffects = () => {
    setEffects([])
  }

  // Convenience methods for common effects
  const triggerHeavyHit = (position?: { x: number; y: number }) => {
    addEffect({
      type: 'cameraShake',
      intensity: 80,
      duration: 400
    })
    addEffect({
      type: 'impactRipple',
      intensity: 90,
      duration: 600,
      position
    })
    addEffect({
      type: 'screenFlash',
      intensity: 30,
      duration: 150
    })
  }

  const triggerKnockout = () => {
    addEffect({
      type: 'knockout',
      intensity: 100,
      duration: 3000
    })
  }

  const triggerCriticalMoment = () => {
    addEffect({
      type: 'slowMotion',
      intensity: 100,
      duration: 1500
    })
    addEffect({
      type: 'screenFlash',
      intensity: 20,
      duration: 200
    })
  }

  return {
    effects,
    addEffect,
    clearEffects,
    triggerHeavyHit,
    triggerKnockout,
    triggerCriticalMoment
  }
}