import {
  getAnimationFrame,
  mapStateToAnimKey,
  createPlaceholderSpriteSheet,
  assembleSpriteSheet,
  registerRealSprites,
  loadSpriteSheet,
  drawSpriteFrame,
  type SpriteFrame,
  type SpriteAnimation,
  type FighterSpriteSheet,
  type FighterBaseFrames,
} from '@/lib/canvas/sprite-renderer'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFrame(w: number, h: number, color = '#f00'): SpriteFrame {
  return {
    width: w,
    height: h,
    pixels: Array.from({ length: h }, () => Array.from({ length: w }, () => color)),
  }
}

function makeAnim(frameCount: number, durationMs: number, loop: boolean): SpriteAnimation {
  return {
    frames: Array.from({ length: frameCount }, (_, i) => makeFrame(2, 2, `#${i}`)),
    frameDurationMs: durationMs,
    loop,
  }
}

/** Minimal canvas context mock — tracks fillRect and fillStyle calls. */
function mockCanvasCtx() {
  const calls: { method: string; args: unknown[] }[] = []
  return {
    calls,
    ctx: {
      fillStyle: '',
      globalCompositeOperation: '',
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      fillRect: jest.fn((...args: unknown[]) => calls.push({ method: 'fillRect', args })),
    } as unknown as CanvasRenderingContext2D,
  }
}

// ── getAnimationFrame ────────────────────────────────────────────────────────

describe('getAnimationFrame', () => {
  it('returns the first frame at time 0', () => {
    const anim = makeAnim(3, 100, true)
    expect(getAnimationFrame(anim, 0)).toBe(anim.frames[0])
  })

  it('advances to the next frame after frameDurationMs', () => {
    const anim = makeAnim(3, 100, true)
    expect(getAnimationFrame(anim, 100)).toBe(anim.frames[1])
    expect(getAnimationFrame(anim, 200)).toBe(anim.frames[2])
  })

  it('loops back to frame 0 when loop=true', () => {
    const anim = makeAnim(3, 100, true)
    // Total duration = 300ms, so 300ms should loop back to frame 0
    expect(getAnimationFrame(anim, 300)).toBe(anim.frames[0])
    expect(getAnimationFrame(anim, 400)).toBe(anim.frames[1])
  })

  it('holds the last frame when loop=false', () => {
    const anim = makeAnim(3, 100, false)
    // Past end: should hold last frame
    expect(getAnimationFrame(anim, 500)).toBe(anim.frames[2])
    expect(getAnimationFrame(anim, 10000)).toBe(anim.frames[2])
  })

  it('throws on empty frames array', () => {
    const anim: SpriteAnimation = { frames: [], frameDurationMs: 100, loop: true }
    expect(() => getAnimationFrame(anim, 0)).toThrow('Animation has no frames')
  })

  it('handles single-frame animation', () => {
    const anim = makeAnim(1, 100, true)
    expect(getAnimationFrame(anim, 0)).toBe(anim.frames[0])
    expect(getAnimationFrame(anim, 500)).toBe(anim.frames[0])
  })

  it('handles mid-frame timing (does not advance early)', () => {
    const anim = makeAnim(3, 100, false)
    expect(getAnimationFrame(anim, 50)).toBe(anim.frames[0])
    expect(getAnimationFrame(anim, 99)).toBe(anim.frames[0])
    expect(getAnimationFrame(anim, 150)).toBe(anim.frames[1])
  })
})

// ── mapStateToAnimKey ────────────────────────────────────────────────────────

describe('mapStateToAnimKey', () => {
  const expectedMappings: [string, keyof FighterSpriteSheet][] = [
    ['idle', 'idle'],
    ['walking', 'walk'],
    ['punching', 'punch'],
    ['kicking', 'kick'],
    ['hit', 'hit'],
    ['blocking', 'block'],
    ['dodging', 'dodge'],
    ['down', 'down'],
    ['victory', 'victory'],
    ['defeat', 'defeat'],
  ]

  it.each(expectedMappings)('maps "%s" → "%s"', (state, expected) => {
    expect(mapStateToAnimKey(state)).toBe(expected)
  })

  it('defaults unknown states to "idle"', () => {
    expect(mapStateToAnimKey('unknown')).toBe('idle')
    expect(mapStateToAnimKey('')).toBe('idle')
    expect(mapStateToAnimKey('charging')).toBe('idle')
  })
})

// ── createPlaceholderSpriteSheet ─────────────────────────────────────────────

describe('createPlaceholderSpriteSheet', () => {
  const ANIM_KEYS: (keyof FighterSpriteSheet)[] = [
    'idle', 'walk', 'punch', 'kick', 'hit', 'block', 'dodge', 'down', 'victory', 'defeat',
  ]

  let sheet: FighterSpriteSheet

  beforeAll(() => {
    sheet = createPlaceholderSpriteSheet('#3366cc')
  })

  it('has all 10 animation keys', () => {
    for (const key of ANIM_KEYS) {
      expect(sheet[key]).toBeDefined()
      expect(sheet[key].frames.length).toBeGreaterThan(0)
    }
  })

  it('every frame has valid dimensions and matching pixel grid', () => {
    for (const key of ANIM_KEYS) {
      for (const frame of sheet[key].frames) {
        expect(frame.width).toBeGreaterThan(0)
        expect(frame.height).toBeGreaterThan(0)
        expect(frame.pixels.length).toBe(frame.height)
        for (const row of frame.pixels) {
          expect(row.length).toBe(frame.width)
        }
      }
    }
  })

  it('includes the fighter color in at least one pixel per frame', () => {
    const color = '#3366cc'
    for (const key of ANIM_KEYS) {
      for (const frame of sheet[key].frames) {
        const hasColor = frame.pixels.some(row => row.some(px => px === color))
        expect(hasColor).toBe(true)
      }
    }
  })

  it('looping animations have loop=true', () => {
    expect(sheet.idle.loop).toBe(true)
    expect(sheet.walk.loop).toBe(true)
    expect(sheet.victory.loop).toBe(true)
  })

  it('non-looping animations have loop=false', () => {
    expect(sheet.punch.loop).toBe(false)
    expect(sheet.kick.loop).toBe(false)
    expect(sheet.hit.loop).toBe(false)
    expect(sheet.block.loop).toBe(false)
    expect(sheet.down.loop).toBe(false)
    expect(sheet.defeat.loop).toBe(false)
  })

  it('frameDurationMs is positive for all animations', () => {
    for (const key of ANIM_KEYS) {
      expect(sheet[key].frameDurationMs).toBeGreaterThan(0)
    }
  })

  it('attack animations have multi-frame sequences', () => {
    expect(sheet.punch.frames.length).toBeGreaterThanOrEqual(3) // wind, extend, retract
    expect(sheet.kick.frames.length).toBeGreaterThanOrEqual(3)
  })
})

// ── drawSpriteFrame ──────────────────────────────────────────────────────────

describe('drawSpriteFrame', () => {
  it('calls fillRect for each non-transparent pixel', () => {
    const frame: SpriteFrame = {
      width: 2,
      height: 2,
      pixels: [
        ['#f00', ''],
        ['', '#0f0'],
      ],
    }
    const { ctx, calls } = mockCanvasCtx()
    drawSpriteFrame(ctx, frame, 100, 200)

    // 2 non-transparent pixels → 2 fillRect calls
    const fillCalls = calls.filter(c => c.method === 'fillRect')
    expect(fillCalls.length).toBe(2)
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
  })

  it('does not draw transparent pixels', () => {
    const frame: SpriteFrame = {
      width: 2,
      height: 2,
      pixels: [
        ['', ''],
        ['', ''],
      ],
    }
    const { ctx, calls } = mockCanvasCtx()
    drawSpriteFrame(ctx, frame, 50, 50)
    const fillCalls = calls.filter(c => c.method === 'fillRect')
    expect(fillCalls.length).toBe(0)
  })

  it('applies horizontal flip when facing=-1', () => {
    const frame = makeFrame(2, 2, '#f00')
    const { ctx } = mockCanvasCtx()
    drawSpriteFrame(ctx, frame, 100, 100, -1)

    expect(ctx.translate).toHaveBeenCalledWith(100, 0)
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1)
    expect(ctx.translate).toHaveBeenCalledWith(-100, 0)
  })

  it('does not flip when facing=1', () => {
    const frame = makeFrame(2, 2, '#f00')
    const { ctx } = mockCanvasCtx()
    drawSpriteFrame(ctx, frame, 100, 100, 1)

    expect(ctx.translate).not.toHaveBeenCalled()
    expect(ctx.scale).not.toHaveBeenCalled()
  })

  it('applies tint overlay when tint is provided', () => {
    const frame = makeFrame(2, 2, '#f00')
    const { ctx } = mockCanvasCtx()
    drawSpriteFrame(ctx, frame, 100, 100, 1, 'rgba(255,255,255,0.6)')

    // After drawing pixels, should apply tint with source-atop
    expect(ctx.globalCompositeOperation).toBe('source-atop')
  })

  it('does not apply tint when tint is undefined', () => {
    const frame = makeFrame(2, 2, '#f00')
    const { ctx } = mockCanvasCtx()
    drawSpriteFrame(ctx, frame, 100, 100)

    expect(ctx.globalCompositeOperation).toBe('')
  })
})

// ── assembleSpriteSheet ──────────────────────────────────────────────────────

describe('assembleSpriteSheet', () => {
  function makeBaseFrames(): FighterBaseFrames {
    return {
      IDLE_1: makeFrame(12, 16, '#idle1'),
      IDLE_2: makeFrame(12, 16, '#idle2'),
      PUNCH_WIND: makeFrame(12, 16, '#pw'),
      PUNCH_EXTEND: makeFrame(16, 16, '#pe'),
      PUNCH_RETRACT: makeFrame(12, 16, '#pr'),
      KICK_WIND: makeFrame(12, 16, '#kw'),
      KICK_EXTEND: makeFrame(16, 16, '#ke'),
      KICK_RETRACT: makeFrame(12, 16, '#kr'),
      HIT: makeFrame(12, 16, '#hit'),
      BLOCK: makeFrame(12, 16, '#blk'),
      DOWN: makeFrame(16, 6, '#dwn'),
      VICTORY_1: makeFrame(12, 16, '#v1'),
      VICTORY_2: makeFrame(12, 16, '#v2'),
      DEFEAT: makeFrame(12, 16, '#def'),
    }
  }

  it('assembles all 10 animation keys from named frames', () => {
    const sheet = assembleSpriteSheet(makeBaseFrames())
    const keys: (keyof FighterSpriteSheet)[] = [
      'idle', 'walk', 'punch', 'kick', 'hit', 'block', 'dodge', 'down', 'victory', 'defeat',
    ]
    for (const key of keys) {
      expect(sheet[key]).toBeDefined()
      expect(sheet[key].frames.length).toBeGreaterThan(0)
    }
  })

  it('uses IDLE frames as walk fallback when WALK not provided', () => {
    const frames = makeBaseFrames()
    const sheet = assembleSpriteSheet(frames)
    expect(sheet.walk.frames[0]).toBe(frames.IDLE_1)
    expect(sheet.walk.frames[1]).toBe(frames.IDLE_2)
  })

  it('uses explicit WALK frames when provided', () => {
    const frames = makeBaseFrames()
    frames.WALK_1 = makeFrame(12, 16, '#w1')
    frames.WALK_2 = makeFrame(12, 16, '#w2')
    const sheet = assembleSpriteSheet(frames)
    expect(sheet.walk.frames[0]).toBe(frames.WALK_1)
    expect(sheet.walk.frames[1]).toBe(frames.WALK_2)
  })

  it('uses IDLE frames as dodge fallback when DODGE not provided', () => {
    const frames = makeBaseFrames()
    const sheet = assembleSpriteSheet(frames)
    expect(sheet.dodge.frames[0]).toBe(frames.IDLE_2)
    expect(sheet.dodge.frames[1]).toBe(frames.IDLE_1)
  })

  it('doubles PUNCH_EXTEND for hold phase', () => {
    const frames = makeBaseFrames()
    const sheet = assembleSpriteSheet(frames)
    expect(sheet.punch.frames).toEqual([
      frames.PUNCH_WIND, frames.PUNCH_EXTEND, frames.PUNCH_EXTEND, frames.PUNCH_RETRACT,
    ])
  })

  it('doubles KICK_EXTEND for hold phase', () => {
    const frames = makeBaseFrames()
    const sheet = assembleSpriteSheet(frames)
    expect(sheet.kick.frames).toEqual([
      frames.KICK_WIND, frames.KICK_EXTEND, frames.KICK_EXTEND, frames.KICK_RETRACT,
    ])
  })
})

// ── loadSpriteSheet + registerRealSprites ────────────────────────────────────

describe('loadSpriteSheet', () => {
  it('returns placeholder when no real sprites are registered', () => {
    const sheet = loadSpriteSheet('#ff0000')
    // Should have all animation keys (same as createPlaceholderSpriteSheet)
    expect(sheet.idle.frames.length).toBeGreaterThan(0)
    expect(sheet.punch.frames.length).toBeGreaterThan(0)
  })

  it('returns real sprites after registerRealSprites is called', () => {
    const realFrames: FighterBaseFrames = {
      IDLE_1: makeFrame(24, 32, '#real1'),
      IDLE_2: makeFrame(24, 32, '#real2'),
      PUNCH_WIND: makeFrame(24, 32, '#rpw'),
      PUNCH_EXTEND: makeFrame(32, 32, '#rpe'),
      PUNCH_RETRACT: makeFrame(24, 32, '#rpr'),
      KICK_WIND: makeFrame(24, 32, '#rkw'),
      KICK_EXTEND: makeFrame(32, 32, '#rke'),
      KICK_RETRACT: makeFrame(24, 32, '#rkr'),
      HIT: makeFrame(24, 32, '#rhit'),
      BLOCK: makeFrame(24, 32, '#rblk'),
      DOWN: makeFrame(32, 12, '#rdwn'),
      VICTORY_1: makeFrame(24, 32, '#rv1'),
      VICTORY_2: makeFrame(24, 32, '#rv2'),
      DEFEAT: makeFrame(24, 32, '#rdef'),
    }

    registerRealSprites(realFrames)
    const sheet = loadSpriteSheet('#ff0000')

    // Real sprites should be used — idle frame should be the real one
    expect(sheet.idle.frames[0]).toBe(realFrames.IDLE_1)
    expect(sheet.idle.frames[1]).toBe(realFrames.IDLE_2)
    expect(sheet.punch.frames[1]).toBe(realFrames.PUNCH_EXTEND)
  })
})
