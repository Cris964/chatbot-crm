/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { lato: ['Lato', 'sans-serif'] },
      colors: {
        ink: { 950:'#07070f', 900:'#0d0d18', 850:'#111120', 800:'#16162a', 750:'#1c1c34', 700:'#22223e', 600:'#2e2e52', 500:'#3d3d6b', 400:'#5c5c8a', 300:'#8888b0', 200:'#aaaac8', 100:'#d0d0e8' },
        violet: { 300:'#c4b5fd', 400:'#a78bfa', 500:'#8b5cf6', 600:'#7c3aed', 700:'#6d28d9' },
        emerald: { 300:'#6ee7b7', 400:'#34d399', 500:'#10b981' },
        rose: { 400:'#fb7185', 500:'#f43f5e' },
        amber: { 400:'#fbbf24', 500:'#f59e0b' },
        sky: { 400:'#38bdf8', 500:'#0ea5e9' }
      }
    }
  },
  plugins: []
}
