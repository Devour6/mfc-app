'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MarketState } from '@/types'
import { DemoTrade } from '@/types'

interface SimplifiedMarketPanelProps {
  fighterName: string
  marketState: MarketState
  demoCredits: number
  demoTrades: DemoTrade[]
  onBuy: (side: 'yes' | 'no', price: number, quantity: number) => void
}

type ButtonState = 'idle' | 'loading' | 'success'

export default function SimplifiedMarketPanel({
  fighterName,
  marketState,
  demoCredits,
  demoTrades,
  onBuy,
}: SimplifiedMarketPanelProps) {
  const [quantity, setQuantity] = useState(10)
  const [yesButtonState, setYesButtonState] = useState<ButtonState>('idle')
  const [noButtonState, setNoButtonState] = useState<ButtonState>('idle')
  const [mobileExpanded, setMobileExpanded] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // Track previous price for trend arrows
  const [prevYesPrice, setPrevYesPrice] = useState(marketState.yesPrice)
  const priceHistoryRef = useRef(marketState.yesPrice)

  // Update price history every 5 seconds for trend comparison
  useEffect(() => {
    const interval = setInterval(() => {
      setPrevYesPrice(priceHistoryRef.current)
      priceHistoryRef.current = marketState.yesPrice
    }, 5000)
    return () => clearInterval(interval)
  }, [marketState.yesPrice])

  const yesPrice = marketState.yesPrice
  const noPrice = 1 - yesPrice
  const yesDiff = yesPrice - prevYesPrice
  const noDiff = -yesDiff

  const getTrend = (diff: number) => {
    if (diff > 0.01) return { arrow: '\u25B2', color: 'text-green' }
    if (diff < -0.01) return { arrow: '\u25BC', color: 'text-red' }
    return { arrow: '\u2013', color: 'text-text2' }
  }

  const yesTrend = getTrend(yesDiff)
  const noTrend = getTrend(noDiff)

  // Max quantity limited by credits
  const maxYesQty = Math.max(1, Math.floor(demoCredits / yesPrice))
  const maxNoQty = Math.max(1, Math.floor(demoCredits / noPrice))

  const adjustQuantity = useCallback((delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta))
  }, [])

  const handleBuy = (side: 'yes' | 'no') => {
    const price = side === 'yes' ? yesPrice : noPrice
    const maxQty = side === 'yes' ? maxYesQty : maxNoQty
    const qty = Math.min(quantity, maxQty)
    if (qty * price > demoCredits) return

    const setButtonState = side === 'yes' ? setYesButtonState : setNoButtonState
    setButtonState('loading')
    setTimeout(() => {
      onBuy(side, price, qty)
      setButtonState('success')
      setToast(`Bought ${qty} ${side.toUpperCase()} contracts at ${price.toFixed(2)}`)
      setTimeout(() => setButtonState('idle'), 300)
      setTimeout(() => setToast(null), 3000)
    }, 100)
  }

  // Compute position from trades
  const position = demoTrades.length > 0 ? (() => {
    const lastTrade = demoTrades[demoTrades.length - 1]
    const totalQty = demoTrades.reduce((sum, t) => sum + t.quantity, 0)
    const avgPrice = demoTrades.reduce((sum, t) => sum + t.price * t.quantity, 0) / totalQty
    const currentPrice = lastTrade.side === 'yes' ? yesPrice : noPrice
    const pnl = totalQty * (currentPrice - avgPrice)
    return {
      side: lastTrade.side.toUpperCase(),
      quantity: totalQty,
      avgPrice,
      pnl,
    }
  })() : null

  // Tooltip state
  const [tooltip, setTooltip] = useState<'yes' | 'no' | null>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = (side: 'yes' | 'no') => {
    tooltipTimer.current = setTimeout(() => setTooltip(side), 200)
  }
  const hideTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltip(null)
  }

  const cost = quantity * (yesPrice) // default to YES price for display
  const payout = quantity * 1.0

  // --- Shared content (used by both desktop and mobile) ---
  const headerContent = (
    <div className="font-pixel text-xs text-text tracking-wider mb-4">
      {fighterName} WINS?
    </div>
  )

  const priceRows = (compact?: boolean) => (
    <div className={compact ? 'flex items-center gap-4' : ''}>
      {/* YES row */}
      <div
        className={`flex items-center justify-between ${compact ? 'flex-1' : 'mb-2'} relative`}
        onMouseEnter={() => showTooltip('yes')}
        onMouseLeave={hideTooltip}
        onClick={() => tooltip === 'yes' ? hideTooltip() : showTooltip('yes')}
      >
        <span className="font-pixel text-sm text-green">YES</span>
        <div className="flex items-center">
          <span className="font-ui text-lg font-semibold text-green">{yesPrice.toFixed(2)}</span>
          <span className={`font-ui text-xs ml-1 ${yesTrend.color}`}>{yesTrend.arrow}</span>
        </div>
        {tooltip === 'yes' && (
          <div className="absolute top-full left-0 mt-1 bg-surface2 border border-border px-3 py-2 z-50 max-w-[200px]">
            <span className="font-ui text-xs text-text2">
              The market thinks there&apos;s a {Math.round(yesPrice * 100)}% chance {fighterName} wins.
            </span>
          </div>
        )}
      </div>
      {/* NO row */}
      <div
        className={`flex items-center justify-between ${compact ? 'flex-1' : 'mb-4'} relative`}
        onMouseEnter={() => showTooltip('no')}
        onMouseLeave={hideTooltip}
        onClick={() => tooltip === 'no' ? hideTooltip() : showTooltip('no')}
      >
        <span className="font-pixel text-sm text-red">NO</span>
        <div className="flex items-center">
          <span className="font-ui text-lg font-semibold text-red">{noPrice.toFixed(2)}</span>
          <span className={`font-ui text-xs ml-1 ${noTrend.color}`}>{noTrend.arrow}</span>
        </div>
        {tooltip === 'no' && (
          <div className="absolute top-full left-0 mt-1 bg-surface2 border border-border px-3 py-2 z-50 max-w-[200px]">
            <span className="font-ui text-xs text-text2">
              The market thinks there&apos;s a {Math.round(noPrice * 100)}% chance {fighterName} loses.
            </span>
          </div>
        )}
      </div>
    </div>
  )

  const buyButtonContent = (side: 'yes' | 'no', btnState: ButtonState) => {
    if (btnState === 'loading') {
      return (
        <span className={`inline-block w-2 h-2 border border-current border-t-transparent animate-spin ${side === 'yes' ? 'rounded-full' : 'rounded-full'}`} />
      )
    }
    if (btnState === 'success') return '\u2713'
    return `BUY ${side.toUpperCase()}`
  }

  const buttonsSection = (stacked: boolean) => (
    <div className={stacked ? 'space-y-2' : 'flex gap-3'}>
      <motion.button
        onClick={() => handleBuy('yes')}
        disabled={yesButtonState !== 'idle' || demoCredits < yesPrice}
        className={`${stacked ? 'w-full' : 'flex-1'} font-pixel text-xs tracking-wider text-green border-2 border-green px-4 py-3 min-h-[44px] hover:bg-green/10 active:bg-green/20 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-green focus-visible:outline-none disabled:opacity-40`}
        whileTap={{ scale: 0.98 }}
      >
        {buyButtonContent('yes', yesButtonState)}
      </motion.button>
      <motion.button
        onClick={() => handleBuy('no')}
        disabled={noButtonState !== 'idle' || demoCredits < noPrice}
        className={`${stacked ? 'w-full' : 'flex-1'} font-pixel text-xs tracking-wider text-red border-2 border-red px-4 py-3 min-h-[44px] hover:bg-red/10 active:bg-red/20 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none disabled:opacity-40`}
        whileTap={{ scale: 0.98 }}
      >
        {buyButtonContent('no', noButtonState)}
      </motion.button>
    </div>
  )

  const quantitySection = (
    <div className="flex items-center justify-between mt-4">
      <span className="font-ui text-xs text-text2">Contracts</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => adjustQuantity(-1)}
          disabled={quantity <= 1}
          className="w-6 h-6 border border-border text-text2 font-ui text-xs flex items-center justify-center hover:text-text hover:border-text2 transition-colors disabled:opacity-30"
        >
          &ndash;
        </button>
        <span className="font-ui text-sm font-semibold text-text w-8 text-center">{quantity}</span>
        <button
          onClick={() => adjustQuantity(1)}
          className="w-6 h-6 border border-border text-text2 font-ui text-xs flex items-center justify-center hover:text-text hover:border-text2 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )

  const costPayoutSection = (
    <div className="space-y-1 mt-3">
      <div className="flex justify-between">
        <span className="font-ui text-xs text-text2">Cost:</span>
        <span className="font-ui text-sm text-text">{(quantity * yesPrice).toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-ui text-xs text-text2">Payout:</span>
        <span className="font-ui text-sm text-green font-semibold">{(quantity * 1.0).toFixed(2)}</span>
      </div>
    </div>
  )

  const demoCreditSection = (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
      <span className="font-ui text-xs text-text2">Demo credits</span>
      <span className="font-ui text-sm font-semibold text-gold">{demoCredits.toFixed(0)}</span>
    </div>
  )

  const positionSection = position && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-3 bg-surface2 border border-border"
    >
      <div className="font-pixel text-[10px] text-text2 tracking-wider mb-2">YOUR POSITION</div>
      <div className="font-ui text-xs text-text">
        {position.quantity} {position.side} @ {position.avgPrice.toFixed(2)}
      </div>
      <div className={`font-ui text-sm font-semibold mt-1 ${
        position.pnl > 0.005 ? 'text-green' : position.pnl < -0.005 ? 'text-red' : 'text-text2'
      }`}>
        {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)}
      </div>
    </motion.div>
  )

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <motion.div
        initial={{ x: 288, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="hidden lg:flex flex-col bg-surface border-l border-border w-72 p-4 overflow-y-auto"
      >
        {headerContent}
        {priceRows()}
        <div className="h-px bg-border my-4" />
        {buttonsSection(true)}
        {quantitySection}
        {costPayoutSection}
        {demoCreditSection}
        {positionSection}
      </motion.div>

      {/* Mobile bottom sheet — hidden on desktop */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40"
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2 pb-3 cursor-pointer"
          onClick={() => setMobileExpanded(!mobileExpanded)}
        >
          <div className="w-10 h-1 bg-text2/40 rounded-full" />
        </div>

        <AnimatePresence>
          {!mobileExpanded ? (
            /* Minimized: price ticker + credits */
            <motion.div
              key="minimized"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="font-pixel text-sm text-green">YES</span>
                  <span className="font-ui text-sm font-semibold text-green">{yesPrice.toFixed(2)}</span>
                  <span className={`font-ui text-xs ${yesTrend.color}`}>{yesTrend.arrow}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-pixel text-sm text-red">NO</span>
                  <span className="font-ui text-sm font-semibold text-red">{noPrice.toFixed(2)}</span>
                  <span className={`font-ui text-xs ${noTrend.color}`}>{noTrend.arrow}</span>
                </div>
              </div>
              <span className="font-ui text-sm font-semibold text-gold">{demoCredits.toFixed(0)}</span>
            </motion.div>
          ) : (
            /* Expanded */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-6"
            >
              {headerContent}
              {priceRows(true)}
              <div className="h-px bg-border my-4" />
              {buttonsSection(false)}
              {quantitySection}
              {costPayoutSection}
              {demoCreditSection}
              {positionSection}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Trade toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 bg-surface2 border border-border px-4 py-2 z-50"
          >
            <span className="font-ui text-xs text-text whitespace-nowrap">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
