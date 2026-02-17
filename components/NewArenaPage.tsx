'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import EnhancedTopBar from './EnhancedTopBar'
import LiveFightSection from './LiveFightSection'
import FightersSection from './FightersSection'
import RankingsSection from './RankingsSection'
import FighterEvolution from './FighterEvolution'
import TournamentBracket from './TournamentBracket'
import AchievementSystem from './AchievementSystem'
import DailyRewards from './DailyRewards'
import CreditsDashboard from './CreditsDashboard'
import { 
  Trophy, 
  Award, 
  Calendar, 
  Users, 
  Zap, 
  Crown,
  Swords,
  DollarSign
} from 'lucide-react'
import { soundManager } from '@/lib/sound-manager'

interface NewArenaPageProps {
  currentSection: 'live' | 'fighters' | 'rankings' | 'tournaments' | 'achievements' | 'rewards' | 'evolution' | 'credits'
  onSectionChange: (section: any) => void
  onGoHome: () => void
}

export default function NewArenaPage({ 
  currentSection, 
  onSectionChange, 
  onGoHome 
}: NewArenaPageProps) {
  const { 
    user, 
    currentTournament, 
    updateAfterFight, 
    startTournament, 
    advanceTournament, 
    claimDailyReward, 
    dismissNotification,
    connectWallet,
    disconnectWallet,
    purchaseCredits,
    withdrawCredits,
    spendCreditsTraining
  } = useGameStore()
  const [selectedFighterId, setSelectedFighterId] = useState<string | null>(null)
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

  const handleFightComplete = (fighterId: string, fightData: any) => {
    updateAfterFight(fighterId, fightData)
    soundManager.play('notification', 0.7)
  }

  const handleStartTournament = () => {
    // Use top 8 fighters by ELO
    const topFighters = user.fighters
      .filter(f => f.isActive)
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 8)
      .map(f => f.id)
    
    startTournament(topFighters)
    soundManager.play('notification', 0.8)
  }

  const handleTournamentMatch = (match: any) => {
    // Simulate fight result for demo
    const winner = Math.random() > 0.5 ? match.fighter1 : match.fighter2
    const method = Math.random() > 0.7 ? 'KO' : 'Decision'
    const round = method === 'Decision' ? 5 : Math.floor(Math.random() * 3) + 1
    
    const result = {
      winner: winner.id,
      method,
      round,
      time: `${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
    }
    
    advanceTournament(match.id, result)
    
    // If it's a user fighter, update their record
    if (user.fighters.some(f => f.id === winner.id)) {
      handleFightComplete(winner.id, {
        opponent: winner.id === match.fighter1.id ? match.fighter2.name : match.fighter1.name,
        result: 'win',
        method: method as any,
        round,
        actions: {
          offensiveActions: Math.floor(Math.random() * 30) + 10,
          defensiveActions: Math.floor(Math.random() * 20) + 5,
          comboActions: Math.floor(Math.random() * 8) + 2,
          precisionStrikes: Math.floor(Math.random() * 15) + 5,
          knockdowns: method === 'KO' ? 1 : 0,
          blocksLanded: Math.floor(Math.random() * 12) + 3,
          dodgesSuccessful: Math.floor(Math.random() * 10) + 2
        },
        isFirstRoundKO: method === 'KO' && round === 1,
        isPerfectRound: Math.random() > 0.9,
        isComeback: Math.random() > 0.8
      })
    }
  }

  const sectionVariants = {
    enter: { 
      opacity: 0, 
      x: 50,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    center: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      x: -50,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  const navItems = [
    { id: 'live', label: 'Live Fights', icon: <Zap className="w-4 h-4" /> },
    { id: 'fighters', label: 'Fighters', icon: <Users className="w-4 h-4" /> },
    { id: 'evolution', label: 'Evolution', icon: <Crown className="w-4 h-4" /> },
    { id: 'tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> },
    { id: 'rewards', label: 'Daily Rewards', icon: <Calendar className="w-4 h-4" /> },
    { id: 'credits', label: 'Credits', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'rankings', label: 'Rankings', icon: <Swords className="w-4 h-4" /> }
  ]

  return (
    <div className="min-h-screen bg-bg">
      <EnhancedTopBar 
        credits={user.creditBalance.available}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onGoHome={onGoHome}
        achievementNotifications={user.achievementNotifications.filter(n => !n.seen).length}
        loginStreak={user.loginStreak.currentStreak}
      />
      
      {/* Enhanced Navigation */}
      <div className="border-b border-border bg-surface1 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {navItems.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`
                    flex items-center gap-2 px-3 py-3 font-pixel text-sm transition-all whitespace-nowrap
                    ${currentSection === id 
                      ? 'text-accent border-b-2 border-accent bg-accent/5' 
                      : 'text-text2 hover:text-text1 hover:bg-surface2'
                    }
                  `}
                >
                  {icon}
                  <span className="hidden md:block">{label}</span>
                </button>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {!currentTournament && user.fighters.length >= 3 && (
                <motion.button
                  onClick={handleStartTournament}
                  className="px-3 py-1 bg-accent text-bg rounded font-pixel text-xs hover:bg-accent/90 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Tournament
                </motion.button>
              )}
              
              {user.achievementNotifications.filter(n => !n.seen).length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => onSectionChange('achievements')}
                    className="p-2 text-yellow-400 hover:bg-surface2 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-xs flex items-center justify-center text-white font-ui">
                    {user.achievementNotifications.filter(n => !n.seen).length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            variants={sectionVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* Live Fights */}
            {currentSection === 'live' && (
              <LiveFightSection onFightComplete={handleFightComplete} />
            )}

            {/* Fighters Management */}
            {currentSection === 'fighters' && (
              <FightersSection 
                fighters={user.fighters}
                onFightComplete={handleFightComplete}
                onSelectFighter={setSelectedFighterId}
                onTraining={spendCreditsTraining}
              />
            )}

            {/* Fighter Evolution Detail */}
            {currentSection === 'evolution' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-pixel text-2xl text-text1 flex items-center gap-2">
                    <Crown className="w-6 h-6 text-accent" />
                    Fighter Evolution
                  </h2>
                  {selectedFighterId && (
                    <button
                      onClick={() => setSelectedFighterId(null)}
                      className="text-sm text-text2 hover:text-text1"
                    >
                      View All Fighters
                    </button>
                  )}
                </div>

                {selectedFighterId ? (
                  <div className="max-w-2xl mx-auto">
                    {(() => {
                      const fighter = user.fighters.find(f => f.id === selectedFighterId)
                      return fighter ? (
                        <div className="bg-surface2 border border-border p-6">
                          <div className="text-center mb-6">
                            <div className="text-4xl mb-2">{fighter.emoji}</div>
                            <h3 className="font-pixel text-xl text-text1">{fighter.name}</h3>
                            <div className="text-sm text-text2">
                              {fighter.record.wins}W-{fighter.record.losses}L-{fighter.record.draws}D • {fighter.elo} ELO
                            </div>
                          </div>
                          <FighterEvolution fighter={fighter} expanded={true} />
                        </div>
                      ) : null
                    })()}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user.fighters.map(fighter => (
                      <div 
                        key={fighter.id}
                        className="bg-surface2 border border-border p-4 cursor-pointer hover:border-accent/30 transition-colors"
                        onClick={() => setSelectedFighterId(fighter.id)}
                      >
                        <div className="text-center mb-4">
                          <div className="text-2xl mb-1">{fighter.emoji}</div>
                          <h3 className="font-pixel text-sm text-text1">{fighter.name}</h3>
                          <div className="text-xs text-text2">Evolution Level {fighter.evolution.evolutionLevel}</div>
                        </div>
                        <FighterEvolution fighter={fighter} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tournament System */}
            {currentSection === 'tournaments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-pixel text-2xl text-text1 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-accent" />
                    Tournaments
                  </h2>
                </div>

                {currentTournament ? (
                  <TournamentBracket 
                    tournament={currentTournament}
                    onStartMatch={handleTournamentMatch}
                    showControls={true}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 mx-auto mb-6 text-text2 opacity-50" />
                    <h3 className="font-pixel text-xl text-text1 mb-4">No Active Tournament</h3>
                    <p className="text-text2 mb-6 max-w-md mx-auto">
                      Start an 8-fighter tournament to compete for glory and prizes!
                    </p>
                    {user.fighters.length >= 3 ? (
                      <button
                        onClick={handleStartTournament}
                        className="px-6 py-3 bg-accent text-bg font-pixel hover:bg-accent/90 transition-colors"
                      >
                        Start Tournament
                      </button>
                    ) : (
                      <p className="text-text2">You need at least 3 fighters to start a tournament.</p>
                    )}
                  </div>
                )}

                {/* Tournament History */}
                {user.tournaments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-pixel text-lg text-text1">Tournament History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.tournaments.slice(0, 6).map(tournament => (
                        <div key={tournament.id} className="bg-surface2 border border-border p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-pixel text-sm text-text1">{tournament.name}</h4>
                            <div className={`px-2 py-1 text-xs ${
                              tournament.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                              tournament.status === 'in-progress' ? 'bg-yellow-400/20 text-yellow-400' :
                              'bg-surface1 text-text2'
                            }`}>
                              {tournament.status.toUpperCase()}
                            </div>
                          </div>
                          {tournament.winner && (
                            <div className="flex items-center gap-2 text-sm">
                              <Crown className="w-3 h-3 text-yellow-400" />
                              <span className="text-text1">{tournament.winner.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Achievement System */}
            {currentSection === 'achievements' && (
              <div className="space-y-6">
                <h2 className="font-pixel text-2xl text-text1 flex items-center gap-2">
                  <Award className="w-6 h-6 text-accent" />
                  Achievements
                </h2>
                <AchievementSystem 
                  achievements={user.achievements}
                  notifications={user.achievementNotifications}
                  onDismissNotification={dismissNotification}
                />
              </div>
            )}

            {/* Daily Rewards */}
            {currentSection === 'rewards' && (
              <div className="space-y-6">
                <h2 className="font-pixel text-2xl text-text1 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-accent" />
                  Daily Rewards
                </h2>
                <div className="max-w-4xl mx-auto">
                  <DailyRewards 
                    loginStreak={user.loginStreak}
                    onClaimReward={claimDailyReward}
                  />
                </div>
              </div>
            )}

            {/* Credits Dashboard */}
            {currentSection === 'credits' && (
              <div className="space-y-6">
                <h2 className="font-pixel text-2xl text-text1 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-accent" />
                  Credits & Wallet
                </h2>
                <CreditsDashboard 
                  user={user}
                  onConnectWallet={connectWallet}
                  onDisconnectWallet={disconnectWallet}
                  onPurchaseCredits={purchaseCredits}
                  onWithdrawCredits={withdrawCredits}
                  onClose={() => {}} // No close needed since it's a section
                />
              </div>
            )}

            {/* Rankings */}
            {currentSection === 'rankings' && (
              <RankingsSection fighters={user.fighters} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}