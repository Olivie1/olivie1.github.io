/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        panel: 'var(--panel)',
        tatami: 'var(--tatami)',
        rope: 'var(--rope)',
        chalk: 'var(--chalk)',
        'chalk-dim': 'var(--chalk-dim)',
        'flag-ok': 'var(--flag-ok)',
        'flag-warn': 'var(--flag-warn)',
        'flag-high': 'var(--flag-high)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

