import { FightState, FighterState, FightAction, Fighter, Commentary } from '@/types'

export class FightEngine {
  private fightState: FightState
  private commentary: Commentary[] = []
  private onStateUpdate?: (state: FightState) => void
  private onCommentary?: (comment: Commentary) => void
  private simulationSpeed: number = 80 // ms between ticks
  private intervalId?: NodeJS.Timeout
  private tickCounter: number = 0
  private ticksPerSecond: number = 12 // 1000ms / 80ms ≈ 12.5, round to 12

  constructor(
    fighter1: Fighter,
    fighter2: Fighter,
    onStateUpdate?: (state: FightState) => void,
    onCommentary?: (comment: Commentary) => void
  ) {
    this.onStateUpdate = onStateUpdate
    this.onCommentary = onCommentary
    
    this.fightState = {
      round: 1,
      maxRounds: 3,
      clock: 180,
      phase: 'intro',
      fighter1: this.createFighterState(fighter1, 120, 1),
      fighter2: this.createFighterState(fighter2, 360, -1),
    }
  }

  private createFighterState(fighter: Fighter, x: number, facing: 1 | -1): FighterState {
    return {
      id: fighter.id,
      hp: 100,
      stamina: 100,
      position: { x, y: 0, facing },
      animation: { state: 'idle', frameCount: 0, duration: 0 },
      stats: { strikes: 0, landed: 0, powerShots: 0, dodges: 0, blocks: 0 },
      modifiers: { stunned: 0, blocking: 0, dodging: 0, charging: 0 },
      combo: { count: 0, lastHit: 0 }
    }
  }

  public start(): void {
    this.fightState.phase = 'fighting'
    this.addCommentary('The fight is underway!', 'general', 'high')
    this.intervalId = setInterval(() => this.tick(), this.simulationSpeed)
    this.onStateUpdate?.(this.fightState)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  public restart(): void {
    this.stop()
    // Reset to initial state but keep fighter data
    this.fightState.round = 1
    this.fightState.clock = 180
    this.fightState.phase = 'fighting'
    this.fightState.fighter1.hp = 100
    this.fightState.fighter1.stamina = 100
    this.fightState.fighter2.hp = 100
    this.fightState.fighter2.stamina = 100
    this.resetFighterState(this.fightState.fighter1)
    this.resetFighterState(this.fightState.fighter2)
    this.tickCounter = 0
    this.commentary = []
    this.start()
  }

  private resetFighterState(fighter: FighterState): void {
    fighter.animation = { state: 'idle', frameCount: 0, duration: 0 }
    fighter.stats = { strikes: 0, landed: 0, powerShots: 0, dodges: 0, blocks: 0 }
    fighter.modifiers = { stunned: 0, blocking: 0, dodging: 0, charging: 0 }
    fighter.combo = { count: 0, lastHit: 0 }
  }

  private tick(): void {
    if (this.fightState.phase !== 'fighting') return

    // Update animations
    this.updateAnimations()
    
    // Handle modifiers decay
    this.updateModifiers()
    
    // Simulate combat
    this.simulateCombat()
    
    // Regenerate stamina
    this.regenerateStamina()
    
    // Check for round/fight end
    this.checkFightEnd()
    
    // Broadcast state update
    this.onStateUpdate?.(this.fightState)
  }

  private updateAnimations(): void {
    [this.fightState.fighter1, this.fightState.fighter2].forEach(fighter => {
      if (fighter.animation.duration > 0) {
        fighter.animation.frameCount++
        fighter.animation.duration--
        
        if (fighter.animation.duration <= 0) {
          fighter.animation.state = 'idle'
          fighter.animation.frameCount = 0
        }
      }
    })
  }

  private updateModifiers(): void {
    [this.fightState.fighter1, this.fightState.fighter2].forEach(fighter => {
      fighter.modifiers.stunned = Math.max(0, fighter.modifiers.stunned - 1)
      fighter.modifiers.blocking = Math.max(0, fighter.modifiers.blocking - 1)
      fighter.modifiers.dodging = Math.max(0, fighter.modifiers.dodging - 1)
      fighter.modifiers.charging = Math.max(0, fighter.modifiers.charging - 1)
      
      // Decay combo counter
      fighter.combo.lastHit++
      if (fighter.combo.lastHit > 30) { // 2.4 seconds at 80ms intervals
        fighter.combo.count = 0
      }
    })
  }

  private simulateCombat(): void {
    const f1 = this.fightState.fighter1
    const f2 = this.fightState.fighter2
    const distance = Math.abs(f1.position.x - f2.position.x)
    
    // Only fight if in range and not stunned
    if (distance <= 100 && f1.modifiers.stunned === 0 && f2.modifiers.stunned === 0) {
      
      // Fighter 1 actions
      if (this.shouldAttemptAction(f1, f2)) {
        const action = this.selectAction(f1, f2, distance)
        this.executeAction(action, f1, f2)
      }
      
      // Fighter 2 actions (slight delay for more realistic timing)
      if (Math.random() > 0.3 && this.shouldAttemptAction(f2, f1)) {
        const action = this.selectAction(f2, f1, distance)
        this.executeAction(action, f2, f1)
      }
    }
    
    // Movement when out of range
    if (distance > 120) {
      this.moveTowardsOpponent(f1, f2)
      this.moveTowardsOpponent(f2, f1)
    }
  }

  private shouldAttemptAction(attacker: FighterState, defender: FighterState): boolean {
    // Base action probability affected by stamina, stunning, and animation state
    let probability = 0.12
    
    if (attacker.stamina < 20) probability *= 0.3
    if (attacker.modifiers.stunned > 0) return false
    if (attacker.animation.state === 'punching') return false
    
    // Higher probability if opponent is vulnerable
    if (defender.modifiers.stunned > 0) probability *= 2
    if (defender.animation.state === 'punching') probability *= 1.5
    
    return Math.random() < probability
  }

  private selectAction(attacker: FighterState, defender: FighterState, distance: number): FightAction {
    const actions: Array<{ action: FightAction; weight: number }> = []
    
    // Attack options
    if (attacker.stamina > 10) {
      actions.push(
        { action: { type: 'jab', fighter: attacker === this.fightState.fighter1 ? 1 : 2, power: 0.7 }, weight: 30 },
        { action: { type: 'cross', fighter: attacker === this.fightState.fighter1 ? 1 : 2, power: 1.0 }, weight: 20 },
        { action: { type: 'hook', fighter: attacker === this.fightState.fighter1 ? 1 : 2, power: 1.2 }, weight: 15 },
      )
      
      if (attacker.stamina > 25) {
        actions.push(
          { action: { type: 'uppercut', fighter: attacker === this.fightState.fighter1 ? 1 : 2, power: 1.5 }, weight: 10 },
          { action: { type: 'combo', fighter: attacker === this.fightState.fighter1 ? 1 : 2, sequence: ['jab', 'cross'] }, weight: 8 }
        )
      }
    }
    
    // Defensive options
    if (defender.animation.state === 'punching' || defender.modifiers.charging > 0) {
      actions.push(
        { action: { type: 'dodge', fighter: attacker === this.fightState.fighter1 ? 1 : 2, direction: Math.random() > 0.5 ? 'left' : 'right' }, weight: 25 },
        { action: { type: 'block', fighter: attacker === this.fightState.fighter1 ? 1 : 2, success: Math.random() > 0.3 }, weight: 20 }
      )
    }
    
    // Movement options
    if (distance > 80 || distance < 40) {
      actions.push(
        { action: { type: 'move', fighter: attacker === this.fightState.fighter1 ? 1 : 2, direction: distance > 80 ? 'forward' : 'back' }, weight: 15 }
      )
    }
    
    // Clinch when close and low stamina
    if (distance < 50 && attacker.stamina < 30) {
      actions.push(
        { action: { type: 'clinch', fighter: attacker === this.fightState.fighter1 ? 1 : 2 }, weight: 12 }
      )
    }
    
    // Weighted random selection
    const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const { action, weight } of actions) {
      random -= weight
      if (random <= 0) return action
    }
    
    // Fallback to jab
    return { type: 'jab', fighter: attacker === this.fightState.fighter1 ? 1 : 2, power: 0.7 }
  }

  private executeAction(action: FightAction, attacker: FighterState, defender: FighterState): void {
    switch (action.type) {
      case 'jab':
      case 'cross':
      case 'hook':
      case 'uppercut':
        this.executeStrike(action, attacker, defender)
        break
      case 'combo':
        this.executeCombo(action, attacker, defender)
        break
      case 'dodge':
        this.executeDodge(action, attacker)
        break
      case 'block':
        this.executeBlock(action, attacker)
        break
      case 'clinch':
        this.executeClinch(action, attacker, defender)
        break
      case 'move':
        this.executeMovement(action, attacker)
        break
    }
  }

  private executeStrike(action: FightAction & { type: 'jab' | 'cross' | 'hook' | 'uppercut' }, attacker: FighterState, defender: FighterState): void {
    attacker.stats.strikes++
    attacker.animation.state = 'punching'
    attacker.animation.duration = action.type === 'jab' ? 8 : action.type === 'uppercut' ? 15 : 12
    
    const staminaCost = action.power * 2
    attacker.stamina = Math.max(0, attacker.stamina - staminaCost)
    
    // Hit calculation
    let hitChance = 0.55 // Base hit chance
    
    // Modifiers
    if (defender.modifiers.dodging > 0) hitChance *= 0.3
    if (defender.modifiers.blocking > 0) hitChance *= 0.4
    if (defender.modifiers.stunned > 0) hitChance *= 1.8
    if (attacker.combo.count > 0) hitChance *= 1.2 // Combo bonus
    
    if (Math.random() < hitChance) {
      this.landStrike(action, attacker, defender)
    } else {
      this.addCommentary(this.getMissCommentary(action.type), 'action', 'low')
    }
  }

  private landStrike(action: FightAction & { type: 'jab' | 'cross' | 'hook' | 'uppercut' }, attacker: FighterState, defender: FighterState): void {
    attacker.stats.landed++
    attacker.combo.count++
    attacker.combo.lastHit = 0
    
    let damage = action.power * (8 + Math.random() * 7) // 8-15 base damage
    
    // Power shot chance
    const powerChance = action.type === 'uppercut' ? 0.25 : action.type === 'hook' ? 0.20 : 0.15
    const isPowerShot = Math.random() < powerChance
    
    if (isPowerShot) {
      damage *= 2.5
      attacker.stats.powerShots++
      defender.modifiers.stunned = 15 // 1.2 seconds
      this.addCommentary(this.getPowerShotCommentary(action.type), 'action', 'high')
    } else {
      this.addCommentary(this.getHitCommentary(action.type), 'action', 'medium')
    }
    
    // Apply damage
    defender.hp = Math.max(0, defender.hp - damage)
    defender.animation.state = 'hit'
    defender.animation.duration = isPowerShot ? 12 : 6
    
    // Check for knockdown/knockout
    if (defender.hp <= 0) {
      this.endFight(attacker.id, 'KO')
    } else if (defender.hp < 15 && Math.random() < 0.3) {
      this.endFight(attacker.id, 'TKO')
    }
  }

  private executeCombo(action: FightAction & { type: 'combo' }, attacker: FighterState, defender: FighterState): void {
    if (attacker.stamina < action.sequence.length * 3) return
    
    attacker.animation.state = 'punching'
    attacker.animation.duration = action.sequence.length * 8
    
    let totalDamage = 0
    let hits = 0
    
    action.sequence.forEach((strike, index) => {
      const hitChance = 0.6 - (index * 0.1) // Each subsequent hit is harder to land
      
      if (Math.random() < hitChance) {
        const damage = 6 + Math.random() * 4
        totalDamage += damage
        hits++
        attacker.stats.landed++
      }
    })
    
    if (hits > 0) {
      attacker.combo.count += hits
      attacker.combo.lastHit = 0
      defender.hp = Math.max(0, defender.hp - totalDamage)
      defender.animation.state = 'hit'
      defender.animation.duration = hits * 4
      
      this.addCommentary(`Devastating ${hits}-hit combo!`, 'action', 'high')
    }
    
    attacker.stamina = Math.max(0, attacker.stamina - action.sequence.length * 3)
  }

  private executeDodge(action: FightAction & { type: 'dodge' }, attacker: FighterState): void {
    attacker.stats.dodges++
    attacker.animation.state = 'dodging'
    attacker.animation.duration = 10
    attacker.modifiers.dodging = 8
    
    // Move based on dodge direction
    const moveDistance = 15
    switch (action.direction) {
      case 'left':
        attacker.position.x = Math.max(60, attacker.position.x - moveDistance)
        break
      case 'right':
        attacker.position.x = Math.min(420, attacker.position.x + moveDistance)
        break
      case 'back':
        attacker.position.x += attacker.position.facing * -moveDistance
        break
    }
    
    this.addCommentary('Nice dodge!', 'action', 'medium')
  }

  private executeBlock(action: FightAction & { type: 'block' }, attacker: FighterState): void {
    if (action.success) {
      attacker.stats.blocks++
      attacker.modifiers.blocking = 12
      this.addCommentary('Good defensive work!', 'action', 'medium')
    }
    
    attacker.animation.state = 'blocking'
    attacker.animation.duration = 8
  }

  private executeClinch(action: FightAction & { type: 'clinch' }, attacker: FighterState, defender: FighterState): void {
    // Both fighters recover some stamina in clinch
    attacker.stamina = Math.min(100, attacker.stamina + 8)
    defender.stamina = Math.min(100, defender.stamina + 8)
    
    // Move fighters close together
    const centerX = (attacker.position.x + defender.position.x) / 2
    attacker.position.x = centerX - 10
    defender.position.x = centerX + 10
    
    this.addCommentary('The fighters are tied up in a clinch.', 'general', 'low')
  }

  private executeMovement(action: FightAction & { type: 'move' }, attacker: FighterState): void {
    const moveDistance = 12
    
    switch (action.direction) {
      case 'forward':
        attacker.position.x += attacker.position.facing * moveDistance
        break
      case 'back':
        attacker.position.x += attacker.position.facing * -moveDistance
        break
      case 'circle':
        attacker.position.x += (Math.random() > 0.5 ? 1 : -1) * moveDistance
        break
    }
    
    // Keep in bounds
    attacker.position.x = Math.max(60, Math.min(420, attacker.position.x))
    
    attacker.animation.state = 'walking'
    attacker.animation.duration = 8
  }

  private moveTowardsOpponent(attacker: FighterState, defender: FighterState): void {
    const direction = defender.position.x > attacker.position.x ? 1 : -1
    attacker.position.x += direction * 2
    attacker.position.x = Math.max(60, Math.min(420, attacker.position.x))
  }

  private regenerateStamina(): void {
    [this.fightState.fighter1, this.fightState.fighter2].forEach(fighter => {
      if (fighter.animation.state === 'idle' || fighter.animation.state === 'walking') {
        fighter.stamina = Math.min(100, fighter.stamina + 0.5)
      }
    })
  }

  private checkFightEnd(): void {
    this.tickCounter++
    if (this.tickCounter >= this.ticksPerSecond) {
      this.tickCounter = 0
      this.fightState.clock--
    }

    if (this.fightState.clock <= 0) {
      if (this.fightState.round < this.fightState.maxRounds) {
        this.nextRound()
      } else {
        this.endByDecision()
      }
    }
  }

  private nextRound(): void {
    this.fightState.round++
    this.fightState.clock = 180
    this.tickCounter = 0
    
    // Rest between rounds
    this.fightState.fighter1.stamina = Math.min(100, this.fightState.fighter1.stamina + 30)
    this.fightState.fighter2.stamina = Math.min(100, this.fightState.fighter2.stamina + 30)
    
    // Reset positions
    this.fightState.fighter1.position.x = 120
    this.fightState.fighter2.position.x = 360
    
    this.addCommentary(`Round ${this.fightState.round} begins!`, 'general', 'high')
  }

  private endFight(winnerId: string, method: 'KO' | 'TKO' | 'Decision'): void {
    this.fightState.phase = method === 'Decision' ? 'decision' : 'ko'
    this.fightState.result = {
      winner: winnerId,
      method,
      round: this.fightState.round,
      time: this.formatTime(180 - this.fightState.clock)
    }
    
    this.stop()
    this.addCommentary(`${method}! ${winnerId} wins!`, 'general', 'high')
  }

  private endByDecision(): void {
    const f1Score = this.calculateScore(this.fightState.fighter1)
    const f2Score = this.calculateScore(this.fightState.fighter2)
    const winnerId = f1Score >= f2Score ? this.fightState.fighter1.id : this.fightState.fighter2.id
    
    this.endFight(winnerId, 'Decision')
  }

  private calculateScore(fighter: FighterState): number {
    return fighter.stats.landed * 2 + fighter.stats.powerShots * 5 + fighter.hp * 0.5
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  private addCommentary(text: string, type: Commentary['type'], priority: Commentary['priority']): void {
    const comment: Commentary = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp: Date.now(),
      type,
      priority
    }
    
    this.commentary.push(comment)
    this.onCommentary?.(comment)
  }

  private getHitCommentary(strikeType: string): string {
    const comments = {
      jab: ['Clean jab lands!', 'Sharp jab connects!', 'Nice jab to the head!'],
      cross: ['Hard cross finds its mark!', 'Power cross lands flush!', 'Big right hand connects!'],
      hook: ['Devastating hook!', 'Crushing hook to the body!', 'Wicked left hook!'],
      uppercut: ['Thunderous uppercut!', 'Brutal uppercut snaps the head back!', 'Devastating uppercut!']
    }
    
    const options = comments[strikeType as keyof typeof comments] || comments.jab
    return options[Math.floor(Math.random() * options.length)]
  }

  private getPowerShotCommentary(strikeType: string): string {
    const comments = {
      jab: ['MASSIVE jab! That rocked them!', 'HUGE power jab!'],
      cross: ['DEVASTATING cross! What a shot!', 'THUNDEROUS right hand!'],
      hook: ['CRUSHING hook! They\'re hurt!', 'VICIOUS hook to the body!'],
      uppercut: ['BRUTAL uppercut! Down goes the fighter!', 'NUCLEAR uppercut!']
    }
    
    const options = comments[strikeType as keyof typeof comments] || comments.cross
    return options[Math.floor(Math.random() * options.length)]
  }

  private getMissCommentary(strikeType: string): string {
    const comments = [
      'Misses with the wild swing!',
      'Whiffs on that attempt!',
      'Nice head movement to avoid that shot!',
      'Just misses the target!',
      'Swings and misses!'
    ]
    return comments[Math.floor(Math.random() * comments.length)]
  }

  public getState(): FightState {
    return this.fightState
  }

  public getCommentary(): Commentary[] {
    return this.commentary
  }
}