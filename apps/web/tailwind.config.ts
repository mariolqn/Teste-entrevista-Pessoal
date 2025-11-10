import defaultTheme from 'tailwindcss/defaultTheme';

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/shared/src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Poppins"', '"Inter"', ...defaultTheme.fontFamily.sans],
        heading: ['"Poppins"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#f6f2ff',
          100: '#ede6ff',
          200: '#d9ccff',
          300: '#bea4ff',
          400: '#9e77ed',
          500: '#8155dc',
          600: '#6a40bf',
          700: '#56329a',
          800: '#44287a',
          900: '#382462',
        },
        success: {
          500: '#1f9d55',
        },
        warning: {
          500: '#f4b400',
        },
        danger: {
          500: '#e63946',
        },
        slate: {
          950: '#0f172a',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(129, 85, 220, 0.35)',
        card: '0 12px 32px -12px rgba(15, 23, 42, 0.18)',
      },
      maxWidth: {
        '8xl': '90rem',
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
