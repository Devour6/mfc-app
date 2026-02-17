'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ExtendedUser } from '@/types'
import { CreditEngine } from '@/lib/credit-engine'
import CreditPurchase from './CreditPurchase'
import CreditWithdrawal from './CreditWithdrawal'
import TransactionHistory from './TransactionHistory'
import WalletConnect from './WalletConnect'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock,
  TrendingUp,
  Shield,
  Zap,
  PlusCircle,
  MinusCircle,
  History,
  DollarSign
} from 'lucide-react'

interface CreditsDashboardProps {
  user: ExtendedUser
  onConnectWallet: () => Promise<void>
  onDisconnectWallet: () => void
  onPurchaseCredits: (option: any) => Promise<void>
  onWithdrawCredits: (amount: number, address: string) => Promise<void>
  onClose: () => void
}

export default function CreditsDashboard({ 
  user, 
  onConnectWallet,
  onDisconnectWallet,
  onPurchaseCredits, 
  onWithdrawCredits,
  onClose 
}: CreditsDashboardProps) {
  const [activeModal, setActiveModal] = useState<'purchase' | 'withdraw' | 'history' | 'wallet' | null>(null)
  
  const { creditBalance, transactions, walletConnection } = user
  const stats = CreditEngine.getTransactionStats(transactions)
  const recentTransactions = transactions.slice(0, 5)

  const balanceCards = [
    {
      title: 'Available Balance',
      value: CreditEngine.formatCredits(creditBalance.available),
      subtitle: `≈ ${CreditEngine.formatUSD(CreditEngine.creditsToUSD(creditBalance.available))}`,
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-accent'
    },
    {
      title: 'Lifetime Deposited',
      value: CreditEngine.formatUSD(creditBalance.lifetime.deposited),
      subtitle: `${CreditEngine.formatCredits(CreditEngine.usdToCredits(creditBalance.lifetime.deposited))} credits`,
      icon: <ArrowDownRight className="w-5 h-5" />,
      color: 'text-green-400'
    },
    {
      title: 'Total Earned',
      value: CreditEngine.formatCredits(creditBalance.lifetime.earned),
      subtitle: `≈ ${CreditEngine.formatUSD(CreditEngine.creditsToUSD(creditBalance.lifetime.earned))}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-400'
    },
    {
      title: 'Total Spent',
      value: CreditEngine.formatCredits(creditBalance.lifetime.spent),
      subtitle: `≈ ${CreditEngine.formatUSD(CreditEngine.creditsToUSD(creditBalance.lifetime.spent))}`,
      icon: <Zap className="w-5 h-5" />,
      color: 'text-yellow-400'
    }
  ]

  const actionButtons = [
    {
      id: 'purchase',
      label: 'Buy Credits',
      description: 'Purchase with USDC',
      icon: <PlusCircle className="w-5 h-5" />,
      color: 'bg-green-400 hover:bg-green-400/90 text-bg',
      disabled: false
    },
    {
      id: 'withdraw',
      label: 'Cash Out',
      description: 'Withdraw to wallet',
      icon: <MinusCircle className="w-5 h-5" />,
      color: 'bg-blue-400 hover:bg-blue-400/90 text-bg',
      disabled: creditBalance.available < 1000
    },
    {
      id: 'history',
      label: 'Transaction History',
      description: `${transactions.length} transactions`,
      icon: <History className="w-5 h-5" />,
      color: 'border border-border hover:border-accent text-text1',
      disabled: false
    }
  ]

  const RecentTransaction = ({ transaction }: { transaction: any }) => {
    const isPositive = transaction.amount > 0
    const icon = isPositive ? (
      <ArrowDownRight className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-400" />
    )

    return (
      <div className="flex items-center justify-between p-3 hover:bg-surface2/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface2 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="text-sm text-text1 capitalize">{transaction.type}</div>
            <div className="text-xs text-text2">
              {new Date(transaction.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className={`font-ui text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{CreditEngine.formatCredits(transaction.amount)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <motion.div
          className="bg-surface1 border border-border max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-pixel text-2xl text-text1">Credits Dashboard</h2>
                  <p className="text-text2">Manage your MFC credit balance and transactions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Wallet Status */}
                <button
                  onClick={() => setActiveModal('wallet')}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm transition-all
                    ${walletConnection.connected 
                      ? 'bg-green-400/10 text-green-400 border border-green-400/30' 
                      : 'bg-surface2 text-text2 border border-border hover:border-accent'
                    }
                  `}
                >
                  <Wallet className="w-4 h-4" />
                  <span>
                    {walletConnection.connected 
                      ? `${walletConnection.address?.slice(0, 6)}...` 
                      : 'Connect Wallet'
                    }
                  </span>
                </button>

                <button
                  onClick={onClose}
                  className="text-text2 hover:text-text1 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {balanceCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  className="bg-surface2 border border-border p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 bg-current/10 flex items-center justify-center ${card.color}`}>
                      {card.icon}
                    </div>
                    <div className="text-xs text-text2">
                      {card.title}
                    </div>
                  </div>
                  <div className={`text-2xl font-ui mb-1 ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-text2">
                    {card.subtitle}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {actionButtons.map((button) => (
                <motion.button
                  key={button.id}
                  onClick={() => setActiveModal(button.id as any)}
                  disabled={button.disabled}
                  className={`
                    flex flex-col items-center gap-3 p-6 transition-all
                    ${button.color}
                    ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  whileHover={!button.disabled ? { scale: 1.02 } : {}}
                  whileTap={!button.disabled ? { scale: 0.98 } : {}}
                >
                  {button.icon}
                  <div className="text-center">
                    <div className="font-pixel text-sm mb-1">{button.label}</div>
                    <div className="text-xs opacity-80">{button.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Platform Fees Info */}
            <div className="bg-yellow-400/10 border border-yellow-400/30 p-4 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="font-pixel text-sm text-text1">Platform Fees</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-text2">Training</div>
                  <div className="text-text1 font-ui">{(CreditEngine.PLATFORM_FEES.training * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-text2">Predictions</div>
                  <div className="text-text1 font-ui">1-2%</div>
                </div>
                <div>
                  <div className="text-text2">Tournaments</div>
                  <div className="text-text1 font-ui">{(CreditEngine.PLATFORM_FEES.tournament * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-text2">Withdrawals</div>
                  <div className="text-text1 font-ui">${CreditEngine.PLATFORM_FEES.withdrawal}</div>
                </div>
              </div>
              <p className="text-xs text-text2 mt-2">
                All fees are transparently displayed before transactions
              </p>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-pixel text-lg text-text1">Recent Activity</h3>
                {transactions.length > 5 && (
                  <button
                    onClick={() => setActiveModal('history')}
                    className="text-accent hover:text-accent/80 text-sm transition-colors"
                  >
                    View All
                  </button>
                )}
              </div>

              {recentTransactions.length > 0 ? (
                <div className="bg-surface2 border border-border divide-y divide-border">
                  {recentTransactions.map(transaction => (
                    <RecentTransaction key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text2">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'purchase' && (
          <CreditPurchase
            walletConnection={walletConnection}
            onConnectWallet={onConnectWallet}
            onPurchase={onPurchaseCredits}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'withdraw' && (
          <CreditWithdrawal
            creditBalance={creditBalance}
            walletConnection={walletConnection}
            onConnectWallet={onConnectWallet}
            onWithdraw={onWithdrawCredits}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'history' && (
          <TransactionHistory
            transactions={transactions}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'wallet' && (
          <WalletConnect
            walletConnection={walletConnection}
            onConnect={onConnectWallet}
            onDisconnect={onDisconnectWallet}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}