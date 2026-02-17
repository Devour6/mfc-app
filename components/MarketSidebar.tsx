'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { MarketState, Fighter, Trade } from '@/types'
import soundManager from '@/lib/sound-manager'

const playTradeSound = (success: boolean, volume?: number) => {
  soundManager.play(success ? 'notification' : 'punch-light', volume || 0.5)
}

interface MarketSidebarProps {
  marketState: MarketState
  fighters: Fighter[]
  onTrade: (side: 'yes' | 'no', price: number, quantity: number) => Trade | null
}

export default function MarketSidebar({
  marketState,
  fighters,
  onTrade
}: MarketSidebarProps) {
  const [tradeSide, setTradeSide] = useState<'yes' | 'no'>('yes')
  const [tradePrice, setTradePrice] = useState(marketState.yesPrice)
  const [tradeQuantity, setTradeQuantity] = useState(10)
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'stable'>('stable')
  const [lastPrice, setLastPrice] = useState(marketState.yesPrice)

  // Update price direction indicator
  useEffect(() => {
    if (marketState.yesPrice > lastPrice) {
      setPriceDirection('up')
    } else if (marketState.yesPrice < lastPrice) {
      setPriceDirection('down')
    } else {
      setPriceDirection('stable')
    }
    setLastPrice(marketState.yesPrice)
  }, [marketState.yesPrice, lastPrice])

  // Auto-update trade price based on selected side
  useEffect(() => {
    const newPrice = tradeSide === 'yes' ? marketState.yesPrice : marketState.noPrice
    setTradePrice(newPrice)
  }, [marketState, tradeSide])

  const handleSideChange = (side: 'yes' | 'no') => {
    setTradeSide(side)
    playTradeSound(true, 0.2)
  }

  const handleTrade = () => {
    const trade = onTrade(tradeSide, tradePrice, tradeQuantity)
    if (trade) {
      setRecentTrades(prev => [trade, ...prev.slice(0, 9)]) // Keep last 10 trades
    }
  }

  const tradeCost = tradePrice * tradeQuantity
  const maxPayout = tradeQuantity
  const canAfford = true // TODO: Integrate with actual credit system

  const getSpread = () => {
    const bestBid = marketState.orderBook.bids[0]?.price || 0
    const bestAsk = marketState.orderBook.asks[0]?.price || 1
    return bestAsk - bestBid
  }

  const getPriceChange = () => {
    if (marketState.priceHistory.length < 2) return 0
    const current = marketState.priceHistory[marketState.priceHistory.length - 1].price
    const previous = marketState.priceHistory[marketState.priceHistory.length - 2].price
    return current - previous
  }

  return (
    <div className="bg-surface border-l border-border flex flex-col h-full overflow-hidden">
      {/* Market Header */}
      <div className="p-4 border-b border-border">
        <div className="font-pixel text-xs text-text2 mb-2 tracking-wider">
          EVENT CONTRACT EXCHANGE
        </div>
        <div className="text-sm font-medium mb-3">
          Will <span className="text-accent font-bold">{fighters[0].name}</span> win?
        </div>
        
        {/* Price Display */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            className={`
              border-2 rounded-lg p-3 text-center cursor-pointer transition-all duration-200
              ${tradeSide === 'yes' 
                ? 'border-green bg-green/10 shadow-lg shadow-green/20' 
                : 'border-green/30 hover:border-green/60'
              }
            `}
            onClick={() => handleSideChange('yes')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs text-green/80 mb-1">YES</div>
            <div className={`text-xl font-bold text-green flex items-center justify-center gap-1 ${priceDirection === 'up' ? 'animate-price-bounce' : ''}`}>
              {marketState.yesPrice.toFixed(2)}
              {priceDirection === 'up' && <TrendingUp className="w-4 h-4" />}
            </div>
            <div className="text-xs text-green/60 mt-1">
              {getPriceChange() > 0 ? '+' : ''}{(getPriceChange() * 100).toFixed(1)}%
            </div>
          </motion.div>

          <motion.div
            className={`
              border-2 rounded-lg p-3 text-center cursor-pointer transition-all duration-200
              ${tradeSide === 'no' 
                ? 'border-red bg-red/10 shadow-lg shadow-red/20' 
                : 'border-red/30 hover:border-red/60'
              }
            `}
            onClick={() => handleSideChange('no')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs text-red/80 mb-1">NO</div>
            <div className={`text-xl font-bold text-red flex items-center justify-center gap-1 ${priceDirection === 'down' ? 'animate-price-bounce' : ''}`}>
              {marketState.noPrice.toFixed(2)}
              {priceDirection === 'down' && <TrendingDown className="w-4 h-4" />}
            </div>
            <div className="text-xs text-red/60 mt-1">
              {getPriceChange() < 0 ? '+' : ''}{(-getPriceChange() * 100).toFixed(1)}%
            </div>
          </motion.div>
        </div>

        {/* Market Stats */}
        <div className="flex justify-between text-xs text-text2 mt-3 pt-2 border-t border-border/50">
          <span>Volume: {marketState.volume.toLocaleString()}</span>
          <span>Spread: ${getSpread().toFixed(3)}</span>
        </div>
      </div>

      {/* Order Book */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-pixel text-xs text-text2 tracking-wider">ORDER BOOK</h3>
            <div className="text-xs text-text2">PRICE / QTY</div>
          </div>

          {/* Asks (Sell Orders) */}
          <div className="mb-2">
            {marketState.orderBook.asks.slice(0, 6).reverse().map((ask, index) => (
              <motion.div
                key={`ask-${ask.price}-${index}`}
                className="relative flex justify-between items-center py-1 px-2 text-sm hover:bg-red/5 cursor-pointer transition-colors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className="absolute inset-0 bg-red/10 origin-right"
                  style={{ transform: `scaleX(${(ask.percentage || 0) / 100})` }}
                />
                <span className="text-red font-ui relative z-10">{ask.price.toFixed(3)}</span>
                <span className="text-text2 text-xs relative z-10">{ask.quantity}</span>
              </motion.div>
            ))}
          </div>

          {/* Spread */}
          <div className="text-center py-2 border-y border-border/50 mb-2">
            <div className="text-xs text-text2">
              Spread: ${getSpread().toFixed(3)} • Mid: ${((marketState.yesPrice + marketState.noPrice) / 2).toFixed(3)}
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div>
            {marketState.orderBook.bids.slice(0, 6).map((bid, index) => (
              <motion.div
                key={`bid-${bid.price}-${index}`}
                className="relative flex justify-between items-center py-1 px-2 text-sm hover:bg-green/5 cursor-pointer transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className="absolute inset-0 bg-green/10 origin-right"
                  style={{ transform: `scaleX(${(bid.percentage || 0) / 100})` }}
                />
                <span className="text-green font-ui relative z-10">{bid.price.toFixed(3)}</span>
                <span className="text-text2 text-xs relative z-10">{bid.quantity}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade Panel */}
      <div className="border-t border-border p-4 bg-surface2">
        {/* Trade Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => handleSideChange('yes')}
            className={`
              flex-1 py-2 text-sm font-bold text-center border-r-0 transition-all duration-200
              ${tradeSide === 'yes' 
                ? 'bg-green/15 border-2 border-green text-green' 
                : 'bg-surface border-2 border-border text-text2 hover:text-green'
              }
            `}
          >
            Buy YES
          </button>
          <button
            onClick={() => handleSideChange('no')}
            className={`
              flex-1 py-2 text-sm font-bold text-center transition-all duration-200
              ${tradeSide === 'no' 
                ? 'bg-red/15 border-2 border-red text-red' 
                : 'bg-surface border-2 border-border text-text2 hover:text-red'
              }
            `}
          >
            Buy NO
          </button>
        </div>

        {/* Trade Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-text2 mb-1 uppercase tracking-wider">
              Price
            </label>
            <input
              type="number"
              value={tradePrice.toFixed(2)}
              onChange={(e) => setTradePrice(parseFloat(e.target.value) || 0)}
              min="0.01"
              max="0.99"
              step="0.01"
              className="w-full bg-surface border border-border text-text px-2 py-2 text-sm font-semibold focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text2 mb-1 uppercase tracking-wider">
              Contracts
            </label>
            <input
              type="number"
              value={tradeQuantity}
              onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 0)}
              min="1"
              step="1"
              className="w-full bg-surface border border-border text-text px-2 py-2 text-sm font-semibold focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Trade Button */}
        <motion.button
          onClick={handleTrade}
          disabled={!canAfford || tradeQuantity <= 0}
          className={`
            w-full py-3 font-pixel text-xs tracking-wider transition-all duration-200
            ${tradeSide === 'yes'
              ? canAfford 
                ? 'bg-green text-black hover:shadow-lg hover:shadow-green/30' 
                : 'bg-green/30 text-green/50 cursor-not-allowed'
              : canAfford 
                ? 'bg-red text-white hover:shadow-lg hover:shadow-red/30' 
                : 'bg-red/30 text-red/50 cursor-not-allowed'
            }
          `}
          whileHover={canAfford ? { scale: 1.02 } : {}}
          whileTap={canAfford ? { scale: 0.98 } : {}}
        >
          {canAfford 
            ? `PLACE ORDER — BUY ${tradeSide.toUpperCase()}`
            : 'INSUFFICIENT CREDITS'
          }
        </motion.button>

        {/* Trade Info */}
        <div className="flex justify-between text-xs text-text2 mt-3">
          <span>Max cost: <span className="text-text font-semibold">{tradeCost.toFixed(2)}</span> MFC</span>
          <span>Potential payout: <span className="text-text font-semibold">{maxPayout.toFixed(2)}</span> MFC</span>
        </div>
      </div>

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <div className="border-t border-border p-4 max-h-40 overflow-y-auto">
          <div className="font-pixel text-xs text-text2 mb-2 tracking-wider">RECENT TRADES</div>
          <AnimatePresence>
            {recentTrades.map((trade) => (
              <motion.div
                key={trade.id}
                className="flex justify-between items-center py-1 text-xs"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span className={trade.side === 'yes' ? 'text-green' : 'text-red'}>
                  {trade.side.toUpperCase()} {trade.quantity}
                </span>
                <span className="text-text2">@{trade.price.toFixed(2)}</span>
                <span className={trade.status === 'filled' ? 'text-green' : 'text-red'}>
                  {trade.status}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}