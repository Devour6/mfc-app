'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { WalletConnection } from '@/types'
import { 
  Wallet, 
  Shield, 
  Loader, 
  Check,
  ExternalLink,
  Copy,
  Power
} from 'lucide-react'

interface WalletConnectProps {
  walletConnection: WalletConnection
  onConnect: () => Promise<void>
  onDisconnect: () => void
  onClose: () => void
}

export default function WalletConnect({ 
  walletConnection, 
  onConnect, 
  onDisconnect, 
  onClose 
}: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await onConnect()
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCopyAddress = () => {
    if (walletConnection.address) {
      navigator.clipboard.writeText(walletConnection.address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const walletProviders = [
    {
      id: 'phantom',
      name: 'Phantom',
      logo: '👻',
      description: 'Most popular Solana wallet',
      installed: typeof window !== 'undefined' && !!(window as any).phantom?.solana,
      downloadUrl: 'https://phantom.app/'
    },
    {
      id: 'solflare',
      name: 'Solflare',
      logo: '🔥',
      description: 'Advanced Solana wallet',
      installed: typeof window !== 'undefined' && !!(window as any).solflare,
      downloadUrl: 'https://solflare.com/'
    },
    {
      id: 'backpack',
      name: 'Backpack',
      logo: '🎒',
      description: 'New generation wallet',
      installed: typeof window !== 'undefined' && !!(window as any).backpack,
      downloadUrl: 'https://backpack.exchange/'
    }
  ]

  const WalletProvider = ({ provider }: { provider: typeof walletProviders[0] }) => (
    <motion.button
      onClick={provider.installed ? handleConnect : undefined}
      disabled={isConnecting || !provider.installed}
      className={`
        w-full p-4 border text-left transition-all
        ${provider.installed 
          ? 'border-border hover:border-accent hover:bg-accent/5' 
          : 'border-border opacity-50 cursor-not-allowed'
        }
      `}
      whileHover={provider.installed ? { scale: 1.02 } : {}}
      whileTap={provider.installed ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{provider.logo}</div>
          <div>
            <div className="font-pixel text-sm text-text1">{provider.name}</div>
            <div className="text-xs text-text2">{provider.description}</div>
          </div>
        </div>
        
        {provider.installed ? (
          <div className="text-green-400">
            <Check className="w-5 h-5" />
          </div>
        ) : (
          <a
            href={provider.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-accent hover:text-accent/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </motion.button>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-surface1 border border-border max-w-md w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-pixel text-lg text-text1">
                  {walletConnection.connected ? 'Wallet Connected' : 'Connect Wallet'}
                </h2>
                <p className="text-text2 text-sm">
                  {walletConnection.connected ? 'Manage your connection' : 'Choose your Solana wallet'}
                </p>
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

          {walletConnection.connected ? (
            /* Connected State */
            <div className="space-y-6">
              {/* Wallet Info */}
              <div className="bg-green-400/10 border border-green-400/30 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-400/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="font-pixel text-sm text-text1">Wallet Connected</div>
                    <div className="text-xs text-text2">Solana Mainnet</div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text2">Address</span>
                    <button
                      onClick={handleCopyAddress}
                      className="text-accent hover:text-accent/80 transition-colors"
                    >
                      {copiedAddress ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="font-ui text-sm text-text1 bg-surface2 px-2 py-1">
                    {walletConnection.address}
                  </div>
                </div>

                {/* Balance */}
                {walletConnection.balance !== undefined && (
                  <div className="mt-4">
                    <div className="text-sm text-text2 mb-1">USDC Balance</div>
                    <div className="text-lg font-ui text-accent">
                      ${walletConnection.balance.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-blue-400/10 border border-blue-400/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="font-pixel text-sm text-text1">Security</span>
                </div>
                <ul className="text-xs text-text2 space-y-1">
                  <li>• MFC never stores your private keys</li>
                  <li>• You approve all transactions in your wallet</li>
                  <li>• Disconnect anytime to revoke access</li>
                </ul>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={onDisconnect}
                className="w-full flex items-center justify-center gap-2 py-3 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-colors"
              >
                <Power className="w-4 h-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          ) : (
            /* Not Connected State */
            <div className="space-y-6">
              {/* Security Notice */}
              <div className="bg-blue-400/10 border border-blue-400/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="font-pixel text-sm text-text1">Why Connect?</span>
                </div>
                <ul className="text-xs text-text2 space-y-1">
                  <li>• Buy credits with USDC instantly</li>
                  <li>• Withdraw earnings to your wallet</li>
                  <li>• Your keys, your crypto - we never store them</li>
                </ul>
              </div>

              {/* Connecting State */}
              {isConnecting && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Loader className="w-8 h-8 text-accent animate-spin" />
                  </div>
                  <h3 className="font-pixel text-lg text-text1 mb-2">Connecting...</h3>
                  <p className="text-text2 text-sm">
                    Please approve the connection in your wallet
                  </p>
                </div>
              )}

              {/* Wallet Options */}
              {!isConnecting && (
                <div className="space-y-3">
                  <h3 className="font-pixel text-sm text-text1 mb-3">Available Wallets</h3>
                  {walletProviders.map(provider => (
                    <WalletProvider key={provider.id} provider={provider} />
                  ))}
                </div>
              )}

              {/* No Wallet Notice */}
              {!isConnecting && !walletProviders.some(p => p.installed) && (
                <div className="text-center py-4">
                  <p className="text-text2 text-sm mb-4">
                    No Solana wallet detected. Install one to continue.
                  </p>
                  <div className="flex gap-2">
                    {walletProviders.map(provider => (
                      <a
                        key={provider.id}
                        href={provider.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-accent/10 text-accent text-sm hover:bg-accent/20 transition-colors"
                      >
                        Get {provider.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}