'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileEnhancementsProps {
  children: React.ReactNode
}

interface GestureState {
  shakeIntensity: number
  lastShake: number
  tapToCheer: boolean
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null
}

// Hook for mobile-specific enhancements
export function useMobileEnhancements() {
  const [isMobile, setIsMobile] = useState(false)
  const [gestureState, setGestureState] = useState<GestureState>({
    shakeIntensity: 0,
    lastShake: 0,
    tapToCheer: false,
    swipeDirection: null
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Device shake detection
  useEffect(() => {
    if (!isMobile) return

    let lastAcceleration = { x: 0, y: 0, z: 0 }
    let lastUpdate = 0

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const current = Date.now()
      
      if ((current - lastUpdate) > 100) {
        const timeDiff = current - lastUpdate
        lastUpdate = current

        const acceleration = event.accelerationIncludingGravity
        if (!acceleration) return

        const x = acceleration.x || 0
        const y = acceleration.y || 0
        const z = acceleration.z || 0

        const speed = Math.abs(x + y + z - lastAcceleration.x - lastAcceleration.y - lastAcceleration.z) / timeDiff * 10000

        if (speed > 500) {
          const intensity = Math.min(100, speed / 10)
          setGestureState(prev => ({
            ...prev,
            shakeIntensity: intensity,
            lastShake: current
          }))

          // Trigger haptic feedback if available
          if (window.navigator && 'vibrate' in window.navigator) {
            window.navigator.vibrate(100)
          }

          setTimeout(() => {
            setGestureState(prev => ({ ...prev, shakeIntensity: 0 }))
          }, 500)
        }

        lastAcceleration.x = x
        lastAcceleration.y = y
        lastAcceleration.z = z
      }
    }

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion)
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleDeviceMotion)
      }
    }
  }, [isMobile])

  return {
    isMobile,
    gestureState,
    setGestureState
  }
}

// Mobile-optimized fight controls
export function MobileFightControls({ 
  onCheer, 
  onBoo, 
  onShake,
  intensity = 0
}: {
  onCheer?: () => void
  onBoo?: () => void
  onShake?: (intensity: number) => void
  intensity?: number
}) {
  const { isMobile, gestureState } = useMobileEnhancements()
  const [lastCheerTime, setLastCheerTime] = useState(0)

  useEffect(() => {
    if (gestureState.shakeIntensity > 20 && onShake) {
      onShake(gestureState.shakeIntensity)
    }
  }, [gestureState.shakeIntensity, onShake])

  const handleCheer = () => {
    const now = Date.now()
    if (now - lastCheerTime > 1000) { // Throttle cheering
      onCheer?.()
      setLastCheerTime(now)
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    }
  }

  const handleBoo = () => {
    onBoo?.()
    if ('vibrate' in navigator) {
      navigator.vibrate(200)
    }
  }

  if (!isMobile) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <motion.div
        className="bg-black/80 backdrop-blur-sm rounded-full p-3 flex justify-center items-center space-x-6"
        animate={{
          scale: gestureState.shakeIntensity > 0 ? 1.1 : 1
        }}
        transition={{ duration: 0.1 }}
      >
        {/* Cheer Button */}
        <motion.button
          onTouchStart={handleCheer}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 text-2xl active:scale-95 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: intensity > 50 ? '0 0 20px #16a34a' : '0 0 10px rgba(22, 163, 74, 0.3)'
          }}
        >
          👏
        </motion.button>

        {/* Shake Indicator */}
        <div className="text-center">
          <div className="text-white text-xs mb-1">SHAKE TO HYPE!</div>
          <div className="w-16 bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-yellow-500 h-2 rounded-full"
              style={{ width: `${gestureState.shakeIntensity}%` }}
              animate={{
                backgroundColor: gestureState.shakeIntensity > 50 ? '#ef4444' : '#eab308'
              }}
            />
          </div>
        </div>

        {/* Boo Button */}
        <motion.button
          onTouchStart={handleBoo}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 text-2xl active:scale-95 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          👎
        </motion.button>
      </motion.div>

      {/* Shake Effect Indicator */}
      <AnimatePresence>
        {gestureState.shakeIntensity > 30 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold"
          >
            🔥 HYPE LEVEL {Math.round(gestureState.shakeIntensity)} 🔥
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Mobile-optimized swipe gestures for fight control
export function SwipeGestures({ 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  children 
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  children: React.ReactNode
}) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance
    const isUpSwipe = distanceY > minSwipeDistance
    const isDownSwipe = distanceY < -minSwipeDistance

    if (isLeftSwipe && Math.abs(distanceX) > Math.abs(distanceY)) {
      onSwipeLeft?.()
    }
    if (isRightSwipe && Math.abs(distanceX) > Math.abs(distanceY)) {
      onSwipeRight?.()
    }
    if (isUpSwipe && Math.abs(distanceY) > Math.abs(distanceX)) {
      onSwipeUp?.()
    }
    if (isDownSwipe && Math.abs(distanceY) > Math.abs(distanceX)) {
      onSwipeDown?.()
    }
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      className="touch-none"
    >
      {children}
    </div>
  )
}

// Picture-in-picture style mini fight view for mobile
export function MobileMiniView({ 
  isMinimized, 
  onToggleMinimize,
  children 
}: {
  isMinimized: boolean
  onToggleMinimize: () => void
  children: React.ReactNode
}) {
  const { isMobile } = useMobileEnhancements()

  if (!isMobile) return <>{children}</>

  return (
    <AnimatePresence>
      {isMinimized ? (
        <motion.div
          initial={{ scale: 1, x: 0, y: 0 }}
          animate={{ 
            scale: 0.3, 
            x: window.innerWidth * 0.25, 
            y: -window.innerHeight * 0.3 
          }}
          className="fixed top-4 right-4 z-50 bg-black rounded-lg overflow-hidden border-2 border-white/20"
          style={{ width: '320px', height: '240px' }}
        >
          <div className="relative h-full">
            {children}
            <button
              onClick={onToggleMinimize}
              className="absolute top-2 right-2 bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
            >
              ⛶
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.3 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          {children}
          <button
            onClick={onToggleMinimize}
            className="md:hidden absolute top-4 right-4 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center z-10"
          >
            ⌃
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Enhanced mobile betting interface
export function MobileBettingQuickActions({ 
  onQuickBet, 
  balance = 1000 
}: {
  onQuickBet: (amount: number, side: 'yes' | 'no') => void
  balance?: number
}) {
  const { isMobile } = useMobileEnhancements()
  const [lastBetTime, setLastBetTime] = useState(0)

  const quickBetAmounts = [10, 25, 50, 100]

  const handleQuickBet = (amount: number, side: 'yes' | 'no') => {
    const now = Date.now()
    if (now - lastBetTime > 1000) { // Prevent spam
      onQuickBet(amount, side)
      setLastBetTime(now)
      
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  if (!isMobile) return null

  return (
    <div className="bg-black/90 backdrop-blur-sm p-3 rounded-lg">
      <div className="text-center text-white text-sm mb-2">
        Quick Bet • Balance: ${balance}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-xs text-green-400 text-center font-bold">FIGHTER 1 WINS</div>
          {quickBetAmounts.map(amount => (
            <motion.button
              key={`yes-${amount}`}
              onClick={() => handleQuickBet(amount, 'yes')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-bold transition-all"
              whileTap={{ scale: 0.95 }}
              disabled={balance < amount}
            >
              ${amount}
            </motion.button>
          ))}
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-red-400 text-center font-bold">FIGHTER 2 WINS</div>
          {quickBetAmounts.map(amount => (
            <motion.button
              key={`no-${amount}`}
              onClick={() => handleQuickBet(amount, 'no')}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-bold transition-all"
              whileTap={{ scale: 0.95 }}
              disabled={balance < amount}
            >
              ${amount}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MobileEnhancements({ children }: MobileEnhancementsProps) {
  const { isMobile } = useMobileEnhancements()

  return (
    <div className={`${isMobile ? 'mobile-optimized' : ''}`}>
      {children}
      
      <style jsx global>{`
        .mobile-optimized {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-optimized * {
          touch-action: manipulation;
        }
        
        @media (max-width: 768px) {
          .mobile-optimized .text-xs { font-size: 0.7rem; }
          .mobile-optimized .text-sm { font-size: 0.8rem; }
          .mobile-optimized .p-4 { padding: 0.75rem; }
          .mobile-optimized .space-y-4 > * + * { margin-top: 0.75rem; }
        }
      `}</style>
    </div>
  )
}