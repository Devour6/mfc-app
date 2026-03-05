/**
 * @jest-environment node
 *
 * Solana credit bridge tests — verifies:
 * 1. buildDepositTransaction — SOL transfer to treasury, blockhash, lamport conversion
 * 2. confirmDeposit — calls /api/user/credits with deposit payload
 * 3. requestWithdrawal — calls /api/user/credits with negative amount
 * 4. getSolanaConfig — fetches and caches config from /api/solana/config
 * 5. Input validation — rejects zero/negative amounts
 * 6. Error handling — API failures propagate correctly
 */
import {
  buildDepositTransaction,
  confirmDeposit,
  requestWithdrawal,
  getSolanaConfig,
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

// Config returned by /api/solana/config — matches SolanaConfig interface
const MOCK_CONFIG = {
  treasuryWallet: 'treasury-wallet-address',
  creditsPerSol: 1000,
}

/**
 * Set up URL-aware fetch mock. Always handles /api/solana/config.
 * Pass an apiResponse to also handle /api/user/credits calls.
 */
function setupFetchMock(apiResponse?: { ok: boolean; json: () => Promise<unknown> }) {
  mockFetch.mockImplementation((url: string) => {
    if (url === '/api/solana/config') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_CONFIG),
      })
    }
    if (apiResponse) return Promise.resolve(apiResponse)
    return Promise.resolve(undefined)
  })
}

/** Find the fetch call to a specific URL (robust against config caching). */
function findFetchCall(url: string): [string, RequestInit] | undefined {
  return mockFetch.mock.calls.find(([callUrl]: [string]) => callUrl === url)
}

beforeEach(() => {
  jest.clearAllMocks()
  setupFetchMock()
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
    expect(creditAmount).toBe(1.5 * MOCK_CONFIG.creditsPerSol)
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
    setupFetchMock({
      ok: true,
      json: () => Promise.resolve({ credits: 2500 }),
    })

    const result = await confirmDeposit('auth0|123', 1.5, 'tx-signature-abc123')

    expect(mockFetch).toHaveBeenCalledWith('/api/user/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })

    const creditsCall = findFetchCall('/api/user/credits')
    const body = JSON.parse(creditsCall![1].body as string)
    expect(body.auth0Id).toBe('auth0|123')
    expect(body.amount).toBe(1.5 * MOCK_CONFIG.creditsPerSol)
    expect(body.type).toBe('deposit')
    expect(body.description).toContain('1.5 SOL')
    expect(body.description).toContain('tx-signature-abc')

    expect(result.credits).toBe(2500)
  })

  it('throws on API error', async () => {
    setupFetchMock({
      ok: false,
      json: () => Promise.resolve({ error: 'User not found' }),
    })

    await expect(
      confirmDeposit('auth0|nope', 1, 'tx-sig'),
    ).rejects.toThrow('User not found')
  })

  it('throws default message when API error has no message', async () => {
    setupFetchMock({
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
    setupFetchMock({
      ok: true,
      json: () => Promise.resolve({ credits: 500 }),
    })

    const result = await requestWithdrawal('auth0|123', 500)

    const creditsCall = findFetchCall('/api/user/credits')
    const body = JSON.parse(creditsCall![1].body as string)
    expect(body.auth0Id).toBe('auth0|123')
    expect(body.amount).toBe(-500)
    expect(body.type).toBe('withdrawal')

    expect(result.solAmount).toBe(500 / MOCK_CONFIG.creditsPerSol)
    expect(result.credits).toBe(500)
  })

  it('calculates correct SOL amount from credits', async () => {
    setupFetchMock({
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
    setupFetchMock({
      ok: false,
      json: () => Promise.resolve({ error: 'Insufficient credits' }),
    })

    await expect(
      requestWithdrawal('auth0|123', 99999),
    ).rejects.toThrow('Insufficient credits')
  })
})

// ─── getSolanaConfig ─────────────────────────────────────────────────────────

describe('getSolanaConfig', () => {
  it('fetches config from /api/solana/config', async () => {
    const config = await getSolanaConfig()

    expect(config.creditsPerSol).toBe(1000)
    expect(config.treasuryWallet).toBe('treasury-wallet-address')
  })

  it('throws when config endpoint fails', async () => {
    // Need a fresh module to clear the config cache
    jest.resetModules()
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/solana/config') {
        return Promise.resolve({ ok: false })
      }
      return Promise.resolve(undefined)
    })

    const { getSolanaConfig: freshGetConfig } = require('@/lib/solana/credit-bridge')
    await expect(freshGetConfig()).rejects.toThrow('Failed to fetch Solana config')
  })
})
