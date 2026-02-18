'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react'
import EnhancedFightCanvas from './EnhancedFightCanvas'
import { FightRecording } from '@/lib/fight-recorder'
import { Fighter } from '@/types'

interface FightReplayViewerProps {
  recording: FightRecording
  fighters: Fighter[]
  onClose?: () => void
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4]

export default function FightReplayViewer({ recording, fighters, onClose }: FightReplayViewerProps) {
  const [currentTick, setCurrentTick] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentState = recording.snapshots[currentTick] ?? recording.snapshots[0]
  const progress = recording.totalTicks > 1 ? (currentTick / (recording.totalTicks - 1)) * 100 : 0

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])

  const seekTo = useCallback((tick: number) => {
    setCurrentTick(Math.max(0, Math.min(tick, recording.totalTicks - 1)))
  }, [recording.totalTicks])

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const interval = recording.tickRate / speed
      intervalRef.current = setInterval(() => {
        setCurrentTick(prev => {
          if (prev >= recording.totalTicks - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, interval)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, speed, recording.tickRate, recording.totalTicks])

  if (!currentState) return null

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Replay Header */}
      <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="font-pixel text-xs text-gold tracking-wider">FIGHT REPLAY</div>
        <div className="font-pixel text-xs text-text2">
          {currentState.round > 0 ? `ROUND ${currentState.round}` : 'INTRO'}
        </div>
        {onClose && (
          <motion.button
            onClick={onClose}
            className="font-pixel text-xs text-text2 hover:text-text transition-colors px-3 py-1 border border-border"
            whileTap={{ scale: 0.95 }}
          >
            CLOSE
          </motion.button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <EnhancedFightCanvas fightState={currentState} fighters={fighters} />
      </div>

      {/* Playback Controls */}
      <div className="bg-surface border-t border-border px-4 py-3">
        {/* Timeline scrubber */}
        <div className="mb-3">
          <div className="relative w-full h-2 bg-surface2 cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            seekTo(Math.round(pct * (recording.totalTicks - 1)))
          }}>
            <div
              className="absolute left-0 top-0 h-full bg-accent transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent"
              style={{ left: `${progress}%`, marginLeft: '-6px' }}
            />
          </div>
          <div className="flex justify-between text-xs text-text2 font-ui mt-1">
            <span>{currentTick} / {recording.totalTicks - 1}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-2">
          <motion.button
            onClick={() => seekTo(0)}
            className="p-2 text-text2 hover:text-text transition-colors"
            whileTap={{ scale: 0.9 }}
            title="Start"
          >
            <SkipBack className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => seekTo(Math.max(0, currentTick - 10))}
            className="p-2 text-text2 hover:text-text transition-colors"
            whileTap={{ scale: 0.9 }}
            title="Back 10"
          >
            <Rewind className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={isPlaying ? pause : play}
            className="p-3 bg-accent text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </motion.button>
          <motion.button
            onClick={() => seekTo(Math.min(recording.totalTicks - 1, currentTick + 10))}
            className="p-2 text-text2 hover:text-text transition-colors"
            whileTap={{ scale: 0.9 }}
            title="Forward 10"
          >
            <FastForward className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => seekTo(recording.totalTicks - 1)}
            className="p-2 text-text2 hover:text-text transition-colors"
            whileTap={{ scale: 0.9 }}
            title="End"
          >
            <SkipForward className="w-4 h-4" />
          </motion.button>

          {/* Speed selector */}
          <div className="ml-4 flex items-center gap-1">
            {SPEED_OPTIONS.map(s => (
              <motion.button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 font-pixel text-xs border transition-colors ${
                  speed === s
                    ? 'bg-accent text-white border-accent'
                    : 'text-text2 border-border hover:text-text'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {s}x
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
