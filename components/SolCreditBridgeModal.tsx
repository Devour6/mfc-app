'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDown, Loader } from 'lucide-react'
import { useSolanaWallet } from '@/lib/solana/use-wallet'
import { getSolanaConfig, buildDepositTransaction, requestWithdrawal } from '@/lib/solana/credit-bridge'
import type { SolanaConfig } from '@/lib/solana/credit-bridge'

interface SolCreditBridgeModalProps {
  credits: number
  onClose: () => void
}

export default function SolCreditBridgeModal({ credits, onClose }: SolCreditBridgeModalProps) {
  const { connected, address, connection, publicKey, signAndSend, getBalance } = useSolanaWallet()
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [config, setConfig] = useState<SolanaConfig | null>(null)
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch config and balance
  useEffect(() => {
    getSolanaConfig().then(setConfig).catch(() => setError('Failed to load Solana config'))
  }, [])

  useEffect(() => {
    if (!connected) return
    getBalance().then(setSolBalance)
  }, [connected, getBalance])

  const numAmount = parseFloat(amount) || 0
  const creditsPerSol = config?.creditsPerSol ?? 0

  const preview = mode === 'deposit'
    ? { from: `${numAmount} SOL`, to: `${Math.round(numAmount * creditsPerSol).toLocaleString()} Credits` }
    : { from: `${Math.round(numAmount).toLocaleString()} Credits`, to: `${creditsPerSol > 0 ? (numAmount / creditsPerSol).toFixed(4) : '0'} SOL` }

  const canSubmit = connected && numAmount > 0 && !loading && (
    mode === 'deposit'
      ? solBalance !== null && numAmount <= solBalance
      : numAmount <= credits
  )

  const handleDeposit = async () => {
    if (!publicKey || !connection) return
    setLoading(true)
    setError(null)
    try {
      const { transaction } = await buildDepositTransaction(connection, publicKey, numAmount)
      await signAndSend(transaction)
      setSuccess(`Deposited ${numAmount} SOL for ${Math.round(numAmount * creditsPerSol).toLocaleString()} credits`)
      setAmount('')
      getBalance().then(setSolBalance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await requestWithdrawal('', Math.round(numAmount))
      setSuccess(`Withdrew ${Math.round(numAmount).toLocaleString()} credits (${result.solAmount.toFixed(4)} SOL)`)
      setAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-surface border border-border max-w-md w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-pixel text-sm text-text">SOL BRIDGE</h2>
            <button onClick={onClose} className="text-text2 hover:text-text transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-0 mb-4 border border-border">
            <button
              onClick={() => { setMode('deposit'); setAmount(''); setError(null); setSuccess(null) }}
              className={`py-2 font-pixel text-[10px] transition-colors ${
                mode === 'deposit' ? 'bg-green/10 text-green border-r border-border' : 'text-text2 border-r border-border hover:text-text'
              }`}
            >
              DEPOSIT SOL
            </button>
            <button
              onClick={() => { setMode('withdraw'); setAmount(''); setError(null); setSuccess(null) }}
              className={`py-2 font-pixel text-[10px] transition-colors ${
                mode === 'withdraw' ? 'bg-accent/10 text-accent' : 'text-text2 hover:text-text'
              }`}
            >
              WITHDRAW
            </button>
          </div>

          {/* Wallet Status */}
          {!connected && (
            <div className="text-center text-xs text-text2 font-ui py-4 border border-border bg-surface2 mb-4">
              Connect your wallet from the top bar to use the SOL bridge
            </div>
          )}

          {connected && (
            <>
              {/* Balance Info */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-surface2 border border-border p-2.5">
                  <div className="text-[10px] text-text2 font-pixel mb-1">SOL BALANCE</div>
                  <div className="text-sm text-accent2 font-ui font-semibold">
                    {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : '...'}
                  </div>
                </div>
                <div className="bg-surface2 border border-border p-2.5">
                  <div className="text-[10px] text-text2 font-pixel mb-1">CREDITS</div>
                  <div className="text-sm text-gold font-ui font-semibold">
                    {credits.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Rate Info */}
              {config && (
                <div className="text-center text-[10px] text-text2 font-ui mb-3">
                  Rate: 1 SOL = {config.creditsPerSol.toLocaleString()} Credits
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-3">
                <div className="text-[10px] text-text2 font-pixel mb-1">
                  {mode === 'deposit' ? 'SOL AMOUNT' : 'CREDITS AMOUNT'}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={mode === 'deposit' ? '0.00' : '0'}
                  step={mode === 'deposit' ? '0.01' : '1'}
                  min="0"
                  className="w-full bg-surface2 border border-border text-text text-sm font-ui px-3 py-2 focus:border-accent focus:outline-none"
                />
              </div>

              {/* Preview */}
              {numAmount > 0 && (
                <div className="bg-bg border border-border p-3 mb-4 flex items-center justify-between">
                  <div className="text-xs text-text2 font-ui">{preview.from}</div>
                  <ArrowDown className="w-4 h-4 text-text2" />
                  <div className="text-xs text-green font-ui font-semibold">{preview.to}</div>
                </div>
              )}

              {/* Error / Success */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-red/10 border border-red/30 px-3 py-2 mb-3 text-xs text-red font-ui"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-green/10 border border-green/30 px-3 py-2 mb-3 text-xs text-green font-ui"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
                disabled={!canSubmit}
                className={`w-full py-2.5 font-pixel text-[10px] transition-all ${
                  mode === 'deposit'
                    ? canSubmit ? 'bg-green text-bg hover:shadow-lg hover:shadow-green/20' : 'bg-green/30 text-green/50 cursor-not-allowed'
                    : canSubmit ? 'bg-accent text-bg hover:shadow-lg hover:shadow-accent/20' : 'bg-accent/30 text-accent/50 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-3 h-3 animate-spin" /> PROCESSING...
                  </span>
                ) : mode === 'deposit' ? 'DEPOSIT SOL' : 'WITHDRAW CREDITS'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
