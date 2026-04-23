/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        card: '#1a1a26',
        border: '#2a2a3d',
        accent: '#7c6fff',
        accent2: '#ff6f91',
        accent3: '#6fffd4',
        text: '#e8e8f0',
        muted: '#7a7a9a',
      },
      boxShadow: {
        glow: '0 0 40px rgba(124, 111, 255, 0.15)',
        'glow-sm': '0 0 20px rgba(124, 111, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
