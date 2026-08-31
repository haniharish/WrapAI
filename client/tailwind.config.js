/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poster: {
          bg: '#E3E2DE',
          blue: '#1351AA',
          black: '#141414',
          charcoal: '#444343',
          muted: '#7A7A7A',
          border: '#C7C7C7',
          white: '#FFFFFF',
          hover: '#F2F1ED',
        },
        // Brand aliases mapped directly to Poster Modernist palette
        brand: {
          navy: '#141414',
          charcoal: '#444343',
          sage: '#1351AA',
          taupe: '#7A7A7A',
          beige: '#E3E2DE',
          cyan: '#1351AA',
          blue: '#1351AA',
          light: '#E3E2DE',
          white: '#FFFFFF',
          border: '#C7C7C7',
        }
      },
      fontFamily: {
        display: ['"General Sans"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"General Sans"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      boxShadow: {
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
        none: 'none',
      },
      transitionTimingFunction: {
        DEFAULT: 'linear',
        linear: 'linear',
      },
      transitionDuration: {
        DEFAULT: '300ms',
        '300': '300ms',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
        tight: '-0.02em',
        widest: '0.2em',
      }
    },
  },
  plugins: [],
}
