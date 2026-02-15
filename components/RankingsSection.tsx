'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, TrendingUp, TrendingDown, Medal } from 'lucide-react'

interface RankingFighter {
  rank: number
  name: string
  emoji: string
  owner: string
  record: { wins: number; losses: number; draws: number }
  elo: number
  streak: { type: 'win' | 'loss'; count: number }
  champion?: boolean
  isUser?: boolean
}

const rankings: RankingFighter[] = [
  {
    rank: 1,
    name: 'TITAN-9',
    emoji: '👑',
    owner: 'DarkMatter_Labs',
    record: { wins: 22, losses: 1, draws: 0 },
    elo: 2105,
    streak: { type: 'win', count: 12 },
    champion: true
  },
  {
    rank: 2,
    name: 'IRONCLAD-7',
    emoji: '🤖',
    owner: 'You',
    record: { wins: 14, losses: 2, draws: 0 },
    elo: 1847,
    streak: { type: 'win', count: 5 },
    isUser: true
  },
  {
    rank: 3,
    name: 'APEX-NULL',
    emoji: '🔥',
    owner: 'ZeroDay_AI',
    record: { wins: 18, losses: 5, draws: 0 },
    elo: 1812,
    streak: { type: 'win', count: 3 }
  },
  {
    rank: 4,
    name: 'NEXUS-PRIME',
    emoji: '⚡',
    owner: 'SynthCorp',
    record: { wins: 11, losses: 4, draws: 0 },
    elo: 1723,
    streak: { type: 'loss', count: 1 }
  },
  {
    rank: 5,
    name: 'VIPER-MK3',
    emoji: '🐍',
    owner: 'RedShift_Dev',
    record: { wins: 15, losses: 6, draws: 0 },
    elo: 1701,
    streak: { type: 'win', count: 2 }
  },
  {
    rank: 6,
    name: 'PHANTOM-X',
    emoji: '👻',
    owner: 'GhostNet',
    record: { wins: 13, losses: 5, draws: 1 },
    elo: 1689,
    streak: { type: 'win', count: 1 }
  },
  {
    rank: 7,
    name: 'CRUSHER-AI',
    emoji: '💥',
    owner: 'IronForge',
    record: { wins: 10, losses: 4, draws: 0 },
    elo: 1665,
    streak: { type: 'loss', count: 2 }
  },
  {
    rank: 8,
    name: 'VOLT-X',
    emoji: '⚡',
    owner: 'You',
    record: { wins: 9, losses: 3, draws: 0 },
    elo: 1654,
    streak: { type: 'win', count: 4 },
    isUser: true
  },
  {
    rank: 9,
    name: 'STORM-BYTE',
    emoji: '🌩️',
    owner: 'DataPunch',
    record: { wins: 8, losses: 3, draws: 0 },
    elo: 1632,
    streak: { type: 'win', count: 1 }
  },
  {
    rank: 10,
    name: 'GHOST-SHELL',
    emoji: '👻',
    owner: 'You',
    record: { wins: 6, losses: 1, draws: 0 },
    elo: 1580,
    streak: { type: 'win', count: 3 },
    isUser: true
  }
]

const divisions = ['All', 'Heavyweight', 'Middleweight', 'Lightweight']

interface RankingsSectionProps {
  fighters: any[]
}

export default function RankingsSection({ fighters }: RankingsSectionProps) {
  const [selectedDivision, setSelectedDivision] = useState('All')
  const [sortBy, setSortBy] = useState<'rank' | 'elo' | 'wins'>('rank')

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-gold'
    if (rank <= 3) return 'text-text'
    if (rank <= 5) return 'text-accent2'
    return 'text-text2'
  }

  const getRankBadge = (rank: number, champion?: boolean) => {
    if (champion) return <Crown className="w-5 h-5 text-gold" />
    if (rank <= 3) return <Medal className="w-4 h-4 text-gold" />
    return null
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-pixel text-2xl text-accent mb-2">GLOBAL RANKINGS</h1>
        <p className="text-text2">Heavyweight Division • Season 1</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Division Filter */}
        <div className="flex gap-2">
          {divisions.map((division) => (
            <button
              key={division}
              onClick={() => setSelectedDivision(division)}
              className={`
                px-4 py-2 text-sm font-semibold rounded transition-all duration-200
                ${selectedDivision === division
                  ? 'bg-accent text-white'
                  : 'bg-surface2 border border-border text-text2 hover:text-accent hover:border-accent'
                }
              `}
            >
              {division}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          {[
            { key: 'rank', label: 'Rank' },
            { key: 'elo', label: 'ELO' },
            { key: 'wins', label: 'Wins' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as any)}
              className={`
                px-3 py-2 text-xs font-semibold rounded transition-all duration-200
                ${sortBy === key
                  ? 'bg-gold/20 text-gold'
                  : 'bg-surface border border-border text-text2 hover:text-gold hover:border-gold/50'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Rankings Table */}
      <motion.div
        className="bg-surface border border-border rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 p-4 border-b border-border bg-surface2 text-sm font-pixel text-text2">
          <div>RANK</div>
          <div>FIGHTER</div>
          <div>OWNER</div>
          <div>RECORD</div>
          <div>ELO</div>
          <div>STREAK</div>
          <div>STATUS</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {rankings.map((fighter, index) => (
            <motion.div
              key={fighter.name}
              className={`
                grid grid-cols-7 gap-4 p-4 items-center hover:bg-surface2/50 transition-colors
                ${fighter.isUser ? 'bg-accent/5 border-l-4 border-l-accent' : ''}
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Rank */}
              <div className="flex items-center gap-2">
                <span className={`font-pixel text-lg ${getRankColor(fighter.rank)}`}>
                  #{fighter.rank}
                </span>
                {getRankBadge(fighter.rank, fighter.champion)}
              </div>

              {/* Fighter */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{fighter.emoji}</span>
                <div>
                  <div className="font-bold text-text">{fighter.name}</div>
                  {fighter.champion && (
                    <div className="text-xs text-gold font-pixel">CHAMPION</div>
                  )}
                </div>
              </div>

              {/* Owner */}
              <div className={`text-sm ${fighter.isUser ? 'text-accent font-semibold' : 'text-text2'}`}>
                {fighter.owner}
              </div>

              {/* Record */}
              <div className="font-mono text-sm">
                <span className="text-green">{fighter.record.wins}</span>
                <span className="text-text2">-</span>
                <span className="text-red">{fighter.record.losses}</span>
                <span className="text-text2">-</span>
                <span className="text-text2">{fighter.record.draws}</span>
              </div>

              {/* ELO */}
              <div className="font-bold text-gold">{fighter.elo}</div>

              {/* Streak */}
              <div className="flex items-center gap-1">
                {fighter.streak.type === 'win' ? (
                  <TrendingUp className="w-4 h-4 text-green" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red" />
                )}
                <span className={`font-semibold ${fighter.streak.type === 'win' ? 'text-green' : 'text-red'}`}>
                  {fighter.streak.type === 'win' ? 'W' : 'L'}{fighter.streak.count}
                </span>
              </div>

              {/* Status */}
              <div>
                <span className="bg-green/20 text-green px-2 py-1 text-xs font-pixel rounded">
                  ACTIVE
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Division Info */}
      <motion.div
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-surface border border-border rounded-lg p-6 text-center">
          <div className="font-pixel text-lg text-gold mb-2">156</div>
          <div className="text-text2">Active Fighters</div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-6 text-center">
          <div className="font-pixel text-lg text-green mb-2">2,847</div>
          <div className="text-text2">Total Fights</div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-6 text-center">
          <div className="font-pixel text-lg text-accent mb-2">$2.4M</div>
          <div className="text-text2">Prize Pool</div>
        </div>
      </motion.div>

      {/* Championship Info */}
      <motion.div
        className="mt-8 bg-surface border border-border rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-6 h-6 text-gold" />
          <h3 className="font-pixel text-lg text-gold">CHAMPIONSHIP BELT</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-text2 mb-2">Current Champion</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">👑</span>
              <div>
                <div className="font-bold text-text">TITAN-9</div>
                <div className="text-text2 text-sm">Defended 3 times</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-text2 mb-2">Next Title Fight</div>
            <div className="text-text">TITAN-9 vs IRONCLAD-7</div>
            <div className="text-text2 text-sm">Scheduled: Next Championship Event</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}