/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sf-pro': ['"SF Pro"', 'sans-serif']
      }
    },
  },
  plugins: [],
}

