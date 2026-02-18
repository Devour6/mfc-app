'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

const steps = [
  {
    number: '01',
    heading: 'WATCH',
    description:
      'Fights happen 24/7. Watch AI agents battle in real-time with pixel-art graphics and live commentary.',
  },
  {
    number: '02',
    heading: 'OWN',
    description:
      'Train, evolve, and manage your stable of AI fighters. Every decision shapes their fighting style.',
  },
  {
    number: '03',
    heading: 'TRADE',
    description:
      'Buy and sell outcome contracts on every fight. If your prediction is right, your contract pays out.',
  },
]

export default function HowItWorks() {
  const [expanded, setExpanded] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const fadeUp = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-80px' },
          transition: { duration: 0.5, ease: 'easeOut', delay },
        }

  return (
    <section className="py-24 px-4">
      <div className="max-w-[1024px] mx-auto">
        {/* Section heading */}
        <motion.h2
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 15 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.4 },
              })}
          className="font-pixel text-base md:text-lg text-text text-center tracking-widest mb-16"
        >
          HOW IT WORKS
        </motion.h2>

        {/* Step grid (3-col desktop, vertical stepper mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              {...fadeUp(i * 0.15)}
              className="flex gap-4 md:block"
            >
              {/* Mobile accent bar */}
              <div className="w-0.5 bg-accent flex-shrink-0 md:hidden" />

              <div>
                <div className="font-ui text-sm font-bold text-accent mb-2">
                  {step.number}
                </div>

                {/* Step illustration */}
                <div className="w-full aspect-[16/10] border border-border bg-[#000814] overflow-hidden relative mb-4">
                  {step.number === '01' && (
                    <>
                      {/* WATCH — mini arena with fighters */}
                      <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-surface" />
                      <div className="absolute bottom-[28%] left-[32%] w-2.5 h-6 bg-accent" />
                      <div className="absolute bottom-[28%] right-[32%] w-2.5 h-6 bg-accent2" />
                      <div className="absolute top-2 left-3 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green animate-pulse" />
                        <span className="font-pixel text-[7px] text-green">LIVE</span>
                      </div>
                      <div className="absolute top-2 right-3">
                        <span className="font-pixel text-[7px] text-gold">R2 1:45</span>
                      </div>
                    </>
                  )}
                  {step.number === '02' && (
                    <>
                      {/* OWN — fighter card with stats */}
                      <div className="absolute inset-3 border border-border bg-surface/80 p-2 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-accent" />
                          <span className="font-pixel text-[7px] text-text">THUNDER BOLT</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          {['STR', 'SPD', 'DEF'].map((stat, j) => (
                            <div key={stat} className="flex items-center gap-1">
                              <span className="font-pixel text-[6px] text-text2 w-5">{stat}</span>
                              <div className="flex-1 h-1.5 bg-bg">
                                <div className="h-full bg-accent" style={{ width: `${65 + j * 12}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="font-pixel text-[6px] text-gold mt-1">ELO 1580</div>
                      </div>
                    </>
                  )}
                  {step.number === '03' && (
                    <>
                      {/* TRADE — contract prices */}
                      <div className="absolute inset-3 flex flex-col justify-center items-center gap-2">
                        <span className="font-pixel text-[7px] text-text2">WILL THUNDER BOLT WIN?</span>
                        <div className="flex gap-3">
                          <div className="border border-green/50 bg-green/10 px-3 py-1.5">
                            <span className="font-pixel text-[8px] text-green block">YES</span>
                            <span className="font-ui text-xs font-bold text-green">0.63</span>
                          </div>
                          <div className="border border-red/50 bg-red/10 px-3 py-1.5">
                            <span className="font-pixel text-[8px] text-red block">NO</span>
                            <span className="font-ui text-xs font-bold text-red">0.37</span>
                          </div>
                        </div>
                        <span className="font-pixel text-[6px] text-text2/50">PAY 0.63 → WIN 1.00</span>
                      </div>
                    </>
                  )}
                </div>

                <h3 className="font-pixel text-sm text-text mb-2">
                  {step.heading}
                </h3>

                <p className="font-ui text-sm text-text2 leading-relaxed">
                  {step.description}
                </p>

                {/* Expandable contract explainer (Step 03 only) */}
                {step.number === '03' && (
                  <>
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="flex items-center gap-2 mt-3 font-ui text-xs text-accent2 hover:text-accent2/80 cursor-pointer min-h-[44px]"
                    >
                      <motion.span
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[8px]"
                      >
                        &#x25BC;
                      </motion.span>
                      What&apos;s an outcome contract?
                    </button>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 p-4 bg-surface border border-border">
                            <p className="font-ui text-xs text-text2 mb-3">
                              An outcome contract is a simple yes/no question
                              about a fight:
                            </p>
                            <p className="font-pixel text-xs text-text mb-3">
                              &ldquo;Will IRONCLAD-7 win?&rdquo;
                            </p>
                            <div className="space-y-1 mb-3 pl-4">
                              <p className="font-ui text-xs text-green">
                                YES at 0.63 — you pay 0.63, get 1.00 if he wins
                              </p>
                              <p className="font-ui text-xs text-red">
                                NO at 0.37 — you pay 0.37, get 1.00 if he loses
                              </p>
                            </div>
                            <p className="font-ui text-xs text-text2">
                              The price reflects what the market thinks will
                              happen. It&apos;s not betting — it&apos;s a
                              financial contract on an outcome, like Kalshi or
                              Polymarket, but for AI combat.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
