import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paint & Keep brand colors — fun, creative, colorful, premium, trustworthy
        brand: {
          primary: '#FF6B35', // Vibrant orange — energy, creativity
          secondary: '#7B2D8B', // Rich purple — premium, imagination
          accent: '#00BFA6', // Teal — trust, freshness
          highlight: '#FFD166', // Sunny yellow — fun, happiness
          dark: '#2D3047', // Deep navy — premium, trust
          light: '#FFF8F0', // Warm cream — warmth, comfort
        },
        paint: {
          red: '#E63946',
          blue: '#457B9D',
          green: '#2A9D8F',
          yellow: '#E9C46A',
          pink: '#F4A6C1',
          orange: '#F4845F',
          purple: '#9B5DE5',
          teal: '#00BBF9',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8F9FA',
          tertiary: '#F1F3F5',
          dark: '#2D3047',
        },
        text: {
          primary: '#2D3047',
          secondary: '#6C757D',
          muted: '#ADB5BD',
          inverse: '#FFFFFF',
        },
        status: {
          success: '#28A745',
          warning: '#FFC107',
          error: '#DC3545',
          info: '#17A2B8',
        },
      },
      fontFamily: {
        heading: ['var(--font-fredoka)', 'Comic Sans MS', 'cursive'],
        body: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        accent: ['var(--font-pacifico)', 'cursive'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-lg': ['3.5rem', { lineHeight: '1.15', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-sm': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'blob': '30% 70% 70% 30% / 30% 30% 70% 70%',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(45, 48, 71, 0.08)',
        'card-hover': '0 8px 30px rgba(45, 48, 71, 0.15)',
        'button': '0 4px 14px rgba(255, 107, 53, 0.3)',
        'button-hover': '0 6px 20px rgba(255, 107, 53, 0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'paint-drop': 'paintDrop 3s ease-in-out infinite',
        'brush-stroke': 'brushStroke 4s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        paintDrop: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(10px) scale(1.1)', opacity: '0.8' },
        },
        brushStroke: {
          '0%, 100%': { transform: 'rotate(-3deg) translateX(0)' },
          '50%': { transform: 'rotate(3deg) translateX(5px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      screens: {
        'xs': '320px',
        // default sm: 640px
        // default md: 768px (tablet breakpoint)
        // default lg: 1024px (desktop breakpoint)
        // default xl: 1280px
        '2xl': '1536px',
        '3xl': '2560px',
      },
    },
  },
  plugins: [],
};

export default config;
