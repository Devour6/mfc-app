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
            className="w-full aspect-[16/10] border border-border bg-surface flex items-center justify-center overflow-hidden"
            style={{ imageRendering: 'pixelated' }}
          >
            <span className="font-pixel text-xs text-text2 tracking-wider">
              SCREENSHOT
            </span>
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
