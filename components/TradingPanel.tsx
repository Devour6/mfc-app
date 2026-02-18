'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { FightState, MarketState, Fighter, Trade } from '@/types'
import soundManager from '@/lib/sound-manager'

// Re-export BettingSlip so LiveFightSection can use it
export interface BettingSlip {
  marketId: string
  optionId: string
  amount: number
  potentialPayout: number
  timestamp: number
}

interface BettingMarket {
  id: string
  type: string
  title: string
  description: string
  options: { id: string; label: string; odds: number; probability: number; color: string }[]
  timeWindow: number
  active: boolean
  volume: number
}

interface TradingPanelProps {
  marketState: MarketState
  fightState: FightState
  fighters: Fighter[]
  credits: number
  onPlaceBet: (bet: BettingSlip) => void
  onPlaceTrade: (side: 'yes' | 'no', price: number, quantity: number) => Trade | null
  activeBets?: Array<{ id: string; marketTitle: string; side: string; amount: number; odds: number }>
}

export default function TradingPanel({
  marketState,
  fightState,
  fighters,
  credits,
  onPlaceBet,
  onPlaceTrade,
  activeBets = [],
}: TradingPanelProps) {
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no'>('yes')
  const [selectedAmount, setSelectedAmount] = useState(25)
  const [customAmount, setCustomAmount] = useState('')
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'stable'>('stable')
  const lastPriceRef = useRef(marketState.yesPrice)
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])

  // Collapsible section state
  const [showProps, setShowProps] = useState(false)
  const [showOrderBook, setShowOrderBook] = useState(false)
  const [showPositions, setShowPositions] = useState(false)

  // Live prop markets
  const [propMarkets, setPropMarkets] = useState<BettingMarket[]>([])
  const [propAmount, setPropAmount] = useState(10)

  const quickAmounts = [10, 25, 50, 100]
  const yesPrice = marketState.yesPrice
  const noPrice = marketState.noPrice
  const yesCents = Math.round(yesPrice * 100)
  const noCents = Math.round(noPrice * 100)

  // Track price direction
  useEffect(() => {
    if (marketState.yesPrice > lastPriceRef.current + 0.005) {
      setPriceDirection('up')
    } else if (marketState.yesPrice < lastPriceRef.current - 0.005) {
      setPriceDirection('down')
    } else {
      setPriceDirection('stable')
    }
    lastPriceRef.current = marketState.yesPrice
  }, [marketState.yesPrice])

  // Generate prop markets from fight state
  useEffect(() => {
    if (!fightState || fightState.phase !== 'fighting') {
      setPropMarkets([])
      return
    }

    const markets: BettingMarket[] = []
    const f1 = fighters[0]?.name || 'Fighter 1'
    const f2 = fighters[1]?.name || 'Fighter 2'

    markets.push({
      id: 'next_strike',
      type: 'next_strike',
      title: 'Next Strike Lands',
      description: 'Who lands the next significant strike?',
      options: [
        { id: 'fighter1', label: f1, odds: 1.8, probability: 55, color: 'text-accent' },
        { id: 'fighter2', label: f2, odds: 2.2, probability: 45, color: 'text-accent2' },
      ],
      timeWindow: 15,
      active: true,
      volume: Math.floor(Math.random() * 5000) + 1000,
    })

    markets.push({
      id: 'round_winner',
      type: 'round_winner',
      title: `Round ${fightState.round} Winner`,
      description: 'Who wins this round on points?',
      options: [
        { id: 'fighter1', label: f1, odds: 1.7, probability: 58, color: 'text-accent' },
        { id: 'fighter2', label: f2, odds: 2.3, probability: 42, color: 'text-accent2' },
      ],
      timeWindow: 45,
      active: true,
      volume: Math.floor(Math.random() * 8000) + 2000,
    })

    if (fightState.round >= 2) {
      markets.push({
        id: 'combo_count',
        type: 'combo_count',
        title: 'Next Combo Size',
        description: 'How many strikes in the next combo?',
        options: [
          { id: '1-2', label: '1-2 Hits', odds: 1.4, probability: 70, color: 'text-green' },
          { id: '3-4', label: '3-4 Hits', odds: 3.2, probability: 25, color: 'text-gold' },
          { id: '5+', label: '5+ Hits', odds: 8.0, probability: 5, color: 'text-accent' },
        ],
        timeWindow: 20,
        active: true,
        volume: Math.floor(Math.random() * 3000) + 500,
      })
    }

    setPropMarkets(markets)
  }, [fightState?.phase, fightState?.round, fighters])

  // Prop market countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setPropMarkets(prev =>
        prev.map(m => ({
          ...m,
          timeWindow: Math.max(0, m.timeWindow - 1),
          active: m.timeWindow > 1,
        }))
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const effectiveAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount
  const cost = selectedSide === 'yes'
    ? (yesPrice * effectiveAmount).toFixed(2)
    : (noPrice * effectiveAmount).toFixed(2)
  const potentialPayout = effectiveAmount.toFixed(2)
  const canAfford = effectiveAmount > 0 && parseFloat(cost) <= credits

  const handlePlaceOrder = () => {
    if (!canAfford) return
    const price = selectedSide === 'yes' ? yesPrice : noPrice
    const trade = onPlaceTrade(selectedSide, price, effectiveAmount)
    if (trade) {
      setRecentTrades(prev => [trade, ...prev.slice(0, 9)])
      soundManager.play('notification', 0.6)
    }
  }

  const handlePlaceProp = (marketId: string, optionId: string, odds: number) => {
    if (propAmount > credits) return
    const bet: BettingSlip = {
      marketId,
      optionId,
      amount: propAmount,
      potentialPayout: propAmount * odds,
      timestamp: Date.now(),
    }
    onPlaceBet(bet)
    soundManager.play('notification', 0.5)
  }

  const getSpread = () => {
    const bestBid = marketState.orderBook.bids[0]?.price || 0
    const bestAsk = marketState.orderBook.asks[0]?.price || 1
    return bestAsk - bestBid
  }

  const activePropCount = propMarkets.filter(m => m.active).length

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      {/* Market Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-ui text-text">
            Will <span className="text-accent font-bold">{fighters[0]?.name}</span> win?
          </div>
          <div className="flex items-center gap-1.5 bg-green/10 border border-green/30 px-2 py-0.5">
            <motion.div
              className="w-1.5 h-1.5 bg-green"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="font-pixel text-[8px] text-green">LIVE</span>
          </div>
        </div>

        {/* YES / NO Buttons — Polymarket style */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button
            onClick={() => { setSelectedSide('yes'); soundManager.play('punch-light', 0.2) }}
            className={`border-2 p-3 text-center transition-all ${
              selectedSide === 'yes'
                ? 'border-green bg-green/10 shadow-lg shadow-green/20'
                : 'border-border hover:border-green/40'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-[10px] text-green/70 font-pixel mb-1">YES</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-bold text-green">{yesCents}&cent;</span>
              {priceDirection === 'up' && <TrendingUp className="w-3 h-3 text-green" />}
            </div>
          </motion.button>

          <motion.button
            onClick={() => { setSelectedSide('no'); soundManager.play('punch-light', 0.2) }}
            className={`border-2 p-3 text-center transition-all ${
              selectedSide === 'no'
                ? 'border-red bg-red/10 shadow-lg shadow-red/20'
                : 'border-border hover:border-red/40'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-[10px] text-red/70 font-pixel mb-1">NO</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-bold text-red">{noCents}&cent;</span>
              {priceDirection === 'down' && <TrendingDown className="w-3 h-3 text-red" />}
            </div>
          </motion.button>
        </div>

        {/* Amount Selection */}
        <div className="mb-3">
          <div className="text-[10px] text-text2 font-pixel mb-1.5">AMOUNT</div>
          <div className="flex gap-2">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                className={`flex-1 py-1.5 text-xs font-pixel border transition-all ${
                  !customAmount && selectedAmount === amt
                    ? 'bg-accent text-white border-accent'
                    : 'bg-transparent text-text2 border-border hover:text-text hover:border-text2'
                }`}
              >
                {amt}
              </button>
            ))}
            <input
              type="number"
              placeholder="..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-16 bg-surface2 border border-border text-text text-xs font-ui text-center px-1 py-1.5 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Cost Summary */}
        <div className="flex justify-between text-xs text-text2 mb-3">
          <span>Cost: <span className="text-text font-semibold">${cost}</span></span>
          <span>Win: <span className="text-green font-semibold">${potentialPayout}</span></span>
        </div>

        {/* Place Order Button */}
        <motion.button
          onClick={handlePlaceOrder}
          disabled={!canAfford}
          className={`w-full py-3 font-pixel text-xs tracking-wider transition-all ${
            selectedSide === 'yes'
              ? canAfford
                ? 'bg-green text-black hover:shadow-lg hover:shadow-green/30'
                : 'bg-green/30 text-green/50 cursor-not-allowed'
              : canAfford
                ? 'bg-red text-white hover:shadow-lg hover:shadow-red/30'
                : 'bg-red/30 text-red/50 cursor-not-allowed'
          }`}
          whileHover={canAfford ? { scale: 1.02 } : {}}
          whileTap={canAfford ? { scale: 0.98 } : {}}
        >
          {canAfford
            ? `BUY ${selectedSide.toUpperCase()}`
            : effectiveAmount <= 0
              ? 'ENTER AMOUNT'
              : 'INSUFFICIENT CREDITS'}
        </motion.button>
      </div>

      {/* Collapsible Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Live Props */}
        <CollapsibleSection
          title={`LIVE PROPS${activePropCount > 0 ? ` (${activePropCount})` : ''}`}
          open={showProps}
          onToggle={() => setShowProps(!showProps)}
        >
          {activePropCount === 0 ? (
            <div className="text-xs text-text2 text-center py-3">No active props</div>
          ) : (
            <div className="space-y-2">
              {/* Prop bet amount */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-text2 font-pixel">BET:</span>
                {[5, 10, 25].map(a => (
                  <button
                    key={a}
                    onClick={() => setPropAmount(a)}
                    className={`px-2 py-0.5 text-[10px] font-pixel border ${
                      propAmount === a
                        ? 'bg-accent text-white border-accent'
                        : 'text-text2 border-border hover:text-text'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {propMarkets.filter(m => m.active).map(market => (
                <div key={market.id} className="bg-bg border border-border p-2.5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-pixel text-text">{market.title}</span>
                    <span className={`text-[10px] font-pixel ${market.timeWindow > 10 ? 'text-green' : 'text-accent'}`}>
                      {market.timeWindow}s
                    </span>
                  </div>
                  <div className="space-y-1">
                    {market.options.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handlePlaceProp(market.id, opt.id, opt.odds)}
                        disabled={propAmount > credits}
                        className="w-full flex justify-between items-center p-1.5 border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors"
                      >
                        <span className={`text-[10px] font-pixel ${opt.color}`}>{opt.label}</span>
                        <span className="text-[10px] font-pixel text-gold">{opt.odds}x</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Order Book */}
        <CollapsibleSection
          title="ORDER BOOK"
          open={showOrderBook}
          onToggle={() => setShowOrderBook(!showOrderBook)}
        >
          <div>
            {/* Asks */}
            <div className="mb-1">
              {marketState.orderBook.asks.slice(0, 5).reverse().map((ask, i) => (
                <div key={`ask-${i}`} className="relative flex justify-between items-center py-0.5 px-2 text-xs">
                  <div
                    className="absolute inset-0 bg-red/10 origin-right"
                    style={{ transform: `scaleX(${(ask.percentage || 0) / 100})` }}
                  />
                  <span className="text-red font-ui relative z-10">{ask.price.toFixed(3)}</span>
                  <span className="text-text2 text-[10px] relative z-10">{ask.quantity}</span>
                </div>
              ))}
            </div>
            {/* Spread */}
            <div className="text-center py-1 border-y border-border/50 my-1">
              <span className="text-[10px] text-text2">
                Spread: ${getSpread().toFixed(3)}
              </span>
            </div>
            {/* Bids */}
            <div>
              {marketState.orderBook.bids.slice(0, 5).map((bid, i) => (
                <div key={`bid-${i}`} className="relative flex justify-between items-center py-0.5 px-2 text-xs">
                  <div
                    className="absolute inset-0 bg-green/10 origin-right"
                    style={{ transform: `scaleX(${(bid.percentage || 0) / 100})` }}
                  />
                  <span className="text-green font-ui relative z-10">{bid.price.toFixed(3)}</span>
                  <span className="text-text2 text-[10px] relative z-10">{bid.quantity}</span>
                </div>
              ))}
            </div>
            {/* Stats */}
            <div className="flex justify-between text-[10px] text-text2 mt-2 pt-1 border-t border-border/50 px-2">
              <span>Vol: {marketState.volume.toLocaleString()}</span>
              <span>Spread: ${getSpread().toFixed(3)}</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Your Positions */}
        <CollapsibleSection
          title={`YOUR POSITIONS${activeBets.length > 0 ? ` (${activeBets.length})` : ''}`}
          open={showPositions}
          onToggle={() => setShowPositions(!showPositions)}
        >
          {activeBets.length === 0 && recentTrades.length === 0 ? (
            <div className="text-xs text-text2 text-center py-3">No active positions</div>
          ) : (
            <div className="space-y-1">
              {activeBets.map((bet) => (
                <div key={bet.id} className="flex justify-between text-[10px] bg-bg p-1.5 border border-border">
                  <span className="text-text2 truncate mr-2">{bet.side}</span>
                  <span className="text-gold font-pixel">${bet.amount} @ {bet.odds.toFixed(1)}x</span>
                </div>
              ))}
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex justify-between text-[10px] bg-bg p-1.5 border border-border">
                  <span className={trade.side === 'yes' ? 'text-green' : 'text-red'}>
                    {trade.side.toUpperCase()} {trade.quantity}
                  </span>
                  <span className="text-text2">@{trade.price.toFixed(2)}</span>
                  <span className={trade.status === 'filled' ? 'text-green' : 'text-text2'}>
                    {trade.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  )
}

/* Collapsible section helper */
function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface2 transition-colors"
      >
        <span className="font-pixel text-[10px] text-text2">{title}</span>
        <ChevronRight
          className={`w-3 h-3 text-text2 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
