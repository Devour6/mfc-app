'use client'

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { CreditTransaction } from '@/types'
import { CreditEngine } from '@/lib/credit-engine'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Trophy, 
  Award, 
  Target,
  Filter,
  Clock,
  Check,
  X,
  ExternalLink,
  Search
} from 'lucide-react'

interface TransactionHistoryProps {
  transactions: CreditTransaction[]
  onClose: () => void
}

export default function TransactionHistory({ transactions, onClose }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<CreditTransaction['type'] | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type === filter)
    }

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }, [transactions, filter, searchTerm])

  const stats = CreditEngine.getTransactionStats(transactions)

  const getTransactionIcon = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'deposit': return <ArrowDownRight className="w-4 h-4 text-green-400" />
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-blue-400" />
      case 'training': return <Zap className="w-4 h-4 text-yellow-400" />
      case 'prediction': return <Target className="w-4 h-4 text-purple-400" />
      case 'tournament': return <Trophy className="w-4 h-4 text-orange-400" />
      case 'reward': return <Award className="w-4 h-4 text-green-400" />
      case 'achievement': return <Award className="w-4 h-4 text-accent" />
      default: return <Clock className="w-4 h-4 text-text2" />
    }
  }

  const getTransactionColor = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'deposit': return 'text-green-400'
      case 'withdrawal': return 'text-blue-400'
      case 'training': return 'text-yellow-400'
      case 'prediction': return 'text-purple-400'
      case 'tournament': return 'text-orange-400'
      case 'reward': return 'text-green-400'
      case 'achievement': return 'text-accent'
      default: return 'text-text2'
    }
  }

  const getStatusIcon = (status: CreditTransaction['status']) => {
    switch (status) {
      case 'completed': return <Check className="w-3 h-3 text-green-400" />
      case 'pending': return <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />
      case 'failed': return <X className="w-3 h-3 text-red-400" />
      case 'cancelled': return <X className="w-3 h-3 text-text2" />
      default: return null
    }
  }

  const formatAmount = (amount: number, type: CreditTransaction['type']) => {
    const isPositive = amount > 0
    const prefix = isPositive ? '+' : ''
    const color = isPositive ? 'text-green-400' : 'text-red-400'
    
    return (
      <span className={`font-mono ${color}`}>
        {prefix}{CreditEngine.formatCredits(Math.abs(amount))}
      </span>
    )
  }

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'training', label: 'Training' },
    { value: 'prediction', label: 'Predictions' },
    { value: 'tournament', label: 'Tournaments' },
    { value: 'reward', label: 'Rewards' },
    { value: 'achievement', label: 'Achievements' }
  ]

  const TransactionRow = ({ transaction }: { transaction: CreditTransaction }) => (
    <motion.div
      className="border-b border-border last:border-b-0 p-4 hover:bg-surface2/50 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-surface2 rounded-full flex items-center justify-center flex-shrink-0">
            {getTransactionIcon(transaction.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-pixel text-sm capitalize ${getTransactionColor(transaction.type)}`}>
                {transaction.type}
              </span>
              {getStatusIcon(transaction.status)}
            </div>
            
            <div className="text-sm text-text1 mb-1 leading-tight">
              {transaction.description}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-text2">
              <span>{new Date(transaction.timestamp).toLocaleString()}</span>
              <span className="font-mono">ID: {transaction.id.slice(-8)}</span>
              {transaction.fee > 0 && (
                <span>Fee: {CreditEngine.formatCredits(transaction.fee)}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-lg">
            {formatAmount(transaction.amount, transaction.type)}
          </div>
          {transaction.transactionHash && (
            <button
              onClick={() => window.open(`https://explorer.solana.com/tx/${transaction.transactionHash}`, '_blank')}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Explorer</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-surface1 border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-pixel text-xl text-text1">Transaction History</h2>
                <p className="text-text2 text-sm">
                  {filteredTransactions.length} of {transactions.length} transactions
                </p>
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

          {/* Stats Overview */}
          <div className="p-6 border-b border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-lg font-mono text-green-400">
                  {CreditEngine.formatCredits(stats.totalDeposits)}
                </div>
                <div className="text-xs text-text2">Total Deposits</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono text-blue-400">
                  {CreditEngine.formatCredits(stats.totalWithdrawals)}
                </div>
                <div className="text-xs text-text2">Total Withdrawals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono text-accent">
                  {CreditEngine.formatCredits(stats.totalRewards)}
                </div>
                <div className="text-xs text-text2">Rewards Earned</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono text-yellow-400">
                  {CreditEngine.formatCredits(stats.totalFeesPaid)}
                </div>
                <div className="text-xs text-text2">Fees Paid</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 bg-surface2 border border-border rounded-lg text-text1 placeholder-text2 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text2" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="pl-10 pr-8 py-2 bg-surface2 border border-border rounded-lg text-text1 focus:outline-none focus:border-accent appearance-none"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto">
            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredTransactions.map(transaction => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-12 h-12 text-text2 opacity-50 mb-4" />
                <h3 className="font-pixel text-lg text-text1 mb-2">No Transactions Found</h3>
                <p className="text-text2 text-sm">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'Your transaction history will appear here'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Export Options */}
          {filteredTransactions.length > 0 && (
            <div className="p-6 border-t border-border">
              <div className="flex items-center justify-between text-sm text-text2">
                <span>
                  Showing {filteredTransactions.length} transactions
                </span>
                <button
                  onClick={() => {
                    // In real implementation, this would export to CSV
                    const csv = [
                      'Date,Type,Description,Amount,Fee,Status,ID',
                      ...filteredTransactions.map(tx => 
                        `${new Date(tx.timestamp).toISOString()},${tx.type},"${tx.description}",${tx.amount},${tx.fee},${tx.status},${tx.id}`
                      )
                    ].join('\n')
                    
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'mfc-transactions.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="text-accent hover:text-accent/80 transition-colors font-pixel"
                >
                  Export CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}