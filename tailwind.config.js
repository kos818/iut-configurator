/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iut: {
          50: '#e8f4fc',
          100: '#c5e3f7',
          200: '#8dc7ef',
          300: '#4fa8e3',
          400: '#1a8cd8',
          500: '#0077C8',   // Primary blue
          600: '#005FA0',
          700: '#004B87',   // Dark corporate blue
          800: '#003A6B',
          900: '#002B50',
          950: '#001A33',
        },
        steel: {
          50: '#f6f7f8',
          100: '#eceef1',
          200: '#d5d9e0',
          300: '#b1b9c5',
          400: '#8693a5',
          500: '#67768a',
          600: '#535f72',
          700: '#444e5d',
          800: '#3b434f',
          900: '#343a44',
          950: '#23272e',
        }
      },
      fontFamily: {
        'sans': ['Source Sans 3', 'system-ui', 'sans-serif'],
        'heading': ['Source Sans 3', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
