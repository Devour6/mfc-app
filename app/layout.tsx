import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import { UserProvider } from '@auth0/nextjs-auth0/client'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
  viewport: 'width=device-width, initial-scale=1',
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
        <link 
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700;900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-bg text-text antialiased`}>
        {/* <UserProvider> */}
          <div id="root" className="min-h-screen">
            {children}
          </div>
        {/* </UserProvider> */}
        
        {/* Toast container */}
        <div id="toast-container" className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        </div>
        
        {/* Audio elements for sound effects */}
        <audio id="punch-light" preload="auto">
          <source src="/sounds/punch-light.mp3" type="audio/mpeg" />
        </audio>
        <audio id="punch-heavy" preload="auto">
          <source src="/sounds/punch-heavy.mp3" type="audio/mpeg" />
        </audio>
        <audio id="dodge" preload="auto">
          <source src="/sounds/dodge.mp3" type="audio/mpeg" />
        </audio>
        <audio id="block" preload="auto">
          <source src="/sounds/block.mp3" type="audio/mpeg" />
        </audio>
        <audio id="ko" preload="auto">
          <source src="/sounds/ko.mp3" type="audio/mpeg" />
        </audio>
        <audio id="bell" preload="auto">
          <source src="/sounds/bell.mp3" type="audio/mpeg" />
        </audio>
        <audio id="crowd-cheer" preload="auto">
          <source src="/sounds/crowd-cheer.mp3" type="audio/mpeg" />
        </audio>
        <audio id="trade-success" preload="auto">
          <source src="/sounds/trade-success.mp3" type="audio/mpeg" />
        </audio>
        <audio id="trade-fail" preload="auto">
          <source src="/sounds/trade-fail.mp3" type="audio/mpeg" />
        </audio>
        <audio id="notification" preload="auto">
          <source src="/sounds/notification.mp3" type="audio/mpeg" />
        </audio>
      </body>
    </html>
  )
}