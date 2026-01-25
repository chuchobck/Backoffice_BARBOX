/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        barbox: {
          wine: '#2A1716',
          terracotta: '#C75040',
          'terracotta-dark': '#AA3A2E',
          'terracotta-darker': '#8B2E22',
          'text-secondary': '#4A4545',
          cream: '#F6EDE7',
          border: '#E3D6D2',
          'input-border': '#c9bcb9',
        },
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
        info: '#17a2b8',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'terracotta': '0 10px 25px rgba(199, 80, 64, 0.3)',
        'terracotta-lg': '0 15px 30px rgba(199, 80, 64, 0.4)',
      },
    },
  },
  plugins: [],
}
