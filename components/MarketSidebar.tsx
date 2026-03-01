'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MarketState, Fighter } from '@/types'

interface MarketSidebarProps {
  marketState: MarketState
  fighters: Fighter[]
  onTrade: (side: 'yes' | 'no', price: number, quantity: number) => void
}

export default function MarketSidebar({
  marketState,
  fighters,
  onTrade
}: MarketSidebarProps) {
  const [quantity, setQuantity] = useState(10)

  const handleTrade = (side: 'yes' | 'no') => {
    const price = side === 'yes' ? marketState.yesPrice : marketState.noPrice
    onTrade(side, price, quantity)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 backdrop-blur-lg rounded-lg p-4 border border-gray-700"
    >
      <h3 className="text-lg font-bold text-white mb-4">Market</h3>
      
      <div className="space-y-3">
        <div className="text-sm text-gray-300">
          {marketState.contractQuestion}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTrade('yes')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            YES {(marketState.yesPrice * 100).toFixed(0)}¢
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTrade('no')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            NO {(marketState.noPrice * 100).toFixed(0)}¢
          </motion.button>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            min="1"
          />
        </div>
        
        <div className="text-xs text-gray-400 space-y-1">
          <div>Volume: {marketState.volume.toLocaleString()}</div>
          <div>Last Trade: {marketState.lastTrade.toFixed(2)}¢</div>
        </div>
      </div>
    </motion.div>
  )
}