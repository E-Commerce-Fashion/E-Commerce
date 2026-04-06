import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        base:      'var(--bg-base)',
        surface:   'var(--bg-surface)',
        elevated:  'var(--bg-elevated)',
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        gold:      'var(--accent-gold)',
        rose:      'var(--accent-rose)',
        border:    'var(--border)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))',
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(var(--accent-gold-rgb), 0.12), transparent)',
      },
      boxShadow: {
        'sm':   'var(--shadow-sm)',
        'md':   'var(--shadow-md)',
        'lg':   'var(--shadow-lg)',
        'gold': '0 0 20px rgba(var(--accent-gold-rgb), 0.3)',
      },
      animation: {
        'fade-in':       'fadeIn 0.5s ease forwards',
        'fade-in-up':    'fadeInUp 0.6s ease forwards',
        'scale-in':      'scaleIn 0.3s ease forwards',
        'slide-right':   'slideInRight 0.4s ease forwards',
        'slide-left':    'slideInLeft 0.4s ease forwards',
        'pulse-glow':    'pulse-glow 2s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s infinite',
        'spin':          'spin 1s linear infinite',
        'marquee':       'marquee 30s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(var(--accent-gold-rgb), 0.4)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(var(--accent-gold-rgb), 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      backdropBlur: {
        'xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
