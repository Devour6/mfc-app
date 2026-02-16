'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, Users, Trophy, Award, Calendar, DollarSign, Home, Volume2, VolumeX } from 'lucide-react'

interface MobileNavProps {
  currentSection: string
  onSectionChange: (section: string) => void
  onGoHome?: () => void
  credits?: number
  soundEnabled?: boolean
  onToggleSound?: () => void
}

export default function MobileNav({
  currentSection,
  onSectionChange,
  onGoHome,
  credits = 0,
  soundEnabled = true,
  onToggleSound
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { id: 'live', label: 'Live Fights', icon: Zap },
    { id: 'fighters', label: 'My Fighters', icon: Users },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'rewards', label: 'Daily Rewards', icon: Calendar },
    { id: 'credits', label: 'Credits', icon: DollarSign },
  ]

  const handleNavClick = (sectionId: string) => {
    onSectionChange(sectionId)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-surface border border-border rounded-lg shadow-lg"
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-text" />
          ) : (
            <Menu className="w-6 h-6 text-text" />
          )}
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-40 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-surface border-r border-border z-50 overflow-y-auto"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-pixel text-2xl text-accent">MFC</h1>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-text2 hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Credits Display */}
              <div className="bg-surface2 rounded-lg p-3">
                <div className="text-xs text-text2 mb-1">Available Credits</div>
                <div className="font-pixel text-lg text-gold">
                  {credits.toLocaleString()} MFC
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="p-4">
              {/* Home Button */}
              {onGoHome && (
                <motion.button
                  onClick={() => {
                    onGoHome()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface2 rounded-lg transition-colors mb-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-5 h-5 text-text2" />
                  <span className="text-text">Home</span>
                </motion.button>
              )}

              {/* Section Navigation */}
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-4 p-4 text-left rounded-lg transition-colors mb-2
                    ${currentSection === item.id 
                      ? 'bg-accent/10 text-accent border border-accent/20' 
                      : 'hover:bg-surface2 text-text'
                    }
                  `}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className={`w-5 h-5 ${
                    currentSection === item.id ? 'text-accent' : 'text-text2'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                  
                  {currentSection === item.id && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-accent rounded-full"
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Settings Footer */}
            <div className="mt-auto p-4 border-t border-border">
              {/* Sound Toggle */}
              {onToggleSound && (
                <motion.button
                  onClick={() => {
                    onToggleSound()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface2 rounded-lg transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-green" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-red" />
                  )}
                  <span className="text-text">
                    Sound {soundEnabled ? 'On' : 'Off'}
                  </span>
                </motion.button>
              )}

              {/* App Info */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-center text-xs text-text2">
                  <div className="font-pixel mb-1">MOLT FIGHTING CHAMPIONSHIP</div>
                  <div>v1.0.0 • Phase 3</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation for Mobile - Alternative approach */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                p-3 rounded-lg text-center transition-colors
                ${currentSection === item.id 
                  ? 'bg-accent/10 text-accent' 
                  : 'text-text2 hover:text-text'
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs font-pixel">{item.label.split(' ')[0]}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </>
  )
}