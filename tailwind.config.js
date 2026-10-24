/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: '#09090B',
        surface: {
          DEFAULT: '#121215',
          raised: '#18181B',
          overlay: '#222226',
          border: '#27272A',
        },
        zinc: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          850: '#1F1F23',
          900: '#18181B',
          950: '#09090B',
        },
        brand: {
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F4F4F5',
          300: '#E4E4E7',
          400: '#D4D4D8',
          500: '#A1A1AA',
          600: '#FAFAFA', // Primary action: pure crisp white
          700: '#E4E4E7',
          800: '#27272A',
          900: '#18181B',
        },
      },
    },
  },
  plugins: [],
}
