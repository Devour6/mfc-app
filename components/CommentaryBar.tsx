'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Commentary } from '@/types'

interface CommentaryBarProps {
  commentary: Commentary | null
}

export default function CommentaryBar({ commentary }: CommentaryBarProps) {
  return (
    <div className="bg-accent/5 border-t border-accent/15 px-4 py-3 min-h-[56px] flex items-center">
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
                className="commentary-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-text font-medium">{commentary.text}</span>
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
    </div>
  )
}