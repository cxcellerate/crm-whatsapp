/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f4ffe6',
          100: '#e6ffb8',
          200: '#d4fa6f',
          300: '#c8fd40',
          400: '#BDFD29',
          500: '#3DA13E',
          600: '#2d832e',
          700: '#007F5F',
          800: '#1a4e1b',
          900: '#103711',
        },
        teal: {
          500: '#086375',
          600: '#065260',
          400: '#0a7a90',
        },
        accent: {
          500: '#FF7919',
          600: '#e06810',
        },
        dark: {
          50:  '#f4f4f4',
          100: '#dedede',
          200: '#b8b8b8',
          300: '#969696',  /* era #737373 — mais legível como texto */
          400: '#787878',  /* era #525252 — passa WCAG AA em fundos escuros */
          500: '#5c5c5c',  /* era #404040 — visível como texto decorativo */
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
