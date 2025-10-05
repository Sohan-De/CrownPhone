/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#00d4ff',
          600: '#00b8e6',
          700: '#0099cc',
        },
        secondary: {
          500: '#00ff88',
          600: '#00e67a',
        },
        dark: {
          100: '#1a1a2e',
          200: '#16213e',
          300: '#0f3460',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
