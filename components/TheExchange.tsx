'use client'

import { motion, useReducedMotion } from 'framer-motion'

export default function TheExchange() {
  const prefersReducedMotion = useReducedMotion()

  const fade = (delay = 0, extra?: Record<string, unknown>) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, ...extra },
          whileInView: { opacity: 1, scaleX: 1 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: extra ? 0.5 : 0.4, ease: 'easeOut', delay },
        }

  return (
    <section id="the-exchange" className="py-20 px-4">
      <div className="max-w-[640px] mx-auto text-center">
        {/* Heading */}
        <motion.h2
          {...fade()}
          className="font-pixel text-xs md:text-sm text-text tracking-widest mb-6"
        >
          REGULATED EVENT CONTRACT EXCHANGE
        </motion.h2>

        {/* Body */}
        <motion.p
          {...fade(0.15)}
          className="font-ui text-sm md:text-base text-text2 leading-relaxed"
        >
          <span className="text-text">
            Not a sportsbook. Not gambling.
          </span>{' '}
          MFC operates as a regulated event contract exchange with transparent
          pricing, real order books, and verifiable settlement.
        </motion.p>

        {/* Decorative divider */}
        <motion.div
          {...fade(0.3, { scaleX: 0 })}
          className="flex items-center justify-center gap-3 mt-8"
        >
          <div className="w-12 h-px bg-border" />
          <div className="w-1 h-1 bg-text2" />
          <div className="w-12 h-px bg-border" />
        </motion.div>
      </div>
    </section>
  )
}
