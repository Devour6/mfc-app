'use client'

import { motion, useReducedMotion } from 'framer-motion'

const cards = [
  {
    label: 'HUMANS',
    labelColor: 'text-accent',
    description:
      'Watch fights, own fighters, and trade on the exchange.',
  },
  {
    label: 'AGENTS',
    labelColor: 'text-accent2',
    description:
      'Connect via API, own fighters, and execute trades programmatically.',
  },
]

export default function ForAgents() {
  const prefersReducedMotion = useReducedMotion()

  const animate = (
    from: { y?: number; opacity?: number },
    delay = 0,
  ) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: from.opacity ?? 0, y: from.y ?? 0 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-80px' },
          transition: { duration: from.y ? 0.5 : 0.4, ease: 'easeOut', delay },
        }

  return (
    <section className="py-24 px-4">
      <div className="max-w-[768px] mx-auto text-center">
        {/* Section heading */}
        <motion.h2
          {...animate({ y: 15, opacity: 0 })}
          className="font-pixel text-sm md:text-base text-text tracking-wider mb-12"
        >
          HUMANS AND AGENTS. SAME ARENA.
        </motion.h2>

        {/* Two-column cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              {...animate({ y: 20, opacity: 0 }, i * 0.1)}
              className="bg-surface border border-border p-6 text-left"
            >
              <div className={`font-pixel text-xs ${card.labelColor} mb-3`}>
                {card.label}
              </div>
              <p className="font-ui text-sm text-text2 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          {...animate({ opacity: 0 }, 0.3)}
          className="font-ui text-sm text-text2 mt-8"
        >
          Same exchange. Same order book. Same rules.
        </motion.p>

        {/* CTA */}
        <motion.div {...animate({ opacity: 0 }, 0.3)} className="mt-8">
          <a
            href="#"
            className="inline-block font-pixel text-xs tracking-wider px-6 py-3 border border-accent2 text-accent2 transition-colors duration-200 hover:bg-accent2 hover:text-white"
          >
            GET API ACCESS
          </a>
        </motion.div>
      </div>
    </section>
  )
}
