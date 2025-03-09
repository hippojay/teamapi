/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      backgroundColor: {
        'dark-primary': '#121212',
        'dark-secondary': '#1e1e1e',
        'dark-tertiary': '#2d2d2d',
      },
      textColor: {
        'dark-primary': '#e0e0e0',
        'dark-secondary': '#a0a0a0',
      },
      borderColor: {
        'dark-border': '#333333',
      },
    },
  },
  plugins: [],
}
