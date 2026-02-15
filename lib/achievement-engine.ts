import { Achievement, Fighter, FightHistoryEntry, TournamentBracket, AchievementNotification } from '@/types'

// Master list of all achievements
const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Fight Achievements
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Win your first fight',
    type: 'fight',
    icon: '🥊',
    rarity: 'common',
    rewardCredits: 50,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'knockout-artist',
    name: 'Knockout Artist',
    description: 'Score your first knockout victory',
    type: 'fight',
    icon: '💥',
    rarity: 'common',
    rewardCredits: 100,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'perfect-round',
    name: 'Flawless Victory',
    description: 'Win a round without taking damage',
    type: 'fight',
    icon: '💎',
    rarity: 'rare',
    rewardCredits: 200,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'comeback-king',
    name: 'The Comeback Kid',
    description: 'Win a fight after being knocked down',
    type: 'fight',
    icon: '🔥',
    rarity: 'rare',
    rewardCredits: 250,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'lightning-ko',
    name: 'Lightning Strike',
    description: 'Score a knockout in the first round',
    type: 'fight',
    icon: '⚡',
    rarity: 'rare',
    rewardCredits: 300,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'veteran',
    name: 'Seasoned Veteran',
    description: 'Fight in 25 total fights',
    type: 'fight',
    icon: '🎖️',
    rarity: 'rare',
    rewardCredits: 500,
    maxProgress: 25,
    hidden: false
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable Force',
    description: 'Win 10 fights in a row',
    type: 'streak',
    icon: '🚀',
    rarity: 'epic',
    rewardCredits: 750,
    maxProgress: 10,
    hidden: false
  },
  {
    id: 'legendary-fighter',
    name: 'Legend Status',
    description: 'Win 50 total fights',
    type: 'fight',
    icon: '👑',
    rarity: 'legendary',
    rewardCredits: 2000,
    maxProgress: 50,
    hidden: false
  },

  // Betting Achievements
  {
    id: 'first-bet',
    name: 'Rookie Bettor',
    description: 'Place your first bet',
    type: 'betting',
    icon: '🎲',
    rarity: 'common',
    rewardCredits: 25,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    description: 'Win 5 bets in a row',
    type: 'betting',
    icon: '🔥',
    rarity: 'rare',
    rewardCredits: 400,
    maxProgress: 5,
    hidden: false
  },
  {
    id: 'big-winner',
    name: 'Big Winner',
    description: 'Earn 5000 credits from betting',
    type: 'betting',
    icon: '💰',
    rarity: 'epic',
    rewardCredits: 1000,
    maxProgress: 5000,
    hidden: false
  },
  {
    id: 'upset-caller',
    name: 'Upset Specialist',
    description: 'Correctly predict 3 major upsets',
    type: 'betting',
    icon: '🎯',
    rarity: 'epic',
    rewardCredits: 800,
    maxProgress: 3,
    hidden: false
  },

  // Collection Achievements
  {
    id: 'first-fighter',
    name: 'Talent Scout',
    description: 'Recruit your first fighter',
    type: 'collection',
    icon: '👤',
    rarity: 'common',
    rewardCredits: 100,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'gym-owner',
    name: 'Gym Owner',
    description: 'Own 5 fighters at once',
    type: 'collection',
    icon: '🏢',
    rarity: 'rare',
    rewardCredits: 300,
    maxProgress: 5,
    hidden: false
  },
  {
    id: 'weight-class-master',
    name: 'Multi-Division Champion',
    description: 'Own fighters in all 3 weight classes',
    type: 'collection',
    icon: '🏆',
    rarity: 'epic',
    rewardCredits: 600,
    maxProgress: 3,
    hidden: false
  },

  // Tournament Achievements
  {
    id: 'tournament-debut',
    name: 'Tournament Fighter',
    description: 'Enter your first tournament',
    type: 'fight',
    icon: '🏛️',
    rarity: 'common',
    rewardCredits: 150,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'tournament-champion',
    name: 'Tournament Champion',
    description: 'Win a tournament',
    type: 'fight',
    icon: '🥇',
    rarity: 'epic',
    rewardCredits: 1000,
    maxProgress: 1,
    hidden: false
  },
  {
    id: 'tournament-legend',
    name: 'Tournament Legend',
    description: 'Win 5 tournaments',
    type: 'fight',
    icon: '🌟',
    rarity: 'legendary',
    rewardCredits: 3000,
    maxProgress: 5,
    hidden: false
  },

  // Hidden/Secret Achievements
  {
    id: 'glass-cannon',
    name: 'Glass Cannon',
    description: 'Win with a fighter who has low defense',
    type: 'fight',
    icon: '💢',
    rarity: 'rare',
    rewardCredits: 350,
    maxProgress: 1,
    hidden: true
  },
  {
    id: 'evolution-master',
    name: 'Evolution Master',
    description: 'Unlock all signature moves for a fighter',
    type: 'fight',
    icon: '⭐',
    rarity: 'legendary',
    rewardCredits: 2500,
    maxProgress: 1,
    hidden: true
  },
  {
    id: 'old-timer',
    name: 'Old Timer',
    description: 'Win with a fighter over 35 years old',
    type: 'fight',
    icon: '👴',
    rarity: 'rare',
    rewardCredits: 400,
    maxProgress: 1,
    hidden: true
  }
]

export class AchievementEngine {
  
  static initializeAchievements(): Achievement[] {
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: false,
      progress: 0
    }))
  }

  static checkFightAchievements(
    achievements: Achievement[],
    fighter: Fighter,
    fightEntry: FightHistoryEntry,
    isFirstRoundKO: boolean = false,
    isPerfectRound: boolean = false,
    isComeback: boolean = false
  ): { updatedAchievements: Achievement[]; newUnlocks: Achievement[] } {
    const updated = [...achievements]
    const newUnlocks: Achievement[] = []

    // First Blood
    if (fightEntry.result === 'win') {
      const firstBlood = this.updateProgress(updated, 'first-blood', 1)
      if (firstBlood) newUnlocks.push(firstBlood)
    }

    // Knockout Artist
    if (fightEntry.result === 'win' && (fightEntry.method === 'KO' || fightEntry.method === 'TKO')) {
      const koArtist = this.updateProgress(updated, 'knockout-artist', 1)
      if (koArtist) newUnlocks.push(koArtist)
    }

    // Perfect Round
    if (isPerfectRound) {
      const perfect = this.updateProgress(updated, 'perfect-round', 1)
      if (perfect) newUnlocks.push(perfect)
    }

    // Comeback Kid
    if (isComeback && fightEntry.result === 'win') {
      const comeback = this.updateProgress(updated, 'comeback-king', 1)
      if (comeback) newUnlocks.push(comeback)
    }

    // Lightning Strike
    if (isFirstRoundKO) {
      const lightning = this.updateProgress(updated, 'lightning-ko', 1)
      if (lightning) newUnlocks.push(lightning)
    }

    // Veteran Status
    const veteran = this.updateProgress(updated, 'veteran', 1)
    if (veteran) newUnlocks.push(veteran)

    // Win Streak
    if (fightEntry.result === 'win') {
      const unstoppable = this.updateProgress(updated, 'unstoppable', 1, fighter.evolution.winStreak)
      if (unstoppable) newUnlocks.push(unstoppable)
    } else {
      // Reset streak progress on loss
      this.resetProgress(updated, 'unstoppable')
    }

    // Legendary Fighter
    const totalWins = fighter.record.wins
    const legendary = this.updateProgress(updated, 'legendary-fighter', 0, totalWins)
    if (legendary) newUnlocks.push(legendary)

    // Hidden Achievements
    this.checkHiddenFightAchievements(updated, fighter, fightEntry, newUnlocks)

    return { updatedAchievements: updated, newUnlocks }
  }

  private static checkHiddenFightAchievements(
    achievements: Achievement[],
    fighter: Fighter,
    fightEntry: FightHistoryEntry,
    newUnlocks: Achievement[]
  ): void {
    // Glass Cannon - win with low defense
    if (fightEntry.result === 'win' && fighter.stats.defense < 60) {
      const glassCannon = this.updateProgress(achievements, 'glass-cannon', 1)
      if (glassCannon) newUnlocks.push(glassCannon)
    }

    // Evolution Master - all signature moves unlocked
    if (fighter.evolution.signatureMoves.length >= 5) {
      const evolutionMaster = this.updateProgress(achievements, 'evolution-master', 1)
      if (evolutionMaster) newUnlocks.push(evolutionMaster)
    }

    // Old Timer - win with old fighter
    if (fightEntry.result === 'win' && fighter.evolution.age > 35) {
      const oldTimer = this.updateProgress(achievements, 'old-timer', 1)
      if (oldTimer) newUnlocks.push(oldTimer)
    }
  }

  static checkTournamentAchievements(
    achievements: Achievement[],
    tournament: TournamentBracket,
    fighterWon: boolean = false
  ): { updatedAchievements: Achievement[]; newUnlocks: Achievement[] } {
    const updated = [...achievements]
    const newUnlocks: Achievement[] = []

    // Tournament Debut
    const debut = this.updateProgress(updated, 'tournament-debut', 1)
    if (debut) newUnlocks.push(debut)

    // Tournament Champion
    if (fighterWon) {
      const champion = this.updateProgress(updated, 'tournament-champion', 1)
      if (champion) newUnlocks.push(champion)

      // Tournament Legend
      const legend = this.updateProgress(updated, 'tournament-legend', 1)
      if (legend) newUnlocks.push(legend)
    }

    return { updatedAchievements: updated, newUnlocks }
  }

  static checkCollectionAchievements(
    achievements: Achievement[],
    fighters: Fighter[]
  ): { updatedAchievements: Achievement[]; newUnlocks: Achievement[] } {
    const updated = [...achievements]
    const newUnlocks: Achievement[] = []

    // First Fighter
    if (fighters.length >= 1) {
      const first = this.updateProgress(updated, 'first-fighter', 1)
      if (first) newUnlocks.push(first)
    }

    // Gym Owner
    const gymOwner = this.updateProgress(updated, 'gym-owner', 0, fighters.length)
    if (gymOwner) newUnlocks.push(gymOwner)

    // Multi-Division Champion
    const weightClasses = new Set(fighters.map(f => f.class))
    const multiDivision = this.updateProgress(updated, 'weight-class-master', 0, weightClasses.size)
    if (multiDivision) newUnlocks.push(multiDivision)

    return { updatedAchievements: updated, newUnlocks }
  }

  private static updateProgress(
    achievements: Achievement[],
    achievementId: string,
    increment: number,
    absoluteValue?: number
  ): Achievement | null {
    const index = achievements.findIndex(a => a.id === achievementId)
    if (index === -1 || achievements[index].unlocked) return null

    const achievement = achievements[index]
    const oldProgress = achievement.progress
    
    if (absoluteValue !== undefined) {
      achievement.progress = Math.min(absoluteValue, achievement.maxProgress)
    } else {
      achievement.progress = Math.min(oldProgress + increment, achievement.maxProgress)
    }

    // Check if achievement is now complete
    if (!achievement.unlocked && achievement.progress >= achievement.maxProgress) {
      achievement.unlocked = true
      achievement.unlockedAt = Date.now()
      return achievement
    }

    return null
  }

  private static resetProgress(achievements: Achievement[], achievementId: string): void {
    const index = achievements.findIndex(a => a.id === achievementId)
    if (index !== -1 && !achievements[index].unlocked) {
      achievements[index].progress = 0
    }
  }

  static createNotification(achievement: Achievement): AchievementNotification {
    return {
      id: `notification-${achievement.id}-${Date.now()}`,
      achievement,
      timestamp: Date.now(),
      seen: false
    }
  }

  static getAchievementsByType(achievements: Achievement[], type: Achievement['type']): Achievement[] {
    return achievements.filter(a => a.type === type)
  }

  static getUnlockedAchievements(achievements: Achievement[]): Achievement[] {
    return achievements.filter(a => a.unlocked)
  }

  static getProgressPercentage(achievement: Achievement): number {
    return Math.round((achievement.progress / achievement.maxProgress) * 100)
  }

  static getTotalRewardsEarned(achievements: Achievement[]): number {
    return achievements
      .filter(a => a.unlocked)
      .reduce((total, a) => total + a.rewardCredits, 0)
  }

  static getAchievementStats(achievements: Achievement[]): {
    total: number
    unlocked: number
    percentage: number
    byRarity: Record<string, { total: number; unlocked: number }>
  } {
    const total = achievements.length
    const unlocked = achievements.filter(a => a.unlocked).length
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0

    const byRarity = achievements.reduce((acc, achievement) => {
      if (!acc[achievement.rarity]) {
        acc[achievement.rarity] = { total: 0, unlocked: 0 }
      }
      acc[achievement.rarity].total++
      if (achievement.unlocked) {
        acc[achievement.rarity].unlocked++
      }
      return acc
    }, {} as Record<string, { total: number; unlocked: number }>)

    return { total, unlocked, percentage, byRarity }
  }
}