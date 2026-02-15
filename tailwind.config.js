/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        ui: ['Inter', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        surface2: '#1a1a26',
        border: '#2a2a3a',
        accent: '#ff4444',
        accent2: '#4488ff',
        gold: '#ffd700',
        green: '#22c55e',
        red: '#ef4444',
        text: '#e8e8f0',
        text2: '#888899',
      },
      animation: {
        pulse: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ko-flash': 'koFlash 0.5s ease-in-out 3',
        'price-bounce': 'priceBounce 0.3s ease-out',
        'fighter-hit': 'fighterHit 0.2s ease-out',
        'order-flash': 'orderFlash 0.4s ease-out',
      },
      keyframes: {
        koFlash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        priceBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        fighterHit: {
          '0%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(2) hue-rotate(15deg)' },
          '100%': { filter: 'brightness(1)' },
        },
        orderFlash: {
          '0%': { backgroundColor: 'rgba(255, 255, 255, 0)' },
          '50%': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          '100%': { backgroundColor: 'rgba(255, 255, 255, 0)' },
        },
      },
    },
  },
  plugins: [],
}