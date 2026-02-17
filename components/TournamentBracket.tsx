'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { TournamentBracket, TournamentMatch, Fighter } from '@/types'
import { TournamentEngine } from '@/lib/tournament-engine'
import { 
  Trophy, 
  Crown, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  Users,
  Award,
  Calendar,
  Target
} from 'lucide-react'

interface TournamentBracketProps {
  tournament: TournamentBracket
  onStartMatch?: (match: TournamentMatch) => void
  showControls?: boolean
}

export default function TournamentBracket({ 
  tournament, 
  onStartMatch,
  showControls = false 
}: TournamentBracketProps) {
  const progress = TournamentEngine.getTournamentProgress(tournament)
  const upcomingMatch = TournamentEngine.getUpcomingMatch(tournament)
  const rewards = TournamentEngine.generateTournamentRewards(tournament)

  const getMatchStatusColor = (status: TournamentMatch['status']) => {
    switch (status) {
      case 'completed': return 'border-green-400 bg-green-400/10'
      case 'in-progress': return 'border-yellow-400 bg-yellow-400/10'
      case 'pending': return 'border-surface2 bg-surface2'
      default: return 'border-surface2 bg-surface2'
    }
  }

  const getMatchStatusIcon = (status: TournamentMatch['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'in-progress': return <PlayCircle className="w-3 h-3 text-yellow-400" />
      case 'pending': return <Clock className="w-3 h-3 text-text2" />
      default: return null
    }
  }

  const FighterCard = ({ 
    fighter, 
    isWinner, 
    isLoser 
  }: { 
    fighter: Fighter
    isWinner?: boolean
    isLoser?: boolean 
  }) => (
    <div className={`
      flex items-center gap-2 p-2 rounded-lg transition-all
      ${isWinner ? 'bg-green-400/20 border border-green-400/30' : ''}
      ${isLoser ? 'bg-red-400/10 border border-red-400/20 opacity-60' : ''}
      ${!isWinner && !isLoser ? 'bg-surface1 border border-border' : ''}
    `}>
      <div className="text-lg">{fighter.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-pixel text-xs text-text1 truncate">{fighter.name}</div>
        <div className="text-xs text-text2">{fighter.elo} ELO</div>
      </div>
      {isWinner && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
    </div>
  )

  const MatchCard = ({ match }: { match: TournamentMatch }) => (
    <motion.div
      className={`border rounded-lg p-3 space-y-2 ${getMatchStatusColor(match.status)}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {getMatchStatusIcon(match.status)}
          <span className="font-pixel text-xs text-text2">
            {TournamentEngine.getTournamentRoundName(match.round)}
          </span>
        </div>
        {match.result && (
          <div className="text-xs text-accent font-ui">
            {match.result.method} R{match.result.round}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <FighterCard 
          fighter={match.fighter1}
          isWinner={match.winner?.id === match.fighter1.id}
          isLoser={match.winner?.id === match.fighter2.id}
        />
        <FighterCard 
          fighter={match.fighter2}
          isWinner={match.winner?.id === match.fighter2.id}
          isLoser={match.winner?.id === match.fighter1.id}
        />
      </div>

      {match.status === 'pending' && onStartMatch && showControls && (
        <button
          onClick={() => onStartMatch(match)}
          className="w-full py-1 bg-accent text-bg rounded font-pixel text-xs hover:bg-accent/90 transition-colors"
        >
          Start Fight
        </button>
      )}
    </motion.div>
  )

  const round1Matches = tournament.matches.filter(m => m.round === 1)
  const round2Matches = tournament.matches.filter(m => m.round === 2)
  const round3Matches = tournament.matches.filter(m => m.round === 3)

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <div className="bg-surface2 border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <h2 className="font-pixel text-lg text-text1">{tournament.name}</h2>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-pixel ${
            tournament.status === 'completed' ? 'bg-green-400/20 text-green-400' :
            tournament.status === 'in-progress' ? 'bg-yellow-400/20 text-yellow-400' :
            'bg-surface1 text-text2'
          }`}>
            {tournament.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3 h-3 text-text2" />
              <span className="text-xs text-text2">Fighters</span>
            </div>
            <div className="font-ui text-lg text-accent">8</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-3 h-3 text-text2" />
              <span className="text-xs text-text2">Progress</span>
            </div>
            <div className="font-ui text-lg text-accent">{Math.round(progress.percentage)}%</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-3 h-3 text-text2" />
              <span className="text-xs text-text2">Prize</span>
            </div>
            <div className="font-ui text-lg text-accent">{tournament.prize}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-text2" />
              <span className="text-xs text-text2">Round</span>
            </div>
            <div className="font-ui text-lg text-accent">{progress.currentRound}/3</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-surface1 rounded-full h-2">
            <motion.div
              className="h-2 bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Tournament Winner */}
      <AnimatePresence>
        {tournament.winner && tournament.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h3 className="font-pixel text-xl text-text1">CHAMPION</h3>
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">{tournament.winner.emoji}</div>
              <div className="font-pixel text-lg text-accent">{tournament.winner.name}</div>
              <div className="text-sm text-text2">Winner of {tournament.name}</div>
              <div className="font-ui text-accent mt-2">+{rewards.winner} credits</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Match Highlight */}
      {upcomingMatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/10 border border-accent/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-4 h-4 text-accent" />
            <span className="font-pixel text-sm text-text1">NEXT UP</span>
            <span className="text-xs text-text2">
              {TournamentEngine.getTournamentRoundName(upcomingMatch.round)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FighterCard fighter={upcomingMatch.fighter1} />
            <FighterCard fighter={upcomingMatch.fighter2} />
          </div>
          {onStartMatch && showControls && (
            <button
              onClick={() => onStartMatch(upcomingMatch)}
              className="w-full mt-3 py-2 bg-accent text-bg rounded font-pixel text-sm hover:bg-accent/90 transition-colors"
            >
              Start Championship Fight
            </button>
          )}
        </motion.div>
      )}

      {/* Tournament Bracket */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Round 1 - Quarterfinals */}
        <div className="space-y-3">
          <h3 className="font-pixel text-sm text-text1 text-center">
            Quarterfinals
          </h3>
          <div className="space-y-3">
            {round1Matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        {/* Round 2 - Semifinals */}
        <div className="space-y-3">
          <h3 className="font-pixel text-sm text-text1 text-center">
            Semifinals
          </h3>
          <div className="space-y-3">
            {round2Matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        {/* Round 3 - Final */}
        <div className="space-y-3">
          <h3 className="font-pixel text-sm text-text1 text-center">
            Championship Final
          </h3>
          <div className="space-y-3">
            {round3Matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      </div>

      {/* Prize Breakdown */}
      <div className="bg-surface2 border border-border rounded-lg p-4">
        <h3 className="font-pixel text-sm text-text1 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          Prize Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
          <div>
            <div className="text-text2 mb-1">Champion</div>
            <div className="font-ui text-accent">{rewards.winner}</div>
          </div>
          <div>
            <div className="text-text2 mb-1">Finalist</div>
            <div className="font-ui text-accent">{rewards.finalist}</div>
          </div>
          <div>
            <div className="text-text2 mb-1">Semi-Final</div>
            <div className="font-ui text-accent">{Math.floor(rewards.semifinalists / 2)}</div>
          </div>
          <div>
            <div className="text-text2 mb-1">Quarter-Final</div>
            <div className="font-ui text-accent">{Math.floor(rewards.quarterfinalists / 4)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}