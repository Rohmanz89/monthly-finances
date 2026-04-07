/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef7ff', 100: '#d9edff', 200: '#bce0ff', 300: '#8eceff',
          400: '#59b2ff', 500: '#3b93ff', 600: '#1b6ff5', 700: '#1459e1',
          800: '#1748b6', 900: '#193f8f', 950: '#142857',
        },
        accent: {
          50: '#edfcf2', 100: '#d4f7df', 200: '#acedC3', 300: '#76dea2',
          400: '#3ec97d', 500: '#1aae62', 600: '#0e8d4e', 700: '#0b7141',
          800: '#0c5935', 900: '#0b492d', 950: '#042919',
        },
        surface: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
