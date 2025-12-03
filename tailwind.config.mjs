import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B0F2A', // darker deep red for better contrast
        secondary: '#FFD700', // gold/yellow from logo
        accent: '#000000', // black
        surface: '#FFFFFF', // white
        muted: '#F5F5F5', // light gray for subtle backgrounds
        border: '#E5E5E5', // light gray for borders
        textPrimary: '#1F2937', // dark gray for primary text
        textSecondary: '#6B7280', // medium gray for secondary text
        success: '#10B981', // green for success states
        error: '#EF4444', // red for errors
        warning: '#F59E0B', // amber for warnings
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [typography],
};

export default config;
