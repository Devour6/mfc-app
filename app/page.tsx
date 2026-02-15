'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from '@/components/LandingPage'
import ArenaPage from '@/components/ArenaPage'
import soundManager from '@/lib/sound-manager'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'arena'>('landing')
  const [currentSection, setCurrentSection] = useState<'live' | 'fighters' | 'rankings'>('live')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize sound manager and preload assets
    const initializeApp = async () => {
      try {
        // Preload sounds
        soundManager.preload()
        
        // Simulate loading time for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  const handleEnterArena = (role: 'spectator' | 'fighter') => {
    soundManager.play('notification', 0.7)
    setCurrentPage('arena')
    setCurrentSection(role === 'fighter' ? 'fighters' : 'live')
  }

  const handleGoHome = () => {
    soundManager.play('notification', 0.5)
    setCurrentPage('landing')
  }

  const handleSectionChange = (section: 'live' | 'fighters' | 'rankings') => {
    soundManager.play('notification', 0.3)
    setCurrentSection(section)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="font-pixel text-4xl text-accent mb-4 animate-pulse">
            MFC
          </div>
          <div className="font-pixel text-sm text-text2 tracking-wider">
            LOADING CHAMPIONSHIP
          </div>
          <div className="mt-6 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-accent rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <AnimatePresence mode="wait">
        {currentPage === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LandingPage onEnterArena={handleEnterArena} />
          </motion.div>
        ) : (
          <motion.div
            key="arena"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <ArenaPage
              currentSection={currentSection}
              onSectionChange={handleSectionChange}
              onGoHome={handleGoHome}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}