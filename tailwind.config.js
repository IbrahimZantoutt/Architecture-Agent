/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        desktop: '1200px',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#E8607A',
          hover: '#D14D68',
          soft: '#FFE4EC',
        },
        bg: {
          DEFAULT: '#FFFFFF',
          soft: '#FFF5F7',
          card: '#FFFFFF',
          input: '#FFF8F9',
        },
        border: {
          DEFAULT: '#F3E8EB',
          strong: '#E8D5DA',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          muted: '#9CA3AF',
          'on-accent': '#FFFFFF',
        },
        mode: {
          blue: '#5B8DEF',
          'blue-soft': '#DBEAFE',
          green: '#4CAF82',
          'green-soft': '#D1FAE5',
          orange: '#E88B5E',
          'orange-soft': '#FDE8D8',
          purple: '#9B6FE8',
          'purple-soft': '#E8DEF8',
          amber: '#F5A623',
          'amber-soft': '#FEF3C7',
        },
      },
      boxShadow: {
        card: '0 4px 20px 0 #E8607A10',
        'card-hover': '0 8px 32px 0 #E8607A18',
      },
    },
  },
  plugins: [],
}
