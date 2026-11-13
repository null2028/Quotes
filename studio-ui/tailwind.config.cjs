/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    __dirname + '/index.html',
    __dirname + '/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tea: {
          bg: '#F5EFE6',
          paper: '#FBF8F3',
          edge: '#E6DDD0',
          border: '#D8CEBE',
          ink: '#1E1B18',
          muted: '#6B6259',
          accent: '#CE472E',
          accentHover: '#B53A23',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
