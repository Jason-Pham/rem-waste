import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#fff4ed',
          100: '#ffe6d4',
          500: '#ff8533',
          600: '#ff6600', // REM Orange
          700: '#cc5200',
        },
        navy: {
          800: '#1b202c',
          900: '#10131B', // REM Navy
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
