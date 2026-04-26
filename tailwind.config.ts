import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c2d4ff',
          300: '#93b0ff',
          400: '#5c82ff',
          500: '#3355ff',
          600: '#2240dd',
          700: '#1a30b0',
          800: '#162690',
          900: '#131f75',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
        },
        neutral: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3.5rem',  { lineHeight: '1.1',  fontWeight: '700' }],
        'display-lg': ['2.5rem',  { lineHeight: '1.15', fontWeight: '700' }],
        'display-md': ['2rem',    { lineHeight: '1.2',  fontWeight: '600' }],
        'heading':    ['1.5rem',  { lineHeight: '1.3',  fontWeight: '600' }],
        'subheading': ['1.125rem',{ lineHeight: '1.4',  fontWeight: '500' }],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'raised':  '0 4px 16px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        'overlay': '0 20px 60px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'brand-gradient':   'linear-gradient(135deg, #3355ff 0%, #7c3aed 100%)',
        'energy-gradient':  'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
        'success-gradient': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'surface-gradient': 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
