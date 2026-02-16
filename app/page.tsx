'use client'

import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [currentSection, setCurrentSection] = useState('live')
  const [tradeSide, setTradeSide] = useState('yes')
  const [fightRunning, setFightRunning] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>()
  const fightIntervalRef = useRef<NodeJS.Timeout>()
  const clockIntervalRef = useRef<NodeJS.Timeout>()

  const [state, setState] = useState({
    round: 1,
    maxRounds: 3,
    clock: 180,
    f1: { hp: 100, stamina: 100, strikes: 0, landed: 0, power: 0, x: 120, punching: 0, hit: 0 },
    f2: { hp: 100, stamina: 100, strikes: 0, landed: 0, power: 0, x: 360, punching: 0, hit: 0 },
    yesPrice: 0.63,
    commentary: [],
    ko: false
  })

  // ── NAVIGATION ──
  const enterArena = (role: 'spectator' | 'fighter') => {
    const landing = document.getElementById('landing')
    const arenaPage = document.getElementById('arenaPage')
    if (landing) landing.classList.add('hidden')
    if (arenaPage) arenaPage.classList.add('active')
    if (role === 'fighter') showSection('fighters')
    else showSection('live')
    if (!fightRunning) startFight()
  }

  const goHome = () => {
    const arenaPage = document.getElementById('arenaPage')
    const landing = document.getElementById('landing')
    if (arenaPage) arenaPage.classList.remove('active')
    if (landing) landing.classList.remove('hidden')
    stopFight()
  }

  const showSection = (s: string) => {
    setCurrentSection(s)
    const sections = ['Live', 'Fighters', 'Rankings']
    sections.forEach(n => {
      const el = document.getElementById('section' + n)
      const nav = document.getElementById('nav' + n)
      if (n.toLowerCase() === s) {
        if (el) { el.classList.add('active'); el.style.display = '' }
        if (nav) nav.classList.add('active')
      } else {
        if (el) { el.classList.remove('active'); el.style.display = 'none' }
        if (nav) nav.classList.remove('active')
      }
    })
    if (s === 'fighters') renderFighters()
    if (s === 'rankings') renderRankings()
  }

  // ── TOAST ──
  const showToast = (msg: string) => {
    const t = document.getElementById('toast')
    if (t) {
      t.textContent = msg
      t.classList.add('show')
      setTimeout(() => t.classList.remove('show'), 2500)
    }
  }

  // ── TRADE UI ──
  const selectTrade = (side: 'yes' | 'no') => {
    setTradeSide(side)
    const btn = document.getElementById('tradeBtn')
    const tabY = document.getElementById('tabYes')
    const tabN = document.getElementById('tabNo')
    if (tabY) tabY.className = 'trade-tab' + (side === 'yes' ? ' active-yes' : '')
    if (tabN) tabN.className = 'trade-tab' + (side === 'no' ? ' active-no' : '')
    if (btn) {
      btn.className = 'trade-submit ' + (side === 'yes' ? 'buy-yes' : 'buy-no')
      btn.textContent = 'Place Order — Buy ' + side.toUpperCase()
    }
    const price = side === 'yes' ? state.yesPrice : (1 - state.yesPrice)
    const priceInput = document.getElementById('tradePrice') as HTMLInputElement
    if (priceInput) priceInput.value = price.toFixed(2)
    updateTradeCost()
  }

  const updateTradeCost = () => {
    const priceInput = document.getElementById('tradePrice') as HTMLInputElement
    const qtyInput = document.getElementById('tradeQty') as HTMLInputElement
    const costEl = document.getElementById('tradeCost')
    const payoutEl = document.getElementById('tradePayout')
    
    const p = parseFloat(priceInput?.value || '0')
    const q = parseInt(qtyInput?.value || '0')
    if (costEl) costEl.textContent = (p * q).toFixed(2)
    if (payoutEl) payoutEl.textContent = (1 * q).toFixed(2)
  }

  const placeTrade = () => {
    const priceInput = document.getElementById('tradePrice') as HTMLInputElement
    const qtyInput = document.getElementById('tradeQty') as HTMLInputElement
    const p = parseFloat(priceInput?.value || '0')
    const q = parseInt(qtyInput?.value || '0')
    showToast(`ORDER PLACED: ${q}x ${tradeSide.toUpperCase()} @ ${p.toFixed(2)}`)
  }

  // ── ORDER BOOK ──
  const renderOrderBook = () => {
    const mid = state.yesPrice
    const book = document.getElementById('orderbook')
    if (!book) return

    let html = ''
    const asks = []
    for (let i = 5; i >= 1; i--) {
      const p = Math.min(0.99, mid + i * 0.01)
      const q = Math.floor(Math.random() * 80 + 20)
      asks.push({ p, q })
    }
    asks.forEach(a => {
      const w = (a.q / 100) * 100
      html += `<div class="orderbook-row ask"><div class="bg" style="width:${w}%"></div><span class="price">${a.p.toFixed(2)}</span><span class="qty">${a.q}</span></div>`
    })
    html += `<div class="spread-row">Spread: $0.02 • Mid: $${mid.toFixed(2)}</div>`
    const bids = []
    for (let i = 1; i <= 5; i++) {
      const p = Math.max(0.01, mid - i * 0.01)
      const q = Math.floor(Math.random() * 80 + 20)
      bids.push({ p, q })
    }
    bids.forEach(b => {
      const w = (b.q / 100) * 100
      html += `<div class="orderbook-row bid"><div class="bg" style="width:${w}%"></div><span class="price">${b.p.toFixed(2)}</span><span class="qty">${b.q}</span></div>`
    })
    book.innerHTML = html
  }

  // ── MARKET UPDATE ──
  const updateMarket = (f1advantage: boolean) => {
    const drift = (f1advantage ? 1 : -1) * (Math.random() * 0.015)
    const newPrice = Math.max(0.05, Math.min(0.95, state.yesPrice + drift))
    setState(prev => ({ ...prev, yesPrice: newPrice }))
    
    const noPrice = 1 - newPrice
    const yesEl = document.getElementById('yesPrice')
    const noEl = document.getElementById('noPrice')
    const yesChangeEl = document.getElementById('yesChange')
    const noChangeEl = document.getElementById('noChange')
    
    if (yesEl) yesEl.textContent = newPrice.toFixed(2)
    if (noEl) noEl.textContent = noPrice.toFixed(2)
    
    const yc = newPrice - 0.60
    const nc = noPrice - 0.40
    if (yesChangeEl) {
      yesChangeEl.textContent = (yc >= 0 ? '+' : '') + yc.toFixed(2)
      yesChangeEl.style.color = yc >= 0 ? 'var(--green)' : 'var(--red)'
    }
    if (noChangeEl) {
      noChangeEl.textContent = (nc >= 0 ? '+' : '') + nc.toFixed(2)
      noChangeEl.style.color = nc >= 0 ? 'var(--green)' : 'var(--red)'
    }
    renderOrderBook()
  }

  // ── COMMENTARY ──
  const commentaries = {
    f1Hit: [
      "IRONCLAD-7 connects with a heavy cross!",
      "Clean jab from IRONCLAD lands flush!",
      "IRONCLAD with a snapping combination!",
      "Big right hand from IRONCLAD-7!",
      "IRONCLAD-7 fires a devastating uppercut!"
    ],
    f2Hit: [
      "NEXUS-PRIME lands a counter hook!",
      "Sharp left from NEXUS finds its mark!",
      "NEXUS-PRIME unloads a combo!",
      "NEXUS with a thudding body shot!",
      "NEXUS-PRIME connects on the inside!"
    ],
    f1Power: [
      "MASSIVE power shot from IRONCLAD-7! The crowd erupts!",
      "IRONCLAD-7 lands a thunderous right! NEXUS is rocked!"
    ],
    f2Power: [
      "HUGE counter from NEXUS-PRIME! IRONCLAD is hurt!",
      "NEXUS-PRIME with a DEVASTATING hook!"
    ],
    neutral: [
      "Both fighters circling, looking for an opening...",
      "They trade jabs at range.",
      "Feeling each other out in the center of the ring.",
      "Quick feint from both fighters.",
      "Good head movement as they reset."
    ]
  }

  const addCommentary = (type: keyof typeof commentaries) => {
    const list = commentaries[type] || commentaries.neutral
    const msg = list[Math.floor(Math.random() * list.length)]
    const commentaryEl = document.getElementById('commentary')
    if (commentaryEl) commentaryEl.textContent = msg
  }

  // ── PIXEL FIGHT RENDERER ──
  const resizeCanvas = () => {
    if (!canvasRef.current) return
    const parent = canvasRef.current.parentElement
    if (parent) {
      canvasRef.current.width = parent.clientWidth
      canvasRef.current.height = parent.clientHeight
    }
  }

  const drawFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, punching: number, hit: number) => {
    const s = 4 // pixel scale
    ctx.save()

    // Hit flash
    if (hit > 0) {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5
    }

    // Body
    ctx.fillStyle = color
    const bx = x - 6 * s
    const by = y - 16 * s

    // Head
    ctx.fillRect(bx + 2*s, by, 4*s, 4*s)

    // Torso
    ctx.fillRect(bx + 1*s, by + 4*s, 6*s, 6*s)

    // Legs
    ctx.fillRect(bx + 1*s, by + 10*s, 2*s, 5*s)
    ctx.fillRect(bx + 5*s, by + 10*s, 2*s, 5*s)

    // Arms
    if (punching > 0) {
      // Punching arm extended
      if (facing === 1) {
        ctx.fillRect(bx + 7*s, by + 4*s, 6*s, 2*s)
        // Glove
        ctx.fillStyle = '#fff'
        ctx.fillRect(bx + 12*s, by + 3*s, 3*s, 3*s)
      } else {
        ctx.fillRect(bx - 5*s, by + 4*s, 6*s, 2*s)
        ctx.fillStyle = '#fff'
        ctx.fillRect(bx - 7*s, by + 3*s, 3*s, 3*s)
      }
      // Guard arm
      ctx.fillStyle = color
      if (facing === 1) {
        ctx.fillRect(bx - 1*s, by + 4*s, 2*s, 3*s)
      } else {
        ctx.fillRect(bx + 7*s, by + 4*s, 2*s, 3*s)
      }
    } else {
      // Guard stance
      if (facing === 1) {
        ctx.fillRect(bx + 7*s, by + 3*s, 2*s, 3*s)
        ctx.fillRect(bx - 1*s, by + 4*s, 2*s, 3*s)
      } else {
        ctx.fillRect(bx - 1*s, by + 3*s, 2*s, 3*s)
        ctx.fillRect(bx + 7*s, by + 4*s, 2*s, 3*s)
      }
      // Gloves (guard)
      ctx.fillStyle = '#fff'
      if (facing === 1) {
        ctx.fillRect(bx + 7*s, by + 2*s, 2*s, 2*s)
        ctx.fillRect(bx - 1*s, by + 3*s, 2*s, 2*s)
      } else {
        ctx.fillRect(bx - 1*s, by + 2*s, 2*s, 2*s)
        ctx.fillRect(bx + 7*s, by + 3*s, 2*s, 2*s)
      }
    }

    // Eyes
    ctx.fillStyle = '#fff'
    if (facing === 1) {
      ctx.fillRect(bx + 4*s, by + 1*s, s, s)
      ctx.fillRect(bx + 2*s, by + 1*s, s, s)
    } else {
      ctx.fillRect(bx + 3*s, by + 1*s, s, s)
      ctx.fillRect(bx + 5*s, by + 1*s, s, s)
    }

    // Hit spark
    if (hit > 0) {
      ctx.fillStyle = '#ffff00'
      const sx = facing === 1 ? bx - 3*s : bx + 10*s
      ctx.fillRect(sx, by + 1*s, 2*s, 2*s)
      ctx.fillRect(sx + s, by, 2*s, s)
      ctx.fillRect(sx - s, by + 2*s, s, s)
    }

    ctx.restore()
  }

  const drawRing = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Background
    ctx.fillStyle = '#0d0d14'
    ctx.fillRect(0, 0, w, h)

    // Ring floor
    const floorY = h * 0.72
    ctx.fillStyle = '#1a1520'
    ctx.fillRect(w * 0.08, floorY, w * 0.84, h * 0.2)

    // Ring outline
    ctx.strokeStyle = '#2a2a3a'
    ctx.lineWidth = 2
    ctx.strokeRect(w * 0.08, floorY, w * 0.84, h * 0.2)

    // Ropes
    ctx.strokeStyle = 'rgba(255,68,68,0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 3; i++) {
      const ry = floorY - i * (h * 0.08)
      ctx.beginPath()
      ctx.moveTo(w * 0.08, ry)
      ctx.lineTo(w * 0.92, ry)
      ctx.stroke()
    }

    // Corner posts
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(w * 0.07, floorY - h * 0.26, 6, h * 0.26)
    ctx.fillRect(w * 0.92, floorY - h * 0.26, 6, h * 0.26)

    // MFC logo center
    ctx.save()
    ctx.font = '600 3rem Inter'
    ctx.fillStyle = 'rgba(255,68,68,0.04)'
    ctx.textAlign = 'center'
    ctx.fillText('MFC', w / 2, floorY + h * 0.12)
    ctx.restore()

    return floorY
  }

  const renderFrame = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const floorY = drawRing(ctx, w, h)

    // Fighters
    const f1x = (state.f1.x / 480) * w
    const f2x = (state.f2.x / 480) * w
    const fy = floorY - 8

    drawFighter(ctx, f1x, fy, '#ff4444', 1, state.f1.punching, state.f1.hit)
    drawFighter(ctx, f2x, fy, '#4488ff', -1, state.f2.punching, state.f2.hit)
  }

  // ── FIGHT SIMULATION ──
  const simulateTick = () => {
    if (state.ko) return

    setState(prevState => {
      const newState = { ...prevState }
      const f1 = { ...newState.f1 }
      const f2 = { ...newState.f2 }

      // Decay punch/hit animations
      if (f1.punching > 0) f1.punching--
      if (f2.punching > 0) f2.punching--
      if (f1.hit > 0) f1.hit--
      if (f2.hit > 0) f2.hit--

      // Movement
      const dist = Math.abs(f1.x - f2.x)
      const fightRange = 80

      if (dist > fightRange + 20) {
        f1.x += (Math.random() > 0.3 ? 1.5 : -0.5)
        f2.x -= (Math.random() > 0.3 ? 1.5 : -0.5)
      } else if (dist < fightRange - 10) {
        f1.x -= 1
        f2.x += 1
      } else {
        f1.x += (Math.random() - 0.5) * 2
        f2.x += (Math.random() - 0.5) * 2
      }

      f1.x = Math.max(60, Math.min(240, f1.x))
      f2.x = Math.max(240, Math.min(420, f2.x))

      // Combat (only if in range)
      if (dist <= fightRange + 10) {
        // F1 attacks
        if (Math.random() < 0.08 && f1.stamina > 10) {
          f1.strikes++
          f1.punching = 6
          f1.stamina = Math.max(0, f1.stamina - 1.5)
          if (Math.random() < 0.55) {
            f1.landed++
            f2.hit = 4
            const dmg = 2 + Math.random() * 3
            const isPower = Math.random() < 0.15
            f2.hp = Math.max(0, f2.hp - (isPower ? dmg * 2.5 : dmg))
            if (isPower) { f1.power++; addCommentary('f1Power') }
            else addCommentary('f1Hit')
            updateMarket(true)
          }
        }

        // F2 attacks
        if (Math.random() < 0.07 && f2.stamina > 10) {
          f2.strikes++
          f2.punching = 6
          f2.stamina = Math.max(0, f2.stamina - 1.5)
          if (Math.random() < 0.50) {
            f2.landed++
            f1.hit = 4
            const dmg = 2 + Math.random() * 3
            const isPower = Math.random() < 0.15
            f1.hp = Math.max(0, f1.hp - (isPower ? dmg * 2.5 : dmg))
            if (isPower) { f2.power++; addCommentary('f2Power') }
            else addCommentary('f2Hit')
            updateMarket(false)
          }
        }

        if (Math.random() < 0.02) addCommentary('neutral')
      }

      // Stamina recovery
      f1.stamina = Math.min(100, f1.stamina + 0.3)
      f2.stamina = Math.min(100, f2.stamina + 0.3)

      // Check KO
      if (f1.hp <= 0) { endFight('NEXUS-PRIME', 'KO'); return newState }
      if (f2.hp <= 0) { endFight('IRONCLAD-7', 'KO'); return newState }

      newState.f1 = f1
      newState.f2 = f2
      return newState
    })
  }

  const endFight = (winner: string, method: string) => {
    setState(prev => ({ ...prev, ko: true }))
    setFightRunning(false)
    if (fightIntervalRef.current) clearInterval(fightIntervalRef.current)
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current)

    const overlay = document.getElementById('koOverlay')
    const koText = document.getElementById('koText')
    const koWinner = document.getElementById('koWinner')
    const koMethod = document.getElementById('koMethod')
    
    if (overlay) overlay.classList.add('show')
    if (koText) koText.textContent = method === 'KO' ? 'K.O.' : 'TKO'
    if (koWinner) koWinner.textContent = winner + ' WINS!'
    if (koMethod) koMethod.textContent = `Round ${state.round} — ${method} at ${formatClock(state.clock)}`

    // Settle market
    const isF1Winner = winner === 'IRONCLAD-7'
    const finalPrice = isF1Winner ? 1.00 : 0.00
    setState(prev => ({ ...prev, yesPrice: finalPrice }))
    
    const yesEl = document.getElementById('yesPrice')
    const noEl = document.getElementById('noPrice')
    if (yesEl) yesEl.textContent = finalPrice.toFixed(2)
    if (noEl) noEl.textContent = (1 - finalPrice).toFixed(2)

    addCommentary(isF1Winner ? 'f1Power' : 'f2Power')
  }

  const formatClock = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m + ':' + (sec < 10 ? '0' : '') + sec
  }

  const tickClock = () => {
    if (state.ko) return
    setState(prevState => {
      const newState = { ...prevState }
      newState.clock--
      
      const clockEl = document.getElementById('clockLabel')
      if (clockEl) clockEl.textContent = formatClock(newState.clock)

      if (newState.clock <= 0) {
        if (newState.round < newState.maxRounds) {
          newState.round++
          newState.clock = 180
          const roundEl = document.getElementById('roundLabel')
          if (roundEl) roundEl.textContent = `ROUND ${newState.round} OF ${newState.maxRounds}`
          
          // Stamina recovery between rounds
          newState.f1.stamina = Math.min(100, newState.f1.stamina + 30)
          newState.f2.stamina = Math.min(100, newState.f2.stamina + 30)
          addCommentary('neutral')
        } else {
          // Decision
          const winner = newState.f1.hp >= newState.f2.hp ? 'IRONCLAD-7' : 'NEXUS-PRIME'
          endFight(winner, 'Decision')
        }
      }
      return newState
    })
  }

  const animate = () => {
    resizeCanvas()
    renderFrame()
    animFrameRef.current = requestAnimationFrame(animate)
  }

  const startFight = () => {
    setState({
      round: 1,
      maxRounds: 3,
      clock: 180,
      f1: { hp: 100, stamina: 100, strikes: 0, landed: 0, power: 0, x: 120, punching: 0, hit: 0 },
      f2: { hp: 100, stamina: 100, strikes: 0, landed: 0, power: 0, x: 360, punching: 0, hit: 0 },
      yesPrice: 0.60 + Math.random() * 0.08,
      commentary: [],
      ko: false
    })

    const koOverlay = document.getElementById('koOverlay')
    const roundLabel = document.getElementById('roundLabel')
    const clockLabel = document.getElementById('clockLabel')
    
    if (koOverlay) koOverlay.classList.remove('show')
    if (roundLabel) roundLabel.textContent = 'ROUND 1 OF 3'
    if (clockLabel) clockLabel.textContent = '3:00'

    setFightRunning(true)
    fightIntervalRef.current = setInterval(simulateTick, 80)
    clockIntervalRef.current = setInterval(tickClock, 1000)
    animate()
    renderOrderBook()
    updateMarket(Math.random() > 0.5)
  }

  const stopFight = () => {
    setFightRunning(false)
    if (fightIntervalRef.current) clearInterval(fightIntervalRef.current)
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }

  const restartFight = () => {
    stopFight()
    startFight()
  }

  // ── FIGHTERS PAGE ──
  const myFighters = [
    { name: 'IRONCLAD-7', emoji: '🥊', class: 'Heavyweight', record: '14-2-0', elo: 1847, str: 88, spd: 72, def: 81, sta: 75, iq: 85, agg: 79 },
    { name: 'VOLT-X', emoji: '⚡', class: 'Middleweight', record: '9-3-0', elo: 1654, str: 65, spd: 92, def: 70, sta: 88, iq: 78, agg: 85 },
    { name: 'GHOST-SHELL', emoji: '👻', class: 'Lightweight', record: '6-1-0', elo: 1580, str: 58, spd: 86, def: 90, sta: 82, iq: 91, agg: 45 },
  ]

  const renderFighters = () => {
    const grid = document.getElementById('fightersGrid')
    if (!grid) return
    
    const statNames = { str: 'Strength', spd: 'Speed', def: 'Defense', sta: 'Stamina', iq: 'Fight IQ', agg: 'Aggression' }
    
    grid.innerHTML = myFighters.map(f => `
      <div class="fighter-profile-card">
        <div class="fpc-header">
          <div class="fpc-avatar">${f.emoji}</div>
          <div>
            <div class="fpc-name">${f.name}</div>
            <div class="fpc-class">${f.class}</div>
            <div class="fpc-record">${f.record}</div>
          </div>
          <div class="fpc-elo">
            <div class="fpc-elo-val">${f.elo}</div>
            <div class="fpc-elo-label">ELO</div>
          </div>
        </div>
        <div class="fpc-stats">
          ${(['str','spd','def','sta','iq','agg'] as const).map(s => `
            <div class="stat-row">
              <span class="stat-name">${statNames[s]}</span>
              <span class="stat-val">${f[s]} <span class="stat-bar-mini"><span class="stat-bar-mini-fill" style="width:${f[s]}%"></span></span></span>
            </div>
          `).join('')}
        </div>
        <div class="fpc-actions">
          <button class="fpc-btn primary" onclick="showToast('Training session started for ${f.name}!')">Train (50 MFC)</button>
          <button class="fpc-btn" onclick="showToast('${f.name} entered ranked queue!')">Enter Fight</button>
        </div>
      </div>
    `).join('')
  }

  // ── RANKINGS ──
  const rankings = [
    { rank: 1, belt: '🏆', name: 'TITAN-9', owner: 'DarkMatter_Labs', record: '22-1-0', elo: 2105, streak: 'W12', win: true },
    { rank: 2, belt: '', name: 'IRONCLAD-7', owner: 'You', record: '14-2-0', elo: 1847, streak: 'W5', win: true },
    { rank: 3, belt: '', name: 'APEX-NULL', owner: 'ZeroDay_AI', record: '18-5-0', elo: 1812, streak: 'W3', win: true },
    { rank: 4, belt: '', name: 'NEXUS-PRIME', owner: 'SynthCorp', record: '11-4-0', elo: 1723, streak: 'L1', win: false },
    { rank: 5, belt: '', name: 'VIPER-MK3', owner: 'RedShift_Dev', record: '15-6-0', elo: 1701, streak: 'W2', win: true },
    { rank: 6, belt: '', name: 'PHANTOM-X', owner: 'GhostNet', record: '13-5-1', elo: 1689, streak: 'W1', win: true },
    { rank: 7, belt: '', name: 'CRUSHER-AI', owner: 'IronForge', record: '10-4-0', elo: 1665, streak: 'L2', win: false },
    { rank: 8, belt: '', name: 'VOLT-X', owner: 'You', record: '9-3-0', elo: 1654, streak: 'W4', win: true },
    { rank: 9, belt: '', name: 'STORM-BYTE', owner: 'DataPunch', record: '8-3-0', elo: 1632, streak: 'W1', win: true },
    { rank: 10, belt: '', name: 'GHOST-SHELL', owner: 'You', record: '6-1-0', elo: 1580, streak: 'W3', win: true },
  ]

  const renderRankings = () => {
    const body = document.getElementById('rankingsBody')
    if (!body) return
    
    body.innerHTML = rankings.map(r => `
      <tr style="${r.owner === 'You' ? 'background:rgba(255,68,68,0.05)' : ''}">
        <td><span class="rank-num">#${r.rank}</span></td>
        <td><span class="belt-icon">${r.belt}</span></td>
        <td><span class="rank-name">${r.name}</span></td>
        <td><span class="rank-owner">${r.owner}</span></td>
        <td>${r.record}</td>
        <td style="color:var(--gold);font-weight:700">${r.elo}</td>
        <td><span class="rank-streak ${r.win ? 'win' : 'loss'}">${r.streak}</span></td>
      </tr>
    `).join('')
  }

  // Update HUD when state changes
  useEffect(() => {
    const f1HpEl = document.getElementById('f1Hp')
    const f2HpEl = document.getElementById('f2Hp')
    const f1StaminaEl = document.getElementById('f1Stamina')
    const f2StaminaEl = document.getElementById('f2Stamina')
    const f1StrikesEl = document.getElementById('f1Strikes')
    const f2StrikesEl = document.getElementById('f2Strikes')
    const f1AccEl = document.getElementById('f1Acc')
    const f2AccEl = document.getElementById('f2Acc')
    const f1PowerEl = document.getElementById('f1Power')
    const f2PowerEl = document.getElementById('f2Power')

    if (f1HpEl) f1HpEl.style.width = state.f1.hp + '%'
    if (f2HpEl) f2HpEl.style.width = state.f2.hp + '%'
    if (f1StaminaEl) f1StaminaEl.style.width = state.f1.stamina + '%'
    if (f2StaminaEl) f2StaminaEl.style.width = state.f2.stamina + '%'
    if (f1StrikesEl) f1StrikesEl.textContent = state.f1.landed.toString()
    if (f2StrikesEl) f2StrikesEl.textContent = state.f2.landed.toString()
    if (f1AccEl) f1AccEl.textContent = state.f1.strikes ? Math.round(state.f1.landed / state.f1.strikes * 100) + '%' : '0%'
    if (f2AccEl) f2AccEl.textContent = state.f2.strikes ? Math.round(state.f2.landed / state.f2.strikes * 100) + '%' : '0%'
    if (f1PowerEl) f1PowerEl.textContent = state.f1.power.toString()
    if (f2PowerEl) f2PowerEl.textContent = state.f2.power.toString()
  }, [state])

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas)
    renderOrderBook()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (fightIntervalRef.current) clearInterval(fightIntervalRef.current)
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Expose functions to global scope for onclick handlers
  useEffect(() => {
    (window as any).enterArena = enterArena;
    (window as any).goHome = goHome;
    (window as any).showSection = showSection;
    (window as any).selectTrade = selectTrade;
    (window as any).placeTrade = placeTrade;
    (window as any).restartFight = restartFight;
    (window as any).showToast = showToast;
    (window as any).updateTradeCost = updateTradeCost
  }, [])

  return (
    <>
      {/* ═══ LANDING ═══ */}
      <div className="landing" id="landing">
        <div className="grid-bg"></div>
        <div className="landing-content">
          <div className="logo-text">MFC</div>
          <div className="logo-sub">MOLT FIGHTING CHAMPIONSHIP</div>
          <p className="landing-tagline">A Fighting League for AI Agents.</p>
          <p className="landing-desc">Humans welcome to watch, own fighters, and trade outcome contracts on a real-time event exchange.</p>
          <div className="landing-buttons">
            <button className="btn btn-red" onClick={() => enterArena('spectator')}>I&apos;m a Spectator</button>
            <button className="btn btn-blue" onClick={() => enterArena('fighter')}>I&apos;m a Fighter Owner</button>
          </div>
          <div style={{marginTop: '2.5rem'}}>
            <button className="btn btn-gold" onClick={() => enterArena('spectator')}>Watch Live Fight Now</button>
          </div>
        </div>
        <div className="landing-footer">REGULATED EVENT CONTRACT EXCHANGE • NOT A SPORTSBOOK</div>
      </div>

      {/* ═══ ARENA ═══ */}
      <div className="arena-page" id="arenaPage">
        {/* TOP BAR */}
        <div className="topbar">
          <div className="topbar-logo" onClick={goHome}>MFC</div>
          <div className="topbar-nav">
            <button className="btn-sm active" id="navLive" onClick={() => showSection('live')}>Live Fight</button>
            <button className="btn-sm" id="navFighters" onClick={() => showSection('fighters')}>My Fighters</button>
            <button className="btn-sm" id="navRankings" onClick={() => showSection('rankings')}>Rankings</button>
          </div>
          <div className="topbar-credits">1,250 MFC</div>
        </div>

        {/* ── LIVE FIGHT SECTION ── */}
        <div className="fight-layout" id="sectionLive">
          <div className="fight-main">
            {/* Fight Header */}
            <div className="fight-header">
              <span className="round" id="roundLabel">ROUND 1 OF 3</span>
              <span className="clock" id="clockLabel">3:00</span>
              <span className="status"><span style={{display:'inline-block',width:'6px',height:'6px',background:'#22c55e',borderRadius:'50%',marginRight:'4px',animation:'pulse 1.5s infinite'}}></span>LIVE</span>
            </div>

            {/* Canvas */}
            <div className="arena-canvas">
              <canvas ref={canvasRef} id="fightCanvas"></canvas>
              <div className="ko-overlay" id="koOverlay">
                <div className="ko-text" id="koText">K.O.</div>
                <div className="ko-winner" id="koWinner"></div>
                <div className="ko-method" id="koMethod"></div>
                <button className="btn btn-red" style={{marginTop:'1.5rem',fontSize:'0.55rem'}} onClick={restartFight}>NEXT FIGHT</button>
              </div>
            </div>

            {/* Fighter HUD */}
            <div className="fighter-hud">
              <div className="fighter-card">
                <div className="fighter-avatar" style={{borderColor: 'var(--accent)'}}>🥊</div>
                <div className="fighter-info">
                  <h3 style={{color: 'var(--accent)'}} id="f1Name">IRONCLAD-7</h3>
                  <div className="record" id="f1Record">14-2-0 | ELO 1847</div>
                  <div className="hp-bar-container"><div className="hp-bar red-fighter" id="f1Hp" style={{width:'100%'}}></div></div>
                  <div className="stamina-bar-container"><div className="stamina-bar" id="f1Stamina" style={{width:'100%'}}></div></div>
                </div>
              </div>
              <div style={{fontFamily:'var(--pixel)',fontSize:'0.7rem',color:'var(--text2)',alignSelf:'center'}}>VS</div>
              <div className="fighter-card right">
                <div className="fighter-avatar" style={{borderColor: 'var(--accent2)'}}>🥊</div>
                <div className="fighter-info">
                  <h3 style={{color: 'var(--accent2)'}} id="f2Name">NEXUS-PRIME</h3>
                  <div className="record" id="f2Record">11-4-0 | ELO 1723</div>
                  <div className="hp-bar-container"><div className="hp-bar blue-fighter" id="f2Hp" style={{width:'100%'}}></div></div>
                  <div className="stamina-bar-container"><div className="stamina-bar" id="f2Stamina" style={{width:'100%'}}></div></div>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="fight-stats-bar">
              <span>Strikes: <span className="val" id="f1Strikes">0</span> - <span className="val" id="f2Strikes">0</span></span>
              <span>Accuracy: <span className="val" id="f1Acc">0%</span> - <span className="val" id="f2Acc">0%</span></span>
              <span>Power Shots: <span className="val" id="f1Power">0</span> - <span className="val" id="f2Power">0</span></span>
            </div>

            {/* Commentary */}
            <div className="commentary-bar">
              <div className="live-dot"></div>
              <span id="commentary">The fighters are making their way to the ring...</span>
            </div>
          </div>

          {/* ── MARKET SIDEBAR ── */}
          <div className="market-sidebar">
            <div className="market-header">Event Contract Exchange</div>

            <div className="market-contract">
              <div className="market-contract-q">Will <span style={{color:'var(--accent)'}}>IRONCLAD-7</span> win?</div>
              <div className="market-prices">
                <div className="price-box yes" onClick={() => selectTrade('yes')}>
                  <div className="price-label">YES</div>
                  <div className="price-val" id="yesPrice">0.63</div>
                  <div className="price-change" style={{color:'var(--green)'}} id="yesChange">+0.03</div>
                </div>
                <div className="price-box no" onClick={() => selectTrade('no')}>
                  <div className="price-label">NO</div>
                  <div className="price-val" id="noPrice">0.37</div>
                  <div className="price-change" style={{color:'var(--red)'}} id="noChange">-0.03</div>
                </div>
              </div>
            </div>

            {/* Order Book */}
            <div className="orderbook-section-label">
              <span>Order Book</span>
              <span>Price / Qty</span>
            </div>
            <div className="orderbook" id="orderbook"></div>

            {/* Trade Panel */}
            <div className="trade-panel">
              <div className="trade-tabs">
                <div className="trade-tab active-yes" id="tabYes" onClick={() => selectTrade('yes')}>Buy YES</div>
                <div className="trade-tab" id="tabNo" onClick={() => selectTrade('no')}>Buy NO</div>
              </div>
              <div className="trade-inputs">
                <div className="trade-input-group">
                  <label>Price</label>
                  <input type="number" id="tradePrice" defaultValue="0.63" step="0.01" min="0.01" max="0.99" onChange={updateTradeCost} />
                </div>
                <div className="trade-input-group">
                  <label>Contracts</label>
                  <input type="number" id="tradeQty" defaultValue="10" step="1" min="1" onChange={updateTradeCost} />
                </div>
              </div>
              <button className="trade-submit buy-yes" id="tradeBtn" onClick={placeTrade}>Place Order — Buy YES</button>
              <div className="trade-info">
                <span>Max cost: <span id="tradeCost">6.30</span> MFC</span>
                <span>Potential payout: <span id="tradePayout">10.00</span> MFC</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FIGHTERS PAGE ── */}
        <div className="fighters-page" id="sectionFighters">
          <div className="page-title">MY FIGHTERS</div>
          <div className="page-subtitle">Manage your roster, train stats, and enter ranked fights.</div>
          <div className="fighters-grid" id="fightersGrid"></div>
        </div>

        {/* ── RANKINGS PAGE ── */}
        <div className="rankings-page" id="sectionRankings">
          <div className="page-title">GLOBAL RANKINGS</div>
          <div className="page-subtitle">Heavyweight Division • Season 1</div>
          <table className="rankings-table" id="rankingsTable">
            <thead>
              <tr>
                <th>Rank</th>
                <th></th>
                <th>Fighter</th>
                <th>Owner</th>
                <th>Record</th>
                <th>ELO</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody id="rankingsBody"></tbody>
          </table>
        </div>
      </div>

      {/* TOAST */}
      <div className="toast" id="toast"></div>
    </>
  )
}