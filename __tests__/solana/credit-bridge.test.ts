/**
 * @jest-environment node
 */
import {
  buildDepositTransaction,
  confirmDeposit,
  requestWithdrawal,
  CREDITS_PER_SOL,
  TREASURY_ADDRESS,
} from '@/lib/solana/credit-bridge'

// ─── Mock @solana/web3.js ─────────────────────────────────────────────────────

const mockGetLatestBlockhash = jest.fn().mockResolvedValue({
  blockhash: 'mock-blockhash-123',
  lastValidBlockHeight: 100,
})

jest.mock('@solana/web3.js', () => {
  const LAMPORTS_PER_SOL = 1_000_000_000

  class MockPublicKey {
    private _key: string
    constructor(key: string) {
      this._key = key
    }
    toBase58() {
      return this._key
    }
    toString() {
      return this._key
    }
    equals(other: MockPublicKey) {
      return this._key === other._key
    }
  }

  class MockTransaction {
    instructions: unknown[] = []
    recentBlockhash?: string
    feePayer?: MockPublicKey
    add(...items: unknown[]) {
      this.instructions.push(...items)
      return this
    }
  }

  return {
    Connection: jest.fn(),
    PublicKey: MockPublicKey,
    SystemProgram: {
      transfer: jest.fn((params: { fromPubkey: MockPublicKey; toPubkey: MockPublicKey; lamports: number }) => ({
        type: 'transfer',
        fromPubkey: params.fromPubkey,
        toPubkey: params.toPubkey,
        lamports: params.lamports,
      })),
    },
    Transaction: MockTransaction,
    LAMPORTS_PER_SOL,
  }
})

// ─── Mock fetch for API calls ─────────────────────────────────────────────────

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── buildDepositTransaction ──────────────────────────────────────────────────

describe('buildDepositTransaction', () => {
  const mockConnection = { getLatestBlockhash: mockGetLatestBlockhash } as never
  const { PublicKey } = jest.requireMock('@solana/web3.js')
  const fromWallet = new PublicKey('sender-wallet-address')

  it('creates a transaction transferring SOL to treasury', async () => {
    const { transaction, creditAmount } = await buildDepositTransaction(
      mockConnection,
      fromWallet,
      1.5,
    )

    expect(transaction.instructions).toHaveLength(1)
    expect(transaction.instructions[0]).toMatchObject({
      type: 'transfer',
      lamports: 1_500_000_000,
    })
    expect(creditAmount).toBe(1.5 * CREDITS_PER_SOL)
  })

  it('sets blockhash and feePayer', async () => {
    const { transaction } = await buildDepositTransaction(
      mockConnection,
      fromWallet,
      1,
    )

    expect(mockGetLatestBlockhash).toHaveBeenCalledWith('confirmed')
    expect(transaction.recentBlockhash).toBe('mock-blockhash-123')
    expect(transaction.feePayer).toBe(fromWallet)
  })

  it('converts SOL to lamports correctly', async () => {
    const { transaction } = await buildDepositTransaction(
      mockConnection,
      fromWallet,
      0.5,
    )

    expect(transaction.instructions[0]).toMatchObject({
      lamports: 500_000_000,
    })
  })

  it('rejects zero deposit', async () => {
    await expect(
      buildDepositTransaction(mockConnection, fromWallet, 0),
    ).rejects.toThrow('Deposit amount must be positive')
  })

  it('rejects negative deposit', async () => {
    await expect(
      buildDepositTransaction(mockConnection, fromWallet, -1),
    ).rejects.toThrow('Deposit amount must be positive')
  })
})

// ─── confirmDeposit ───────────────────────────────────────────────────────────

describe('confirmDeposit', () => {
  it('calls /api/user/credits with correct deposit payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ credits: 2500 }),
    })

    const result = await confirmDeposit('auth0|123', 1.5, 'tx-signature-abc123')

    expect(mockFetch).toHaveBeenCalledWith('/api/user/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.auth0Id).toBe('auth0|123')
    expect(body.amount).toBe(1.5 * CREDITS_PER_SOL)
    expect(body.type).toBe('deposit')
    expect(body.description).toContain('1.5 SOL')
    expect(body.description).toContain('tx-signature-abc')

    expect(result.credits).toBe(2500)
  })

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'User not found' }),
    })

    await expect(
      confirmDeposit('auth0|nope', 1, 'tx-sig'),
    ).rejects.toThrow('User not found')
  })

  it('throws default message when API error has no message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    })

    await expect(
      confirmDeposit('auth0|123', 1, 'tx-sig'),
    ).rejects.toThrow('Failed to credit account')
  })
})

// ─── requestWithdrawal ────────────────────────────────────────────────────────

describe('requestWithdrawal', () => {
  it('calls /api/user/credits with negative amount for withdrawal', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ credits: 500 }),
    })

    const result = await requestWithdrawal('auth0|123', 500)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.auth0Id).toBe('auth0|123')
    expect(body.amount).toBe(-500)
    expect(body.type).toBe('withdrawal')

    expect(result.solAmount).toBe(500 / CREDITS_PER_SOL)
    expect(result.credits).toBe(500)
  })

  it('calculates correct SOL amount from credits', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ credits: 0 }),
    })

    const result = await requestWithdrawal('auth0|123', 2000)

    expect(result.solAmount).toBe(2) // 2000 credits / 1000 per SOL = 2 SOL
  })

  it('rejects zero withdrawal', async () => {
    await expect(
      requestWithdrawal('auth0|123', 0),
    ).rejects.toThrow('Withdrawal amount must be positive')
  })

  it('rejects negative withdrawal', async () => {
    await expect(
      requestWithdrawal('auth0|123', -100),
    ).rejects.toThrow('Withdrawal amount must be positive')
  })

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Insufficient credits' }),
    })

    await expect(
      requestWithdrawal('auth0|123', 99999),
    ).rejects.toThrow('Insufficient credits')
  })
})

// ─── Constants ────────────────────────────────────────────────────────────────

describe('exported constants', () => {
  it('exports CREDITS_PER_SOL as 1000 (default)', () => {
    expect(CREDITS_PER_SOL).toBe(1000)
  })

  it('exports TREASURY_ADDRESS as a PublicKey', () => {
    expect(TREASURY_ADDRESS).toBeDefined()
    expect(typeof TREASURY_ADDRESS.toBase58).toBe('function')
  })
})
