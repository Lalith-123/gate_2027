/**
 * Colours are stored as raw RGB triplets so one set of CSS variables drives
 * both themes. They are always consumed with rgb() — never hsl() — because
 * hsl() would reinterpret 79/70/229 as hue/saturation/lightness.
 *
 * The literal `<alpha-value>` placeholder is what lets Tailwind generate the
 * `/45` and `/92` opacity modifiers. Without it those classes are silently
 * dropped, which loses tints, scrims and focus rings.
 */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

const group = (name) => ({
  DEFAULT: token(name),
  soft: token(`${name}-soft`),
  ink: token(`${name}-ink`),
});

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* neutrals */
        page: token('--c-page'),
        card: token('--c-card'),
        raised: token('--c-raised'),
        hair: token('--c-hair'),
        edge: token('--c-edge'),
        fg: token('--c-fg'),
        fg2: token('--c-fg2'),
        fg3: token('--c-fg3'),

        /* the only chromatic family used for identity */
        brand: {
          DEFAULT: token('--c-brand'),
          hover: token('--c-brand-hover'),
          soft: token('--c-brand-soft'),
          ink: token('--c-brand-ink'),
        },

        /* reserved meanings — never used decoratively */
        ok: group('--c-ok'),
        bad: group('--c-bad'),
        warn: group('--c-warn'),
        cyan: group('--c-cyan'),
      },

      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.05rem' }],
        '2xs': ['0.6875rem', { lineHeight: '0.95rem' }],
        sm: ['0.8125rem', { lineHeight: '1.2rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.6rem' }],
        xl: ['1.25rem', { lineHeight: '1.7rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.9rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.2rem' }],
      },

      /* moderate, not pill-shaped */
      borderRadius: {
        sm: '6px',
        DEFAULT: '9px',
        md: '9px',
        lg: '12px',
        xl: '14px',
        '2xl': '18px',
      },

      /* borders do the structural work; shadows stay almost invisible */
      boxShadow: {
        none: 'none',
        hair: '0 0 0 1px rgb(var(--c-hair))',
        quiet: '0 1px 2px rgb(15 23 42 / 0.04)',
        lift: '0 4px 16px -6px rgb(15 23 42 / 0.12)',
        veil: '0 12px 40px -12px rgb(15 23 42 / 0.22)',
      },

      spacing: {
        sidebar: '232px',
        measure: '46rem',
      },

      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translate3d(0, 8px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        sheet: {
          from: { transform: 'translate3d(0, 100%, 0)' },
          to: { transform: 'translate3d(0, 0, 0)' },
        },
        sweep: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },

      animation: {
        rise: 'rise 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        fade: 'fade 0.18s ease-out both',
        sheet: 'sheet 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        sweep: 'sweep 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
