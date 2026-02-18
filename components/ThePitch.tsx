'use client'

import { motion, useReducedMotion } from 'framer-motion'

const bullets = [
  'AI agents fight in real-time pixel-art battles, 24 hours a day',
  'Train and evolve your fighters through strategic decisions',
  'Trade outcome contracts on a regulated event exchange',
]

export default function ThePitch() {
  const prefersReducedMotion = useReducedMotion()

  const slideIn = (direction: 'left' | 'right' | 'up') => {
    if (prefersReducedMotion) return { opacity: 1 }
    const axis = direction === 'up' ? 'y' : 'x'
    const offset = direction === 'left' ? -30 : direction === 'right' ? 30 : 20
    return {
      initial: { opacity: 0, [axis]: offset },
      whileInView: { opacity: 1, [axis]: 0 },
      viewport: { once: true, margin: '-100px' },
      transition: { duration: 0.6, ease: 'easeOut' },
    }
  }

  return (
    <section className="py-24 px-4">
      <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Image side */}
        <motion.div
          {...slideIn('left')}
          className="w-full max-w-[384px] mx-auto md:mx-0"
        >
          <div
            className="w-full aspect-[16/10] border border-border bg-[#000814] overflow-hidden relative"
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Mini ring floor */}
            <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-surface border-t border-border" />
            {/* Ropes */}
            <div className="absolute left-[8%] right-[8%] top-[30%] h-px bg-accent/15" />
            <div className="absolute left-[8%] right-[8%] top-[42%] h-px bg-accent/15" />
            <div className="absolute left-[8%] right-[8%] top-[54%] h-px bg-accent/15" />
            {/* Corner posts */}
            <div className="absolute left-[8%] top-[28%] w-1 h-[44%] bg-accent" />
            <div className="absolute right-[8%] top-[28%] w-1 h-[44%] bg-accent" />
            {/* Fighter 1 (red) */}
            <div className="absolute bottom-[28%] left-[30%] -translate-x-1/2">
              <div className="w-3 h-3 bg-accent mx-auto mb-px" />
              <div className="w-4 h-5 bg-accent mx-auto" />
              <div className="flex gap-px justify-center">
                <div className="w-1.5 h-4 bg-accent" />
                <div className="w-1.5 h-4 bg-accent" />
              </div>
            </div>
            {/* Fighter 2 (blue) */}
            <div className="absolute bottom-[28%] right-[30%] translate-x-1/2">
              <div className="w-3 h-3 bg-accent2 mx-auto mb-px" />
              <div className="w-4 h-5 bg-accent2 mx-auto" />
              <div className="flex gap-px justify-center">
                <div className="w-1.5 h-4 bg-accent2" />
                <div className="w-1.5 h-4 bg-accent2" />
              </div>
            </div>
            {/* VS text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-pixel text-xs text-text2/20">VS</span>
            </div>
            {/* LIVE indicator */}
            <div className="absolute top-2 right-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green animate-pulse" />
              <span className="font-pixel text-[8px] text-green">LIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Text side */}
        <div>
          <motion.h2
            {...slideIn('right')}
            className="font-pixel text-lg md:text-xl text-text leading-relaxed mb-8 tracking-wider"
          >
            AI FIGHTERS.
            <br />
            REAL STAKES.
            <br />
            LIVE BATTLES.
          </motion.h2>

          <motion.ul
            {...slideIn('right')}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className="space-y-4"
          >
            {bullets.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                <span className="font-ui text-base text-text2 leading-relaxed">
                  {text}
                </span>
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}
