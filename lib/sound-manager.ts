import { SoundEffect, SoundManager } from '@/types'

class SoundManagerImpl implements SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map()
  private masterVolume: number = 0.7
  private muted: boolean = false
  private initialized: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private initialize(): void {
    if (this.initialized) return

    const soundEffects: SoundEffect[] = [
      'punch-light',
      'punch-heavy',
      'dodge',
      'block',
      'ko',
      'bell',
      'crowd-cheer',
      'trade-success',
      'trade-fail',
      'notification'
    ]

    soundEffects.forEach(sound => {
      const audio = document.getElementById(sound) as HTMLAudioElement
      if (audio) {
        this.sounds.set(sound, audio)
        audio.volume = this.masterVolume
      }
    })

    this.initialized = true
  }

  public play(sound: SoundEffect, volume: number = 1.0): void {
    if (!this.initialized) this.initialize()
    if (this.muted) return

    const audio = this.sounds.get(sound)
    if (!audio) {
      console.warn(`Sound effect '${sound}' not found`)
      return
    }

    try {
      // Reset to start and play
      audio.currentTime = 0
      audio.volume = this.masterVolume * volume
      
      // Use promise-based playback for better error handling
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Failed to play sound '${sound}':`, error)
        })
      }
    } catch (error) {
      console.warn(`Error playing sound '${sound}':`, error)
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    
    // Update all loaded sounds
    this.sounds.forEach(audio => {
      audio.volume = this.masterVolume
    })
  }

  public mute(): void {
    this.muted = true
    this.sounds.forEach(audio => {
      audio.volume = 0
    })
  }

  public unmute(): void {
    this.muted = false
    this.sounds.forEach(audio => {
      audio.volume = this.masterVolume
    })
  }

  public isMuted(): boolean {
    return this.muted
  }

  public getMasterVolume(): number {
    return this.masterVolume
  }

  // Preload all sounds for better performance
  public preload(): void {
    if (!this.initialized) this.initialize()
    
    this.sounds.forEach((audio, sound) => {
      if (audio.readyState < 2) { // HAVE_CURRENT_DATA
        audio.load()
      }
    })
  }

  // Play contextual fight sounds based on actions
  public playFightAction(actionType: string, isPowerShot: boolean = false): void {
    switch (actionType) {
      case 'jab':
      case 'cross':
        this.play(isPowerShot ? 'punch-heavy' : 'punch-light', isPowerShot ? 1.0 : 0.7)
        break
      case 'hook':
      case 'uppercut':
        this.play('punch-heavy', 0.9)
        break
      case 'combo':
        // Play rapid light punches
        this.play('punch-light', 0.8)
        setTimeout(() => this.play('punch-light', 0.6), 150)
        setTimeout(() => this.play('punch-heavy', 1.0), 300)
        break
      case 'dodge':
        this.play('dodge', 0.5)
        break
      case 'block':
        this.play('block', 0.6)
        break
      case 'ko':
      case 'tko':
        this.play('ko', 1.0)
        setTimeout(() => this.play('crowd-cheer', 0.8), 500)
        break
      case 'bell':
        this.play('bell', 0.9)
        break
      default:
        break
    }
  }

  // Enhanced market sound feedback
  public playTradeSound(success: boolean, volume: number = 0.6): void {
    this.play(success ? 'trade-success' : 'trade-fail', volume)
  }

  // Ambient crowd reactions based on fight intensity
  public playAmbientReaction(intensity: 'low' | 'medium' | 'high'): void {
    const volumes = { low: 0.2, medium: 0.4, high: 0.7 }
    
    if (Math.random() < 0.3) { // 30% chance to play ambient sound
      this.play('crowd-cheer', volumes[intensity])
    }
  }
}

// Singleton instance
export const soundManager = new SoundManagerImpl()

// Utility functions for easy access
export const playSound = (sound: SoundEffect, volume?: number) => {
  soundManager.play(sound, volume)
}

export const playFightSound = (actionType: string, isPowerShot?: boolean) => {
  soundManager.playFightAction(actionType, isPowerShot)
}

export const playTradeSound = (success: boolean, volume?: number) => {
  soundManager.playTradeSound(success, volume)
}

export const muteAll = () => soundManager.mute()
export const unmuteAll = () => soundManager.unmute()
export const setVolume = (volume: number) => soundManager.setMasterVolume(volume)

// Initialize sound manager on first import
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      soundManager.preload()
    })
  } else {
    soundManager.preload()
  }
}

export default soundManager