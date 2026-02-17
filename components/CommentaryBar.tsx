'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Commentary } from '@/types'

interface CommentaryBarProps {
  commentary: Commentary | null
  commentaryHistory?: Commentary[]
}

export default function CommentaryBar({ commentary, commentaryHistory = [] }: CommentaryBarProps) {
  const [showHistory, setShowHistory] = useState(false)
  
  return (
    <div className="relative bg-accent/5 border-t border-accent/15 px-4 py-3 min-h-[56px] flex items-center">
      <div className="flex items-center gap-3 w-full">
        {/* Live indicator */}
        <motion.div
          className="w-2 h-2 bg-accent rounded-full flex-shrink-0"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Commentary text */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {commentary ? (
              <motion.div
                key={commentary.id}
                className="commentary-text cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowHistory(!showHistory)}
                onMouseEnter={() => setShowHistory(true)}
                onMouseLeave={() => setShowHistory(false)}
              >
                <span className="text-text font-medium">{commentary.text}</span>
                {commentaryHistory.length > 0 && (
                  <motion.span 
                    className="text-xs text-text2 ml-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    (hover for history)
                  </motion.span>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-text2"
              >
                The fighters are sizing each other up...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Commentary priority indicator */}
        {commentary && (
          <motion.div
            className={`
              px-2 py-1 text-xs font-pixel rounded flex-shrink-0
              ${commentary.priority === 'high' ? 'bg-accent/20 text-accent' :
                commentary.priority === 'medium' ? 'bg-gold/20 text-gold' :
                'bg-text2/20 text-text2'
              }
            `}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {commentary.type.toUpperCase()}
          </motion.div>
        )}
      </div>
      
      {/* Commentary History Popup */}
      <AnimatePresence>
        {showHistory && commentaryHistory.length > 0 && (
          <motion.div
            className="absolute bottom-full left-0 right-0 bg-background border border-accent/20 rounded-t-md shadow-lg z-50 max-h-48 overflow-y-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3">
              <div className="text-xs text-text2 font-medium mb-2 border-b border-accent/10 pb-1">
                Recent Commentary
              </div>
              <div className="space-y-1">
                {commentaryHistory.slice(-5).reverse().map((historyItem, index) => (
                  <motion.div
                    key={historyItem.id}
                    className="text-sm text-text opacity-80 hover:opacity-100 transition-opacity"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 0.8, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {historyItem.text}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}