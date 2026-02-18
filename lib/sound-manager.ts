import { SoundEffect, SoundManager } from '@/types'

const SOUND_PATHS: Record<SoundEffect, string> = {
  'punch-light': '/sounds/punch-light.mp3',
  'punch-heavy': '/sounds/punch-heavy.mp3',
  'dodge': '/sounds/dodge.mp3',
  'block': '/sounds/block.mp3',
  'ko': '/sounds/ko.mp3',
  'bell': '/sounds/bell.mp3',
  'crowd-cheer': '/sounds/crowd-cheer.mp3',
  'trade-success': '/sounds/trade-success.mp3',
  'trade-fail': '/sounds/trade-fail.mp3',
  'notification': '/sounds/notification.mp3',
}

class SoundManagerImpl implements SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map()
  private masterVolume: number = 0.7
  private muted: boolean = false

  private getOrCreate(sound: SoundEffect): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null

    let audio = this.sounds.get(sound)
    if (audio) return audio

    const path = SOUND_PATHS[sound]
    if (!path) return null

    audio = new Audio(path)
    audio.volume = this.masterVolume
    this.sounds.set(sound, audio)
    return audio
  }

  public play(sound: SoundEffect, volume: number = 1.0): void {
    if (this.muted) return

    const audio = this.getOrCreate(sound)
    if (!audio) return

    try {
      audio.currentTime = 0
      audio.volume = this.masterVolume * volume

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

  public preload(): void {
    if (typeof window === 'undefined') return

    const effects = Object.keys(SOUND_PATHS) as SoundEffect[]
    effects.forEach(sound => {
      this.getOrCreate(sound)
    })
  }

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

  public playTradeSound(success: boolean, volume: number = 0.6): void {
    this.play(success ? 'trade-success' : 'trade-fail', volume)
  }

  public playAmbientReaction(intensity: 'low' | 'medium' | 'high'): void {
    const volumes = { low: 0.2, medium: 0.4, high: 0.7 }

    if (Math.random() < 0.3) {
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

export default soundManager
