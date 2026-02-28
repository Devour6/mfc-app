import {
  getPositionLimit,
  checkPositionLimit,
  computeExitPnl,
  upsertPosition,
  getOrCreatePosition,
  PositionLimitError,
  POSITION_LIMIT_CENTS,
  AGENT_POSITION_CAP_CENTS,
  AGENT_BANKROLL_FRACTION,
  CONTRACT_PAYOUT_CENTS,
  DMM_SYSTEM_ID,
  type PositionTxClient,
  type PositionUpdateParams,
} from '@/lib/position-manager'
import type { Position } from '@prisma/client'

const NOW = new Date('2026-01-01T00:00:00Z')
const EARLIER = new Date('2025-12-31T00:00:00Z')

let positionIdCounter = 0

function resetCounters() {
  positionIdCounter = 0
}

/** Make a mock Position object. */
function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: `pos-${++positionIdCounter}`,
    userId: 'u1',
    fightId: 'f1',
    league: 'HUMAN',
    side: 'YES',
    quantity: 10,
    avgCostBasis: 60,
    realizedPnl: 0,
    settlementPnl: null,
    settled: false,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    settledAt: null,
    ...overrides,
  } as Position
}

/** Create a mock transaction client with position methods. */
function createMockTx() {
  const tx = {
    position: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `pos-${++positionIdCounter}`,
        ...data,
        settled: false,
        settlementPnl: null,
        settledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      })),
      update: jest.fn().mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
        id: where.id,
        userId: 'u1',
        fightId: 'f1',
        league: 'HUMAN',
        side: 'YES',
        quantity: 0,
        avgCostBasis: 0,
        realizedPnl: 0,
        settled: false,
        settlementPnl: null,
        settledAt: null,
        createdAt: EARLIER,
        updatedAt: NOW,
        ...data,
      })),
    },
  }
  return tx as unknown as PositionTxClient
}

beforeEach(() => {
  resetCounters()
})

// ── getPositionLimit ──────────────────────────────────────────────────────────

describe('getPositionLimit', () => {
  it('returns correct limit for each Human League fight tier', () => {
    expect(getPositionLimit('LOCAL', 'HUMAN')).toBe(10_000)
    expect(getPositionLimit('REGIONAL', 'HUMAN')).toBe(25_000)
    expect(getPositionLimit('GRAND', 'HUMAN')).toBe(50_000)
    expect(getPositionLimit('INVITATIONAL', 'HUMAN')).toBe(100_000)
  })

  it('falls back to LOCAL for unknown fight tier', () => {
    expect(getPositionLimit('UNKNOWN', 'HUMAN')).toBe(POSITION_LIMIT_CENTS.LOCAL)
  })

  it('Agent limit: min(bankroll * 5%, $100 cap)', () => {
    // 100,000¢ bankroll * 0.05 = 5,000¢ (under cap)
    expect(getPositionLimit('LOCAL', 'AGENT', 100_000)).toBe(5_000)
  })

  it('Agent limit capped at 10,000¢ for high bankroll', () => {
    // 500,000¢ bankroll * 0.05 = 25,000¢ → capped at 10,000¢
    expect(getPositionLimit('LOCAL', 'AGENT', 500_000)).toBe(AGENT_POSITION_CAP_CENTS)
  })

  it('Agent with zero bankroll returns 0', () => {
    expect(getPositionLimit('LOCAL', 'AGENT', 0)).toBe(0)
  })

  it('Agent with no bankroll param returns 0', () => {
    expect(getPositionLimit('LOCAL', 'AGENT')).toBe(0)
  })
})

// ── checkPositionLimit ────────────────────────────────────────────────────────

describe('checkPositionLimit', () => {
  it('passes when new position is within limit', () => {
    expect(() => checkPositionLimit({
      existingPosition: null,
      orderSide: 'YES',
      orderQuantity: 100,
      orderPrice: 60,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).not.toThrow()
    // 100 * 60 = 6,000¢ ≤ 10,000¢ ✓
  })

  it('throws PositionLimitError when new position exceeds limit', () => {
    expect(() => checkPositionLimit({
      existingPosition: null,
      orderSide: 'YES',
      orderQuantity: 200,
      orderPrice: 60,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).toThrow(PositionLimitError)
    // 200 * 60 = 12,000¢ > 10,000¢ ✗
  })

  it('same side: combines existing + new cost', () => {
    const existing = makePosition({ side: 'YES', quantity: 100, avgCostBasis: 50 })
    // Existing cost: 100 * 50 = 5,000. New cost: 60 * 100 = 6,000. Total: 11,000 > 10,000
    expect(() => checkPositionLimit({
      existingPosition: existing,
      orderSide: 'YES',
      orderQuantity: 100,
      orderPrice: 60,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).toThrow(PositionLimitError)
  })

  it('same side: passes when combined cost is within limit', () => {
    const existing = makePosition({ side: 'YES', quantity: 50, avgCostBasis: 50 })
    // Existing: 2,500. New: 50 * 50 = 2,500. Total: 5,000 ≤ 10,000
    expect(() => checkPositionLimit({
      existingPosition: existing,
      orderSide: 'YES',
      orderQuantity: 50,
      orderPrice: 50,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).not.toThrow()
  })

  it('opposite side netting (reducing): always allowed', () => {
    const existing = makePosition({ side: 'YES', quantity: 100, avgCostBasis: 60 })
    // Buying 50 NO against 100 YES → nets to 50 YES. Reduces risk, always passes.
    expect(() => checkPositionLimit({
      existingPosition: existing,
      orderSide: 'NO',
      orderQuantity: 50,
      orderPrice: 40,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).not.toThrow()
  })

  it('side flip: checks only flipped portion against limit', () => {
    const existing = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    // Buying 15 NO → closes 10 YES, opens 5 NO. Flipped cost: 5 * 40 = 200 ≤ 10,000
    expect(() => checkPositionLimit({
      existingPosition: existing,
      orderSide: 'NO',
      orderQuantity: 15,
      orderPrice: 40,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).not.toThrow()
  })

  it('side flip: throws when flipped portion exceeds limit', () => {
    const existing = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    // Buying 510 NO → closes 10, opens 500 NO. Cost: 500 * 60 = 30,000 > 10,000
    expect(() => checkPositionLimit({
      existingPosition: existing,
      orderSide: 'NO',
      orderQuantity: 510,
      orderPrice: 60,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).toThrow(PositionLimitError)
  })

  it('DMM bypasses all position limits', () => {
    expect(() => checkPositionLimit({
      existingPosition: null,
      orderSide: 'YES',
      orderQuantity: 999_999,
      orderPrice: 99,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: DMM_SYSTEM_ID,
    })).not.toThrow()
  })

  it('Agent league: enforces bankroll-based limit', () => {
    // Agent bankroll: 100,000¢ → limit = 5,000¢
    expect(() => checkPositionLimit({
      existingPosition: null,
      orderSide: 'YES',
      orderQuantity: 100,
      orderPrice: 60,
      fightTier: 'LOCAL',
      league: 'AGENT',
      userId: 'agent-1',
      agentBankroll: 100_000,
    })).toThrow(PositionLimitError)
    // 100 * 60 = 6,000 > 5,000

    expect(() => checkPositionLimit({
      existingPosition: null,
      orderSide: 'YES',
      orderQuantity: 50,
      orderPrice: 60,
      fightTier: 'LOCAL',
      league: 'AGENT',
      userId: 'agent-1',
      agentBankroll: 100_000,
    })).not.toThrow()
    // 50 * 60 = 3,000 ≤ 5,000
  })

  it('handles zero-quantity existing position like a new position', () => {
    const existing = makePosition({ side: 'YES', quantity: 0, avgCostBasis: 0 })
    expect(() => checkPositionLimit({
      existingPosition: existing,
      orderSide: 'NO',
      orderQuantity: 100,
      orderPrice: 40,
      fightTier: 'LOCAL',
      league: 'HUMAN',
      userId: 'u1',
    })).not.toThrow()
    // 100 * 40 = 4,000 ≤ 10,000
  })
})

// ── computeExitPnl ────────────────────────────────────────────────────────────

describe('computeExitPnl', () => {
  it('positive PnL: buying opposite side cheap (favorable close)', () => {
    // Hold YES at 60. Buy NO at 35 to close.
    // Implied YES sell price = 100 - 35 = 65. Profit = 65 - 60 = 5 per contract.
    expect(computeExitPnl(5, 35, 60)).toBe(25) // 5 * (40 - 35) = 25
  })

  it('negative PnL: buying opposite side expensive (unfavorable close)', () => {
    // Hold YES at 60. Buy NO at 50 to close.
    // Implied YES sell price = 100 - 50 = 50. Loss = 50 - 60 = -10 per contract.
    expect(computeExitPnl(5, 50, 60)).toBe(-50) // 5 * (40 - 50) = -50
  })

  it('zero PnL: closing at implied complement', () => {
    // Hold YES at 60. Buy NO at 40 to close (exactly at implied).
    expect(computeExitPnl(10, 40, 60)).toBe(0) // 10 * (40 - 40) = 0
  })

  it('works for NO positions closing via YES', () => {
    // Hold NO at 30. Buy YES at 65 to close.
    // Implied NO sell price = 100 - 65 = 35. Profit = 35 - 30 = 5 per contract.
    expect(computeExitPnl(10, 65, 30)).toBe(50) // 10 * (70 - 65) = 50
  })
})

// ── upsertPosition ────────────────────────────────────────────────────────────

describe('upsertPosition', () => {
  it('creates new position when none exists', async () => {
    const tx = createMockTx()

    const result = await upsertPosition(tx, {
      userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'YES',
      fillQty: 10, fillPrice: 58,
    })

    expect(tx.position.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'YES',
        quantity: 10, avgCostBasis: 58, realizedPnl: 0,
      },
    })
    expect(result.quantity).toBe(10)
    expect(result.avgCostBasis).toBe(58)
  })

  it('same side: weighted average cost', async () => {
    const tx = createMockTx()
    const existing = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    ;(tx.position.findUnique as jest.Mock).mockResolvedValue(existing)

    await upsertPosition(tx, {
      userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'YES',
      fillQty: 5, fillPrice: 50,
    })

    // newAvg = (10 * 60 + 5 * 50) / 15 = 850 / 15 = 56.67 → 57
    expect(tx.position.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { quantity: 15, avgCostBasis: 57 },
    })
  })

  it('auto-netting: 10 YES + buy 5 NO = 5 YES', async () => {
    const tx = createMockTx()
    const existing = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    ;(tx.position.findUnique as jest.Mock).mockResolvedValue(existing)

    await upsertPosition(tx, {
      userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'NO',
      fillQty: 5, fillPrice: 35,
    })

    // exitPnl = 5 * ((100 - 60) - 35) = 5 * (40 - 35) = 25
    expect(tx.position.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { quantity: 5, realizedPnl: 25 },
    })
  })

  it('side flip: 10 YES + buy 15 NO = 5 NO', async () => {
    const tx = createMockTx()
    const existing = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    ;(tx.position.findUnique as jest.Mock).mockResolvedValue(existing)

    await upsertPosition(tx, {
      userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'NO',
      fillQty: 15, fillPrice: 35,
    })

    // Close 10: exitPnl = 10 * (40 - 35) = 50. Flip to 5 NO at cost 35.
    expect(tx.position.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { side: 'NO', quantity: 5, avgCostBasis: 35, realizedPnl: 50 },
    })
  })

  it('exact match: 10 YES + buy 10 NO = 0 quantity', async () => {
    const tx = createMockTx()
    const existing = makePosition({ side: 'YES', quantity: 10, avgCostBasis: 60 })
    ;(tx.position.findUnique as jest.Mock).mockResolvedValue(existing)

    await upsertPosition(tx, {
      userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'NO',
      fillQty: 10, fillPrice: 35,
    })

    // exitPnl = 10 * (40 - 35) = 50. Quantity goes to 0.
    expect(tx.position.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { quantity: 0, realizedPnl: 50 },
    })
  })

  it('realizedPnl accumulates across multiple partial exits', async () => {
    const tx = createMockTx()
    // Already has +100 realizedPnl from a previous trade
    const existing = makePosition({
      side: 'YES', quantity: 10, avgCostBasis: 60, realizedPnl: 100,
    })
    ;(tx.position.findUnique as jest.Mock).mockResolvedValue(existing)

    await upsertPosition(tx, {
      userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'NO',
      fillQty: 3, fillPrice: 35,
    })

    // exitPnl = 3 * (40 - 35) = 15. New realizedPnl = 100 + 15 = 115.
    expect(tx.position.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { quantity: 7, realizedPnl: 115 },
    })
  })
})

// ── getOrCreatePosition ───────────────────────────────────────────────────────

describe('getOrCreatePosition', () => {
  it('returns existing position if found', async () => {
    const tx = createMockTx()
    const existing = makePosition({ userId: 'u1', fightId: 'f1' })
    ;(tx.position.findUnique as jest.Mock).mockResolvedValue(existing)

    const result = await getOrCreatePosition(tx, 'u1', 'f1', 'HUMAN', 'YES')
    expect(result).toBe(existing)
    expect(tx.position.create).not.toHaveBeenCalled()
  })

  it('creates empty position if none exists', async () => {
    const tx = createMockTx()

    const result = await getOrCreatePosition(tx, 'u1', 'f1', 'HUMAN', 'YES')
    expect(tx.position.create).toHaveBeenCalledWith({
      data: { userId: 'u1', fightId: 'f1', league: 'HUMAN', side: 'YES', quantity: 0, avgCostBasis: 0, realizedPnl: 0 },
    })
    expect(result.quantity).toBe(0)
  })
})
