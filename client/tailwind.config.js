/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#171e19',
          charcoal: '#302b2f',
          sage: '#b7c6c2',
          taupe: '#9f8d8b',
          beige: '#d7c5b2',
          cyan: '#d5f4f9',
          blue: '#bbe2f5',
          light: '#fafafa',
          white: '#ffffff',
        }
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.35' },
        }
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
