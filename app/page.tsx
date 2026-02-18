'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import LiveFightSection from '@/components/LiveFightSection'
import LandingPage from '@/components/LandingPage'
import ArenaTopBar, { ArenaSection } from '@/components/ArenaTopBar'
import DailyRewards from '@/components/DailyRewards'
import RankingsSection from '@/components/RankingsSection'
import TournamentBracket from '@/components/TournamentBracket'
import AchievementSystem from '@/components/AchievementSystem'
import FightersSection from '@/components/FightersSection'
import SolCreditBridgeModal from '@/components/SolCreditBridgeModal'
import CreditPurchase from '@/components/CreditPurchase'
import soundManager from '@/lib/sound-manager'
import { useGameStore } from '@/lib/store'
// import { LoginStreak, TournamentBracket, TournamentMatch, Fighter } from '@/types'

// Inline type definitions to fix build
interface LoginStreak {
  currentStreak: number
  longestStreak: number
  lastLoginDate: number
  rewards: any[]
  nextRewardCredits: number
}

interface TournamentBracketData {
  id: string
  name: string
  status: 'upcoming' | 'in-progress' | 'completed'
  fighters: any[]
  matches: any[]
  winner?: any
  prize: number
  startDate: number
  endDate?: number
}

// Mock data for daily rewards
const mockLoginStreak: LoginStreak = {
  currentStreak: 3,
  longestStreak: 7,
  lastLoginDate: Date.now(),
  rewards: [],
  nextRewardCredits: 100
}

// Mock fighters data for rankings - Updated to match Fighter interface
const mockFighters = [
  {
    id: 'titan-9',
    name: 'TITAN-9',
    emoji: '👑',
    class: 'Heavyweight' as const,
    owner: 'DarkMatter_Labs',
    record: { wins: 22, losses: 1, draws: 0 },
    elo: 2105,
    stats: {
      strength: 95,
      speed: 88,
      defense: 92,
      stamina: 89,
      fightIQ: 94,
      aggression: 87
    },
    isActive: true,
    trainingCost: 100,
    evolution: {
      traits: { aggressive: 80, defensive: 70, showboat: 40, technical: 90 },
      signatureMoves: [],
      age: 28,
      peakAgeStart: 25,
      peakAgeEnd: 32,
      fightHistory: [],
      evolutionLevel: 5,
      totalFights: 23,
      winStreak: 12,
      careerHighlights: ['Championship Belt Winner']
    }
  },
  {
    id: 'shadow-boxer',
    name: 'SHADOW-BOXER',
    emoji: '🥊',
    class: 'Heavyweight' as const,
    owner: 'Neural_Networks',
    record: { wins: 18, losses: 3, draws: 1 },
    elo: 1987,
    stats: {
      strength: 82,
      speed: 95,
      defense: 78,
      stamina: 91,
      fightIQ: 88,
      aggression: 93
    },
    isActive: true,
    trainingCost: 85,
    evolution: {
      traits: { aggressive: 95, defensive: 60, showboat: 70, technical: 85 },
      signatureMoves: [],
      age: 26,
      peakAgeStart: 24,
      peakAgeEnd: 30,
      fightHistory: [],
      evolutionLevel: 4,
      totalFights: 22,
      winStreak: 5,
      careerHighlights: ['Rising Star Award']
    }
  }
]

// Mock tournament data
const mockTournament: TournamentBracketData = {
  id: 'weekly-championship-001',
  name: 'Weekly Championship',
  status: 'in-progress',
  fighters: mockFighters as any[],
  matches: [],
  prize: 5000,
  startDate: Date.now(),
  endDate: Date.now() + (7 * 24 * 60 * 60 * 1000)
}

// Mock achievement data
const mockAchievements = [
  {
    id: 'first-win',
    name: 'First Victory',
    description: 'Win your first fight',
    type: 'combat',
    unlocked: true,
    unlockedAt: Date.now(),
    credits: 100,
    requirements: { wins: 1 }
  },
  {
    id: 'win-streak-5',
    name: 'Winning Streak',
    description: 'Win 5 fights in a row',
    type: 'combat',
    unlocked: false,
    credits: 500,
    requirements: { winStreak: 5 }
  }
]

const mockNotifications = [
  {
    id: 'notif-1',
    achievementId: 'first-win',
    title: 'Achievement Unlocked!',
    message: 'You earned First Victory',
    credits: 100,
    timestamp: Date.now(),
    read: false
  }
]

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'arena'>('landing')
  const [drawerSection, setDrawerSection] = useState<ArenaSection | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showBridge, setShowBridge] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const credits = useGameStore(state => state.user.credits)

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

  const enterArena = (userType: 'spectator' | 'fighter') => {
    setCurrentView('arena')
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
            />

            {/* Fight always visible — fills remaining space */}
            <div className="flex-1 overflow-hidden relative">
              <LiveFightSection onFightComplete={(fighterId, fightData) => {
                console.log('Fight completed:', fighterId, fightData)
              }} />

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
                          <DailyRewards
                            loginStreak={mockLoginStreak}
                            onClaimReward={(reward) => console.log('Reward claimed:', reward)}
                          />
                        )}
                        {drawerSection === 'rankings' && (
                          <RankingsSection fighters={mockFighters} />
                        )}
                        {drawerSection === 'tournaments' && (
                          <TournamentBracket
                            tournament={mockTournament}
                            onStartMatch={(match) => console.log('Starting match:', match)}
                            showControls={true}
                          />
                        )}
                        {drawerSection === 'fighters' && (
                          <FightersSection
                            fighters={mockFighters as any[]}
                            onFightComplete={(fighterId, fightData) => console.log('Fight completed:', fighterId, fightData)}
                            onSelectFighter={(fighterId) => console.log('Selected fighter:', fighterId)}
                            onTraining={(fighterId, fighterName, cost) => {
                              console.log('Training:', fighterId, fighterName, cost)
                              return true
                            }}
                          />
                        )}
                        {drawerSection === 'achievements' && (
                          <AchievementSystem
                            achievements={mockAchievements as any[]}
                            notifications={mockNotifications as any[]}
                            onDismissNotification={(notificationId) => console.log('Dismissed notification:', notificationId)}
                          />
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