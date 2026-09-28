/** @type {import('tailwindcss').Config} */
/**
 * Tokens are stored as raw RGB triplets (`79 70 229`) so a single set of
 * variables drives both themes. They must be consumed with `rgb()`, never
 * `hsl()` — hsl() would re-interpret 79/70/229 as hue/saturation/lightness.
 */
const withVar = (name) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `rgb(var(${name}))`
    : `rgb(var(${name}) / ${opacityValue})`;

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: withVar('--c-canvas'),
        surface: withVar('--c-surface'),
        elevated: withVar('--c-elevated'),
        sunken: withVar('--c-sunken'),
        line: withVar('--c-line'),
        'line-strong': withVar('--c-line-strong'),
        ink: withVar('--c-ink'),
        'ink-soft': withVar('--c-ink-soft'),
        'ink-mute': withVar('--c-ink-mute'),
        brand: {
          DEFAULT: withVar('--c-brand'),
          soft: withVar('--c-brand-soft'),
          ink: withVar('--c-brand-ink'),
          hover: withVar('--c-brand-hover'),
        },
        accent: {
          DEFAULT: withVar('--c-accent'),
          soft: withVar('--c-accent-soft'),
          ink: withVar('--c-accent-ink'),
        },
        info: {
          DEFAULT: withVar('--c-info'),
          soft: withVar('--c-info-soft'),
          ink: withVar('--c-info-ink'),
        },
        danger: {
          DEFAULT: withVar('--c-danger'),
          soft: withVar('--c-danger-soft'),
          ink: withVar('--c-danger-ink'),
        },
        warn: {
          DEFAULT: withVar('--c-warn'),
          soft: withVar('--c-warn-soft'),
          ink: withVar('--c-warn-ink'),
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        hair: '0 1px 0 0 rgb(var(--c-line))',
        lift: '0 1px 2px -1px rgb(var(--c-shadow) / 0.10), 0 8px 24px -12px rgb(var(--c-shadow) / 0.16)',
        pop: '0 12px 40px -12px rgb(var(--c-shadow) / 0.28), 0 2px 6px -2px rgb(var(--c-shadow) / 0.12)',
        ring: '0 0 0 1px rgb(var(--c-brand) / 0.28)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        'fade-rise': {
          from: { opacity: '0', transform: 'translate3d(0, 6px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sheet-up': {
          from: { transform: 'translate3d(0, 100%, 0)' },
          to: { transform: 'translate3d(0, 0, 0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'draw-bar': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      animation: {
        'fade-rise': 'fade-rise 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.2s ease-out both',
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.16s cubic-bezier(0.22, 1, 0.36, 1) both',
        'draw-bar': 'draw-bar 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
