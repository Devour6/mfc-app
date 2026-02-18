import { FightState, Commentary } from '@/types'

export interface FightRecording {
  version: 1
  fighters: { id: string; name: string; emoji: string }[]
  tickRate: number
  snapshots: FightState[]
  commentary: { tick: number; comment: Commentary }[]
  totalTicks: number
  result?: FightState['result']
}

export class FightRecorder {
  private snapshots: FightState[] = []
  private commentary: { tick: number; comment: Commentary }[] = []
  private tickCounter = 0
  private sampleRate: number

  constructor(sampleRate = 3) {
    this.sampleRate = sampleRate
  }

  recordTick(state: FightState): void {
    this.tickCounter++
    if (this.tickCounter % this.sampleRate === 0) {
      this.snapshots.push(JSON.parse(JSON.stringify(state)))
    }
  }

  recordCommentary(comment: Commentary): void {
    this.commentary.push({ tick: this.tickCounter, comment })
  }

  finalize(fighters: { id: string; name: string; emoji: string }[]): FightRecording {
    const lastSnapshot = this.snapshots[this.snapshots.length - 1]
    return {
      version: 1,
      fighters,
      tickRate: 80 * this.sampleRate,
      snapshots: this.snapshots,
      commentary: this.commentary,
      totalTicks: this.snapshots.length,
      result: lastSnapshot?.result,
    }
  }

  reset(): void {
    this.snapshots = []
    this.commentary = []
    this.tickCounter = 0
  }
}
