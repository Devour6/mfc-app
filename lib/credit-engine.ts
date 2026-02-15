import { 
  CreditTransaction, 
  CreditBalance, 
  CreditPurchaseOption, 
  WithdrawalRequest, 
  PlatformFees,
  WalletConnection 
} from '@/types'

export class CreditEngine {
  
  static readonly PLATFORM_FEES: PlatformFees = {
    training: 0.10,      // 10% on training
    predictionMaker: 0.02, // 2% on maker orders
    predictionTaker: 0.01, // 1% on taker orders
    tournament: 0.10,    // 10% tournament entry
    withdrawal: 25       // $25 USDC flat fee
  }

  static readonly CREDIT_TO_USD_RATE = 0.01 // 1 credit = $0.01 USD

  static createInitialBalance(): CreditBalance {
    return {
      available: 2500, // Starting credits
      pending: 0,
      lifetime: {
        deposited: 0,
        withdrawn: 0,
        earned: 2500, // Starting credits count as earned
        spent: 0
      }
    }
  }

  static createInitialWallet(): WalletConnection {
    return {
      connected: false,
      network: 'solana-mainnet'
    }
  }

  static getCreditPurchaseOptions(): CreditPurchaseOption[] {
    return [
      {
        id: 'starter',
        usdcAmount: 10,
        creditAmount: 1000,
        bonusCredits: 0
      },
      {
        id: 'popular',
        usdcAmount: 25,
        creditAmount: 2500,
        bonusCredits: 250, // 10% bonus
        popular: true
      },
      {
        id: 'value',
        usdcAmount: 50,
        creditAmount: 5000,
        bonusCredits: 750, // 15% bonus
        bestValue: true
      },
      {
        id: 'whale',
        usdcAmount: 100,
        creditAmount: 10000,
        bonusCredits: 2000 // 20% bonus
      },
      {
        id: 'megalodon',
        usdcAmount: 250,
        creditAmount: 25000,
        bonusCredits: 6250 // 25% bonus
      }
    ]
  }

  static calculateTrainingFee(baseCost: number): {
    baseCost: number
    platformFee: number
    totalCost: number
  } {
    const platformFee = Math.floor(baseCost * this.PLATFORM_FEES.training)
    return {
      baseCost,
      platformFee,
      totalCost: baseCost + platformFee
    }
  }

  static calculatePredictionFee(amount: number, isMaker: boolean): {
    baseAmount: number
    platformFee: number
    totalAmount: number
  } {
    const feeRate = isMaker ? this.PLATFORM_FEES.predictionMaker : this.PLATFORM_FEES.predictionTaker
    const platformFee = Math.floor(amount * feeRate)
    return {
      baseAmount: amount,
      platformFee,
      totalAmount: amount + platformFee
    }
  }

  static calculateTournamentFee(entryFee: number): {
    entryFee: number
    platformFee: number
    totalCost: number
  } {
    const platformFee = Math.floor(entryFee * this.PLATFORM_FEES.tournament)
    return {
      entryFee,
      platformFee,
      totalCost: entryFee + platformFee
    }
  }

  static calculateWithdrawalFee(amount: number): {
    requestedAmount: number
    platformFee: number
    netAmount: number
    feeInCredits: number
  } {
    const feeInCredits = Math.floor(this.PLATFORM_FEES.withdrawal / this.CREDIT_TO_USD_RATE)
    return {
      requestedAmount: amount,
      platformFee: this.PLATFORM_FEES.withdrawal, // USD
      netAmount: amount - feeInCredits,
      feeInCredits
    }
  }

  static createTransaction(
    type: CreditTransaction['type'],
    amount: number,
    fee: number,
    description: string,
    relatedId?: string
  ): CreditTransaction {
    return {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      fee,
      netAmount: type === 'withdrawal' ? amount - fee : amount,
      description,
      timestamp: Date.now(),
      status: 'completed',
      relatedId
    }
  }

  static processDeposit(
    balance: CreditBalance,
    transactions: CreditTransaction[],
    purchaseOption: CreditPurchaseOption,
    walletAddress: string
  ): {
    newBalance: CreditBalance
    newTransactions: CreditTransaction[]
    transaction: CreditTransaction
  } {
    const totalCredits = purchaseOption.creditAmount + purchaseOption.bonusCredits
    
    const transaction = this.createTransaction(
      'deposit',
      totalCredits,
      0,
      `Purchased ${purchaseOption.creditAmount} credits${purchaseOption.bonusCredits > 0 ? ` + ${purchaseOption.bonusCredits} bonus` : ''} for $${purchaseOption.usdcAmount} USDC`
    )
    
    transaction.walletAddress = walletAddress
    transaction.status = 'pending' // Would be completed after blockchain confirmation

    const newBalance = {
      ...balance,
      available: balance.available + totalCredits,
      lifetime: {
        ...balance.lifetime,
        deposited: balance.lifetime.deposited + purchaseOption.usdcAmount
      }
    }

    return {
      newBalance,
      newTransactions: [transaction, ...transactions],
      transaction
    }
  }

  static processWithdrawal(
    balance: CreditBalance,
    transactions: CreditTransaction[],
    amount: number,
    walletAddress: string
  ): {
    newBalance: CreditBalance
    newTransactions: CreditTransaction[]
    transaction: CreditTransaction
    error?: string
  } {
    const { feeInCredits, netAmount, platformFee } = this.calculateWithdrawalFee(amount)
    
    if (balance.available < amount) {
      return {
        newBalance: balance,
        newTransactions: transactions,
        transaction: {} as CreditTransaction,
        error: 'Insufficient credits for withdrawal'
      }
    }

    const usdAmount = (netAmount * this.CREDIT_TO_USD_RATE).toFixed(2)
    
    const transaction = this.createTransaction(
      'withdrawal',
      amount,
      feeInCredits,
      `Withdraw ${netAmount} credits ($${usdAmount} USDC) - Fee: ${feeInCredits} credits ($${platformFee} USDC)`
    )
    
    transaction.walletAddress = walletAddress
    transaction.status = 'pending'

    const newBalance = {
      ...balance,
      available: balance.available - amount,
      lifetime: {
        ...balance.lifetime,
        withdrawn: balance.lifetime.withdrawn + parseFloat(usdAmount)
      }
    }

    return {
      newBalance,
      newTransactions: [transaction, ...transactions],
      transaction
    }
  }

  static processTraining(
    balance: CreditBalance,
    transactions: CreditTransaction[],
    fighterId: string,
    fighterName: string,
    baseCost: number
  ): {
    newBalance: CreditBalance
    newTransactions: CreditTransaction[]
    transaction: CreditTransaction
    error?: string
  } {
    const { totalCost, platformFee } = this.calculateTrainingFee(baseCost)
    
    if (balance.available < totalCost) {
      return {
        newBalance: balance,
        newTransactions: transactions,
        transaction: {} as CreditTransaction,
        error: 'Insufficient credits for training'
      }
    }

    const transaction = this.createTransaction(
      'training',
      -totalCost,
      platformFee,
      `Training session for ${fighterName} (Base: ${baseCost} + Fee: ${platformFee})`,
      fighterId
    )

    const newBalance = {
      ...balance,
      available: balance.available - totalCost,
      lifetime: {
        ...balance.lifetime,
        spent: balance.lifetime.spent + totalCost
      }
    }

    return {
      newBalance,
      newTransactions: [transaction, ...transactions],
      transaction
    }
  }

  static processReward(
    balance: CreditBalance,
    transactions: CreditTransaction[],
    amount: number,
    description: string,
    relatedId?: string
  ): {
    newBalance: CreditBalance
    newTransactions: CreditTransaction[]
    transaction: CreditTransaction
  } {
    const transaction = this.createTransaction(
      'reward',
      amount,
      0,
      description,
      relatedId
    )

    const newBalance = {
      ...balance,
      available: balance.available + amount,
      lifetime: {
        ...balance.lifetime,
        earned: balance.lifetime.earned + amount
      }
    }

    return {
      newBalance,
      newTransactions: [transaction, ...transactions],
      transaction
    }
  }

  static getTransactionsByType(
    transactions: CreditTransaction[],
    type: CreditTransaction['type']
  ): CreditTransaction[] {
    return transactions.filter(tx => tx.type === type)
  }

  static getTransactionStats(transactions: CreditTransaction[]): {
    totalDeposits: number
    totalWithdrawals: number
    totalFeesPaid: number
    totalRewards: number
    transactionCount: number
  } {
    return transactions.reduce((stats, tx) => {
      if (tx.type === 'deposit') stats.totalDeposits += tx.amount
      if (tx.type === 'withdrawal') stats.totalWithdrawals += Math.abs(tx.amount)
      if (tx.type === 'reward' || tx.type === 'achievement') stats.totalRewards += tx.amount
      stats.totalFeesPaid += tx.fee
      stats.transactionCount++
      return stats
    }, {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalFeesPaid: 0,
      totalRewards: 0,
      transactionCount: 0
    })
  }

  static formatCredits(amount: number): string {
    return amount.toLocaleString()
  }

  static formatUSD(amount: number): string {
    return `$${amount.toFixed(2)}`
  }

  static creditsToUSD(credits: number): number {
    return credits * this.CREDIT_TO_USD_RATE
  }

  static usdToCredits(usd: number): number {
    return Math.floor(usd / this.CREDIT_TO_USD_RATE)
  }

  // Wallet connection simulation
  static async connectWallet(): Promise<WalletConnection> {
    // In real implementation, this would connect to Phantom/Solflare
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate connection time
    
    return {
      connected: true,
      address: '5fE...8aB', // Mock Solana address
      balance: 1250.75, // Mock USDC balance
      network: 'solana-mainnet'
    }
  }

  static disconnectWallet(): WalletConnection {
    return {
      connected: false,
      network: 'solana-mainnet'
    }
  }
}