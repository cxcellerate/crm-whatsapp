/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
