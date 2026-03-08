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
  KICK_WIND as RAW_KICK_WIND,
  KICK_EXTEND as RAW_KICK_EXTEND,
  KICK_RETRACT as RAW_KICK_RETRACT,
  HIT as RAW_HIT,
  BLOCK as RAW_BLOCK,
  DOWN as RAW_DOWN,
  VICTORY_1 as RAW_VICTORY_1,
  VICTORY_2 as RAW_VICTORY_2,
  DEFEAT as RAW_DEFEAT,
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

  registerRealSprites({
    IDLE_1: resolve(RAW_IDLE_1),
    IDLE_2: resolve(RAW_IDLE_2),
    PUNCH_WIND: resolve(RAW_JAB_1),
    PUNCH_EXTEND: resolve(RAW_JAB_3),
    PUNCH_RETRACT: resolve(RAW_JAB_4),
    KICK_WIND: resolve(RAW_KICK_WIND),
    KICK_EXTEND: resolve(RAW_KICK_EXTEND),
    KICK_RETRACT: resolve(RAW_KICK_RETRACT),
    HIT: resolve(RAW_HIT),
    BLOCK: resolve(RAW_BLOCK),
    DOWN: resolve(RAW_DOWN),
    VICTORY_1: resolve(RAW_VICTORY_1),
    VICTORY_2: resolve(RAW_VICTORY_2),
    DEFEAT: resolve(RAW_DEFEAT),
  })
}
