/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        sand: {
          light: '#FAF9F2',
          DEFAULT: '#EFECE1',
          hover: '#E2DEC8',
          muted: '#D1CCA9',
        },
        charcoal: {
          DEFAULT: '#333333',
          muted: '#666666',
          border: '#D9D7C7',
        },
        navy: {
          DEFAULT: '#1B365D',
          hover: '#122543',
          light: '#E8EEF5',
        },
        sage: {
          DEFAULT: '#5F8A75',
          hover: '#4A6F5C',
          light: '#EBF2EE',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
