/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useSolanaWallet } from '@/lib/solana/use-wallet'

// ─── Mock @solana/wallet-adapter-react ────────────────────────────────────────

const mockGetBalance = jest.fn()
const mockSendTransaction = jest.fn()
const mockConfirmTransaction = jest.fn()

const mockConnection = {
  getBalance: mockGetBalance,
  confirmTransaction: mockConfirmTransaction,
}

const mockPublicKey = {
  toBase58: () => 'mock-wallet-address-abc123',
}

const mockConnect = jest.fn()
const mockDisconnect = jest.fn()
const mockSignTransaction = jest.fn()
const mockSignAllTransactions = jest.fn()

jest.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({ connection: mockConnection }),
  useWallet: () => ({
    publicKey: mockPublicKey,
    connected: true,
    connecting: false,
    disconnecting: false,
    wallet: { adapter: { name: 'Phantom' } },
    connect: mockConnect,
    disconnect: mockDisconnect,
    signTransaction: mockSignTransaction,
    signAllTransactions: mockSignAllTransactions,
    sendTransaction: mockSendTransaction,
  }),
}))

jest.mock('@solana/web3.js', () => ({
  LAMPORTS_PER_SOL: 1_000_000_000,
}))

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Hook interface ───────────────────────────────────────────────────────────

describe('useSolanaWallet', () => {
  it('returns wallet state', () => {
    const { result } = renderHook(() => useSolanaWallet())

    expect(result.current.publicKey).toBe(mockPublicKey)
    expect(result.current.address).toBe('mock-wallet-address-abc123')
    expect(result.current.connected).toBe(true)
    expect(result.current.connecting).toBe(false)
    expect(result.current.disconnecting).toBe(false)
    expect(result.current.walletName).toBe('Phantom')
  })

  it('exposes connect and disconnect', () => {
    const { result } = renderHook(() => useSolanaWallet())

    expect(result.current.connect).toBe(mockConnect)
    expect(result.current.disconnect).toBe(mockDisconnect)
  })

  it('exposes signing functions', () => {
    const { result } = renderHook(() => useSolanaWallet())

    expect(result.current.signTransaction).toBe(mockSignTransaction)
    expect(result.current.signAllTransactions).toBe(mockSignAllTransactions)
  })

  it('exposes connection for raw access', () => {
    const { result } = renderHook(() => useSolanaWallet())

    expect(result.current.connection).toBe(mockConnection)
  })
})

// ─── getBalance ───────────────────────────────────────────────────────────────

describe('getBalance', () => {
  it('converts lamports to SOL correctly', async () => {
    mockGetBalance.mockResolvedValue(2_500_000_000) // 2.5 SOL

    const { result } = renderHook(() => useSolanaWallet())

    let balance: number | null = null
    await act(async () => {
      balance = await result.current.getBalance()
    })

    expect(mockGetBalance).toHaveBeenCalledWith(mockPublicKey)
    expect(balance).toBe(2.5)
  })

  it('handles zero balance', async () => {
    mockGetBalance.mockResolvedValue(0)

    const { result } = renderHook(() => useSolanaWallet())

    let balance: number | null = null
    await act(async () => {
      balance = await result.current.getBalance()
    })

    expect(balance).toBe(0)
  })

  it('handles fractional SOL amounts', async () => {
    mockGetBalance.mockResolvedValue(100_000_000) // 0.1 SOL

    const { result } = renderHook(() => useSolanaWallet())

    let balance: number | null = null
    await act(async () => {
      balance = await result.current.getBalance()
    })

    expect(balance).toBe(0.1)
  })
})

// ─── signAndSend ──────────────────────────────────────────────────────────────

describe('signAndSend', () => {
  it('sends transaction and confirms it', async () => {
    const mockTx = { type: 'mock-transaction' }
    mockSendTransaction.mockResolvedValue('tx-signature-123')
    mockConfirmTransaction.mockResolvedValue({ value: { err: null } })

    const { result } = renderHook(() => useSolanaWallet())

    let signature: string = ''
    await act(async () => {
      signature = await result.current.signAndSend(mockTx as never)
    })

    expect(mockSendTransaction).toHaveBeenCalledWith(mockTx, mockConnection)
    expect(mockConfirmTransaction).toHaveBeenCalledWith('tx-signature-123', 'confirmed')
    expect(signature).toBe('tx-signature-123')
  })

  it('throws when transaction fails on-chain', async () => {
    const mockTx = { type: 'mock-transaction' }
    mockSendTransaction.mockResolvedValue('tx-signature-fail')
    mockConfirmTransaction.mockResolvedValue({
      value: { err: { InstructionError: [0, 'InsufficientFunds'] } },
    })

    const { result } = renderHook(() => useSolanaWallet())

    await expect(
      act(async () => {
        await result.current.signAndSend(mockTx as never)
      }),
    ).rejects.toThrow('Transaction failed')
  })
})

// ─── Disconnected wallet state ────────────────────────────────────────────────

describe('when wallet is disconnected', () => {
  beforeEach(() => {
    const walletAdapter = require('@solana/wallet-adapter-react')
    jest.spyOn(walletAdapter, 'useWallet').mockReturnValue({
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      wallet: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      signTransaction: null,
      signAllTransactions: null,
      sendTransaction: mockSendTransaction,
    })
  })

  it('returns null address when disconnected', () => {
    const { result } = renderHook(() => useSolanaWallet())

    expect(result.current.address).toBeNull()
    expect(result.current.connected).toBe(false)
    expect(result.current.walletName).toBeNull()
  })

  it('getBalance returns null when no publicKey', async () => {
    const { result } = renderHook(() => useSolanaWallet())

    let balance: number | null = -1
    await act(async () => {
      balance = await result.current.getBalance()
    })

    expect(balance).toBeNull()
    expect(mockGetBalance).not.toHaveBeenCalled()
  })

  it('signAndSend throws when wallet not connected', async () => {
    const { result } = renderHook(() => useSolanaWallet())

    await expect(
      act(async () => {
        await result.current.signAndSend({} as never)
      }),
    ).rejects.toThrow('Wallet not connected')
  })
})
