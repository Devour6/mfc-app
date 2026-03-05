'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import LiveFightSection from '@/components/LiveFightSection'
import LandingPage from '@/components/LandingPage'
import ArenaTopBar, { ArenaSection } from '@/components/ArenaTopBar'
import RankingsSection from '@/components/RankingsSection'
import FightersSection from '@/components/FightersSection'
import ContentSection from '@/components/ContentSection'
import SolCreditBridgeModal from '@/components/SolCreditBridgeModal'
import CreditPurchase from '@/components/CreditPurchase'
import soundManager from '@/lib/sound-manager'
import { useGameStore } from '@/lib/store'

function ComingSoonPlaceholder({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="font-pixel text-lg text-accent mb-4">{feature}</div>
      <div className="text-text2 text-sm">Coming soon</div>
    </div>
  )
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'arena'>('landing')
  const [drawerSection, setDrawerSection] = useState<ArenaSection | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showBridge, setShowBridge] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const credits = useGameStore(state => state.user.credits)
  const hasCompletedOnboarding = useGameStore(state => state.hasCompletedOnboarding)
  const leaderboardFighters = useGameStore(state => state.leaderboardFighters)
  const fetchLeaderboard = useGameStore(state => state.fetchLeaderboard)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerSection) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerSection(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerSection])

  const enterArena = () => {
    setCurrentView('arena')
    fetchLeaderboard()
  }

  const goHome = () => {
    setCurrentView('landing')
  }

  const handleToggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    if (next) { soundManager.unmute() } else { soundManager.mute() }
  }

  const handleOpenSection = (section: ArenaSection) => {
    setDrawerSection(prev => prev === section ? null : section)
  }

  const drawerTitle: Record<ArenaSection, string> = {
    rankings: 'RANKINGS',
    fighters: 'FIGHTERS',
    tournaments: 'TOURNAMENTS',
    rewards: 'REWARDS',
    achievements: 'ACHIEVEMENTS',
    content: 'CONTENT',
  }

  if (!isLoaded) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center text-text font-ui">
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
            className="h-screen flex flex-col"
          >
            {/* Slim top bar */}
            <ArenaTopBar
              credits={credits}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              onGoHome={goHome}
              onOpenSection={handleOpenSection}
              onOpenBridge={() => setShowBridge(true)}
              onBuyCredits={() => setShowPurchase(true)}
              onboardingMode={!hasCompletedOnboarding}
            />

            {/* Fight always visible — fills remaining space */}
            <div className="flex-1 overflow-hidden relative">
              <LiveFightSection
                simplified={!hasCompletedOnboarding}
                onFightComplete={(fighterId, fightData) => {
                  console.log('Fight completed:', fighterId, fightData)
                }}
              />

              {/* Slide-over drawer for secondary sections */}
              <AnimatePresence>
                {drawerSection && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      key="drawer-backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 z-40"
                      onClick={() => setDrawerSection(null)}
                    />
                    {/* Drawer panel */}
                    <motion.div
                      key="drawer-panel"
                      role="dialog"
                      aria-modal="true"
                      aria-label={drawerTitle[drawerSection]}
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                      className="absolute top-0 right-0 bottom-0 w-full max-w-full sm:max-w-lg bg-bg border-l border-border z-50 flex flex-col overflow-hidden"
                    >
                      {/* Drawer header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
                        <span className="font-pixel text-xs text-text">{drawerTitle[drawerSection]}</span>
                        <button
                          onClick={() => setDrawerSection(null)}
                          className="text-text2 hover:text-text transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Drawer content */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {drawerSection === 'rewards' && (
                          <ComingSoonPlaceholder feature="DAILY REWARDS" />
                        )}
                        {drawerSection === 'rankings' && (
                          <RankingsSection fighters={leaderboardFighters} />
                        )}
                        {drawerSection === 'tournaments' && (
                          <ComingSoonPlaceholder feature="TOURNAMENTS" />
                        )}
                        {drawerSection === 'fighters' && (
                          <FightersSection
                            fighters={leaderboardFighters}
                            onFightComplete={(fighterId, fightData) => console.log('Fight completed:', fighterId, fightData)}
                            onSelectFighter={(fighterId) => console.log('Selected fighter:', fighterId)}
                            onTraining={(fighterId, fighterName, cost) => {
                              console.log('Training:', fighterId, fighterName, cost)
                              return true
                            }}
                          />
                        )}
                        {drawerSection === 'achievements' && (
                          <ComingSoonPlaceholder feature="ACHIEVEMENTS" />
                        )}
                        {drawerSection === 'content' && (
                          <ContentSection />
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOL Bridge Modal */}
      <AnimatePresence>
        {showBridge && (
          <SolCreditBridgeModal credits={credits} onClose={() => setShowBridge(false)} />
        )}
      </AnimatePresence>

      {/* Credit Purchase Modal */}
      <AnimatePresence>
        {showPurchase && (
          <CreditPurchase onClose={() => setShowPurchase(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
