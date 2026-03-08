// ── Sprite Loader ────────────────────────────────────────────────────────────
// Bridges Luna's palette-indexed frames (number[][]) to the renderer's
// color-string format (string[][]). Call initRealSprites() once to replace
// placeholder sprites globally.

import {
  resolveIndexedFrame,
  registerRealSprites,
  type SpriteFrame,
} from '../sprite-renderer'
import {
  FIGHTER_PALETTE,
  IDLE_1 as RAW_IDLE_1,
  IDLE_2 as RAW_IDLE_2,
  IDLE_3 as RAW_IDLE_3,
  IDLE_4 as RAW_IDLE_4,
  JAB_1 as RAW_JAB_1,
  JAB_2 as RAW_JAB_2,
  JAB_3 as RAW_JAB_3,
  JAB_4 as RAW_JAB_4,
  KICK_1 as RAW_KICK_1,
  KICK_3 as RAW_KICK_3,
  KICK_4 as RAW_KICK_4,
} from './fighter-base'

// Convert a palette-indexed frame to renderer-compatible color strings
function resolve(raw: { width: number; height: number; pixels: number[][] }): SpriteFrame {
  return resolveIndexedFrame(raw.pixels, FIGHTER_PALETTE, raw.width, raw.height)
}

let _initialized = false

/** Initialize real sprite art — call once. Replaces placeholders globally. */
export function initRealSprites(): void {
  if (_initialized) return
  _initialized = true

  const IDLE_1 = resolve(RAW_IDLE_1)
  const IDLE_2 = resolve(RAW_IDLE_2)
  const IDLE_3 = resolve(RAW_IDLE_3)
  const IDLE_4 = resolve(RAW_IDLE_4)
  const JAB_1 = resolve(RAW_JAB_1)
  const JAB_3 = resolve(RAW_JAB_3)
  const JAB_4 = resolve(RAW_JAB_4)
  const KICK_1 = resolve(RAW_KICK_1)
  const KICK_3 = resolve(RAW_KICK_3)
  const KICK_4 = resolve(RAW_KICK_4)

  registerRealSprites({
    IDLE_1,
    IDLE_2,
    PUNCH_WIND: JAB_1,
    PUNCH_EXTEND: JAB_3,
    PUNCH_RETRACT: JAB_4,
    KICK_WIND: KICK_1,
    KICK_EXTEND: KICK_3,
    KICK_RETRACT: KICK_4,
    // Temporary: reuse idle variants for other states
    HIT: IDLE_3,
    BLOCK: IDLE_4,
    DOWN: IDLE_1,
    VICTORY_1: IDLE_1,
    VICTORY_2: IDLE_3,
    DEFEAT: IDLE_4,
  })
}
