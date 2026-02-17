'use client'

import { useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, type Transaction, type VersionedTransaction } from '@solana/web3.js'

export function useSolanaWallet() {
  const { connection } = useConnection()
  const {
    publicKey,
    connected,
    connecting,
    disconnecting,
    wallet,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  } = useWallet()

  const getBalance = useCallback(async (): Promise<number | null> => {
    if (!publicKey) return null
    const lamports = await connection.getBalance(publicKey)
    return lamports / LAMPORTS_PER_SOL
  }, [connection, publicKey])

  const signAndSend = useCallback(
    async (transaction: Transaction | VersionedTransaction) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const signature = await sendTransaction(transaction, connection)
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }
      return signature
    },
    [connection, publicKey, sendTransaction],
  )

  return {
    // State
    publicKey,
    address: publicKey?.toBase58() ?? null,
    connected,
    connecting,
    disconnecting,
    walletName: wallet?.adapter.name ?? null,

    // Actions
    connect,
    disconnect,
    getBalance,
    signTransaction,
    signAllTransactions,
    signAndSend,

    // Raw access
    connection,
  }
}
