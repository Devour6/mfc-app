import { MarketState, OrderBookEntry, Trade, FightState } from '@/types'

export class MarketEngine {
  // Exchange economics — MFC takes a cut on every trade + settlement
  static readonly TAKER_FEE = 0.02      // 2% fee on every trade
  static readonly VIG = 0.02             // 2% overround on displayed prices
  static readonly SETTLEMENT_FEE = 0.02  // 2% fee on winning payouts

  private marketState: MarketState
  private onStateUpdate?: (state: MarketState) => void
  private simulationInterval?: NodeJS.Timeout
  private priceUpdateInterval?: NodeJS.Timeout
  private isActive: boolean = false

  constructor(
    initialQuestion: string,
    initialYesPrice: number = 0.5,
    onStateUpdate?: (state: MarketState) => void
  ) {
    this.onStateUpdate = onStateUpdate
    this.marketState = {
      contractQuestion: initialQuestion,
      yesPrice: initialYesPrice,
      noPrice: 1 - initialYesPrice,
      volume: 0,
      lastTrade: 0,
      houseRevenue: 0,
      priceHistory: [{
        timestamp: Date.now(),
        price: initialYesPrice,
        volume: 0
      }],
      orderBook: {
        bids: this.generateInitialBids(initialYesPrice),
        asks: this.generateInitialAsks(initialYesPrice)
      }
    }
  }

  public start(): void {
    if (this.isActive) return
    
    this.isActive = true
    
    // Update market prices based on simulated activity
    this.priceUpdateInterval = setInterval(() => {
      this.updateMarketPrices()
    }, 2000 + Math.random() * 3000) // Random interval 2-5 seconds
    
    // Simulate order book activity
    this.simulationInterval = setInterval(() => {
      this.simulateOrderBookActivity()
    }, 1000 + Math.random() * 2000) // Random interval 1-3 seconds
  }

  public stop(): void {
    this.isActive = false
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = undefined
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval)
      this.simulationInterval = undefined
    }
  }

  public updateBasedOnFightState(fightState: FightState): void {
    if (!this.isActive) return

    const f1 = fightState.fighter1
    const f2 = fightState.fighter2
    
    // Calculate fight advantage based on multiple factors
    let f1Advantage = 0
    
    // HP advantage
    const hpDiff = f1.hp - f2.hp
    f1Advantage += hpDiff * 0.003 // 0.3% per HP point difference
    
    // Landing percentage advantage
    const f1Accuracy = f1.stats.strikes > 0 ? f1.stats.landed / f1.stats.strikes : 0
    const f2Accuracy = f2.stats.strikes > 0 ? f2.stats.landed / f2.stats.strikes : 0
    f1Advantage += (f1Accuracy - f2Accuracy) * 0.2
    
    // Power shots advantage
    const powerDiff = f1.stats.powerShots - f2.stats.powerShots
    f1Advantage += powerDiff * 0.05 // 5% per power shot difference
    
    // Combo advantage
    f1Advantage += f1.combo.count * 0.01 // 1% per combo hit
    f1Advantage -= f2.combo.count * 0.01
    
    // Stamina advantage (less important but still factors in)
    const staminaDiff = f1.stamina - f2.stamina
    f1Advantage += staminaDiff * 0.001 // 0.1% per stamina point
    
    // Stun/vulnerable state
    if (f2.modifiers.stunned > 0) f1Advantage += 0.08 // 8% bonus if opponent stunned
    if (f1.modifiers.stunned > 0) f1Advantage -= 0.08
    
    // Apply the calculated advantage with some randomness and smoothing
    const targetPrice = Math.max(0.05, Math.min(0.95, this.marketState.yesPrice + f1Advantage * 0.3))
    const priceMove = (targetPrice - this.marketState.yesPrice) * 0.1 // Smooth movement
    
    this.adjustPrice(priceMove)
  }

  public placeTrade(side: 'yes' | 'no', price: number, quantity: number): Trade {
    const cost = price * quantity
    const fee = Math.round(cost * MarketEngine.TAKER_FEE * 100) / 100
    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      side,
      price,
      quantity,
      cost,
      fee,
      netCost: cost + fee,
      timestamp: Date.now(),
      status: 'pending'
    }

    // Simulate trade execution based on order book
    const orderBook = side === 'yes' ? this.marketState.orderBook.asks : this.marketState.orderBook.bids
    const canFill = this.canFillOrder(orderBook, price, quantity, side)

    if (canFill) {
      trade.status = 'filled'
      this.executeTrade(trade)
      // Track house revenue from taker fee
      this.marketState.houseRevenue += fee
    }

    return trade
  }

  private canFillOrder(orders: OrderBookEntry[], price: number, quantity: number, side: 'yes' | 'no'): boolean {
    let remainingQty = quantity
    
    for (const order of orders) {
      if (side === 'yes' && order.price <= price) {
        remainingQty -= order.quantity
      } else if (side === 'no' && order.price >= price) {
        remainingQty -= order.quantity
      }
      
      if (remainingQty <= 0) return true
    }
    
    return false
  }

  private executeTrade(trade: Trade): void {
    // Update market state
    this.marketState.lastTrade = trade.price
    this.marketState.volume += trade.quantity
    
    // Update order book (simplified - remove filled orders)
    this.updateOrderBookAfterTrade(trade)
    
    // Add to price history
    this.marketState.priceHistory.push({
      timestamp: trade.timestamp,
      price: trade.price,
      volume: trade.quantity
    })
    
    // Keep price history manageable
    if (this.marketState.priceHistory.length > 100) {
      this.marketState.priceHistory = this.marketState.priceHistory.slice(-50)
    }
    
    // Update current prices
    this.marketState.yesPrice = trade.side === 'yes' ? trade.price : this.marketState.yesPrice
    this.marketState.noPrice = 1 - this.marketState.yesPrice
    
    this.onStateUpdate?.(this.marketState)
  }

  private updateOrderBookAfterTrade(trade: Trade): void {
    const orders = trade.side === 'yes' ? this.marketState.orderBook.asks : this.marketState.orderBook.bids
    let remainingQty = trade.quantity
    
    for (let i = 0; i < orders.length && remainingQty > 0; i++) {
      if (orders[i].quantity <= remainingQty) {
        remainingQty -= orders[i].quantity
        orders.splice(i, 1)
        i--
      } else {
        orders[i].quantity -= remainingQty
        remainingQty = 0
      }
    }
    
    // Regenerate order book if depleted
    if (orders.length < 3) {
      if (trade.side === 'yes') {
        this.marketState.orderBook.asks = this.generateInitialAsks(this.marketState.yesPrice)
      } else {
        this.marketState.orderBook.bids = this.generateInitialBids(this.marketState.yesPrice)
      }
    }
  }

  private adjustPrice(priceMove: number): void {
    const oldPrice = this.marketState.yesPrice
    this.marketState.yesPrice = Math.max(0.05, Math.min(0.95, oldPrice + priceMove))
    this.marketState.noPrice = 1 - this.marketState.yesPrice
    
    // Update order book to reflect new price levels
    this.adjustOrderBook(this.marketState.yesPrice)
    
    // Add to price history if significant move
    if (Math.abs(priceMove) > 0.005) { // 0.5% minimum move to record
      this.marketState.priceHistory.push({
        timestamp: Date.now(),
        price: this.marketState.yesPrice,
        volume: 0
      })
    }
    
    this.onStateUpdate?.(this.marketState)
  }

  private updateMarketPrices(): void {
    if (!this.isActive) return

    // Simulate natural price movement (random walk, no mean reversion —
    // prices should only move based on fight state, not artificially toward 50%)
    const randomMove = (Math.random() - 0.5) * 0.015 // ±0.75% random noise
    this.adjustPrice(randomMove)
  }

  private simulateOrderBookActivity(): void {
    if (!this.isActive) return
    
    // Randomly add/remove orders to create realistic market depth
    if (Math.random() < 0.3) { // 30% chance to modify order book
      const currentPrice = this.marketState.yesPrice
      
      // Add new bids
      if (Math.random() < 0.6) {
        const newBid: OrderBookEntry = {
          price: currentPrice - (Math.random() * 0.035 + 0.015), // 1.5-5% below market
          quantity: Math.floor(Math.random() * 80 + 20)
        }
        
        this.marketState.orderBook.bids.push(newBid)
        this.marketState.orderBook.bids.sort((a, b) => b.price - a.price) // Sort descending
        
        // Keep reasonable depth
        if (this.marketState.orderBook.bids.length > 8) {
          this.marketState.orderBook.bids = this.marketState.orderBook.bids.slice(0, 6)
        }
      }
      
      // Add new asks
      if (Math.random() < 0.6) {
        const newAsk: OrderBookEntry = {
          price: currentPrice + (Math.random() * 0.035 + 0.015), // 1.5-5% above market
          quantity: Math.floor(Math.random() * 80 + 20)
        }
        
        this.marketState.orderBook.asks.push(newAsk)
        this.marketState.orderBook.asks.sort((a, b) => a.price - b.price) // Sort ascending
        
        // Keep reasonable depth
        if (this.marketState.orderBook.asks.length > 8) {
          this.marketState.orderBook.asks = this.marketState.orderBook.asks.slice(0, 6)
        }
      }
      
      this.calculateOrderBookTotals()
      this.onStateUpdate?.(this.marketState)
    }
  }

  private generateInitialBids(midPrice: number): OrderBookEntry[] {
    const bids: OrderBookEntry[] = []

    for (let i = 1; i <= 6; i++) {
      const price = Math.max(0.01, midPrice - (i * 0.008 + Math.random() * 0.015))
      const quantity = Math.floor(Math.random() * 100 + 30)
      bids.push({ price, quantity })
    }

    return bids.sort((a, b) => b.price - a.price) // Descending order
  }

  private generateInitialAsks(midPrice: number): OrderBookEntry[] {
    const asks: OrderBookEntry[] = []

    for (let i = 1; i <= 6; i++) {
      const price = Math.min(0.99, midPrice + (i * 0.008 + Math.random() * 0.015))
      const quantity = Math.floor(Math.random() * 100 + 30)
      asks.push({ price, quantity })
    }

    return asks.sort((a, b) => a.price - b.price) // Ascending order
  }

  private adjustOrderBook(newMidPrice: number): void {
    // Adjust existing orders based on new price levels
    this.marketState.orderBook.bids = this.marketState.orderBook.bids
      .map(bid => ({
        ...bid,
        price: Math.max(0.01, newMidPrice - (newMidPrice - bid.price) * 1.1) // Slightly widen spreads
      }))
      .filter(bid => bid.price < newMidPrice - 0.015) // Remove orders too close to mid
      .sort((a, b) => b.price - a.price)

    this.marketState.orderBook.asks = this.marketState.orderBook.asks
      .map(ask => ({
        ...ask,
        price: Math.min(0.99, newMidPrice + (ask.price - newMidPrice) * 1.1) // Slightly widen spreads
      }))
      .filter(ask => ask.price > newMidPrice + 0.015) // Remove orders too close to mid
      .sort((a, b) => a.price - b.price)

    // Ensure minimum depth
    if (this.marketState.orderBook.bids.length < 3) {
      this.marketState.orderBook.bids = this.generateInitialBids(newMidPrice)
    }
    if (this.marketState.orderBook.asks.length < 3) {
      this.marketState.orderBook.asks = this.generateInitialAsks(newMidPrice)
    }
    
    this.calculateOrderBookTotals()
  }

  private calculateOrderBookTotals(): void {
    // Calculate cumulative quantities for visualization
    let bidTotal = 0
    this.marketState.orderBook.bids.forEach(bid => {
      bidTotal += bid.quantity
      bid.total = bidTotal
    })
    
    let askTotal = 0
    this.marketState.orderBook.asks.forEach(ask => {
      askTotal += ask.quantity
      ask.total = askTotal
    })
    
    // Calculate percentages for visual depth bars
    const maxBidTotal = Math.max(...this.marketState.orderBook.bids.map(b => b.total!))
    const maxAskTotal = Math.max(...this.marketState.orderBook.asks.map(a => a.total!))
    
    this.marketState.orderBook.bids.forEach(bid => {
      bid.percentage = (bid.total! / maxBidTotal) * 100
    })
    
    this.marketState.orderBook.asks.forEach(ask => {
      ask.percentage = (ask.total! / maxAskTotal) * 100
    })
  }

  public getSpread(): number {
    const bestBid = this.marketState.orderBook.bids[0]?.price || 0
    const bestAsk = this.marketState.orderBook.asks[0]?.price || 1
    return bestAsk - bestBid
  }

  public getMidPrice(): number {
    const bestBid = this.marketState.orderBook.bids[0]?.price || 0
    const bestAsk = this.marketState.orderBook.asks[0]?.price || 1
    return (bestBid + bestAsk) / 2
  }

  /** Effective price with vig applied — used for display and cost calculation.
   *  YES + NO effective prices sum to > 1.00 (the overround is MFC's edge). */
  public getEffectivePrice(side: 'yes' | 'no'): number {
    const raw = side === 'yes' ? this.marketState.yesPrice : this.marketState.noPrice
    return Math.min(0.99, raw * (1 + MarketEngine.VIG / 2))
  }

  public getState(): MarketState {
    return this.marketState
  }

  public settleMarket(winner: string, fighterNames: { fighter1: string; fighter2: string }): void {
    this.stop()

    // Set final prices based on winner — winning contracts pay 0.98 (2% settlement fee)
    const winnerPayout = 1.00 - MarketEngine.SETTLEMENT_FEE
    const fighter1Won = winner === fighterNames.fighter1
    this.marketState.yesPrice = fighter1Won ? winnerPayout : 0.00
    this.marketState.noPrice = fighter1Won ? 0.00 : winnerPayout

    // Track settlement fee as house revenue
    this.marketState.houseRevenue += MarketEngine.SETTLEMENT_FEE * this.marketState.volume

    // Clear order book
    this.marketState.orderBook.bids = []
    this.marketState.orderBook.asks = []

    // Add final price to history
    this.marketState.priceHistory.push({
      timestamp: Date.now(),
      price: this.marketState.yesPrice,
      volume: 0
    })

    this.onStateUpdate?.(this.marketState)
  }
}