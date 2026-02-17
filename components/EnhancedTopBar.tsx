'use client'

import { motion } from 'framer-motion'
import { 
  Volume2, 
  VolumeX, 
  Home, 
  Award, 
  Flame, 
  DollarSign,
  Bell,
  Calendar
} from 'lucide-react'

interface EnhancedTopBarProps {
  onGoHome: () => void
  credits: number
  soundEnabled: boolean
  onToggleSound: () => void
  achievementNotifications?: number
  loginStreak?: number
}

export default function EnhancedTopBar({
  onGoHome,
  credits,
  soundEnabled,
  onToggleSound,
  achievementNotifications = 0,
  loginStreak = 0
}: EnhancedTopBarProps) {
  return (
    <div className="bg-surface1 border-b border-border px-4 py-3 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Left side - Brand and Home */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onGoHome}
              className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-5 h-5" />
              <span className="font-pixel text-lg hidden md:block">MFC</span>
            </motion.button>
          </div>

          {/* Center - Stats */}
          <div className="flex items-center gap-6">
            {/* Credits */}
            <div className="flex items-center gap-2 bg-surface2 px-3 py-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="font-ui text-text1">{credits.toLocaleString()}</span>
              <span className="text-xs text-text2 hidden md:block">credits</span>
            </div>

            {/* Login Streak */}
            {loginStreak > 0 && (
              <div className="flex items-center gap-2 bg-orange-400/10 px-3 py-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="font-ui text-orange-400">{loginStreak}</span>
                <span className="text-xs text-text2 hidden md:block">streak</span>
              </div>
            )}
          </div>

          {/* Right side - Controls and Notifications */}
          <div className="flex items-center gap-3">
            {/* Achievement Notifications */}
            {achievementNotifications > 0 && (
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-400 px-2 py-1">
                  <Award className="w-3 h-3" />
                  <span className="font-ui text-xs">{achievementNotifications}</span>
                </div>
                <motion.div
                  className="absolute inset-0 bg-yellow-400/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            )}

            {/* Sound Toggle */}
            <motion.button
              onClick={onToggleSound}
              className={`
                p-2 transition-colors
                ${soundEnabled 
                  ? 'bg-surface2 text-text1 hover:bg-surface2/80' 
                  : 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                }
              `}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}