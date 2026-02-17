'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CreditPurchaseOption, WalletConnection } from '@/types'
import { CreditEngine } from '@/lib/credit-engine'
import { 
  CreditCard, 
  Wallet, 
  Star, 
  TrendingUp, 
  Shield,
  Clock,
  Check,
  Loader,
  ExternalLink,
  DollarSign
} from 'lucide-react'

interface CreditPurchaseProps {
  walletConnection: WalletConnection
  onConnectWallet: () => Promise<void>
  onPurchase: (option: CreditPurchaseOption) => Promise<void>
  onClose: () => void
}

export default function CreditPurchase({ 
  walletConnection, 
  onConnectWallet, 
  onPurchase, 
  onClose 
}: CreditPurchaseProps) {
  const [selectedOption, setSelectedOption] = useState<CreditPurchaseOption | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'complete'>('select')

  const purchaseOptions = CreditEngine.getCreditPurchaseOptions()

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      await onConnectWallet()
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePurchase = async (option: CreditPurchaseOption) => {
    if (!walletConnection.connected) {
      setSelectedOption(option)
      await handleConnectWallet()
      if (!walletConnection.connected) return
    }

    setSelectedOption(option)
    setStep('confirm')
  }

  const handleConfirmPurchase = async () => {
    if (!selectedOption) return
    
    setStep('processing')
    setIsPurchasing(true)
    
    try {
      await onPurchase(selectedOption)
      setStep('complete')
    } catch (error) {
      setStep('confirm')
    } finally {
      setIsPurchasing(false)
    }
  }

  const PurchaseOption = ({ option }: { option: CreditPurchaseOption }) => {
    const totalCredits = option.creditAmount + option.bonusCredits
    const bonusPercentage = option.bonusCredits > 0 ? Math.round((option.bonusCredits / option.creditAmount) * 100) : 0

    return (
      <motion.div
        className={`
          relative border p-6 cursor-pointer transition-all
          ${option.popular 
            ? 'border-accent bg-accent/5 shadow-lg' 
            : option.bestValue 
              ? 'border-green-400 bg-green-400/5' 
              : 'border-border bg-surface2 hover:border-accent/50'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handlePurchase(option)}
      >
        {/* Popular/Best Value Badge */}
        {(option.popular || option.bestValue) && (
          <div className={`
            absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-pixel
            ${option.popular ? 'bg-accent text-bg' : 'bg-green-400 text-bg'}
          `}>
            {option.popular ? 'MOST POPULAR' : 'BEST VALUE'}
          </div>
        )}

        {/* USDC Amount */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-text1 mb-1">
            ${option.usdcAmount}
          </div>
          <div className="text-sm text-text2">USDC</div>
        </div>

        {/* Credit Amount */}
        <div className="text-center mb-4">
          <div className="text-2xl font-ui text-accent mb-1">
            {CreditEngine.formatCredits(totalCredits)}
          </div>
          <div className="text-sm text-text2">credits</div>
        </div>

        {/* Bonus */}
        {option.bonusCredits > 0 && (
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-1 text-green-400">
              <Star className="w-4 h-4" />
              <span className="text-sm font-pixel">
                +{CreditEngine.formatCredits(option.bonusCredits)} BONUS
              </span>
            </div>
            <div className="text-xs text-green-400">
              {bonusPercentage}% extra credits
            </div>
          </div>
        )}

        {/* Value proposition */}
        <div className="text-center text-xs text-text2">
          ${(option.usdcAmount / totalCredits * 100).toFixed(3)} per 100 credits
        </div>
      </motion.div>
    )
  }

  const WalletStatus = () => (
    <div className="bg-surface2 border border-border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 flex items-center justify-center
            ${walletConnection.connected ? 'bg-green-400/20' : 'bg-surface1'}
          `}>
            <Wallet className={`w-5 h-5 ${walletConnection.connected ? 'text-green-400' : 'text-text2'}`} />
          </div>
          
          <div>
            <div className="font-pixel text-sm text-text1">
              {walletConnection.connected ? 'Wallet Connected' : 'Connect Wallet'}
            </div>
            <div className="text-xs text-text2">
              {walletConnection.connected 
                ? `${walletConnection.address} • $${walletConnection.balance?.toFixed(2)} USDC`
                : 'Connect your Solana wallet to purchase credits'
              }
            </div>
          </div>
        </div>

        {!walletConnection.connected && (
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="px-4 py-2 bg-accent text-bg rounded font-pixel text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              'Connect'
            )}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-surface1 border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="font-pixel text-xl text-text1">Purchase Credits</h2>
                <p className="text-text2 text-sm">Buy MFC credits with USDC on Solana</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text2 hover:text-text1 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Package */}
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Wallet Status */}
                <WalletStatus />

                {/* Security Notice */}
                <div className="bg-blue-400/10 border border-blue-400/30 p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="font-pixel text-sm text-text1">Secure & Fast</span>
                  </div>
                  <ul className="text-xs text-text2 space-y-1">
                    <li>• Payments processed on Solana blockchain</li>
                    <li>• Instant credit delivery after confirmation</li>
                    <li>• Your wallet, your control</li>
                  </ul>
                </div>

                {/* Purchase Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {purchaseOptions.map(option => (
                    <PurchaseOption key={option.id} option={option} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Confirm Purchase */}
            {step === 'confirm' && selectedOption && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto"
              >
                <div className="text-center mb-6">
                  <h3 className="font-pixel text-lg text-text1 mb-2">Confirm Purchase</h3>
                  <p className="text-text2 text-sm">Review your order before proceeding</p>
                </div>

                <div className="bg-surface2 border border-border p-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-text2">Credits</span>
                      <span className="font-ui text-text1">{CreditEngine.formatCredits(selectedOption.creditAmount)}</span>
                    </div>
                    
                    {selectedOption.bonusCredits > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-400">Bonus Credits</span>
                        <span className="font-ui text-green-400">+{CreditEngine.formatCredits(selectedOption.bonusCredits)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-pixel text-text1">Total Credits</span>
                        <span className="font-ui text-xl text-accent">
                          {CreditEngine.formatCredits(selectedOption.creditAmount + selectedOption.bonusCredits)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-pixel text-text1">Payment</span>
                        <span className="font-ui text-xl text-text1">${selectedOption.usdcAmount} USDC</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('select')}
                    className="flex-1 py-3 border border-border font-pixel text-sm text-text2 hover:text-text1 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isPurchasing}
                    className="flex-1 py-3 bg-accent text-bg font-pixel text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
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
                <div className="w-16 h-16 bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <Loader className="w-8 h-8 text-accent animate-spin" />
                </div>
                <h3 className="font-pixel text-lg text-text1 mb-2">Processing Payment</h3>
                <p className="text-text2 text-sm mb-4">
                  Please confirm the transaction in your wallet
                </p>
                <div className="text-xs text-text2">
                  This usually takes 30-60 seconds on Solana
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && selectedOption && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-green-400/10 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-pixel text-lg text-text1 mb-2">Purchase Complete!</h3>
                <p className="text-text2 text-sm mb-6">
                  {CreditEngine.formatCredits(selectedOption.creditAmount + selectedOption.bonusCredits)} credits have been added to your account
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-accent text-bg font-pixel text-sm hover:bg-accent/90 transition-colors"
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