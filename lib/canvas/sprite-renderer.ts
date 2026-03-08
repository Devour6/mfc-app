// ── Sprite Frame Rendering Engine ─────────────────────────────────────────────
// Bitmap-based sprite system replacing skeleton+lerp animation.
// SpriteFrame holds a 2D pixel grid. drawSpriteFrame() blits pixels to canvas.
// getAnimationFrame() picks the correct frame by tick count.
// Luna draws real art — these are placeholder frames.

// Sprite pixel size — independent of skeleton system's P=4.
// At SPRITE_P=2 + FIGHTER_SCALE=2.0, each sprite "pixel" = 4 canvas pixels.
// This allows higher-resolution sprite art than the old skeleton blocks.
const SPRITE_P = 2

// ── Types ────────────────────────────────────────────────────────────────────

/** A single sprite frame: 2D grid of color strings ('' = transparent). */
export interface SpriteFrame {
  width: number   // grid columns
  height: number  // grid rows
  pixels: string[][]  // [row][col] — color string or '' for transparent
}

/** A named animation: ordered frames with timing. */
export interface SpriteAnimation {
  frames: SpriteFrame[]
  frameDurationMs: number  // how long each frame displays
  loop: boolean            // whether to loop or hold last frame
}

/** Complete sprite sheet for a fighter: all animation states. */
export interface FighterSpriteSheet {
  idle: SpriteAnimation
  walk: SpriteAnimation
  punch: SpriteAnimation
  kick: SpriteAnimation
  hit: SpriteAnimation
  block: SpriteAnimation
  dodge: SpriteAnimation
  down: SpriteAnimation
  victory: SpriteAnimation
  defeat: SpriteAnimation
}

// ── Core Rendering ───────────────────────────────────────────────────────────

/**
 * Blit a SpriteFrame to canvas at (x, y). Each pixel is drawn as a SPRITE_P×SPRITE_P block.
 * The sprite is anchored at its horizontal center, vertical bottom (feet).
 * If `facing` is -1, the sprite is flipped horizontally.
 */
export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  x: number,
  y: number,
  facing: 1 | -1 = 1,
  tint?: string,
): void {
  const totalW = frame.width * SPRITE_P
  const totalH = frame.height * SPRITE_P

  // Anchor: center-bottom (feet at x, y)
  const originX = x - totalW / 2
  const originY = y - totalH

  ctx.save()

  // Flip by mirroring around the anchor x
  if (facing === -1) {
    ctx.translate(x, 0)
    ctx.scale(-1, 1)
    ctx.translate(-x, 0)
  }

  for (let row = 0; row < frame.height; row++) {
    const rowData = frame.pixels[row]
    if (!rowData) continue
    for (let col = 0; col < frame.width; col++) {
      const color = rowData[col]
      if (!color) continue // transparent
      ctx.fillStyle = color
      ctx.fillRect(
        Math.round(originX + col * SPRITE_P),
        Math.round(originY + row * SPRITE_P),
        SPRITE_P,
        SPRITE_P,
      )
    }
  }

  // Optional tint overlay (for hit flash, etc.)
  if (tint) {
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = tint
    ctx.fillRect(originX, originY, totalW, totalH)
  }

  ctx.restore()
}

// ── Animation Playback ───────────────────────────────────────────────────────

/**
 * Pick the correct frame from an animation based on elapsed time.
 * Returns the SpriteFrame to draw.
 */
export function getAnimationFrame(
  anim: SpriteAnimation,
  elapsedMs: number,
): SpriteFrame {
  if (anim.frames.length === 0) {
    throw new Error('Animation has no frames')
  }

  const totalDuration = anim.frames.length * anim.frameDurationMs
  let t = elapsedMs

  if (anim.loop) {
    t = t % totalDuration
  } else {
    t = Math.min(t, totalDuration - 1)
  }

  const frameIndex = Math.floor(t / anim.frameDurationMs)
  return anim.frames[Math.min(frameIndex, anim.frames.length - 1)]
}

/**
 * Map a fight engine animation state to a sprite animation key.
 */
export function mapStateToAnimKey(
  animState: string,
): keyof FighterSpriteSheet {
  switch (animState) {
    case 'idle': return 'idle'
    case 'walking': return 'walk'
    case 'punching': return 'punch'
    case 'kicking': return 'kick'
    case 'hit': return 'hit'
    case 'blocking': return 'block'
    case 'dodging': return 'dodge'
    case 'down': return 'down'
    case 'victory': return 'victory'
    case 'defeat': return 'defeat'
    default: return 'idle'
  }
}

// ── Palette Conversion ──────────────────────────────────────────────────────
// Luna's sprite data uses number[][] with palette indices.
// The renderer expects string[][] with CSS color strings.
// This function bridges the two formats.

/**
 * Convert a palette-indexed pixel grid (number[][]) to a color-string grid (string[][]).
 * Index 0 or 'transparent' → '' (transparent). All other indices → palette[index].
 */
export function resolveIndexedFrame(
  pixels: number[][],
  palette: string[],
  width: number,
  height: number,
): SpriteFrame {
  const resolved: string[][] = pixels.map(row =>
    row.map(idx => {
      if (idx === 0) return ''
      const color = palette[idx]
      return (!color || color === 'transparent') ? '' : color
    })
  )
  return { width, height, pixels: resolved }
}

// ── Placeholder Sprite Sheets ────────────────────────────────────────────────
// Minimal recognizable fighters until Luna draws real pixel art.
// Each frame is a small grid (approx 12×16 pixels).
// Colors: body color passed in, skin tones, black outline.

const O = '#111'     // outline
const SK = '#e8b88a' // skin
const SS = '#c89870' // skin shadow
const T = ''         // transparent

/** Build a placeholder idle frame with the given body color. */
function makeIdleFrame(color: string, breathOffset: number): SpriteFrame {
  const C = color
  const bOff = breathOffset // 0 or 1 — subtle breathing
  return {
    width: 12,
    height: 16 + bOff,
    pixels: [
      // Hair/head top
      [T, T, T, T, O, O, O, O, T, T, T, T],
      [T, T, T, O, C, C, C, C, O, T, T, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      // Face
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, O, SK, O, SK, SK, O, SK, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, T, O, SK, SS, SS, SK, O, T, T, T],
      // Neck + shoulders
      [T, T, T, T, O, SK, SK, O, T, T, T, T],
      [T, O, O, O, O, C, C, O, O, O, O, T],
      // Torso
      [T, O, C, C, C, C, C, C, C, C, O, T],
      [T, O, C, C, C, C, C, C, C, C, O, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      // Waist + hips
      [T, T, O, C, C, O, O, C, C, O, T, T],
      // Legs
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      // Boots
      [T, O, O, O, O, T, T, O, O, O, O, T],
      // Extra row for breath offset
      ...(bOff ? [[T, T, T, T, T, T, T, T, T, T, T, T]] : []),
    ],
  }
}

function makePunchFrame(color: string, phase: 'wind' | 'extend' | 'retract'): SpriteFrame {
  const C = color
  const G = '#ffdd00' // glove
  if (phase === 'extend') {
    return {
      width: 16,
      height: 16,
      pixels: [
        [T, T, T, T, O, O, O, O, T, T, T, T, T, T, T, T],
        [T, T, T, O, C, C, C, C, O, T, T, T, T, T, T, T],
        [T, T, O, C, C, C, C, C, C, O, T, T, T, T, T, T],
        [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T, T, T, T, T],
        [T, T, O, SK, O, SK, SK, O, SK, O, T, T, T, T, T, T],
        [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T, T, T, T, T],
        [T, T, T, O, SK, SS, SS, SK, O, T, T, T, T, T, T, T],
        [T, T, T, T, O, SK, SK, O, T, T, T, T, T, T, T, T],
        [T, O, O, O, O, C, C, O, O, SK, SK, SK, G, G, T, T],
        [T, O, C, C, C, C, C, C, C, C, O, T, G, G, T, T],
        [T, O, C, C, C, C, C, C, C, C, O, T, T, T, T, T],
        [T, T, O, C, C, C, C, C, C, O, T, T, T, T, T, T],
        [T, T, O, C, C, O, O, C, C, O, T, T, T, T, T, T],
        [T, T, O, SK, SK, O, O, SK, SK, O, T, T, T, T, T, T],
        [T, T, O, SK, SK, O, O, SK, SK, O, T, T, T, T, T, T],
        [T, O, O, O, O, T, T, O, O, O, O, T, T, T, T, T],
      ],
    }
  }
  // wind-up and retract share a similar chambered pose
  return {
    width: 12,
    height: 16,
    pixels: [
      [T, T, T, T, O, O, O, O, T, T, T, T],
      [T, T, T, O, C, C, C, C, O, T, T, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, O, SK, O, SK, SK, O, SK, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, T, O, SK, SS, SS, SK, O, T, T, T],
      [T, T, T, T, O, SK, SK, O, T, T, T, T],
      [T, O, O, O, O, C, C, O, O, O, O, T],
      [T, O, C, C, C, C, C, C, G, G, O, T],
      [T, O, C, C, C, C, C, C, G, G, O, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, C, C, O, O, C, C, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, O, O, O, O, T, T, O, O, O, O, T],
    ],
  }
}

function makeKickFrame(color: string, phase: 'wind' | 'extend' | 'retract'): SpriteFrame {
  const C = color
  const B = '#222' // boot
  if (phase === 'extend') {
    return {
      width: 16,
      height: 16,
      pixels: [
        [T, T, T, T, O, O, O, O, T, T, T, T, T, T, T, T],
        [T, T, T, O, C, C, C, C, O, T, T, T, T, T, T, T],
        [T, T, O, C, C, C, C, C, C, O, T, T, T, T, T, T],
        [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T, T, T, T, T],
        [T, T, O, SK, O, SK, SK, O, SK, O, T, T, T, T, T, T],
        [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T, T, T, T, T],
        [T, T, T, O, SK, SS, SS, SK, O, T, T, T, T, T, T, T],
        [T, T, T, T, O, SK, SK, O, T, T, T, T, T, T, T, T],
        [T, O, O, O, O, C, C, O, O, O, O, T, T, T, T, T],
        [T, O, C, C, C, C, C, C, C, C, O, T, T, T, T, T],
        [T, O, C, C, C, C, C, C, C, C, O, T, T, T, T, T],
        [T, T, O, C, C, C, C, C, C, O, T, T, T, T, T, T],
        [T, T, O, C, C, O, O, SK, SK, SK, SK, O, O, B, B, T],
        [T, T, O, SK, SK, O, T, T, T, T, T, T, T, B, B, T],
        [T, T, O, SK, SK, O, T, T, T, T, T, T, T, T, T, T],
        [T, O, O, O, O, T, T, T, T, T, T, T, T, T, T, T],
      ],
    }
  }
  return makeIdleFrame(color, 0) // wind/retract reuse idle shape
}

function makeHitFrame(color: string): SpriteFrame {
  const C = color
  return {
    width: 12,
    height: 16,
    pixels: [
      [T, T, T, T, T, O, O, O, O, T, T, T],
      [T, T, T, T, O, C, C, C, C, O, T, T],
      [T, T, T, O, C, C, C, C, C, C, O, T],
      [T, T, T, O, SK, SK, SK, SK, SK, SK, O, T],
      [T, T, T, O, '#ff0', SK, SK, '#ff0', SK, O, T, T],
      [T, T, T, O, SK, SK, SK, SK, SK, SK, O, T],
      [T, T, T, T, O, SK, '#c00', SK, O, T, T, T],
      [T, T, T, T, T, O, SK, O, T, T, T, T],
      [T, T, O, O, O, O, C, C, O, O, O, T],
      [T, T, O, C, C, C, C, C, C, C, O, T],
      [T, T, T, O, C, C, C, C, C, O, T, T],
      [T, T, T, O, C, C, C, C, C, O, T, T],
      [T, T, T, O, C, C, O, O, C, C, O, T],
      [T, T, T, O, SK, SK, O, O, SK, SK, O, T],
      [T, T, T, O, SK, SK, O, O, SK, SK, O, T],
      [T, T, O, O, O, O, T, T, O, O, O, O],
    ],
  }
}

function makeBlockFrame(color: string): SpriteFrame {
  const C = color
  const G = '#ffdd00'
  return {
    width: 12,
    height: 16,
    pixels: [
      [T, T, T, T, O, O, O, O, T, T, T, T],
      [T, T, T, O, C, C, C, C, O, T, T, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, O, SK, O, SK, SK, O, SK, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, G, O, SK, SS, SS, SK, O, G, T, T],
      [T, T, G, T, O, SK, SK, O, T, G, T, T],
      [T, O, G, O, O, C, C, O, O, G, O, T],
      [T, O, C, C, C, C, C, C, C, C, O, T],
      [T, O, C, C, C, C, C, C, C, C, O, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, C, C, O, O, C, C, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, O, O, O, O, T, T, O, O, O, O, T],
    ],
  }
}

function makeDownFrame(color: string): SpriteFrame {
  const C = color
  const G = '#ffdd00'
  const B = '#222'
  return {
    width: 16,
    height: 6,
    pixels: [
      [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
      [O, C, C, O, SK, SK, SK, O, C, C, C, C, SK, SK, B, B],
      [O, C, C, O, SK, O, SK, O, C, C, C, C, SK, SK, B, B],
      [T, O, O, O, SK, SK, SK, O, C, C, C, C, O, O, O, O],
      [T, T, T, T, O, O, O, T, O, O, O, O, T, T, T, T],
      [T, T, G, G, T, T, T, T, T, T, T, T, T, T, T, T],
    ],
  }
}

function makeVictoryFrame(color: string, phase: number): SpriteFrame {
  const C = color
  const G = '#ffdd00'
  const armUp = phase % 2 === 0
  return {
    width: 12,
    height: 16,
    pixels: [
      [T, T, T, T, O, O, O, O, T, T, T, T],
      [T, T, T, O, C, C, C, C, O, T, T, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, O, SK, O, SK, SK, O, SK, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, T, O, SK, SK, SK, SK, O, T, T, T],
      [T, T, T, T, O, SK, SK, O, T, T, T, T],
      armUp
        ? [G, G, O, O, O, C, C, O, O, O, G, G]
        : [T, G, O, O, O, C, C, O, O, O, G, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, T, O, C, C, C, C, O, T, T, T],
      [T, T, O, C, C, O, O, C, C, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, O, O, O, O, T, T, O, O, O, O, T],
    ],
  }
}

function makeDefeatFrame(color: string): SpriteFrame {
  const C = color
  return {
    width: 12,
    height: 16,
    pixels: [
      [T, T, T, T, T, T, T, T, T, T, T, T],
      [T, T, T, T, O, O, O, O, T, T, T, T],
      [T, T, T, O, C, C, C, C, O, T, T, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, SK, SK, SK, SK, SK, SK, O, T, T],
      [T, T, O, SK, O, SK, SK, O, SK, O, T, T],
      [T, T, O, SK, SK, SS, SS, SK, SK, O, T, T],
      [T, T, T, O, SK, SK, SK, SK, O, T, T, T],
      [T, T, O, O, O, C, C, O, O, O, T, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, O, C, C, C, C, C, C, C, C, O, T],
      [T, T, O, C, C, C, C, C, C, O, T, T],
      [T, T, O, C, C, O, O, C, C, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, T, O, SK, SK, O, O, SK, SK, O, T, T],
      [T, O, O, O, O, T, T, O, O, O, O, T],
    ],
  }
}

// ── Sprite Sheet Loader ──────────────────────────────────────────────────────
// Integration point for Luna's real sprite art.
// When sprites/fighter-base.ts ships, import it and call registerRealSprites().
// Until then, loadSpriteSheet() falls back to placeholders.

/** Expected named frame exports from Luna's sprites/fighter-base.ts. */
export interface FighterBaseFrames {
  IDLE_1: SpriteFrame
  IDLE_2: SpriteFrame
  WALK_1?: SpriteFrame        // defaults to IDLE_1
  WALK_2?: SpriteFrame        // defaults to IDLE_2
  PUNCH_WIND: SpriteFrame
  PUNCH_EXTEND: SpriteFrame
  PUNCH_RETRACT: SpriteFrame
  KICK_WIND: SpriteFrame
  KICK_EXTEND: SpriteFrame
  KICK_RETRACT: SpriteFrame
  HIT: SpriteFrame
  BLOCK: SpriteFrame
  DODGE_1?: SpriteFrame       // defaults to IDLE_2
  DODGE_2?: SpriteFrame       // defaults to IDLE_1
  DOWN: SpriteFrame
  VICTORY_1: SpriteFrame
  VICTORY_2: SpriteFrame
  DEFEAT: SpriteFrame
}

/** Assemble named frame exports into a complete FighterSpriteSheet. */
export function assembleSpriteSheet(frames: FighterBaseFrames): FighterSpriteSheet {
  return {
    idle: {
      frames: [frames.IDLE_1, frames.IDLE_2],
      frameDurationMs: 500,
      loop: true,
    },
    walk: {
      frames: [frames.WALK_1 ?? frames.IDLE_1, frames.WALK_2 ?? frames.IDLE_2],
      frameDurationMs: 200,
      loop: true,
    },
    punch: {
      frames: [frames.PUNCH_WIND, frames.PUNCH_EXTEND, frames.PUNCH_EXTEND, frames.PUNCH_RETRACT],
      frameDurationMs: 80,
      loop: false,
    },
    kick: {
      frames: [frames.KICK_WIND, frames.KICK_EXTEND, frames.KICK_EXTEND, frames.KICK_RETRACT],
      frameDurationMs: 100,
      loop: false,
    },
    hit: {
      frames: [frames.HIT, frames.HIT],
      frameDurationMs: 150,
      loop: false,
    },
    block: {
      frames: [frames.BLOCK],
      frameDurationMs: 300,
      loop: false,
    },
    dodge: {
      frames: [frames.DODGE_1 ?? frames.IDLE_2, frames.DODGE_2 ?? frames.IDLE_1],
      frameDurationMs: 150,
      loop: false,
    },
    down: {
      frames: [frames.DOWN],
      frameDurationMs: 1000,
      loop: false,
    },
    victory: {
      frames: [frames.VICTORY_1, frames.VICTORY_2],
      frameDurationMs: 400,
      loop: true,
    },
    defeat: {
      frames: [frames.DEFEAT],
      frameDurationMs: 1000,
      loop: false,
    },
  }
}

let _realSpriteSheet: FighterSpriteSheet | null = null

/** Register real sprite art — replaces placeholders globally. */
export function registerRealSprites(frames: FighterBaseFrames): void {
  _realSpriteSheet = assembleSpriteSheet(frames)
}

/** Load sprite sheet: real art if registered, otherwise placeholders. */
export function loadSpriteSheet(color: string): FighterSpriteSheet {
  return _realSpriteSheet ?? createPlaceholderSpriteSheet(color)
}

/**
 * Generate a complete placeholder sprite sheet for a fighter.
 * Uses the fighter's color for body/outfit pixels.
 */
export function createPlaceholderSpriteSheet(color: string): FighterSpriteSheet {
  return {
    idle: {
      frames: [makeIdleFrame(color, 0), makeIdleFrame(color, 1)],
      frameDurationMs: 500,
      loop: true,
    },
    walk: {
      frames: [makeIdleFrame(color, 0), makeIdleFrame(color, 1)],
      frameDurationMs: 200,
      loop: true,
    },
    punch: {
      frames: [
        makePunchFrame(color, 'wind'),
        makePunchFrame(color, 'extend'),
        makePunchFrame(color, 'extend'),
        makePunchFrame(color, 'retract'),
      ],
      frameDurationMs: 80,
      loop: false,
    },
    kick: {
      frames: [
        makeKickFrame(color, 'wind'),
        makeKickFrame(color, 'extend'),
        makeKickFrame(color, 'extend'),
        makeKickFrame(color, 'retract'),
      ],
      frameDurationMs: 100,
      loop: false,
    },
    hit: {
      frames: [makeHitFrame(color), makeHitFrame(color)],
      frameDurationMs: 150,
      loop: false,
    },
    block: {
      frames: [makeBlockFrame(color)],
      frameDurationMs: 300,
      loop: false,
    },
    dodge: {
      // Reuse idle with offset as placeholder
      frames: [makeIdleFrame(color, 1), makeIdleFrame(color, 0)],
      frameDurationMs: 150,
      loop: false,
    },
    down: {
      frames: [makeDownFrame(color)],
      frameDurationMs: 1000,
      loop: false,
    },
    victory: {
      frames: [makeVictoryFrame(color, 0), makeVictoryFrame(color, 1)],
      frameDurationMs: 400,
      loop: true,
    },
    defeat: {
      frames: [makeDefeatFrame(color)],
      frameDurationMs: 1000,
      loop: false,
    },
  }
}
