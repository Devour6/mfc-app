'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export type ArenaSection = 'rankings' | 'fighters' | 'tournaments' | 'rewards' | 'achievements'

interface ArenaTopBarProps {
  credits: number
  soundEnabled: boolean
  onToggleSound: () => void
  onGoHome: () => void
  onOpenSection: (section: ArenaSection) => void
  onOpenBridge?: () => void
}

const dropdownSections: { id: ArenaSection; label: string; icon: string }[] = [
  { id: 'rankings', label: 'RANKINGS', icon: '\u{1F3C6}' },
  { id: 'fighters', label: 'FIGHTERS', icon: '\u{1F916}' },
  { id: 'tournaments', label: 'TOURNAMENTS', icon: '\u{1F3DF}\uFE0F' },
  { id: 'rewards', label: 'REWARDS', icon: '\u{1F381}' },
  { id: 'achievements', label: 'ACHIEVEMENTS', icon: '\u{1F396}\uFE0F' },
]

export default function ArenaTopBar({
  credits,
  soundEnabled,
  onToggleSound,
  onGoHome,
  onOpenSection,
  onOpenBridge,
}: ArenaTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  return (
    <div className="bg-surface border-b border-border px-4 py-2 flex items-center justify-between gap-3 h-12 shrink-0">
      {/* Left: Logo + LIVE pill */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={onGoHome}
          className="font-pixel text-sm text-accent hover:text-accent/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          MFC
        </motion.button>

        <div className="flex items-center gap-1.5 bg-green/10 border border-green/30 px-2.5 py-1">
          <motion.div
            className="w-1.5 h-1.5 bg-green"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="font-pixel text-[10px] text-green">LIVE</span>
        </div>

        {/* More dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 font-pixel text-[10px] text-text2 hover:text-text transition-colors px-2 py-1"
            whileTap={{ scale: 0.95 }}
          >
            MORE
            <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 bg-surface2 border border-border z-50 min-w-[180px] shadow-lg shadow-black/40"
              >
                {dropdownSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      onOpenSection(section.id)
                      setDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 font-pixel text-[10px] text-text2 hover:text-text hover:bg-surface transition-colors flex items-center gap-2"
                  >
                    <span>{section.icon}</span>
                    <span>{section.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Credits + Sound toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenBridge}
          className="font-pixel text-[10px] text-gold hover:text-gold/80 transition-colors"
          title="SOL Bridge — deposit or withdraw"
        >
          ${credits.toLocaleString()}
        </button>
        <button
          onClick={onToggleSound}
          className="font-pixel text-[10px] text-text2 hover:text-text transition-colors"
          title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
        >
          {soundEnabled ? 'SND' : 'MUTE'}
        </button>
      </div>
    </div>
  )
}
