/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          600: '#7c3aed',
          700: '#6d28d9',
        },
        accent: '#10b981',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
