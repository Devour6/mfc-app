'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LiveFightSection from '@/components/LiveFightSection'
import LandingPage from '@/components/LandingPage'
import DailyRewards from '@/components/DailyRewards'
import RankingsSection from '@/components/RankingsSection'
import TournamentBracket from '@/components/TournamentBracket'
import AchievementSystem from '@/components/AchievementSystem'
import FightersSection from '@/components/FightersSection'
// import { LoginStreak, TournamentBracket, TournamentMatch, Fighter } from '@/types'

// Inline type definitions to fix build
interface LoginStreak {
  currentStreak: number
  longestStreak: number
  lastLoginDate: number
  rewards: any[]
  nextRewardCredits: number
}

interface TournamentBracket {
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
const mockTournament: TournamentBracket = {
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
  const [arenaSection, setArenaSection] = useState<'fights' | 'rewards' | 'rankings' | 'tournaments' | 'achievements' | 'fighters'>('fights')
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
      <div className="bg-bg min-h-screen flex items-center justify-center text-text1 font-ui">
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
            {/* Header with navigation */}
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
                {arenaSection === 'fights' ? 'LIVE NOW' : arenaSection.toUpperCase()}
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="bg-surface border-b border-border px-4 py-2">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {[
                  { id: 'fights', label: '🥊 FIGHTS', icon: '🥊' },
                  { id: 'rewards', label: '🎁 REWARDS', icon: '🎁' },
                  { id: 'rankings', label: '🏆 RANKINGS', icon: '🏆' },
                  { id: 'tournaments', label: '🏟️ TOURNAMENTS', icon: '🏟️' },
                  { id: 'fighters', label: '🤖 FIGHTERS', icon: '🤖' },
                  { id: 'achievements', label: '🎖️ ACHIEVEMENTS', icon: '🎖️' }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setArenaSection(tab.id as any)}
                    className={`font-pixel text-xs px-3 py-2 border transition-all ${
                      arenaSection === tab.id
                        ? 'bg-accent text-white border-accent'
                        : 'bg-transparent text-text2 border-border hover:text-text hover:border-text2'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="md:hidden">{tab.icon}</span>
                    <span className="hidden md:inline">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Content area */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {arenaSection === 'fights' && (
                  <motion.div
                    key="fights"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <LiveFightSection onFightComplete={(fighterId, fightData) => {
                      console.log('Fight completed:', fighterId, fightData)
                    }} />
                  </motion.div>
                )}

                {arenaSection === 'rewards' && (
                  <motion.div
                    key="rewards"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    <DailyRewards 
                      loginStreak={mockLoginStreak}
                      onClaimReward={(reward) => {
                        console.log('Reward claimed:', reward)
                        // Add reward claiming logic
                      }}
                    />
                  </motion.div>
                )}

                {arenaSection === 'rankings' && (
                  <motion.div
                    key="rankings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    <RankingsSection fighters={mockFighters} />
                  </motion.div>
                )}

                {arenaSection === 'tournaments' && (
                  <motion.div
                    key="tournaments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    <TournamentBracket 
                      tournament={mockTournament}
                      onStartMatch={(match) => console.log('Starting match:', match)}
                      showControls={true}
                    />
                  </motion.div>
                )}

                {arenaSection === 'fighters' && (
                  <motion.div
                    key="fighters"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    <FightersSection 
                      fighters={mockFighters as any[]}
                      onFightComplete={(fighterId, fightData) => console.log('Fight completed:', fighterId, fightData)}
                      onSelectFighter={(fighterId) => console.log('Selected fighter:', fighterId)}
                      onTraining={(fighterId, fighterName, cost) => {
                        console.log('Training:', fighterId, fighterName, cost)
                        return true // Allow training
                      }}
                    />
                  </motion.div>
                )}

                {arenaSection === 'achievements' && (
                  <motion.div
                    key="achievements"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    <AchievementSystem 
                      achievements={mockAchievements as any[]}
                      notifications={mockNotifications as any[]}
                      onDismissNotification={(notificationId) => console.log('Dismissed notification:', notificationId)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}