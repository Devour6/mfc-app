'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TopBar from './TopBar'
import LiveFightSection from './LiveFightSection'
import FightersSection from './FightersSection'
import RankingsSection from './RankingsSection'
import { soundManager } from '@/lib/sound-manager'

interface ArenaPageProps {
  currentSection: 'live' | 'fighters' | 'rankings'
  onSectionChange: (section: 'live' | 'fighters' | 'rankings') => void
  onGoHome: () => void
}

export default function ArenaPage({ currentSection, onSectionChange, onGoHome }: ArenaPageProps) {
  const [userCredits, setUserCredits] = useState(1250)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    // Initialize sound settings
    if (!soundEnabled) {
      soundManager.mute()
    } else {
      soundManager.unmute()
    }
  }, [soundEnabled])

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled)
    soundManager.play('notification', 0.3)
  }

  const handleSpendCredits = (amount: number) => {
    if (userCredits >= amount) {
      setUserCredits(prev => prev - amount)
      return true
    }
    return false
  }

  const handleEarnCredits = (amount: number) => {
    setUserCredits(prev => prev + amount)
  }

  const sectionVariants = {
    enter: { 
      opacity: 0, 
      x: 50,
      transition: { duration: 0.3 }
    },
    center: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      x: -50,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Top Navigation */}
      <TopBar
        currentSection={currentSection}
        onSectionChange={onSectionChange}
        onGoHome={onGoHome}
        userCredits={userCredits}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentSection === 'live' && (
          <motion.div
            key="live"
            variants={sectionVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <LiveFightSection
              userCredits={userCredits}
              onSpendCredits={handleSpendCredits}
              onEarnCredits={handleEarnCredits}
            />
          </motion.div>
        )}

        {currentSection === 'fighters' && (
          <motion.div
            key="fighters"
            variants={sectionVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <FightersSection
              userCredits={userCredits}
              onSpendCredits={handleSpendCredits}
            />
          </motion.div>
        )}

        {currentSection === 'rankings' && (
          <motion.div
            key="rankings"
            variants={sectionVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <RankingsSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}