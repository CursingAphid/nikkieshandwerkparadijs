/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      animation: {
        'scroll-left': 'scroll-left 35s linear infinite',
      },
    },
  },
  plugins: [],
}


