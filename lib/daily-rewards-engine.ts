import { LoginStreak, DailyReward } from '@/types'

export class DailyRewardsEngine {
  
  static createNewLoginStreak(): LoginStreak {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: 0,
      rewards: this.generateRewardCalendar(),
      nextRewardCredits: this.getRewardForDay(1)
    }
  }

  static processLogin(loginStreak: LoginStreak): {
    updatedStreak: LoginStreak
    rewardClaimed: DailyReward | null
    streakBroken: boolean
    newRecord: boolean
  } {
    const now = Date.now()
    const today = this.getDateKey(now)
    const lastLoginDay = this.getDateKey(loginStreak.lastLoginDate)
    const yesterday = this.getDateKey(now - 86400000) // 24 hours ago

    let updatedStreak = { ...loginStreak }
    let rewardClaimed: DailyReward | null = null
    let streakBroken = false
    let newRecord = false

    // Check if player already logged in today
    if (today === lastLoginDay) {
      return {
        updatedStreak,
        rewardClaimed: null,
        streakBroken: false,
        newRecord: false
      }
    }

    // Check if streak continues or breaks
    if (lastLoginDay === yesterday || loginStreak.currentStreak === 0) {
      // Streak continues or starts
      updatedStreak.currentStreak++
      updatedStreak.lastLoginDate = now

      // Claim reward for current day
      const dayIndex = (updatedStreak.currentStreak - 1) % 7
      rewardClaimed = { ...updatedStreak.rewards[dayIndex] }
      rewardClaimed.claimed = true

      // Update next reward
      updatedStreak.nextRewardCredits = this.getRewardForDay(updatedStreak.currentStreak + 1)

      // Check for new record
      if (updatedStreak.currentStreak > updatedStreak.longestStreak) {
        updatedStreak.longestStreak = updatedStreak.currentStreak
        newRecord = true
      }
    } else {
      // Streak broken
      streakBroken = true
      updatedStreak.currentStreak = 1 // Start new streak
      updatedStreak.lastLoginDate = now
      updatedStreak.nextRewardCredits = this.getRewardForDay(2)

      // Claim day 1 reward
      rewardClaimed = { ...updatedStreak.rewards[0] }
      rewardClaimed.claimed = true

      // Reset reward calendar
      updatedStreak.rewards = this.generateRewardCalendar()
    }

    return {
      updatedStreak,
      rewardClaimed,
      streakBroken,
      newRecord
    }
  }

  private static generateRewardCalendar(): DailyReward[] {
    return [
      { day: 1, credits: 50, claimed: false },
      { day: 2, credits: 75, claimed: false },
      { day: 3, credits: 100, claimed: false },
      { day: 4, credits: 125, claimed: false },
      { day: 5, credits: 150, bonus: 'Fighter Slot', claimed: false },
      { day: 6, credits: 200, claimed: false },
      { day: 7, credits: 300, bonus: 'Premium Training', claimed: false }
    ]
  }

  private static getRewardForDay(day: number): number {
    const rewardCalendar = this.generateRewardCalendar()
    const dayIndex = (day - 1) % 7
    return rewardCalendar[dayIndex].credits
  }

  private static getDateKey(timestamp: number): string {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }

  static getDaysUntilReset(): number {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    return Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60))
  }

  static getStreakBonus(streak: number): {
    multiplier: number
    bonusCredits: number
    specialReward?: string
  } {
    let multiplier = 1.0
    let bonusCredits = 0
    let specialReward: string | undefined

    // Weekly milestones
    if (streak >= 7) {
      multiplier = 1.1 // 10% bonus
      bonusCredits = 100
    }

    if (streak >= 14) {
      multiplier = 1.2 // 20% bonus
      bonusCredits = 250
      specialReward = 'Veteran Badge'
    }

    if (streak >= 30) {
      multiplier = 1.3 // 30% bonus
      bonusCredits = 500
      specialReward = 'Monthly Champion'
    }

    if (streak >= 60) {
      multiplier = 1.5 // 50% bonus
      bonusCredits = 1000
      specialReward = 'Dedication Master'
    }

    if (streak >= 100) {
      multiplier = 2.0 // 100% bonus
      bonusCredits = 2000
      specialReward = 'Legend Status'
    }

    return { multiplier, bonusCredits, specialReward }
  }

  static getWeeklyProgress(streak: number): {
    currentWeek: number
    dayInWeek: number
    weekProgress: number
  } {
    const currentWeek = Math.floor(streak / 7) + 1
    const dayInWeek = (streak % 7) + 1
    const weekProgress = ((streak % 7) / 7) * 100

    return { currentWeek, dayInWeek, weekProgress }
  }

  static canClaimReward(loginStreak: LoginStreak): boolean {
    const now = Date.now()
    const today = this.getDateKey(now)
    const lastLoginDay = this.getDateKey(loginStreak.lastLoginDate)
    
    return today !== lastLoginDay
  }

  static getTimeUntilNextReward(): {
    hours: number
    minutes: number
    canClaim: boolean
  } {
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setDate(nextMidnight.getDate() + 1)
    nextMidnight.setHours(0, 0, 0, 0)
    
    const timeUntilReset = nextMidnight.getTime() - now.getTime()
    const hours = Math.floor(timeUntilReset / (1000 * 60 * 60))
    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))
    
    return {
      hours,
      minutes,
      canClaim: hours >= 0 // Can claim if it's still today
    }
  }

  static getStreakStats(loginStreak: LoginStreak): {
    totalDaysLogged: number
    averagePerWeek: number
    streakPercentile: number
    creditsEarned: number
  } {
    const totalDaysLogged = loginStreak.currentStreak
    const weeksActive = Math.max(1, Math.ceil(totalDaysLogged / 7))
    const averagePerWeek = totalDaysLogged / weeksActive
    
    // Mock percentile calculation (would be based on all users in real app)
    let streakPercentile = 50
    if (totalDaysLogged >= 30) streakPercentile = 75
    if (totalDaysLogged >= 60) streakPercentile = 90
    if (totalDaysLogged >= 100) streakPercentile = 95
    
    // Calculate total credits earned from login rewards
    const fullWeeks = Math.floor(totalDaysLogged / 7)
    const remainingDays = totalDaysLogged % 7
    const weeklyCredits = [50, 75, 100, 125, 150, 200, 300]
    
    let creditsEarned = 0
    
    // Add credits from full weeks
    creditsEarned += fullWeeks * weeklyCredits.reduce((sum, credits) => sum + credits, 0)
    
    // Add credits from remaining days
    for (let i = 0; i < remainingDays; i++) {
      creditsEarned += weeklyCredits[i]
    }

    return {
      totalDaysLogged,
      averagePerWeek: Math.round(averagePerWeek * 10) / 10,
      streakPercentile,
      creditsEarned
    }
  }

  static generateMotivationalMessage(streak: number, isBroken: boolean = false): string {
    if (isBroken && streak > 7) {
      return "Don&apos;t give up! Every champion faces setbacks. Start your comeback today!"
    }

    if (streak === 0) {
      return "Welcome to MFC! Start your daily login streak and earn amazing rewards!"
    }

    if (streak === 1) {
      return "Great start! Come back tomorrow to continue your streak."
    }

    if (streak < 7) {
      return `${7 - streak} more days until your first weekly bonus! Keep it up!`
    }

    if (streak === 7) {
      return "🎉 First week complete! You&apos;re building great habits!"
    }

    if (streak < 30) {
      return `${30 - streak} days until your monthly milestone! You're doing amazing!`
    }

    if (streak === 30) {
      return "🏆 30 days straight! You're officially a dedicated fighter!"
    }

    if (streak < 100) {
      return `${100 - streak} days until legendary status! The dedication is real!`
    }

    if (streak === 100) {
      return "👑 LEGENDARY! 100 days of dedication! You&apos;re among the elite!"
    }

    return `${streak} days and counting! You&apos;re a true MFC champion!`
  }

  static shouldShowStreakReminder(loginStreak: LoginStreak): boolean {
    const now = Date.now()
    const hoursSinceLastLogin = (now - loginStreak.lastLoginDate) / (1000 * 60 * 60)
    
    // Show reminder if haven't logged in for 20+ hours and have active streak
    return hoursSinceLastLogin >= 20 && loginStreak.currentStreak > 0
  }

  static getSpecialEvents(): {
    id: string
    name: string
    description: string
    multiplier: number
    startDate: number
    endDate: number
    active: boolean
  }[] {
    const now = Date.now()
    
    // Mock special events (would be configurable in real app)
    return [
      {
        id: 'weekend-bonus',
        name: 'Weekend Warrior',
        description: 'Double login rewards on weekends!',
        multiplier: 2.0,
        startDate: now,
        endDate: now + (48 * 60 * 60 * 1000), // 48 hours
        active: this.isWeekend()
      },
      {
        id: 'monthly-celebration',
        name: 'Monthly Celebration',
        description: 'Extra bonus credits all month long!',
        multiplier: 1.5,
        startDate: now - (15 * 24 * 60 * 60 * 1000), // Started 15 days ago
        endDate: now + (15 * 24 * 60 * 60 * 1000), // Ends in 15 days
        active: true
      }
    ]
  }

  private static isWeekend(): boolean {
    const day = new Date().getDay()
    return day === 0 || day === 6 // Sunday or Saturday
  }
}