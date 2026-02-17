'use client'

import { motion } from 'framer-motion'
import { FightState, Fighter } from '@/types'

interface LiveStatsOverlayProps {
  fightState: FightState
  fighters: Fighter[]
}

export default function LiveStatsOverlay({ fightState, fighters }: LiveStatsOverlayProps) {
  const f1 = fightState.fighter1
  const f2 = fightState.fighter2

  const f1Accuracy = f1.stats.strikes > 0
    ? Math.round((f1.stats.landed / f1.stats.strikes) * 100)
    : 0
  const f2Accuracy = f2.stats.strikes > 0
    ? Math.round((f2.stats.landed / f2.stats.strikes) * 100)
    : 0

  // Momentum: based on recent landed strikes, HP advantage, and combo
  const f1Momentum = f1.stats.landed * 2 + f1.combo.count * 5 + Math.max(0, f1.hp - f2.hp)
  const f2Momentum = f2.stats.landed * 2 + f2.combo.count * 5 + Math.max(0, f2.hp - f1.hp)
  const totalMomentum = f1Momentum + f2Momentum || 1
  const f1MomentumPct = Math.round((f1Momentum / totalMomentum) * 100)

  return (
    <div className="bg-surface/95 border border-border p-3">
      {/* Header */}
      <div className="font-pixel text-[10px] text-gold mb-3 text-center tracking-wider">
        LIVE FIGHT STATS
      </div>

      {/* Fighter names row */}
      <div className="flex justify-between mb-2">
        <span className="font-pixel text-[10px] text-accent">{fighters[0]?.name ?? 'F1'}</span>
        <span className="font-pixel text-[10px] text-blue">{fighters[1]?.name ?? 'F2'}</span>
      </div>

      {/* HP Bars */}
      <StatBar
        label="HP"
        leftVal={f1.hp}
        rightVal={f2.hp}
        max={100}
        leftColor="bg-accent"
        rightColor="bg-blue"
      />

      {/* Stamina Bars */}
      <StatBar
        label="STA"
        leftVal={Math.round(f1.stamina)}
        rightVal={Math.round(f2.stamina)}
        max={100}
        leftColor="bg-green"
        rightColor="bg-green"
      />

      {/* Strike Stats */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1 mt-3 text-[10px] font-pixel">
        <StatRow leftVal={f1.stats.landed} label="LANDED" rightVal={f2.stats.landed} />
        <StatRow leftVal={f1.stats.strikes} label="THROWN" rightVal={f2.stats.strikes} />
        <StatRow leftVal={`${f1Accuracy}%`} label="ACC" rightVal={`${f2Accuracy}%`} />
        <StatRow leftVal={f1.stats.powerShots} label="POWER" rightVal={f2.stats.powerShots} />
        <StatRow leftVal={f1.stats.dodges} label="DODGE" rightVal={f2.stats.dodges} />
        <StatRow leftVal={f1.stats.blocks} label="BLOCK" rightVal={f2.stats.blocks} />
      </div>

      {/* Momentum Bar */}
      <div className="mt-3">
        <div className="font-pixel text-[9px] text-text2 text-center mb-1">MOMENTUM</div>
        <div className="h-2 bg-bg flex overflow-hidden border border-border">
          <motion.div
            className="bg-accent h-full"
            animate={{ width: `${f1MomentumPct}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="bg-blue h-full"
            animate={{ width: `${100 - f1MomentumPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Combo indicator */}
      {(f1.combo.count > 1 || f2.combo.count > 1) && (
        <div className="mt-2 flex justify-between">
          {f1.combo.count > 1 && (
            <motion.div
              className="font-pixel text-[10px] text-gold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            >
              {f1.combo.count}x COMBO
            </motion.div>
          )}
          {f1.combo.count <= 1 && <div />}
          {f2.combo.count > 1 && (
            <motion.div
              className="font-pixel text-[10px] text-gold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            >
              {f2.combo.count}x COMBO
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function StatBar({
  label,
  leftVal,
  rightVal,
  max,
  leftColor,
  rightColor,
}: {
  label: string
  leftVal: number
  rightVal: number
  max: number
  leftColor: string
  rightColor: string
}) {
  const leftPct = Math.max(0, Math.min(100, (leftVal / max) * 100))
  const rightPct = Math.max(0, Math.min(100, (rightVal / max) * 100))

  return (
    <div className="flex items-center gap-1 mb-1">
      {/* Left bar (reversed direction) */}
      <div className="flex-1 flex items-center gap-1">
        <span className="font-pixel text-[9px] text-text2 w-5 text-right">{Math.round(leftVal)}</span>
        <div className="flex-1 h-[6px] bg-bg border border-border relative">
          <motion.div
            className={`absolute right-0 top-0 h-full ${leftColor}`}
            animate={{ width: `${leftPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <span className="font-pixel text-[8px] text-text2 w-6 text-center">{label}</span>

      {/* Right bar */}
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 h-[6px] bg-bg border border-border relative">
          <motion.div
            className={`absolute left-0 top-0 h-full ${rightColor}`}
            animate={{ width: `${rightPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="font-pixel text-[9px] text-text2 w-5">{Math.round(rightVal)}</span>
      </div>
    </div>
  )
}

function StatRow({
  leftVal,
  label,
  rightVal,
}: {
  leftVal: number | string
  label: string
  rightVal: number | string
}) {
  return (
    <>
      <span className="text-text text-right">{leftVal}</span>
      <span className="text-text2 text-center">{label}</span>
      <span className="text-text">{rightVal}</span>
    </>
  )
}
