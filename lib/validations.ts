import { z } from 'zod'

// ─── Enums (mirror Prisma enums) ────────────────────────────────────────────

export const FighterClass = z.enum(['LIGHTWEIGHT', 'MIDDLEWEIGHT', 'HEAVYWEIGHT'])
export const FightStatus = z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'])
export const FightMethod = z.enum(['KO', 'TKO', 'DECISION', 'SUBMISSION', 'DISQUALIFICATION', 'NO_CONTEST'])
export const BetSide = z.enum(['YES', 'NO', 'FIGHTER1', 'FIGHTER2', 'OVER', 'UNDER'])
export const BetStatus = z.enum(['PENDING', 'WON', 'LOST', 'CANCELLED', 'REFUNDED'])
export const CreditTransactionType = z.enum(['deposit', 'withdrawal', 'training', 'bet', 'reward', 'payout'])

// ─── Fighters ───────────────────────────────────────────────────────────────

export const createFighterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(30, 'Name must be at most 30 characters'),
  emoji: z.string().min(1, 'Emoji is required'),
  fighterClass: FighterClass,
})

const statValue = z.number().int().min(0).max(100)

export const updateFighterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(30, 'Name must be at most 30 characters').optional(),
  emoji: z.string().min(1, 'Emoji is required').optional(),
  strength: statValue.optional(),
  speed: statValue.optional(),
  defense: statValue.optional(),
  stamina: statValue.optional(),
  fightIQ: statValue.optional(),
  aggression: statValue.optional(),
  elo: z.number().int().optional(),
  wins: z.number().int().min(0).optional(),
  losses: z.number().int().min(0).optional(),
  draws: z.number().int().min(0).optional(),
  winStreak: z.number().int().min(0).optional(),
  lossStreak: z.number().int().min(0).optional(),
  lastFightAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  totalTrainingHours: z.number().min(0).optional(),
  totalTrainingSessions: z.number().int().min(0).optional(),
  trainingCost: z.number().min(0).optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' })

// ─── Fights ─────────────────────────────────────────────────────────────────

export const createFightSchema = z.object({
  fighter1Id: z.string().min(1, 'Fighter 1 ID is required'),
  fighter2Id: z.string().min(1, 'Fighter 2 ID is required'),
  scheduledAt: z.string().datetime().optional(),
  maxRounds: z.number().int().min(1).max(12).optional().default(3),
  venue: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
}).refine((data) => data.fighter1Id !== data.fighter2Id, {
  message: 'A fighter cannot fight themselves',
  path: ['fighter2Id'],
})

export const updateFightStatusSchema = z.object({
  status: FightStatus,
  fightData: z.unknown().optional(),
})

// Legal status transitions: SCHEDULED→LIVE, SCHEDULED→CANCELLED, LIVE→COMPLETED, LIVE→CANCELLED
const LEGAL_STATUS_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ['LIVE', 'CANCELLED'],
  LIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export function isLegalStatusTransition(from: string, to: string): boolean {
  return LEGAL_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export const submitFightResultSchema = z.object({
  method: FightMethod,
  round: z.number().int().min(1).optional(),
  time: z.string().optional(),
  winnerId: z.string().optional(),
  fighter1Stats: z.record(z.string(), z.unknown()).optional().default({}),
  fighter2Stats: z.record(z.string(), z.unknown()).optional().default({}),
  fighter1EloChange: z.number().int().optional().default(0),
  fighter2EloChange: z.number().int().optional().default(0),
})

// ─── Bets ───────────────────────────────────────────────────────────────────

export const createBetSchema = z.object({
  fightId: z.string().min(1, 'Fight ID is required'),
  fighterId: z.string().optional(),
  side: BetSide,
  amount: z.number().positive('Amount must be greater than 0'),
  odds: z.number().positive('Odds must be greater than 0'),
})

export const settleBetSchema = z.object({
  status: z.enum(['WON', 'LOST', 'CANCELLED', 'REFUNDED']),
  payout: z.number().min(0).optional(),
})

// ─── Training ───────────────────────────────────────────────────────────────

export const TrainingStatus = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED'])

export const createTrainingSchema = z.object({
  fighterId: z.string().min(1, 'Fighter ID is required'),
  durationMinutes: z.union([z.literal(15), z.literal(20), z.literal(25), z.literal(30)]),
})

export const cancelTrainingSchema = z.object({
  status: z.literal('CANCELLED'),
})

// ─── User ───────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  auth0Id: z.string().min(1, 'Auth0 ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1).max(50).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores').optional(),
}).refine((data) => data.name !== undefined || data.username !== undefined, {
  message: 'At least one of name or username must be provided',
})

// ─── Credits ────────────────────────────────────────────────────────────────

export const creditTransactionSchema = z.object({
  amount: z.number().refine((n) => n !== 0 && isFinite(n), { message: 'Amount must be a non-zero finite number' }),
  type: CreditTransactionType,
  description: z.string().max(200).optional(),
})

// ─── Agents ────────────────────────────────────────────────────────────────

export const registerAgentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  description: z.string().max(500).optional(),
  moltbookToken: z.string().optional(),
  challengeId: z.string().min(1, 'Challenge ID is required'),
  challengeAnswer: z.number({ message: 'Challenge answer must be a number' }),
})

// ─── Skins ─────────────────────────────────────────────────────────────────

export const SkinType = z.enum(['BODY', 'HEAD', 'GLOVES', 'BOOTS', 'AURA'])
export const SkinRarity = z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'])

export const purchaseSkinSchema = z.object({
  skinId: z.string().min(1, 'Skin ID is required'),
  fighterId: z.string().min(1, 'Fighter ID is required'),
})

export const skinQuerySchema = z.object({
  type: SkinType.optional(),
  rarity: SkinRarity.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// ─── Billing ──────────────────────────────────────────────────────────────

export const BillingStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID'])

export const createBillingRequestSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be at most 500 characters'),
})

export const updateBillingRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
})

// ─── Stripe ────────────────────────────────────────────────────────────────

export const checkoutSessionSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
})

// ─── Orders ────────────────────────────────────────────────────────────────

export const OrderSide = z.enum(['YES', 'NO'])
export const OrderType = z.enum(['LIMIT', 'MARKET'])

export const createOrderSchema = z
  .object({
    fightId: z.string().min(1, 'Fight ID is required'),
    side: OrderSide,
    type: OrderType,
    price: z.number().int().min(1).max(99).optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })
  .refine(
    (data) => data.type === 'MARKET' || (data.price !== undefined && data.price >= 1 && data.price <= 99),
    { message: 'Price (1-99) is required for LIMIT orders', path: ['price'] }
  )

export const OrderStatus = z.enum(['OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED'])

export const orderQuerySchema = z.object({
  fightId: z.string().optional(),
  status: OrderStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// ─── Trades ───────────────────────────────────────────────────────────────

export const tradeQuerySchema = z.object({
  fightId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// ─── Positions ────────────────────────────────────────────────────────────

export const positionQuerySchema = z.object({
  fightId: z.string().optional(),
  settled: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// ─── Public market data ─────────────────────────────────────────────────────

export const publicTradeQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// ─── Query params ───────────────────────────────────────────────────────────

export const fighterQuerySchema = z.object({
  ownerId: z.string().optional(),
  class: FighterClass.optional(),
  active: z.enum(['true', 'false']).optional(),
})

export const fightQuerySchema = z.object({
  status: FightStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const betQuerySchema = z.object({
  userId: z.string().optional(),
  fightId: z.string().optional(),
  status: BetStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const trainingQuerySchema = z.object({
  fighterId: z.string().optional(),
  status: TrainingStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})
