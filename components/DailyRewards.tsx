'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LoginStreak, DailyReward } from '@/types'
import { DailyRewardsEngine } from '@/lib/daily-rewards-engine'
import { 
  Calendar, 
  Gift, 
  Clock, 
  TrendingUp, 
  Award, 
  Flame,
  Star,
  CheckCircle,
  Lock,
  Zap,
  Target,
  Trophy
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface DailyRewardsProps {
  loginStreak: LoginStreak
  onClaimReward?: (reward: DailyReward) => void
}

export default function DailyRewards({ loginStreak, onClaimReward }: DailyRewardsProps) {
  const [timeUntilNext, setTimeUntilNext] = useState(DailyRewardsEngine.getTimeUntilNextReward())
  const [canClaim, setCanClaim] = useState(DailyRewardsEngine.canClaimReward(loginStreak))
  
  const progress = DailyRewardsEngine.getWeeklyProgress(loginStreak.currentStreak)
  const bonus = DailyRewardsEngine.getStreakBonus(loginStreak.currentStreak)
  const stats = DailyRewardsEngine.getStreakStats(loginStreak)
  const message = DailyRewardsEngine.generateMotivationalMessage(loginStreak.currentStreak)
  const specialEvents = DailyRewardsEngine.getSpecialEvents()
  const activeEvents = specialEvents.filter(e => e.active)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilNext(DailyRewardsEngine.getTimeUntilNextReward())
      setCanClaim(DailyRewardsEngine.canClaimReward(loginStreak))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [loginStreak])

  const handleClaimReward = () => {
    if (!canClaim || !onClaimReward) return
    
    const result = DailyRewardsEngine.processLogin(loginStreak)
    if (result.rewardClaimed) {
      onClaimReward(result.rewardClaimed)
    }
  }

  const DayCard = ({ 
    reward, 
    index, 
    isCurrent 
  }: { 
    reward: DailyReward
    index: number
    isCurrent: boolean 
  }) => {
    const isUnlocked = index < loginStreak.currentStreak || (isCurrent && canClaim)
    const isClaimed = index < loginStreak.currentStreak
    
    return (
      <motion.div
        className={`
          relative border p-3 text-center transition-all
          ${isCurrent && canClaim 
            ? 'border-accent bg-accent/10 shadow-lg' 
            : isUnlocked 
              ? 'border-green-400/30 bg-green-400/10' 
              : 'border-surface2 bg-surface2 opacity-50'
          }
        `}
        whileHover={isUnlocked ? { scale: 1.05 } : {}}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Glow effect for current day */}
        {isCurrent && canClaim && (
          <motion.div
            className="absolute inset-0 bg-accent/20"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Day number */}
        <div className="relative mb-2">
          <div className={`
            w-8 h-8 mx-auto flex items-center justify-center font-pixel text-sm
            ${isClaimed 
              ? 'bg-green-400 text-bg' 
              : isCurrent && canClaim 
                ? 'bg-accent text-bg animate-pulse' 
                : 'bg-surface1 text-text2'
            }
          `}>
            {isClaimed ? <CheckCircle className="w-4 h-4" /> : reward.day}
          </div>
          
          {!isUnlocked && (
            <Lock className="absolute -top-1 -right-1 w-3 h-3 text-text2" />
          )}
        </div>

        {/* Credits */}
        <div className={`font-ui text-lg mb-1 ${isUnlocked ? 'text-accent' : 'text-text2'}`}>
          {reward.credits}
        </div>
        <div className="text-xs text-text2 mb-2">credits</div>

        {/* Bonus */}
        {reward.bonus && (
          <div className="text-xs text-yellow-400 font-pixel">
            +{reward.bonus}
          </div>
        )}

        {/* Claim button for current day */}
        {isCurrent && canClaim && onClaimReward && (
          <motion.button
            onClick={handleClaimReward}
            className="absolute inset-0 bg-accent text-bg font-pixel text-sm opacity-0 hover:opacity-90 transition-opacity flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            CLAIM
          </motion.button>
        )}
      </motion.div>
    )
  }

  const currentDayIndex = (loginStreak.currentStreak % 7)

  return (
    <div className="space-y-6">
      {/* Header with streak info */}
      <div className="bg-surface2 border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <h2 className="font-pixel text-lg text-text1">Daily Login Rewards</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="font-pixel text-sm text-text1">{loginStreak.currentStreak} Day Streak</span>
            </div>
            {loginStreak.longestStreak > loginStreak.currentStreak && (
              <div className="flex items-center gap-1 text-text2">
                <Trophy className="w-3 h-3" />
                <span className="text-xs">Best: {loginStreak.longestStreak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for current week */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-text2">Week {progress.currentWeek} Progress</span>
            <span className="text-text1">{progress.dayInWeek}/7 days</span>
          </div>
          <div className="w-full bg-surface1 h-2">
            <motion.div
              className="h-2 bg-gradient-to-r from-accent/70 to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.dayInWeek / 7) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-ui text-accent">{stats.creditsEarned}</div>
            <div className="text-xs text-text2">Credits Earned</div>
          </div>
          <div>
            <div className="text-lg font-ui text-accent">{stats.averagePerWeek}</div>
            <div className="text-xs text-text2">Days/Week</div>
          </div>
          <div>
            <div className="text-lg font-ui text-accent">{stats.streakPercentile}%</div>
            <div className="text-xs text-text2">Percentile</div>
          </div>
          <div>
            <div className="text-lg font-ui text-accent">{loginStreak.nextRewardCredits}</div>
            <div className="text-xs text-text2">Next Reward</div>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      <motion.div
        className="bg-accent/10 border border-accent/30 p-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-accent font-pixel text-sm mb-2">Daily Motivation</div>
        <p className="text-text1 text-sm" dangerouslySetInnerHTML={{ __html: message.replace(/'/g, '&apos;') }} />
      </motion.div>

      {/* Active special events */}
      {activeEvents.length > 0 && (
        <div className="space-y-2">
          {activeEvents.map(event => (
            <motion.div
              key={event.id}
              className="bg-yellow-400/10 border border-yellow-400/30 p-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-pixel text-sm text-text1">{event.name}</span>
                <div className="px-2 py-0.5 bg-yellow-400/20 text-xs font-ui text-yellow-400">
                  {event.multiplier}x
                </div>
              </div>
              <p className="text-xs text-text2">{event.description}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Weekly calendar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-text1 flex items-center gap-2">
            <Gift className="w-4 h-4 text-accent" />
            This Week&apos;s Rewards
          </h3>
          
          {!canClaim && (
            <div className="flex items-center gap-1 text-sm text-text2">
              <Clock className="w-3 h-3" />
              <span>
                Next reward in {timeUntilNext.hours}h {timeUntilNext.minutes}m
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {loginStreak.rewards.map((reward, index) => (
            <DayCard
              key={reward.day}
              reward={reward}
              index={index}
              isCurrent={index === currentDayIndex && canClaim}
            />
          ))}
        </div>
      </div>

      {/* Streak bonuses */}
      {bonus.multiplier > 1 && (
        <div className="bg-purple-400/10 border border-purple-400/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-purple-400" />
            <h3 className="font-pixel text-sm text-text1">Streak Bonus Active!</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-ui text-purple-400">{bonus.multiplier}x</div>
              <div className="text-xs text-text2">Multiplier</div>
            </div>
            <div>
              <div className="text-lg font-ui text-purple-400">+{bonus.bonusCredits}</div>
              <div className="text-xs text-text2">Bonus Credits</div>
            </div>
            {bonus.specialReward && (
              <div>
                <div className="text-lg font-ui text-purple-400">🏅</div>
                <div className="text-xs text-text2">{bonus.specialReward}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming milestones */}
      <div className="bg-surface2 border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-accent" />
          <h3 className="font-pixel text-sm text-text1">Upcoming Milestones</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          {loginStreak.currentStreak < 7 && (
            <div className="flex justify-between items-center">
              <span className="text-text2">First Week Bonus</span>
              <span className="text-accent font-ui">{7 - loginStreak.currentStreak} days</span>
            </div>
          )}
          {loginStreak.currentStreak < 30 && (
            <div className="flex justify-between items-center">
              <span className="text-text2">Monthly Champion</span>
              <span className="text-accent font-ui">{30 - loginStreak.currentStreak} days</span>
            </div>
          )}
          {loginStreak.currentStreak < 100 && (
            <div className="flex justify-between items-center">
              <span className="text-text2">Legend Status</span>
              <span className="text-accent font-ui">{100 - loginStreak.currentStreak} days</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}