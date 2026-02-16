'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Crown, 
  Medal, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Flame as Fire,
  Star,
  Target,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Fighter } from '@/types'

interface LeaderboardEntry extends Fighter {
  rank: number
  previousRank?: number
  rankChange: 'up' | 'down' | 'same'
  points: number
  streak: { type: 'win' | 'loss', count: number }
  champion?: boolean
  fightsThisWeek: number
  earnings: number
}

interface EnhancedLeaderboardProps {
  fighters: Fighter[]
  timeframe?: 'weekly' | 'monthly' | 'allTime'
  onTimeframeChange?: (timeframe: string) => void
}

export default function EnhancedLeaderboard({ 
  fighters = [],
  timeframe = 'allTime',
  onTimeframeChange
}: EnhancedLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'elo' | 'winRate' | 'streak' | 'earnings'>('elo')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])

  // Transform fighter data into leaderboard entries
  useEffect(() => {
    const transformedData: LeaderboardEntry[] = fighters.map((fighter, index) => {
      const winRate = (fighter.record.wins / (fighter.record.wins + fighter.record.losses + fighter.record.draws)) * 100 || 0
      const isChampion = index === 0 && fighter.elo >= 2000
      
      return {
        ...fighter,
        rank: index + 1,
        previousRank: index + 1 + Math.floor(Math.random() * 3) - 1, // Mock previous rank
        rankChange: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'same',
        points: fighter.elo,
        streak: { 
          type: Math.random() > 0.6 ? 'win' : 'loss', 
          count: Math.floor(Math.random() * 8) + 1 
        },
        champion: isChampion,
        fightsThisWeek: Math.floor(Math.random() * 12) + 1,
        earnings: Math.floor(Math.random() * 50000) + 5000
      }
    })

    // Sort based on selected criteria
    const sorted = [...transformedData].sort((a, b) => {
      switch (sortBy) {
        case 'elo':
          return b.elo - a.elo
        case 'winRate': {
          const aWinRate = (a.record.wins / (a.record.wins + a.record.losses + a.record.draws)) * 100 || 0
          const bWinRate = (b.record.wins / (b.record.wins + b.record.losses + b.record.draws)) * 100 || 0
          return bWinRate - aWinRate
        }
        case 'streak':
          return b.streak.count - a.streak.count
        case 'earnings':
          return b.earnings - a.earnings
        default:
          return b.elo - a.elo
      }
    })

    // Apply class filter
    const filtered = filterClass === 'all' 
      ? sorted 
      : sorted.filter(fighter => fighter.class.toLowerCase() === filterClass.toLowerCase())

    // Update ranks after filtering and sorting
    const finalData = filtered.map((fighter, index) => ({
      ...fighter,
      rank: index + 1
    }))

    setLeaderboardData(finalData)
  }, [fighters, sortBy, filterClass])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-gold" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />
    return (
      <div className="w-5 h-5 rounded-full bg-border flex items-center justify-center">
        <span className="font-pixel text-xs text-text2">{rank}</span>
      </div>
    )
  }

  const getRankChangeIcon = (change: string) => {
    if (change === 'up') return <TrendingUp className="w-4 h-4 text-green" />
    if (change === 'down') return <TrendingDown className="w-4 h-4 text-red" />
    return <div className="w-4 h-4" />
  }

  const getWinRate = (record: Fighter['record']) => {
    const total = record.wins + record.losses + record.draws
    return total > 0 ? Math.round((record.wins / total) * 100) : 0
  }

  return (
    <div className="p-6 bg-surface rounded-lg border border-border">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-gold" />
            <h2 className="font-pixel text-xl text-accent">CHAMPIONSHIP LEADERBOARD</h2>
          </div>
          
          {/* Timeframe Toggle */}
          <div className="flex items-center gap-1 bg-bg border border-border rounded-lg p-1">
            {['weekly', 'monthly', 'allTime'].map((period) => (
              <button
                key={period}
                onClick={() => onTimeframeChange?.(period)}
                className={`px-3 py-1 font-pixel text-xs transition-colors rounded ${
                  timeframe === period
                    ? 'bg-accent text-white'
                    : 'text-text2 hover:text-text'
                }`}
              >
                {period === 'allTime' ? 'ALL TIME' : period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text2" />
            <span className="text-sm text-text2">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-bg border border-border rounded px-2 py-1 text-sm text-text"
            >
              <option value="elo">ELO Rating</option>
              <option value="winRate">Win Rate</option>
              <option value="streak">Current Streak</option>
              <option value="earnings">Earnings</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text2">Class:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-bg border border-border rounded px-2 py-1 text-sm text-text"
            >
              <option value="all">All Classes</option>
              <option value="lightweight">Lightweight</option>
              <option value="middleweight">Middleweight</option>
              <option value="heavyweight">Heavyweight</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-bg rounded-lg border border-border font-pixel text-xs text-text2">
          <div className="col-span-1">RANK</div>
          <div className="col-span-4">FIGHTER</div>
          <div className="col-span-2">RECORD</div>
          <div className="col-span-1">ELO</div>
          <div className="col-span-2">STREAK</div>
          <div className="col-span-2">EARNINGS</div>
        </div>

        {/* Leaderboard Entries */}
        <AnimatePresence>
          {leaderboardData.map((fighter, index) => (
            <motion.div
              key={fighter.id}
              className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg border transition-all cursor-pointer ${
                fighter.champion 
                  ? 'bg-accent/10 border-accent shadow-lg' 
                  : 'bg-surface border-border hover:border-text2'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center gap-2">
                {getRankIcon(fighter.rank)}
                {getRankChangeIcon(fighter.rankChange)}
              </div>

              {/* Fighter Info */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="text-2xl">{fighter.emoji}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-sm text-accent">
                      {fighter.name}
                    </span>
                    {fighter.champion && (
                      <Crown className="w-4 h-4 text-gold" />
                    )}
                    {fighter.streak.type === 'win' && fighter.streak.count >= 5 && (
                      <Fire className="w-4 h-4 text-red" />
                    )}
                  </div>
                  <div className="text-xs text-text2">
                    {fighter.owner} • {fighter.class}
                  </div>
                </div>
              </div>

              {/* Record */}
              <div className="col-span-2 flex flex-col justify-center">
                <div className="font-pixel text-sm text-text">
                  {fighter.record.wins}W-{fighter.record.losses}L-{fighter.record.draws}D
                </div>
                <div className="text-xs text-text2">
                  {getWinRate(fighter.record)}% win rate
                </div>
              </div>

              {/* ELO */}
              <div className="col-span-1 flex flex-col justify-center">
                <div className="font-pixel text-sm text-gold">
                  {fighter.elo}
                </div>
                <div className="flex items-center gap-1">
                  {fighter.rankChange === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-green" />
                  ) : fighter.rankChange === 'down' ? (
                    <TrendingDown className="w-3 h-3 text-red" />
                  ) : (
                    <div className="w-3 h-3" />
                  )}
                </div>
              </div>

              {/* Streak */}
              <div className="col-span-2 flex items-center gap-2">
                <div className={`px-2 py-1 rounded font-pixel text-xs ${
                  fighter.streak.type === 'win' 
                    ? 'bg-green text-white' 
                    : 'bg-red text-white'
                }`}>
                  {fighter.streak.count}{fighter.streak.type === 'win' ? 'W' : 'L'}
                </div>
                {fighter.streak.type === 'win' && fighter.streak.count >= 5 && (
                  <Zap className="w-4 h-4 text-yellow-400" />
                )}
              </div>

              {/* Earnings */}
              <div className="col-span-2 flex flex-col justify-center">
                <div className="font-pixel text-sm text-green">
                  ${fighter.earnings.toLocaleString()}
                </div>
                <div className="text-xs text-text2">
                  {fighter.fightsThisWeek} fights this week
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {leaderboardData.length === 0 && (
          <div className="text-center py-8 text-text2">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>No fighters found matching the current filters.</div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="font-pixel text-lg text-accent">
              {leaderboardData.length}
            </div>
            <div className="text-xs text-text2">Total Fighters</div>
          </div>
          <div>
            <div className="font-pixel text-lg text-gold">
              {leaderboardData.reduce((sum, f) => sum + f.fightsThisWeek, 0)}
            </div>
            <div className="text-xs text-text2">Fights This Week</div>
          </div>
          <div>
            <div className="font-pixel text-lg text-green">
              ${leaderboardData.reduce((sum, f) => sum + f.earnings, 0).toLocaleString()}
            </div>
            <div className="text-xs text-text2">Total Earnings</div>
          </div>
          <div>
            <div className="font-pixel text-lg text-text">
              {Math.round(leaderboardData.reduce((sum, f) => sum + getWinRate(f.record), 0) / leaderboardData.length)}%
            </div>
            <div className="text-xs text-text2">Avg Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}