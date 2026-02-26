'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useSolanaWallet } from '@/lib/solana/use-wallet'

export type ArenaSection = 'rankings' | 'fighters' | 'tournaments' | 'rewards' | 'achievements' | 'content'

interface ArenaTopBarProps {
  credits: number
  soundEnabled: boolean
  onToggleSound: () => void
  onGoHome: () => void
  onOpenSection: (section: ArenaSection) => void
  onOpenBridge?: () => void
  onBuyCredits?: () => void
  onboardingMode?: boolean
}

const dropdownSections: { id: ArenaSection; label: string; icon: string }[] = [
  { id: 'rankings', label: 'RANKINGS', icon: '\u{1F3C6}' },
  { id: 'fighters', label: 'FIGHTERS', icon: '\u{1F916}' },
  { id: 'tournaments', label: 'TOURNAMENTS', icon: '\u{1F3DF}\uFE0F' },
  { id: 'rewards', label: 'REWARDS', icon: '\u{1F381}' },
  { id: 'achievements', label: 'ACHIEVEMENTS', icon: '\u{1F396}\uFE0F' },
  { id: 'content', label: 'CONTENT', icon: '\u{1F4DD}' },
]

export default function ArenaTopBar({
  credits,
  soundEnabled,
  onToggleSound,
  onGoHome,
  onOpenSection,
  onOpenBridge,
  onBuyCredits,
  onboardingMode = false,
}: ArenaTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { connected, connecting, address, connect, disconnect, getBalance } = useSolanaWallet()
  const [solBalance, setSolBalance] = useState<number | null>(null)

  // Fetch SOL balance when connected
  useEffect(() => {
    if (!connected) { setSolBalance(null); return }
    let cancelled = false
    getBalance().then(bal => { if (!cancelled) setSolBalance(bal) })
    return () => { cancelled = true }
  }, [connected, getBalance])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setTooltipItem(null)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // --- Locked menu item state ---
  const [unlockStage, setUnlockStage] = useState<'locked' | 'animating' | 'done'>(
    onboardingMode ? 'locked' : 'done'
  )
  const unlockPlayedRef = useRef(!onboardingMode)

  // Play unlock animation on first dropdown open after onboarding completes
  useEffect(() => {
    if (!dropdownOpen || onboardingMode || unlockStage !== 'locked' || unlockPlayedRef.current) return

    setUnlockStage('animating')
    const totalMs = dropdownSections.length * 100 + 500
    setTimeout(() => {
      setUnlockStage('done')
      unlockPlayedRef.current = true
    }, totalMs)
  }, [dropdownOpen, onboardingMode, unlockStage])

  // Tooltip for locked items
  const [tooltipItem, setTooltipItem] = useState<ArenaSection | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTooltip = (id: ArenaSection) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    tooltipTimerRef.current = setTimeout(() => setTooltipItem(id), 200)
  }
  const hideTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setTooltipItem(null)
  }

  const truncatedAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null

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

        {/* More dropdown — always visible, items locked during onboarding */}
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
                {dropdownSections.map((section, index) => {
                  const isLocked = unlockStage === 'locked'

                  return (
                    <div key={section.id} className="relative">
                      <motion.button
                        initial={false}
                        animate={
                          unlockStage === 'animating'
                            ? {
                                opacity: [0.4, 1, 1],
                                color: ['rgba(136,136,153,0.4)', '#ffd700', '#888899'],
                              }
                            : isLocked
                            ? { opacity: 0.4, color: 'rgba(136,136,153,0.4)' }
                            : { opacity: 1, color: '#888899' }
                        }
                        transition={
                          unlockStage === 'animating'
                            ? { delay: index * 0.1, duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }
                            : { duration: 0 }
                        }
                        whileHover={!isLocked ? { color: '#e8e8f0', backgroundColor: '#12121a' } : undefined}
                        onClick={() => {
                          if (isLocked) {
                            setTooltipItem(tooltipItem === section.id ? null : section.id)
                            return
                          }
                          onOpenSection(section.id)
                          setDropdownOpen(false)
                        }}
                        onMouseEnter={() => isLocked ? showTooltip(section.id) : undefined}
                        onMouseLeave={() => isLocked ? hideTooltip() : undefined}
                        className={`w-full text-left px-3 py-2.5 font-pixel text-[10px] flex items-center gap-2 ${
                          isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <span>{section.icon}</span>
                        <span>{section.label}</span>
                      </motion.button>

                      {/* Locked item tooltip */}
                      <AnimatePresence>
                        {tooltipItem === section.id && isLocked && (
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-surface2 border border-border px-3 py-2 z-50 max-w-[200px] whitespace-nowrap"
                          >
                            <span className="font-ui text-xs text-text2">Complete onboarding to unlock</span>
                            {/* Arrow pointing left */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-surface2" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Wallet + Credits + Buy + Sound toggle */}
      <div className="flex items-center gap-3">
        {/* Solana wallet button */}
        {connected ? (
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-1.5 font-pixel text-[10px] text-accent2 border border-accent2/30 bg-accent2/10 px-2 py-1 hover:bg-accent2/20 transition-colors"
            title="Disconnect wallet"
          >
            <span>{truncatedAddress}</span>
            {solBalance !== null && (
              <span className="text-text2">{solBalance.toFixed(2)} SOL</span>
            )}
          </button>
        ) : (
          <button
            onClick={() => connect()}
            disabled={connecting}
            className="font-pixel text-[10px] text-text2 border border-border px-2 py-1 hover:text-text hover:border-accent2 transition-colors disabled:opacity-50"
          >
            {connecting ? 'CONNECTING...' : 'WALLET'}
          </button>
        )}

        {onOpenBridge && (
          <button
            onClick={onOpenBridge}
            className="font-pixel text-[10px] text-gold hover:text-gold/80 transition-colors"
            title="SOL Bridge — deposit or withdraw"
          >
            BRIDGE
          </button>
        )}

        <div className="font-pixel text-[10px] text-gold">
          ${credits.toLocaleString()}
        </div>
        {onBuyCredits && (
          <button
            onClick={onBuyCredits}
            className="font-pixel text-[8px] text-bg bg-gold px-2 py-1 hover:bg-gold/80 transition-colors"
          >
            BUY
          </button>
        )}
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
