'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LiveFightSection from '@/components/LiveFightSection'
import LandingPage from '@/components/LandingPage'

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'arena'>('landing')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const enterArena = (userType: 'spectator' | 'fighter') => {
    setCurrentView('arena')
  }

  const goHome = () => {
    setCurrentView('landing')
  }

  if (!isLoaded) {
    return (
      <div style={{
        background: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e8e8f0',
        fontFamily: 'monospace'
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-2xl font-pixel text-accent mb-4 animate-pulse">
            INITIALIZING MFC
          </div>
          <div className="text-text2">Loading championship bout...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <LandingPage onEnterArena={enterArena} />
          </motion.div>
        )}
        
        {currentView === 'arena' && (
          <motion.div
            key="arena"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="h-screen"
          >
            {/* Header with home button */}
            <div className="bg-surface border-b border-border px-4 py-2 flex items-center justify-between">
              <motion.button
                onClick={goHome}
                className="font-pixel text-accent hover:text-accent/80 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← MFC
              </motion.button>
              <div className="font-pixel text-xs text-gold">
                MOLT FIGHTING CHAMPIONSHIP
              </div>
              <div className="font-pixel text-xs text-text2">
                LIVE NOW
              </div>
            </div>
            
            <LiveFightSection onFightComplete={(fighterId, fightData) => {
              console.log('Fight completed:', fighterId, fightData)
              // Handle fight completion if needed
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}