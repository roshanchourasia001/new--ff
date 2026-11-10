/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        primary: {
          DEFAULT: '#1761F5',
          dark: '#0D47A1',
          light: '#EAF1FF'
        },
        slateText: {
          DEFAULT: '#172033',
          muted: '#788397'
        },
        accentGreen: {
          DEFAULT: '#16B978',
          light: '#E9FBF3'
        },
        accentGold: {
          DEFAULT: '#F4B83F',
          light: '#FFF7E5'
        },
        borderLight: '#E5EAF1',
        bgSubtle: '#F5F7FA'
      }
    },
  },
  plugins: [],
}
