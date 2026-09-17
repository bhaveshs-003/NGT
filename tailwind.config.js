/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Industrial field-tool surfaces
        steel: {
          950: '#0a0e14',
          900: '#0f141c',
          850: '#151b25',
          800: '#1c2331',
          700: '#2a3342',
          600: '#3b4655',
          500: '#5a6779',
          400: '#8593a5',
          300: '#b3bfcd',
          200: '#ccd5df',
          100: '#e4eaf1',
          50: '#f2f5f9',
        },
        // Safety amber accent
        amber: {
          DEFAULT: '#ffb020',
          400: '#ffc14d',
          500: '#ffb020',
          600: '#e59200',
          700: '#b87400',
        },
        // Confidence scale
        conf: {
          high: '#22c55e',
          mid: '#f59e0b',
          low: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        sheet: '0 -12px 40px rgba(0,0,0,0.55)',
        frame: '0 30px 90px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'slide-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'toast-in': { '0%': { opacity: '0', transform: 'translateY(-14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        'scan-line': { '0%': { top: '8%' }, '100%': { top: '92%' } },
      },
      animation: {
        'slide-up': 'slide-up 220ms cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fade-in 180ms ease-out',
        'toast-in': 'toast-in 260ms cubic-bezier(0.16,1,0.3,1)',
        shimmer: 'shimmer 1.4s linear infinite',
        'scan-line': 'scan-line 2.6s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}
