'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Redirect to the static HTML version
    window.location.href = '/index.html'
  }, [])

  return (
    <div style={{
      background: '#0a0a0f',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e8e8f0',
      fontFamily: 'monospace'
    }}>
      Loading MFC...
    </div>
  )
}
