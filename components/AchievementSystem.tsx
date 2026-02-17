'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Achievement, AchievementNotification } from '@/types'
import { AchievementEngine } from '@/lib/achievement-engine'
import { 
  Award, 
  Trophy, 
  Star, 
  Crown, 
  Lock, 
  CheckCircle,
  Gift,
  TrendingUp,
  Filter,
  X
} from 'lucide-react'
import { useState } from 'react'

interface AchievementSystemProps {
  achievements: Achievement[]
  notifications: AchievementNotification[]
  onDismissNotification?: (notificationId: string) => void
}

export default function AchievementSystem({ 
  achievements, 
  notifications,
  onDismissNotification 
}: AchievementSystemProps) {
  const [selectedType, setSelectedType] = useState<Achievement['type'] | 'all'>('all')
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false)
  
  const stats = AchievementEngine.getAchievementStats(achievements)
  const totalRewards = AchievementEngine.getTotalRewardsEarned(achievements)

  const filteredAchievements = achievements.filter(achievement => {
    if (achievement.hidden && !achievement.unlocked) return false
    if (selectedType !== 'all' && achievement.type !== selectedType) return false
    if (showOnlyUnlocked && !achievement.unlocked) return false
    return true
  })

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
      case 'rare': return 'text-blue-400 border-blue-400/30 bg-blue-400/10'
      case 'epic': return 'text-purple-400 border-purple-400/30 bg-purple-400/10'
      case 'legendary': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
    }
  }

  const getRarityIcon = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return <Award className="w-3 h-3" />
      case 'rare': return <Star className="w-3 h-3" />
      case 'epic': return <Trophy className="w-3 h-3" />
      case 'legendary': return <Crown className="w-3 h-3" />
      default: return <Award className="w-3 h-3" />
    }
  }

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const progress = AchievementEngine.getProgressPercentage(achievement)
    const isComplete = achievement.unlocked

    return (
      <motion.div
        className={`
          border p-4 transition-all relative overflow-hidden
          ${isComplete 
            ? `${getRarityColor(achievement.rarity)} shadow-lg` 
            : 'border-surface2 bg-surface2 text-text2'
          }
          ${!isComplete ? 'grayscale opacity-70' : ''}
        `}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Unlock Animation */}
        {isComplete && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${!isComplete ? 'grayscale' : ''}`}>
              {achievement.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-pixel text-sm ${isComplete ? 'text-text1' : 'text-text2'}`}>
                  {achievement.name}
                </h3>
                {isComplete && <CheckCircle className="w-3 h-3 text-green-400" />}
                {!isComplete && achievement.hidden && <Lock className="w-3 h-3 text-text2" />}
              </div>
              <p className="text-xs text-text2 leading-relaxed">
                {achievement.description}
              </p>
            </div>
          </div>
          
          <div className={`
            flex items-center gap-1 px-2 py-1 text-xs font-pixel
            ${getRarityColor(achievement.rarity)}
          `}>
            {getRarityIcon(achievement.rarity)}
            <span className="capitalize">{achievement.rarity}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {achievement.maxProgress > 1 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text2">Progress</span>
              <span className="font-ui text-text1">
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
            <div className="w-full bg-surface1 h-2">
              <motion.div
                className={`h-2 ${isComplete ? 'bg-accent' : 'bg-text2'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Reward */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            <Gift className="w-3 h-3" />
            <span className="text-accent font-ui">+{achievement.rewardCredits}</span>
            <span className="text-text2">credits</span>
          </div>
          
          {isComplete && achievement.unlockedAt && (
            <div className="text-xs text-text2">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const NotificationToast = ({ notification }: { notification: AchievementNotification }) => (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className={`
        fixed top-4 right-4 z-50 max-w-sm p-4 border shadow-lg
        ${getRarityColor(notification.achievement.rarity)}
        backdrop-blur-sm
      `}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{notification.achievement.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="font-pixel text-sm text-text1">Achievement Unlocked!</span>
          </div>
          <h3 className="font-pixel text-sm text-text1 mb-1">
            {notification.achievement.name}
          </h3>
          <p className="text-xs text-text2 mb-2">
            {notification.achievement.description}
          </p>
          <div className="flex items-center gap-1 text-xs">
            <Gift className="w-3 h-3 text-accent" />
            <span className="text-accent font-ui">+{notification.achievement.rewardCredits} credits</span>
          </div>
        </div>
        
        {onDismissNotification && (
          <button
            onClick={() => onDismissNotification(notification.id)}
            className="text-text2 hover:text-text1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Achievement Notifications */}
      <AnimatePresence>
        {notifications.filter(n => !n.seen).map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>

      {/* Stats Overview */}
      <div className="bg-surface2 border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="font-pixel text-lg text-text1">Achievement Progress</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-ui text-accent mb-1">
              {stats.unlocked}/{stats.total}
            </div>
            <div className="text-xs text-text2">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-ui text-accent mb-1">
              {stats.percentage}%
            </div>
            <div className="text-xs text-text2">Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-ui text-accent mb-1">
              {totalRewards}
            </div>
            <div className="text-xs text-text2">Credits Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-ui text-accent mb-1">
              {Object.values(stats.byRarity).reduce((acc, rarity) => acc + rarity.unlocked, 0)}
            </div>
            <div className="text-xs text-text2">Total Unlocked</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface1 h-3">
          <motion.div
            className="h-3 bg-gradient-to-r from-accent/70 to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${stats.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Rarity Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(stats.byRarity).map(([rarity, data]) => (
          <div key={rarity} className={`border p-3 ${getRarityColor(rarity as any)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getRarityIcon(rarity as any)}
              <span className="font-pixel text-xs capitalize">{rarity}</span>
            </div>
            <div className="font-ui text-lg">{data.unlocked}/{data.total}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text2" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-surface2 border border-border rounded px-2 py-1 text-sm text-text1"
          >
            <option value="all">All Types</option>
            <option value="fight">Fight</option>
            <option value="betting">Betting</option>
            <option value="collection">Collection</option>
            <option value="social">Social</option>
            <option value="streak">Streak</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyUnlocked}
            onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
            className="accent-accent"
          />
          Show only unlocked
        </label>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-8 text-text2">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No achievements match your current filter.</p>
        </div>
      )}
    </div>
  )
}