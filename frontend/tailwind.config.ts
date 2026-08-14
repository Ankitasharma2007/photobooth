import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          main: '#F4F1EC',
          card: '#FFFFFF',
          subtle: '#E5E0D8',
          selected: '#E3F0F5',
        },
        paleOak: {
          50: '#F9F8F6',
          100: '#F4F1EC',
          200: '#E9E5DE',
          300: '#E5E0D8', // SW 7015 Pale Oak
          400: '#D6D0C5',
          500: '#C8C2B7',
          600: '#A8A195',
          700: '#6B665E',
          800: '#3D3A35',
          900: '#252320',
        },
        graphite: {
          DEFAULT: '#252320',
          900: '#1C1B18',
          800: '#252320',
          700: '#3D3A35',
          600: '#524F49',
        },
        slate: {
          DEFAULT: '#6B665E',
          700: '#524F49',
          600: '#6B665E',
          500: '#7E786F',
          400: '#9E978C',
          300: '#D6D0C5',
          200: '#E5E0D8',
          100: '#F4F1EC',
          50: '#F9F8F6',
        },
        acm: {
          50: '#F4F8FA',
          100: '#E3F0F5',
          200: '#CBE0EA',
          300: '#94C0D4',
          400: '#5A9BB7',
          500: '#2F7898',
          600: '#276984',
          700: '#1F546B',
          800: '#173E50',
          900: '#102B38',
        },
      },
      boxShadow: {
        glass: '0 8px 24px rgba(37, 35, 32, 0.06), 0 1px 2px rgba(37, 35, 32, 0.04)',
        glow: '0 0 20px -3px rgba(47, 120, 152, 0.25)',
        card: '0 4px 16px rgba(37, 35, 32, 0.05)',
        subtle: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '4xl': '2rem',
        btn: '10px',
        panel: '12px',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
