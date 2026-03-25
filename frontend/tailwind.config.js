/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary — Azul corporativo
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Navy — Sidebar
        navy: {
          50:  '#F0F4FF',
          100: '#D9E2FF',
          200: '#B3C5FF',
          300: '#7B96F5',
          400: '#4F6BE0',
          500: '#2B4ACB',
          600: '#1A37B0',
          700: '#132C96',
          800: '#0D1F6E',
          900: '#0A1628',
          950: '#060E1C',
        },
        // Surface — Backgrounds
        surface: {
          50:  '#FFFFFF',
          100: '#F8FAFF',
          200: '#F1F4FD',
          300: '#E8EDF8',
          400: '#D1D9F0',
          500: '#A8B4D8',
          600: '#6B7AA8',
          700: '#4A5578',
          800: '#2D3558',
          900: '#1A2240',
        },
        // Semantic
        success: { 50: '#ECFDF5', 500: '#10B981', 600: '#059669' },
        warning: { 50: '#FFFBEB', 500: '#F59E0B', 600: '#D97706' },
        danger:  { 50: '#FEF2F2', 500: '#EF4444', 600: '#DC2626' },
        info:    { 50: '#EFF6FF', 500: '#3B82F6', 600: '#2563EB' },
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(15,29,55,0.06), 0 1px 2px -1px rgba(15,29,55,0.06)',
        'card-md':'0 4px 16px -2px rgba(15,29,55,0.10), 0 2px 8px -2px rgba(15,29,55,0.06)',
        'card-lg':'0 12px 32px -4px rgba(15,29,55,0.14), 0 4px 12px -4px rgba(15,29,55,0.08)',
        'nav':    '0 0 0 1px rgba(255,255,255,0.06)',
        'glow':   '0 0 20px rgba(59,130,246,0.25)',
        'inner':  'inset 0 2px 4px 0 rgba(15,29,55,0.06)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        'gradient-navy':    'linear-gradient(135deg, #0A1628 0%, #132C96 100%)',
        'gradient-surface': 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-in':   'slideIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                          to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
