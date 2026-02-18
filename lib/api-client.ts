// ─── API Client ─────────────────────────────────────────────────────────────
// Typed fetch wrappers for all MFC API routes.
// Replaces direct Zustand mock data with real backend calls.

// ─── Response Types ─────────────────────────────────────────────────────────

/** Shared fighter fields returned by all endpoints */
export interface ApiFighterBase {
  id: string
  name: string
  emoji: string
  class: 'LIGHTWEIGHT' | 'MIDDLEWEIGHT' | 'HEAVYWEIGHT'
  elo: number
  isActive: boolean
  trainingCost: number
  strength: number
  speed: number
  defense: number
  stamina: number
  fightIQ: number
  aggression: number
  wins: number
  losses: number
  draws: number
  totalTrainingHours: number
  totalTrainingSessions: number
  winStreak: number
  lossStreak: number
  lastFightAt: string | null
  createdAt: string
  updatedAt: string
  ownerId: string
  owner?: { id: string; name: string | null; username: string | null }
}

/** Summary type returned by getFighters() — no nested relations */
export type ApiFighterSummary = ApiFighterBase

/** Detail type returned by getFighter(id) — includes trainings and fight results */
export interface ApiFighterDetail extends ApiFighterBase {
  trainings: ApiTraining[]
  fightResults: ApiFightResult[]
}

/** Union type for backwards compatibility */
export type ApiFighter = ApiFighterSummary | ApiFighterDetail

export interface ApiFight {
  id: string
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  scheduledAt: string
  startedAt: string | null
  endedAt: string | null
  maxRounds: number
  venue: string | null
  title: string | null
  fightData: unknown
  createdAt: string
  updatedAt: string
  fighter1Id: string
  fighter2Id: string
  fighter1?: Partial<ApiFighterBase>
  fighter2?: Partial<ApiFighterBase>
  result?: ApiFightResult | null
  bets?: Partial<ApiBet>[]
}

export interface ApiFightResult {
  id: string
  method: 'KO' | 'TKO' | 'DECISION' | 'SUBMISSION' | 'DISQUALIFICATION' | 'NO_CONTEST'
  round: number | null
  time: string | null
  fighter1Stats: Record<string, unknown>
  fighter2Stats: Record<string, unknown>
  fighter1EloChange: number
  fighter2EloChange: number
  createdAt: string
  fightId: string
  winnerId: string | null
  userId: string
}

export interface ApiUser {
  id: string
  auth0Id: string
  email: string
  name: string | null
  username: string | null
  credits: number
  createdAt: string
  updatedAt: string
  fighters?: ApiFighter[]
}

export interface ApiBet {
  id: string
  amount: number
  side: 'YES' | 'NO' | 'FIGHTER1' | 'FIGHTER2' | 'OVER' | 'UNDER'
  odds: number
  status: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED' | 'REFUNDED'
  payout: number | null
  createdAt: string
  settledAt: string | null
  userId: string
  fightId: string
  fighterId: string | null
  fight?: Partial<ApiFight>
  fighter?: Partial<ApiFighterBase> | null
  user?: Partial<ApiUser>
}

export interface ApiTraining {
  id: string
  hours: number
  cost: number
  strengthGain: number
  speedGain: number
  defenseGain: number
  staminaGain: number
  fightIQGain: number
  aggressionGain: number
  createdAt: string
  fighterId: string
  userId: string
  fighter?: Partial<ApiFighterBase>
  user?: Partial<ApiUser>
}

export interface CreditBalance {
  credits: number
}

export interface CreditTransactionResult {
  credits: number
  transaction: {
    amount: number
    type: 'deposit' | 'withdrawal' | 'training' | 'bet' | 'reward' | 'payout'
    description?: string
    timestamp: string
  }
}

export interface ApiValidationError {
  error: 'Validation failed'
  issues: Array<{ field: string; message: string }>
}

export interface ApiError {
  error: string
}

// ─── Core fetch helper ──────────────────────────────────────────────────────

class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: ApiError | ApiValidationError,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response

  try {
    res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
  } catch (err) {
    throw new ApiClientError(
      err instanceof TypeError ? err.message : 'Network request failed',
      0,
      { error: 'Network request failed' },
    )
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new ApiClientError(
      'Failed to parse response',
      res.status,
      { error: 'Failed to parse response' },
    )
  }

  if (!res.ok) {
    const body = data as ApiError | ApiValidationError
    throw new ApiClientError(
      body.error || `Request failed with status ${res.status}`,
      res.status,
      body,
    )
  }

  return data as T
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

// ─── Fighters ───────────────────────────────────────────────────────────────

export function getFighters(filters?: {
  ownerId?: string
  class?: 'LIGHTWEIGHT' | 'MIDDLEWEIGHT' | 'HEAVYWEIGHT'
  active?: boolean
}) {
  return request<ApiFighterSummary[]>(`/api/fighters${qs({
    ownerId: filters?.ownerId,
    class: filters?.class,
    active: filters?.active,
  })}`)
}

export function getFighter(id: string) {
  return request<ApiFighterDetail>(`/api/fighters/${id}`)
}

export function createFighter(data: {
  name: string
  emoji: string
  fighterClass: 'LIGHTWEIGHT' | 'MIDDLEWEIGHT' | 'HEAVYWEIGHT'
}) {
  return request<ApiFighterSummary>('/api/fighters', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateFighter(id: string, data: Partial<{
  strength: number
  speed: number
  defense: number
  stamina: number
  fightIQ: number
  aggression: number
  elo: number
  wins: number
  losses: number
  draws: number
  isActive: boolean
  winStreak: number
  lossStreak: number
  lastFightAt: string | null
  totalTrainingHours: number
  totalTrainingSessions: number
  trainingCost: number
}>) {
  return request<ApiFighterSummary>(`/api/fighters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ─── Fights ─────────────────────────────────────────────────────────────────

export function getFights(filters?: {
  status?: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  limit?: number
}) {
  return request<ApiFight[]>(`/api/fights${qs({
    status: filters?.status,
    limit: filters?.limit,
  })}`)
}

export function getUpcomingFights(limit = 20) {
  return getFights({ status: 'SCHEDULED', limit })
}

export function getLiveFights(limit = 20) {
  return getFights({ status: 'LIVE', limit })
}

export function getFight(id: string) {
  return request<ApiFight>(`/api/fights/${id}`)
}

export function createFight(data: {
  fighter1Id: string
  fighter2Id: string
  scheduledAt?: string
  maxRounds?: number
  venue?: string
  title?: string
}) {
  return request<ApiFight>('/api/fights', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateFightStatus(id: string, data: {
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  fightData?: unknown
}) {
  return request<ApiFight>(`/api/fights/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function submitFightResult(id: string, data: {
  method: 'KO' | 'TKO' | 'DECISION' | 'SUBMISSION' | 'DISQUALIFICATION' | 'NO_CONTEST'
  round?: number
  time?: string
  winnerId?: string
  fighter1Stats?: Record<string, unknown>
  fighter2Stats?: Record<string, unknown>
  fighter1EloChange?: number
  fighter2EloChange?: number
}) {
  return request<ApiFightResult>(`/api/fights/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── User ───────────────────────────────────────────────────────────────────

export function getUserProfile() {
  return request<ApiUser>('/api/user')
}

export function syncUser(data?: {
  name?: string
}) {
  return request<ApiUser>('/api/user', {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  })
}

export function updateUser(data: {
  name?: string
  username?: string
}) {
  return request<ApiUser>('/api/user', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ─── Credits ────────────────────────────────────────────────────────────────

export function getUserCredits() {
  return request<CreditBalance>('/api/user/credits')
}

export function modifyCredits(data: {
  amount: number
  type: 'deposit' | 'withdrawal' | 'training' | 'bet' | 'reward' | 'payout'
  description?: string
}) {
  return request<CreditTransactionResult>('/api/user/credits', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Bets ───────────────────────────────────────────────────────────────────

export function getBets(filters?: {
  userId?: string
  fightId?: string
  status?: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED' | 'REFUNDED'
  limit?: number
}) {
  return request<ApiBet[]>(`/api/bets${qs({
    userId: filters?.userId,
    fightId: filters?.fightId,
    status: filters?.status,
    limit: filters?.limit,
  })}`)
}

export function getBet(id: string) {
  return request<ApiBet>(`/api/bets/${id}`)
}

export function placeBet(data: {
  fightId: string
  fighterId?: string
  side: 'YES' | 'NO' | 'FIGHTER1' | 'FIGHTER2' | 'OVER' | 'UNDER'
  amount: number
  odds: number
}) {
  return request<ApiBet>('/api/bets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function settleBet(id: string, data: {
  status: 'WON' | 'LOST' | 'CANCELLED' | 'REFUNDED'
  payout?: number
}) {
  return request<ApiBet>(`/api/bets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ─── Training ───────────────────────────────────────────────────────────────

export function getTrainingSessions(filters?: {
  fighterId?: string
  userId?: string
  limit?: number
}) {
  return request<ApiTraining[]>(`/api/training${qs({
    fighterId: filters?.fighterId,
    userId: filters?.userId,
    limit: filters?.limit,
  })}`)
}

export function getTrainingSession(id: string) {
  return request<ApiTraining>(`/api/training/${id}`)
}

export function startTraining(data: {
  fighterId: string
  hours: number
}) {
  return request<ApiTraining>('/api/training', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Re-export error class for consumers ────────────────────────────────────

export { ApiClientError }
