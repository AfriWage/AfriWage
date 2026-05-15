import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AfriWage — Veil-style design tokens
        primary: '#14A800',
        foreground: '#111111',
        muted: '#6B7280',
        border: '#E5E7EB',
        card: '#F9FAFB',

        // Dashboard surface tokens
        background: '#FFFFFF',
        secondary: '#6B7280',
        surface: '#FFFFFF',
        'on-surface': '#111111',
        'on-background': '#111111',
        'on-surface-variant': '#6B7280',
        'primary-container': '#14A800',
        'on-primary': '#FFFFFF',
        'surface-container-low': '#F9FAFB',
        'surface-container-high': '#F3F4F6',
        'surface-container-highest': '#E5E7EB',
        'outline-variant': '#E5E7EB',
        outline: '#E5E7EB',
        'primary-fixed-dim': '#86efac',
        'surface-tint': '#14A800',

        // Brand aliases (kept for WorkerCard and any legacy components)
        brand: {
          primary: '#14A800',
          'primary-container': '#14A800',
          secondary: '#6B7280',
          navy: '#111111',
          surface: '#F9FAFB',
          'on-surface': '#111111',
          'on-surface-variant': '#6B7280',
          outline: '#E5E7EB',
          'outline-variant': '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        'body-sm': ['Inter', 'system-ui', 'sans-serif'],
        'label-mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        h1: ['Inter', 'system-ui', 'sans-serif'],
        h2: ['Inter', 'system-ui', 'sans-serif'],
        h3: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-mono': ['13px', { lineHeight: '1.0', letterSpacing: '0.02em', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.7', fontWeight: '400' }],
        h3: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        h2: ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        h1: ['52px', { lineHeight: '1.06', letterSpacing: '-0.03em', fontWeight: '700' }],
      },
      spacing: {
        margin: '32px',
        gutter: '24px',
        unit: '8px',
        'container-max': '1080px',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '0.75rem',
        full: '9999px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.35s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
