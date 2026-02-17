import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  type TransactionSignature,
} from '@solana/web3.js'

// MFC platform treasury wallet (set in env, fallback to devnet test wallet)
const TREASURY_ADDRESS = new PublicKey(
  process.env.NEXT_PUBLIC_MFC_TREASURY_WALLET || '11111111111111111111111111111111',
)

// Credit exchange rate: 1 SOL = 1000 credits (configurable)
const CREDITS_PER_SOL = Number(process.env.NEXT_PUBLIC_CREDITS_PER_SOL) || 1000

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

  const lamports = Math.round(solAmount * LAMPORTS_PER_SOL)
  const creditAmount = solAmount * CREDITS_PER_SOL

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet,
      toPubkey: TREASURY_ADDRESS,
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
  auth0Id: string,
  solAmount: number,
  signature: TransactionSignature,
): Promise<{ credits: number }> {
  const creditAmount = solAmount * CREDITS_PER_SOL

  const res = await fetch('/api/user/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth0Id,
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
  auth0Id: string,
  creditAmount: number,
): Promise<{ solAmount: number; credits: number }> {
  if (creditAmount <= 0) throw new Error('Withdrawal amount must be positive')

  const solAmount = creditAmount / CREDITS_PER_SOL

  const res = await fetch('/api/user/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth0Id,
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

// Export constants for UI consumption
export { CREDITS_PER_SOL, TREASURY_ADDRESS }
