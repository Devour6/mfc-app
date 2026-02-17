import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  type TransactionSignature,
} from '@solana/web3.js'

export interface SolanaConfig {
  treasuryWallet: string
  creditsPerSol: number
}

export interface DepositResult {
  signature: TransactionSignature
  solAmount: number
  creditAmount: number
}

export interface WithdrawResult {
  signature: TransactionSignature
  creditAmount: number
  solAmount: number
}

let _configCache: SolanaConfig | null = null

/**
 * Fetch Solana config (treasury address, exchange rate) from the backend.
 * Cached after first successful fetch.
 */
export async function getSolanaConfig(): Promise<SolanaConfig> {
  if (_configCache) return _configCache

  const res = await fetch('/api/solana/config')
  if (!res.ok) {
    throw new Error('Failed to fetch Solana config')
  }

  _configCache = await res.json()
  return _configCache!
}

/**
 * Build a SOL transfer transaction for depositing to MFC platform credits.
 * The caller must sign and send the transaction using their wallet adapter.
 */
export async function buildDepositTransaction(
  connection: Connection,
  fromWallet: PublicKey,
  solAmount: number,
): Promise<{ transaction: Transaction; creditAmount: number }> {
  if (solAmount <= 0) throw new Error('Deposit amount must be positive')

  const config = await getSolanaConfig()
  const treasuryAddress = new PublicKey(config.treasuryWallet)
  const lamports = Math.round(solAmount * LAMPORTS_PER_SOL)
  const creditAmount = solAmount * config.creditsPerSol

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet,
      toPubkey: treasuryAddress,
      lamports,
    }),
  )

  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromWallet

  return { transaction, creditAmount }
}

/**
 * After a deposit transaction is confirmed on-chain, call the MFC API
 * to credit the user's account.
 */
export async function confirmDeposit(
  solAmount: number,
  signature: TransactionSignature,
): Promise<{ credits: number }> {
  const config = await getSolanaConfig()
  const creditAmount = solAmount * config.creditsPerSol

  const res = await fetch('/api/user/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: creditAmount,
      type: 'deposit',
      description: `Deposit ${solAmount} SOL (tx: ${signature.slice(0, 16)}...)`,
    }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to credit account')
  }

  return res.json()
}

/**
 * Request a withdrawal: deduct credits first via API, then the backend
 * would process the SOL transfer from treasury. For devnet, this is simulated.
 *
 * In production, withdrawal would be a two-step process:
 * 1. API deducts credits and creates a withdrawal request
 * 2. Backend service processes the on-chain transfer
 *
 * For devnet/development, we deduct credits immediately.
 */
export async function requestWithdrawal(
  creditAmount: number,
): Promise<{ solAmount: number; credits: number }> {
  if (creditAmount <= 0) throw new Error('Withdrawal amount must be positive')

  const config = await getSolanaConfig()
  const solAmount = creditAmount / config.creditsPerSol

  const res = await fetch('/api/user/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: -creditAmount,
      type: 'withdrawal',
      description: `Withdraw ${creditAmount} credits (${solAmount} SOL)`,
    }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to process withdrawal')
  }

  const data = await res.json()
  return { solAmount, credits: data.credits }
}
