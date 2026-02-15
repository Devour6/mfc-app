import { Fighter, TournamentBracket, TournamentMatch, FightState } from '@/types'

export class TournamentEngine {
  
  static createTournament(
    fighters: Fighter[], 
    name: string = 'MFC Championship',
    prize: number = 1000
  ): TournamentBracket {
    if (fighters.length !== 8) {
      throw new Error('Tournament requires exactly 8 fighters')
    }

    // Seed fighters by ELO rating (highest to lowest)
    const seededFighters = [...fighters].sort((a, b) => b.elo - a.elo)
    
    // Create bracket pairings (1v8, 2v7, 3v6, 4v5)
    const matches: TournamentMatch[] = []
    const bracketPairings = [
      [seededFighters[0], seededFighters[7]], // 1 vs 8
      [seededFighters[1], seededFighters[6]], // 2 vs 7
      [seededFighters[2], seededFighters[5]], // 3 vs 6
      [seededFighters[3], seededFighters[4]]  // 4 vs 5
    ]

    // Create first round matches
    bracketPairings.forEach((pairing, index) => {
      matches.push({
        id: `round1-match${index + 1}`,
        round: 1,
        fighter1: pairing[0],
        fighter2: pairing[1],
        status: 'pending',
        scheduledTime: Date.now() + (index * 30000) // Stagger matches by 30 seconds
      })
    })

    return {
      id: `tournament-${Date.now()}`,
      name,
      status: 'upcoming',
      fighters: seededFighters,
      matches,
      prize,
      startDate: Date.now()
    }
  }

  static advanceTournament(
    tournament: TournamentBracket,
    completedMatch: TournamentMatch,
    fightResult: FightState['result']
  ): TournamentBracket {
    const updatedMatches = [...tournament.matches]
    const matchIndex = updatedMatches.findIndex(m => m.id === completedMatch.id)
    
    if (matchIndex === -1) {
      throw new Error('Match not found in tournament')
    }

    // Update the completed match
    updatedMatches[matchIndex] = {
      ...completedMatch,
      result: fightResult,
      status: 'completed',
      winner: fightResult?.winner === completedMatch.fighter1.id ? 
        completedMatch.fighter1 : completedMatch.fighter2
    }

    // Check if round is complete and create next round matches
    const currentRound = completedMatch.round
    const roundMatches = updatedMatches.filter(m => m.round === currentRound)
    const completedRoundMatches = roundMatches.filter(m => m.status === 'completed')

    if (completedRoundMatches.length === roundMatches.length) {
      // Round is complete, create next round
      const nextRoundMatches = this.createNextRoundMatches(completedRoundMatches)
      updatedMatches.push(...nextRoundMatches)
    }

    // Check if tournament is complete
    const finalMatch = updatedMatches.find(m => m.round === 3 && m.status === 'completed')
    let status = tournament.status
    let winner = tournament.winner
    let endDate = tournament.endDate

    if (finalMatch && finalMatch.winner) {
      status = 'completed'
      winner = finalMatch.winner
      endDate = Date.now()
    } else if (updatedMatches.some(m => m.status === 'in-progress')) {
      status = 'in-progress'
    }

    return {
      ...tournament,
      matches: updatedMatches,
      status,
      winner,
      endDate
    }
  }

  private static createNextRoundMatches(completedMatches: TournamentMatch[]): TournamentMatch[] {
    const winners = completedMatches
      .filter(m => m.winner)
      .sort((a, b) => parseInt(a.id.split('match')[1]) - parseInt(b.id.split('match')[1]))
      .map(m => m.winner!)

    const nextRound = completedMatches[0].round + 1
    const matches: TournamentMatch[] = []

    if (nextRound === 2) {
      // Semifinals: pair winners from round 1
      matches.push({
        id: `round2-match1`,
        round: 2,
        fighter1: winners[0],
        fighter2: winners[1],
        status: 'pending',
        scheduledTime: Date.now() + 60000 // 1 minute delay
      })

      matches.push({
        id: `round2-match2`,
        round: 2,
        fighter1: winners[2],
        fighter2: winners[3],
        status: 'pending',
        scheduledTime: Date.now() + 90000 // 1.5 minute delay
      })
    } else if (nextRound === 3 && winners.length === 2) {
      // Final: last two winners
      matches.push({
        id: `round3-match1`,
        round: 3,
        fighter1: winners[0],
        fighter2: winners[1],
        status: 'pending',
        scheduledTime: Date.now() + 120000 // 2 minute delay
      })
    }

    return matches
  }

  static getTournamentRoundName(round: number): string {
    switch (round) {
      case 1: return 'Quarterfinals'
      case 2: return 'Semifinals'
      case 3: return 'Championship Final'
      default: return `Round ${round}`
    }
  }

  static getUpcomingMatch(tournament: TournamentBracket): TournamentMatch | null {
    return tournament.matches
      .filter(m => m.status === 'pending')
      .sort((a, b) => a.scheduledTime - b.scheduledTime)[0] || null
  }

  static getTournamentProgress(tournament: TournamentBracket): {
    totalMatches: number
    completedMatches: number
    percentage: number
    currentRound: number
  } {
    const totalMatches = tournament.matches.length
    const completedMatches = tournament.matches.filter(m => m.status === 'completed').length
    const percentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
    const currentRound = this.getCurrentRound(tournament)

    return {
      totalMatches,
      completedMatches,
      percentage,
      currentRound
    }
  }

  private static getCurrentRound(tournament: TournamentBracket): number {
    const inProgressMatch = tournament.matches.find(m => m.status === 'in-progress')
    if (inProgressMatch) return inProgressMatch.round

    const pendingMatches = tournament.matches.filter(m => m.status === 'pending')
    if (pendingMatches.length > 0) {
      return Math.min(...pendingMatches.map(m => m.round))
    }

    const completedMatches = tournament.matches.filter(m => m.status === 'completed')
    if (completedMatches.length > 0) {
      return Math.max(...completedMatches.map(m => m.round)) + 1
    }

    return 1
  }

  static simulateRandomTournament(fighters: Fighter[]): TournamentBracket {
    let tournament = this.createTournament(fighters)
    tournament.status = 'in-progress'

    // Simulate all matches
    while (tournament.status !== 'completed') {
      const upcomingMatch = this.getUpcomingMatch(tournament)
      if (!upcomingMatch) break

      // Simulate fight result
      const winner = Math.random() > 0.5 ? upcomingMatch.fighter1 : upcomingMatch.fighter2
      const method = Math.random() > 0.7 ? 'KO' : Math.random() > 0.5 ? 'Decision' : 'TKO'
      const round = method === 'Decision' ? 5 : Math.floor(Math.random() * 3) + 1

      const fightResult: FightState['result'] = {
        winner: winner.id,
        method: method as any,
        round,
        time: `${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
      }

      tournament = this.advanceTournament(tournament, upcomingMatch, fightResult)
    }

    return tournament
  }

  static createTournamentHistory(): TournamentBracket[] {
    // This would typically load from a database
    // For now, return empty array - will be populated as tournaments complete
    return []
  }

  static addToTournamentHistory(tournament: TournamentBracket): void {
    // In a real app, this would save to database
    console.log('Tournament completed:', tournament.name, 'Winner:', tournament.winner?.name)
  }

  static getEligibleFighters(allFighters: Fighter[], minElo: number = 1200): Fighter[] {
    return allFighters
      .filter(f => f.isActive && f.elo >= minElo)
      .sort((a, b) => b.elo - a.elo)
  }

  static generateTournamentRewards(tournament: TournamentBracket): {
    winner: number
    finalist: number
    semifinalists: number
    quarterfinalists: number
  } {
    const basePrize = tournament.prize
    return {
      winner: Math.floor(basePrize * 0.5),        // 50%
      finalist: Math.floor(basePrize * 0.25),     // 25%
      semifinalists: Math.floor(basePrize * 0.15), // 15% split
      quarterfinalists: Math.floor(basePrize * 0.1) // 10% split
    }
  }
}