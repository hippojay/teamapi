/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      backgroundColor: {
        'dark-primary': '#121212',
        'dark-secondary': '#1e1e1e',
        'dark-tertiary': '#2d2d2d',
        'dark-card': '#252525',
        'dark-highlight': '#333333',
        'dark-blue-highlight': '#1e2c3d',
        'dark-green-highlight': '#1c2a1e', 
        'dark-purple-highlight': '#231c2a',
        'dark-amber-highlight': '#2a231c',
        'dark-red-highlight': '#2a1c1c',
      },
      textColor: {
        'dark-primary': '#e0e0e0',
        'dark-secondary': '#a0a0a0',
        'dark-blue': '#90caf9',
        'dark-green': '#a5d6a7',
        'dark-purple': '#ce93d8',
        'dark-amber': '#ffe082',
        'dark-red': '#ef9a9a',
      },
      borderColor: {
        'dark-border': '#333333',
        'dark-blue-border': '#1a365d',
        'dark-green-border': '#1a4e1a',
        'dark-purple-border': '#4a1a4e',
        'dark-amber-border': '#4e401a',
        'dark-red-border': '#4e1a1a',
      },
      divideColor: {
        'dark-divide': '#333333',
      },
    },
  },
  plugins: [],
}
