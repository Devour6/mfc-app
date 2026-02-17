'use client'

import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'

interface TopBarProps {
  currentSection: 'live' | 'fighters' | 'rankings'
  onSectionChange: (section: 'live' | 'fighters' | 'rankings') => void
  onGoHome: () => void
  userCredits: number
  soundEnabled: boolean
  onToggleSound: () => void
}

export default function TopBar({
  currentSection,
  onSectionChange,
  onGoHome,
  userCredits,
  soundEnabled,
  onToggleSound
}: TopBarProps) {
  const navItems = [
    { id: 'live' as const, label: 'Live Fight', icon: '🥊' },
    { id: 'fighters' as const, label: 'My Fighters', icon: '⚔️' },
    { id: 'rankings' as const, label: 'Rankings', icon: '🏆' }
  ]

  return (
    <div className="bg-surface border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <motion.button
          onClick={onGoHome}
          className="font-pixel text-xl text-accent hover:text-glow transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          MFC
        </motion.button>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                relative px-4 py-2 text-sm font-semibold transition-all duration-300
                border border-border hover:border-accent
                ${currentSection === item.id 
                  ? 'bg-accent/10 border-accent text-accent' 
                  : 'bg-surface2 text-text hover:text-accent'
                }
              `}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="hidden sm:inline mr-2">{item.icon}</span>
              {item.label}
              
              {/* Active indicator */}
              {currentSection === item.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  layoutId="activeTab"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* User controls */}
        <div className="flex items-center gap-4">
          {/* Sound toggle */}
          <motion.button
            onClick={onToggleSound}
            className="p-2 hover:bg-surface2 rounded transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-text2 hover:text-accent transition-colors" />
            ) : (
              <VolumeX className="w-5 h-5 text-text2 hover:text-accent transition-colors" />
            )}
          </motion.button>

          {/* Credits display */}
          <motion.div
            className="bg-gold/10 border border-gold/20 px-4 py-2 rounded"
            whileHover={{ scale: 1.02 }}
          >
            <div className="font-pixel text-xs text-gold">
              {userCredits.toLocaleString()} MFC
            </div>
          </motion.div>

          {/* User menu (placeholder for future enhancement) */}
          <motion.button
            className="w-8 h-8 bg-surface2 border border-border flex items-center justify-center text-text2 hover:text-accent hover:border-accent transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-sm">👤</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile navigation (for smaller screens) */}
      <div className="sm:hidden mt-3 flex justify-center">
        <div className="flex bg-surface2 p-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                relative px-3 py-2 text-xs font-semibold transition-all duration-300
                ${currentSection === item.id 
                  ? 'bg-accent text-white' 
                  : 'text-text2 hover:text-accent'
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label.split(' ')[0]} {/* Show first word only on mobile */}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}