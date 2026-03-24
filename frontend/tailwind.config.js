/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4e7',
          100: '#fae3b0',
          200: '#f7cc70',
          300: '#f5b530',
          400: '#f5a623',
          500: '#f59f0a',
          600: '#d48b06',
          700: '#a96e04',
          800: '#7e5203',
          900: '#533701',
        },
        dark: {
          50: '#f0f0f0',
          100: '#d4d4d4',
          200: '#a3a3a3',
          300: '#737373',
          400: '#525252',
          500: '#404040',
          600: '#2d2d2d',
          700: '#1f1f1f',
          800: '#141414',
          900: '#0a0a0a',
        },
      },
    },
  },
  plugins: [],
};
