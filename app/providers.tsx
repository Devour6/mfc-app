'use client'

import type { ReactNode } from 'react'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { SolanaWalletProvider } from '@/lib/solana/wallet-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider>
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </Auth0Provider>
  )
}
