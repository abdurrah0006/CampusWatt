export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      /* Fonts */
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },

      /* Colors */
      colors: {
        canvas: 'var(--bg-primary)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          secondary: 'var(--brand-secondary)',
          soft: 'var(--brand-soft)',
        },
        energy: {
          optimal: 'var(--status-optimal)',
          moderate: 'var(--status-moderate)',
          critical: 'var(--status-critical)',
          info: 'var(--status-info)',
          'optimal-ink': 'var(--status-optimal-text)',
          'moderate-ink': 'var(--status-moderate-text)',
          'critical-ink': 'var(--status-critical-text)',
          'info-ink': 'var(--status-info-text)',
          'optimal-soft': 'var(--status-optimal-soft)',
          'moderate-soft': 'var(--status-moderate-soft)',
          'critical-soft': 'var(--status-critical-soft)',
          'info-soft': 'var(--status-info-soft)',
        },
        danger: {
          DEFAULT: 'var(--danger-bg)',
          hover: 'var(--danger-bg-hover)',
        },
        'on-brand': 'var(--text-on-brand)',
        'on-danger': 'var(--text-on-danger)',
        overlay: 'var(--overlay)',
        line: 'var(--border-subtle)',
      },

      /* Shadows */
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        popover: '0 8px 24px -12px rgb(0 0 0 / 0.35)',
      },

      /* Animation */
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 240ms ease-out both',
        'slide-in': 'slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
