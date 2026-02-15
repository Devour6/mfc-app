'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CreditBalance, WalletConnection } from '@/types'
import { CreditEngine } from '@/lib/credit-engine'
import { 
  Wallet, 
  ArrowUpRight, 
  Clock,
  Check,
  Loader,
  AlertTriangle,
  DollarSign,
  Copy
} from 'lucide-react'

interface CreditWithdrawalProps {
  creditBalance: CreditBalance
  walletConnection: WalletConnection
  onConnectWallet: () => Promise<void>
  onWithdraw: (amount: number, walletAddress: string) => Promise<void>
  onClose: () => void
}

export default function CreditWithdrawal({ 
  creditBalance,
  walletConnection, 
  onConnectWallet, 
  onWithdraw, 
  onClose 
}: CreditWithdrawalProps) {
  const [amount, setAmount] = useState('')
  const [customWalletAddress, setCustomWalletAddress] = useState('')
  const [useConnectedWallet, setUseConnectedWallet] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'complete'>('form')
  const [error, setError] = useState('')

  const numAmount = parseFloat(amount) || 0
  const withdrawalCalc = numAmount > 0 ? CreditEngine.calculateWithdrawalFee(numAmount) : null
  const minWithdrawal = 1000 // Minimum withdrawal amount

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      await onConnectWallet()
    } finally {
      setIsConnecting(false)
    }
  }

  const handleContinue = () => {
    setError('')
    
    if (numAmount < minWithdrawal) {
      setError(`Minimum withdrawal is ${CreditEngine.formatCredits(minWithdrawal)} credits`)
      return
    }

    if (numAmount > creditBalance.available) {
      setError('Insufficient credits')
      return
    }

    if (!withdrawalCalc || withdrawalCalc.netAmount <= 0) {
      setError('Amount too small after fees')
      return
    }

    if (!walletConnection.connected && !customWalletAddress) {
      setError('Please connect wallet or enter wallet address')
      return
    }

    if (!useConnectedWallet && !isValidSolanaAddress(customWalletAddress)) {
      setError('Invalid Solana wallet address')
      return
    }

    setStep('confirm')
  }

  const handleConfirmWithdraw = async () => {
    if (!withdrawalCalc) return
    
    const walletAddress = useConnectedWallet ? 
      walletConnection.address! : 
      customWalletAddress

    setStep('processing')
    setIsWithdrawing(true)
    
    try {
      await onWithdraw(numAmount, walletAddress)
      setStep('complete')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Withdrawal failed')
      setStep('confirm')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const isValidSolanaAddress = (address: string): boolean => {
    // Basic Solana address validation (base58, 32-44 chars)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }

  const presetAmounts = [1000, 2500, 5000, 10000]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-surface1 border border-border rounded-xl max-w-md w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-400/10 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="font-pixel text-lg text-text1">Withdraw Credits</h2>
                <p className="text-text2 text-sm">Cash out to USDC on Solana</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text2 hover:text-text1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Form */}
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Balance Display */}
                <div className="bg-surface2 border border-border rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-text2 mb-1">Available Balance</div>
                    <div className="text-2xl font-mono text-accent">
                      {CreditEngine.formatCredits(creditBalance.available)}
                    </div>
                    <div className="text-xs text-text2">
                      ≈ {CreditEngine.formatUSD(CreditEngine.creditsToUSD(creditBalance.available))}
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-pixel text-text1 mb-2">
                      Withdrawal Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 bg-surface2 border border-border rounded-lg text-text1 placeholder-text2 focus:outline-none focus:border-accent"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-text2">
                        credits
                      </div>
                    </div>
                  </div>

                  {/* Preset Amounts */}
                  <div className="flex gap-2">
                    {presetAmounts.map(preset => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        disabled={preset > creditBalance.available}
                        className="flex-1 py-2 text-sm border border-border rounded text-text2 hover:text-text1 hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {CreditEngine.formatCredits(preset)}
                      </button>
                    ))}
                  </div>

                  {/* Max Button */}
                  <button
                    onClick={() => setAmount(creditBalance.available.toString())}
                    className="text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    Use maximum available
                  </button>
                </div>

                {/* Fee Breakdown */}
                {withdrawalCalc && (
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      <span className="font-pixel text-sm text-text1">Withdrawal Breakdown</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text2">Withdrawal Amount</span>
                        <span className="text-text1">{CreditEngine.formatCredits(withdrawalCalc.requestedAmount)} credits</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text2">Platform Fee</span>
                        <span className="text-yellow-400">-{CreditEngine.formatCredits(withdrawalCalc.feeInCredits)} credits</span>
                      </div>
                      <div className="border-t border-yellow-400/30 pt-2">
                        <div className="flex justify-between font-pixel">
                          <span className="text-text1">You Receive</span>
                          <span className="text-green-400">
                            {CreditEngine.formatUSD(CreditEngine.creditsToUSD(withdrawalCalc.netAmount))} USDC
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Selection */}
                <div className="space-y-4 mb-6">
                  <label className="block text-sm font-pixel text-text1">
                    Destination Wallet
                  </label>

                  {walletConnection.connected ? (
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
                        <input
                          type="radio"
                          checked={useConnectedWallet}
                          onChange={() => setUseConnectedWallet(true)}
                          className="text-accent"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-text1">Connected Wallet</div>
                          <div className="text-xs text-text2 font-mono">{walletConnection.address}</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
                        <input
                          type="radio"
                          checked={!useConnectedWallet}
                          onChange={() => setUseConnectedWallet(false)}
                          className="text-accent"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-text1">Custom Address</div>
                          <div className="text-xs text-text2">Withdraw to different wallet</div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                      className="w-full p-3 border-2 border-dashed border-border rounded-lg text-text2 hover:border-accent/50 transition-colors"
                    >
                      {isConnecting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Wallet className="w-4 h-4" />
                          <span>Connect Wallet</span>
                        </div>
                      )}
                    </button>
                  )}

                  {(!walletConnection.connected || !useConnectedWallet) && (
                    <input
                      type="text"
                      value={customWalletAddress}
                      onChange={(e) => setCustomWalletAddress(e.target.value)}
                      placeholder="Enter Solana wallet address (e.g., 5fE...8aB)"
                      className="w-full px-4 py-3 bg-surface2 border border-border rounded-lg text-text1 placeholder-text2 focus:outline-none focus:border-accent font-mono text-sm"
                    />
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!amount || numAmount <= 0}
                  className="w-full py-3 bg-accent text-bg rounded-lg font-pixel text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>

                {/* Minimum withdrawal notice */}
                <p className="text-xs text-text2 text-center mt-4">
                  Minimum withdrawal: {CreditEngine.formatCredits(minWithdrawal)} credits • 
                  Estimated time: 1-2 minutes
                </p>
              </motion.div>
            )}

            {/* Step 2: Confirm */}
            {step === 'confirm' && withdrawalCalc && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <h3 className="font-pixel text-lg text-text1 mb-2">Confirm Withdrawal</h3>
                  <p className="text-text2 text-sm">Review your withdrawal details</p>
                </div>

                {/* Withdrawal Summary */}
                <div className="bg-surface2 border border-border rounded-lg p-6 mb-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-mono text-green-400 mb-1">
                        {CreditEngine.formatUSD(CreditEngine.creditsToUSD(withdrawalCalc.netAmount))} USDC
                      </div>
                      <div className="text-sm text-text2">You will receive</div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text2">Withdrawal</span>
                        <span className="text-text1">{CreditEngine.formatCredits(withdrawalCalc.requestedAmount)} credits</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text2">Platform Fee</span>
                        <span className="text-yellow-400">-{CreditEngine.formatCredits(withdrawalCalc.feeInCredits)} credits</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text2">Destination</span>
                        <div className="text-right">
                          <div className="text-text1 font-mono text-xs">
                            {(useConnectedWallet ? walletConnection.address : customWalletAddress)?.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Time */}
                <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-text1">Estimated processing time: 1-2 minutes</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 py-3 border border-border rounded-lg font-pixel text-sm text-text2 hover:text-text1 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmWithdraw}
                    disabled={isWithdrawing}
                    className="flex-1 py-3 bg-green-400 text-bg rounded-lg font-pixel text-sm hover:bg-green-400/90 transition-colors disabled:opacity-50"
                  >
                    {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Processing */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader className="w-8 h-8 text-green-400 animate-spin" />
                </div>
                <h3 className="font-pixel text-lg text-text1 mb-2">Processing Withdrawal</h3>
                <p className="text-text2 text-sm mb-4">
                  Your USDC is being sent to your wallet
                </p>
                <div className="text-xs text-text2">
                  This usually takes 1-2 minutes on Solana
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && withdrawalCalc && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-pixel text-lg text-text1 mb-2">Withdrawal Complete!</h3>
                <p className="text-text2 text-sm mb-6">
                  {CreditEngine.formatUSD(CreditEngine.creditsToUSD(withdrawalCalc.netAmount))} USDC has been sent to your wallet
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-green-400 text-bg rounded-lg font-pixel text-sm hover:bg-green-400/90 transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}