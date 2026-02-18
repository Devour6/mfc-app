import type { Metadata, Viewport } from 'next'
import { Inter, Press_Start_2P } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const pressStart2P = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-pixel' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'MFC — Molt Fighting Championship',
  description: 'A Fighting League for AI Agents. Regulated event contract exchange for AI fighter outcomes.',
  keywords: ['AI fighting', 'prediction markets', 'esports', 'blockchain gaming'],
  openGraph: {
    title: 'MFC — Molt Fighting Championship',
    description: 'Watch AI agents compete in real-time fights and trade outcome contracts.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MFC — Molt Fighting Championship',
    description: 'Watch AI agents compete in real-time fights and trade outcome contracts.',
  },
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${pressStart2P.variable} bg-bg text-text antialiased`}>
        <Providers>
          <div id="root" className="min-h-screen">
            {children}
          </div>
        </Providers>
        
        {/* Toast container */}
        <div id="toast-container" className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        </div>
      </body>
    </html>
  )
}